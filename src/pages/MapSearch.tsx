import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegionCard from 'components/RegionCard'
import RegionDrilldown from 'components/RegionDrilldown'
import { fetchRegionDetail } from 'utils'
import type { RegionRecommendation, InfraStat } from 'types/search'
import InteractiveMap from '../components/InteractiveMap'
import { REGION_JSON } from '../utils/regionCodes'

export default function MapSearch() {
  const [sidoName, setSidoName] = useState<string | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [resetToken, setResetToken] = useState(0)
  const navigate = useNavigate()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [selectedSidoCode, setSelectedSidoCode] = useState<string | null>(null)
  const [selectedRec, setSelectedRec] = useState<RegionRecommendation | null>(
    null
  )

  useEffect(() => {
    if (!selectedCode) {
      setSelectedRec(null)
      setSelectedSidoCode(null)
      return
    }
    fetchRegionDetail({ sigunguCode: selectedCode })
      .then((d) => {
        const totalJobInfo =
          d.totalJobInfo ??
          (typeof d.totalJobs === 'number'
            ? { count: d.totalJobs, url: d.jobURL }
            : null)
        const fitJobInfo =
          d.fitJobInfo ??
          (typeof d.fitJobs === 'number'
            ? {
                count: d.fitJobs,
                url: d.jobURL
              }
            : null)

        const dwellingSimple = d.dwellingInfo
          ? {
              monthMid: d.dwellingInfo.monthMid ?? null,
              jeonseMid: d.dwellingInfo.jeonseMid ?? null
            }
          : undefined

        const aggregatedInfra: InfraStat[] = (() => {
          const map = new Map<string, number>()
          for (const item of d.infraDetails ?? d.infra ?? []) {
            if (!item) continue
            const current = map.get(item.major) ?? 0
            map.set(item.major, current + (item.num ?? 0))
          }
          return Array.from(map.entries()).map(([major, num]) => ({
            major: major as InfraStat['major'],
            num
          }))
        })()

        const totalSupportNum =
          d.totalSupportNum ?? d.totalSupportList?.length ?? null

        const rec: RegionRecommendation = {
          sidoCode: d.sidoCode,
          sidoName: d.sidoName,
          sigunguCode: d.sigunguCode,
          sigunguName: d.sigunguName,
          totalJobInfo,
          fitJobInfo,
          totalSupportNum,
          dwellingSimpleInfo: dwellingSimple,
          infraMajors: aggregatedInfra
        }
        setSelectedRec(rec)
        setSelectedSidoCode(d.sidoCode ? String(d.sidoCode) : null)
        setSidoName(d.sidoName ?? null)
      })
      .finally(() => {})
  }, [selectedCode])
  return (
    <div className="p-4 pb-8 lg:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.45fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)]">
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:min-h-[520px]">
          <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/60 px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {'지도 검색'}
              {sidoName ? (
                <span className="text-gray-400"> {' · '} </span>
              ) : null}
              {sidoName ? (
                <span className="text-gray-900">{sidoName}</span>
              ) : null}
            </h1>
          </div>

          <div className="relative flex flex-1 flex-col p-4">
            {canGoBack && (
              <button
                type="button"
                onClick={() => {
                  setResetToken((t) => t + 1)
                  setSelectedCode(null)
                  setSelectedRec(null)
                  setSelectedSidoCode(null)
                  setSidoName(null)
                }}
                className="absolute right-6 top-6 z-50 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm hover:bg-gray-50"
              >
                <span aria-hidden>←</span>
                <span className="ml-1">뒤로</span>
              </button>
            )}
            <InteractiveMap
              onSidoChange={(code, name) => {
                setSidoName(name)
                setSelectedSidoCode(code)
              }}
              onViewLevelChange={(view) => setCanGoBack(view === 'sigungu')}
              externalResetToken={resetToken}
              activeSigunguCode={selectedCode}
              onSigunguClick={(code) => {
                setSelectedCode(code)
                const parent = REGION_JSON.sigunguByCode?.[code]
                setSelectedSidoCode(parent?.sidoCode ?? code.slice(0, 2))
                setSidoName(parent?.sidoName ?? null)
              }}
            />
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <RegionDrilldown
            defaultSidoCode={selectedSidoCode ?? undefined}
            defaultSigunguCode={selectedCode ?? undefined}
            onSelect={(code) => {
              setSelectedCode(code)
              const parent = REGION_JSON.sigunguByCode?.[code]
              setSelectedSidoCode(parent?.sidoCode ?? code.slice(0, 2))
              setSidoName(parent?.sidoName ?? null)
            }}
            actionLabel="지역 정보 보기"
          />

          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-brand-100 bg-brand-50/60 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">지역 정보</h2>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              {selectedRec ? (
                <RegionCard
                  item={selectedRec}
                  onCardClick={(code) => {
                    const search = new URLSearchParams()
                    search.set('sigunguCode', code)
                    navigate(`/region?${search.toString()}`)
                  }}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  지역을 선택해 주세요.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
