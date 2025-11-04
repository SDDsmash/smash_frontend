import RegionDrilldown from 'components/RegionDrilldown'
import RegionCard from 'components/RegionCard'
import type {
  InfraStat,
  RegionRecommendation,
  RegionDetail,
  RegionDetailInfraItem
} from 'types/search'
import { useComparison } from 'state/comparisonStore'

export default function Comparison() {
  const { items, addBySigunguCode, removeBySigunguCode, isAdding } =
    useComparison()

  function toRecommendation(d: RegionDetail): RegionRecommendation {
    const infraByMajor = new Map<string, number>()
    ;(d.infra || []).forEach((i: RegionDetailInfraItem) =>
      infraByMajor.set(i.major, (infraByMajor.get(i.major) || 0) + (i.num || 0))
    )
    const infra: InfraStat[] = Array.from(infraByMajor.entries()).map(
      ([major, num]) => ({ major: major as InfraStat['major'], num })
    )

    const totalJobInfo =
      d.totalJobInfo ??
      (typeof d.totalJobs === 'number'
        ? { count: d.totalJobs, url: d.jobURL }
        : null)
    const fitJobInfo =
      d.fitJobInfo ??
      (typeof d.fitJobs === 'number'
        ? { count: d.fitJobs, url: d.jobURL }
        : null)

    const dwellingSimple = d.dwellingInfo
      ? {
          monthMid: d.dwellingInfo.monthMid ?? null,
          jeonseMid: d.dwellingInfo.jeonseMid ?? null
        }
      : undefined

    return {
      sidoCode: d.sidoCode,
      sidoName: d.sidoName,
      sigunguCode: d.sigunguCode,
      sigunguName: d.sigunguName,
      totalJobInfo,
      fitJobInfo,
      totalSupportNum: d.totalSupportNum ?? d.totalSupportList?.length ?? null,
      dwellingSimpleInfo: dwellingSimple,
      infraMajors: infra
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">비교 분석</h1>
        <p className="mt-1 text-sm text-gray-600">
          추가하기 버튼으로 여러 지역을 추가해 비교하세요.
        </p>
        <div className="mt-4">
          <RegionDrilldown actionLabel="추가하기" onSelect={addBySigunguCode} />
        </div>
      </section>

      {isAdding && <p className="text-gray-600">불러오는 중...</p>}

      <section>
        {items.length === 0 ? (
          <p className="text-gray-500">추가된 지역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d: RegionDetail, idx: number) => (
              <div key={`${d.sigunguCode}-${idx}`} className="relative h-full">
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() =>
                    removeBySigunguCode(String(d.sigunguCode || ''))
                  }
                  className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow ring-1 ring-gray-200 hover:text-gray-700"
                >
                  ×
                </button>
                <RegionCard
                  item={toRecommendation(d)}
                  metricsColsClass="sm:grid-cols-2"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
