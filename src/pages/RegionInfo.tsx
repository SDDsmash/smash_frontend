import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ApiError,
  fetchRegionDetail,
  formatKRWMan,
  formatNumberComma
} from 'utils'
import { useComparison } from 'state/comparisonStore'
import type { RegionDetail } from 'types/search'
import RegionDrilldown from 'components/RegionDrilldown'
import RegionPreviewMap from 'components/RegionPreviewMap'

export default function RegionInfo() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const sigunguCode = params.get('sigunguCode') || ''
  const jobCode = params.get('jobCode') || undefined

  const [data, setData] = useState<RegionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeUrl = (raw?: string | null) => {
    if (!raw) return ''
    const trimmed = raw.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  useEffect(() => {
    if (!sigunguCode) {
      setError('시군구 코드가 필요합니다. (?sigunguCode=)')
      setData(null)
      return
    }
    let mounted = true
    setIsLoading(true)
    setError(null)
    fetchRegionDetail({ sigunguCode, jobCode })
      .then((res) => {
        if (!mounted) return
        setData(res)
      })
      .catch((err) => {
        if (!mounted) return
        setError(
          err instanceof ApiError
            ? err.message
            : '지역 정보를 불러오지 못했습니다.'
        )
      })
      .finally(() => mounted && setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [sigunguCode, jobCode])

  const jobs = useMemo(() => {
    if (!data) return null
    const fitCount = data.fitJobInfo?.count ?? data.fitJobs
    const totalCount = data.totalJobInfo?.count ?? data.totalJobs
    if (typeof fitCount === 'number')
      return { label: '맞춤 일자리', value: fitCount }
    return { label: '전체 일자리', value: totalCount }
  }, [data])

  const monthlyAvg = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.monthAvg ?? data.monthlyRentAvg ?? null
  }, [data])

  const monthlyMid = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.monthMid ?? data.monthlyRentMid ?? null
  }, [data])

  const jeonseAvg = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.jeonseAvg ?? data.jeonseAvg ?? null
  }, [data])

  const jeonseMid = useMemo(() => {
    if (!data) return null
    return data.dwellingInfo?.jeonseMid ?? data.jeonseMid ?? null
  }, [data])

  if (!sigunguCode) {
    return (
      <div className="space-y-4">
        <RegionDrilldown
          onSelect={(code) => {
            const search = new URLSearchParams()
            search.set('sigunguCode', code)
            if (jobCode) search.set('jobCode', jobCode)
            navigate(`/region?${search.toString()}`)
          }}
        />
      </div>
    )
  }

  if (isLoading) return <div className="text-gray-600">불러오는 중...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 헤더 메타 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          {/* 좌측: 타이틀 + 지표(줄바꿈 단락) */}
          <div className="flex-1">
            <div className="flex items-end gap-2">
              <div className="mr-auto">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {data.sidoName}
                  {data.sigunguName ? (
                    <span className="text-gray-400"> · </span>
                  ) : null}
                  <span className="text-gray-900">{data.sigunguName}</span>
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {data.sidoCode ?? ''}
                  {data.sidoCode ? ' / ' : ''}
                  {data.sigunguCode ?? ''}
                </p>
              </div>

              {normalizeUrl(data.jobURL) && (
                <a
                  href={normalizeUrl(data.jobURL)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center self-center rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-brand-700"
                >
                  채용 정보 바로가기
                </a>
              )}
              <AddToCompareButton
                sigunguCode={String(data.sigunguCode || '')}
              />
            </div>

            {/* 일자리: 카드 + 버튼 나란히 */}
            <div className="mt-5 flex gap-2">
              {jobs && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">{jobs.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                    {typeof jobs.value === 'number'
                      ? formatNumberComma(jobs.value)
                      : '-'}
                  </p>
                </div>
              )}
            </div>

            {/* 월세/전세: 각 단락 내 줄바꿈 */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">월세</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">평균</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof monthlyAvg === 'number'
                      ? formatKRWMan(monthlyAvg)
                      : '-'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">중간</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof monthlyMid === 'number'
                      ? formatKRWMan(monthlyMid)
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">전세</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">평균</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof jeonseAvg === 'number'
                      ? formatKRWMan(jeonseAvg)
                      : '-'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">중간</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {typeof jeonseMid === 'number'
                      ? formatKRWMan(jeonseMid)
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 인프라 요약 */}
            {data.infra && data.infra.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-800">
                  인프라
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.infra.map((it, idx) => (
                    <span
                      key={`${it.major}-${it.name}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700"
                    >
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                        {it.major}
                      </span>
                      <span>{it.name}</span>
                      <span className="tabular-nums text-gray-500">
                        {it.num}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 위치 정보 목업 */}
          <div className="w-full lg:w-80 lg:self-stretch xl:w-96">
            <RegionPreviewMap
              sigunguCode={
                data.sigunguCode ? String(data.sigunguCode) : undefined
              }
            />
          </div>
        </div>
      </section>

      {/* 지원정책 리스트 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">지원정책</h2>
        {data.totalSupportNum != null && (
          <p className="text-sm text-gray-500">
            총 지원사업
            <span className="mx-1 font-semibold text-gray-700">
              {formatNumberComma(data.totalSupportNum)}건
            </span>
            을 제공합니다.
          </p>
        )}
        {data.totalSupportList && data.totalSupportList.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.totalSupportList.map((s, i) => (
              <article
                key={`${s.title}-${i}`}
                className="size-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex size-full flex-col">
                  <h3 className="text-base font-semibold text-gray-900">
                    {s.title}
                  </h3>
                  {s.keyword && (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                      #{s.keyword}
                    </span>
                  )}
                  <a
                    href={normalizeUrl(s.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-fit rounded-md border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    자세히 보기
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">표시할 지원정책이 없습니다.</p>
        )}
      </section>
    </div>
  )
}

function AddToCompareButton({ sigunguCode }: { sigunguCode: string }) {
  const { addBySigunguCode, items } = useComparison()
  const exists = items.some(
    (x) => String(x.sigunguCode) === String(sigunguCode)
  )
  if (!sigunguCode) return null
  return (
    <button
      type="button"
      disabled={exists}
      onClick={() => addBySigunguCode(sigunguCode)}
      className="inline-flex items-center justify-center self-center rounded-md border border-brand-600 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exists ? '비교에 추가됨' : '비교에 추가'}
    </button>
  )
}
