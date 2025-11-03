import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  loadSidoList,
  loadSigunguList,
  getSigunguBySido,
  REGION_JSON
} from 'utils/regionCodes'

interface Props {
  defaultSidoCode?: string
  defaultSigunguCode?: string
  onSelect: (sigunguCode: string) => void
  actionLabel?: string
}

export default function RegionDrilldown({
  defaultSidoCode,
  defaultSigunguCode,
  onSelect,
  actionLabel = '선택 완료'
}: Props) {
  const sidoList = useMemo(() => loadSidoList(), [])
  const [sido, setSido] = useState<string>(() => {
    if (!defaultSidoCode) {
      return ''
    }
    return defaultSidoCode
  })
  const [sigungu, setSigungu] = useState<string>(() => {
    if (!defaultSigunguCode) {
      return ''
    }
    const parent = REGION_JSON.sigunguByCode[defaultSigunguCode]
    if (!parent) {
      return ''
    }
    return defaultSigunguCode
  })
  const [sidoQuery, setSidoQuery] = useState('')
  const [sigunguQuery, setSigunguQuery] = useState('')
  const [sidoFocused, setSidoFocused] = useState(false)
  const [sigunguFocused, setSigunguFocused] = useState(false)

  const sigunguListAll = useMemo(() => loadSigunguList(), [])
  const sigunguList = useMemo(
    () => (sido ? getSigunguBySido(sido) : sigunguListAll),
    [sido, sigunguListAll]
  )
  useEffect(() => {
    if (defaultSigunguCode) {
      const parent = REGION_JSON.sigunguByCode[defaultSigunguCode]
      if (!parent) {
        setSigungu('')
        if (!defaultSidoCode) {
          setSido('')
        }
        return
      }
      setSido(parent.sidoCode)
      setSigungu(defaultSigunguCode)
      return
    }

    if (defaultSidoCode) {
      setSido(defaultSidoCode)
      setSigungu('')
      return
    }

    setSido('')
    setSigungu('')
  }, [defaultSidoCode, defaultSigunguCode])
  const duplicateNamesInCurrent = useMemo(() => {
    const count = new Map<string, number>()
    for (const g of sigunguList) {
      count.set(g.name, (count.get(g.name) || 0) + 1)
    }
    const dup = new Set<string>()
    for (const [name, c] of count.entries()) if (c > 1) dup.add(name)
    // 만약 시도가 비어 있어 전역 목록을 보여줄 때는 전역 중복 기준 적용
    if (!sido) {
      const globalCount = new Map<string, number>()
      for (const g of sigunguListAll)
        globalCount.set(g.name, (globalCount.get(g.name) || 0) + 1)
      for (const [name, c] of globalCount.entries()) if (c > 1) dup.add(name)
    }
    return dup
  }, [sigunguList, sigunguListAll, sido])

  const getSigunguLabel = useCallback(
    (g: { code: string; name: string; sidoCode: string }): string => {
      const needPrefix = duplicateNamesInCurrent.has(g.name)
      return needPrefix && !sido
        ? `${REGION_JSON.sidoByCode[g.sidoCode] || ''} ${g.name}`.trim()
        : g.name
    },
    [duplicateNamesInCurrent, sido]
  )
  const filteredSido = useMemo(() => {
    const q = sidoQuery.trim()
    if (!q) return sidoList
    return sidoList.filter((s) =>
      s.name.toLowerCase().includes(q.toLowerCase())
    )
  }, [sidoList, sidoQuery])
  const filteredSigungu = useMemo(() => {
    const q = sigunguQuery.trim()
    if (!q) return sigunguList
    return sigunguList.filter((g) => {
      const label = getSigunguLabel(g)
      return (
        g.name.toLowerCase().includes(q.toLowerCase()) ||
        label.toLowerCase().includes(q.toLowerCase())
      )
    })
  }, [getSigunguLabel, sigunguList, sigunguQuery])

  useEffect(() => {
    if (!sigunguList.find((s) => s.code === sigungu)) {
      setSigungu('')
    }
  }, [sigungu, sigunguList])

  // 초기 질의 텍스트를 현재 선택값의 이름으로 세팅
  useEffect(() => {
    const currentSidoName = REGION_JSON.sidoByCode[sido]
    setSidoQuery(currentSidoName || '')
  }, [sido])
  useEffect(() => {
    const current = sigunguList.find((g) => g.code === sigungu)
    setSigunguQuery(current ? getSigunguLabel(current) : '')
  }, [getSigunguLabel, sigungu, sigunguList])

  const confirmSidoInput = () => {
    const name = sidoQuery.trim()
    const match = sidoList.find((s) => s.name === name)
    if (match) {
      setSido(match.code)
      setSidoQuery(match.name)
    } else {
      setSido('')
      setSidoQuery('')
      setSigungu('')
      setSigunguQuery('')
    }
  }

  const confirmSigunguInput = () => {
    const name = sigunguQuery.trim()
    const baseList = sido ? sigunguList : sigunguListAll
    const match = baseList.find((g) => getSigunguLabel(g) === name)
    if (match) {
      setSigungu(match.code)
      setSigunguQuery(getSigunguLabel(match))
      setSido(match.sidoCode)
      setSidoQuery(REGION_JSON.sidoByCode[match.sidoCode] || '')
    } else {
      setSigungu('')
      setSigunguQuery('')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-brand-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          {/*<span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">R</span>*/}
          <h2 className="text-lg font-semibold text-gray-900">지역 선택</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          시·도를 고르고, 시·군·구를 선택하세요.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {/* Sido Autocomplete */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">시·도</span>
          <div className="relative">
            <input
              type="text"
              value={sidoQuery}
              onChange={(e) => {
                setSidoQuery(e.target.value)
                setSido('')
              }}
              onFocus={() => setSidoFocused(true)}
              onBlur={() =>
                setTimeout(() => {
                  setSidoFocused(false)
                  confirmSidoInput()
                }, 120)
              }
              placeholder="예: 경상북도"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            {filteredSido.length > 0 && sidoFocused && (
              <ul className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-md">
                {filteredSido.map((s: { code: string; name: string }) => (
                  <li key={s.code}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSido(s.code)
                        setSidoQuery(s.name)
                        setSidoFocused(false)
                        // 시군구는 자동 선택하지 않고 비움
                        setSigungu('')
                        setSigunguQuery('')
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-gray-400">선택</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-gray-500">
            시·도 이름으로 검색해 선택하세요.
          </p>
        </div>

        {/* Sigungu Autocomplete */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">시·군·구</span>
          <div className="relative">
            <input
              type="text"
              value={sigunguQuery}
              onChange={(e) => {
                setSigunguQuery(e.target.value)
                setSigungu('')
              }}
              onFocus={() => setSigunguFocused(true)}
              onBlur={() =>
                setTimeout(() => {
                  setSigunguFocused(false)
                  confirmSigunguInput()
                }, 120)
              }
              placeholder="예: 안동시"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            {filteredSigungu.length > 0 && sigunguFocused && (
              <ul className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-md">
                {filteredSigungu.map(
                  (g: { code: string; name: string; sidoCode: string }) => (
                    <li key={g.code}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSigungu(g.code)
                          setSigunguQuery(getSigunguLabel(g))
                          setSigunguFocused(false)
                          // 시군구 선택 시 해당 시도 자동 채움
                          const parent = REGION_JSON.sigunguByCode[g.code]
                          if (parent) {
                            setSido(parent.sidoCode)
                            setSidoQuery(parent.sidoName || '')
                          }
                        }}
                        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <span>{getSigunguLabel(g)}</span>
                        <span className="text-xs text-gray-400">선택</span>
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
          <p className="text-xs text-gray-500">
            시·군·구 이름으로 검색해 선택하세요.
          </p>
          {filteredSigungu.length === 0 && (
            <p className="text-xs text-red-600">
              해당 이름의 시·군·구를 찾을 수 없습니다.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
        <p className="text-sm text-gray-500">
          선택한 지역은 페이지 이동 후 상단에 표시됩니다.
        </p>
        <button
          type="button"
          disabled={!sigungu}
          onClick={() => sigungu && onSelect(sigungu)}
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
