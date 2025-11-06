import { useMemo } from 'react'
import RegionDrilldown from 'components/RegionDrilldown'
import RegionCard from 'components/RegionCard'
import LoadingIndicator from 'components/LoadingIndicator'
import { useNavigate } from 'react-router-dom'
import type {
  InfraStat,
  RegionRecommendation,
  RegionDetail,
  RegionDetailInfraItem
} from 'types/search'
import { useComparison } from 'state/comparisonStore'

export default function Comparison() {
  const navigate = useNavigate()
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
      fitSupportNum: d.fitSupportNum ?? null,
      totalSupportNum: d.totalSupportNum ?? d.totalSupportList?.length ?? null,
      dwellingSimpleInfo: dwellingSimple,
      infraMajors: infra
    }
  }

  const recommendations = useMemo(() => items.map(toRecommendation), [items])

  const metricsExtremes = useMemo(() => {
    let maxJob: number | null = null
    let maxSupport: number | null = null
    let minMonthly: number | null = null
    let minJeonse: number | null = null

    recommendations.forEach((rec) => {
      const jobValue =
        typeof rec.fitJobInfo?.count === 'number'
          ? rec.fitJobInfo.count
          : typeof rec.totalJobInfo?.count === 'number'
            ? rec.totalJobInfo.count
            : null
      if (jobValue != null) {
        maxJob = maxJob == null ? jobValue : Math.max(maxJob, jobValue)
      }

      const supportValue =
        typeof rec.fitSupportNum === 'number'
          ? rec.fitSupportNum
          : typeof rec.totalSupportNum === 'number'
            ? rec.totalSupportNum
            : null
      if (supportValue != null) {
        maxSupport =
          maxSupport == null ? supportValue : Math.max(maxSupport, supportValue)
      }

      const monthlyValue =
        typeof rec.dwellingSimpleInfo?.monthMid === 'number'
          ? rec.dwellingSimpleInfo.monthMid
          : null
      if (monthlyValue != null && monthlyValue > 0) {
        minMonthly =
          minMonthly == null ? monthlyValue : Math.min(minMonthly, monthlyValue)
      }

      const jeonseValue =
        typeof rec.dwellingSimpleInfo?.jeonseMid === 'number'
          ? rec.dwellingSimpleInfo.jeonseMid
          : null
      if (jeonseValue != null && jeonseValue > 0) {
        minJeonse =
          minJeonse == null ? jeonseValue : Math.min(minJeonse, jeonseValue)
      }
    })

    return { maxJob, maxSupport, minMonthly, minJeonse }
  }, [recommendations])

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

      {isAdding && (
        <LoadingIndicator
          className="py-6"
          messages={[
            '선택한 지역의 세부 정보를 불러오고 있어요...',
            '비교 데이터를 준비 중입니다. 잠시만 기다려 주세요.'
          ]}
          description="곧 비교 목록에 추가됩니다."
        />
      )}

      <section>
        {items.length === 0 ? (
          <p className="text-gray-500">추가된 지역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, idx) => {
              const detail = items[idx]
              const jobValue =
                typeof rec.fitJobInfo?.count === 'number'
                  ? rec.fitJobInfo.count
                  : typeof rec.totalJobInfo?.count === 'number'
                    ? rec.totalJobInfo.count
                    : null
              const supportValue =
                typeof rec.fitSupportNum === 'number'
                  ? rec.fitSupportNum
                  : typeof rec.totalSupportNum === 'number'
                    ? rec.totalSupportNum
                    : null
              const monthlyValue =
                typeof rec.dwellingSimpleInfo?.monthMid === 'number'
                  ? rec.dwellingSimpleInfo.monthMid
                  : null
              const jeonseValue =
                typeof rec.dwellingSimpleInfo?.jeonseMid === 'number'
                  ? rec.dwellingSimpleInfo.jeonseMid
                  : null

              const metricsHighlight = {
                jobs:
                  metricsExtremes.maxJob != null &&
                  jobValue != null &&
                  jobValue === metricsExtremes.maxJob,
                support:
                  metricsExtremes.maxSupport != null &&
                  supportValue != null &&
                  supportValue === metricsExtremes.maxSupport,
                monthly:
                  metricsExtremes.minMonthly != null &&
                  monthlyValue != null &&
                  monthlyValue > 0 &&
                  monthlyValue === metricsExtremes.minMonthly,
                jeonse:
                  metricsExtremes.minJeonse != null &&
                  jeonseValue != null &&
                  jeonseValue > 0 &&
                  jeonseValue === metricsExtremes.minJeonse
              }

              return (
                <div
                  key={`${detail.sigunguCode}-${idx}`}
                  className="relative h-full"
                >
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() =>
                      removeBySigunguCode(String(detail.sigunguCode || ''))
                    }
                    className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    ×
                  </button>
                  <RegionCard
                    item={rec}
                    metricsColsClass="sm:grid-cols-2"
                    metricsHighlight={metricsHighlight}
                    onCardClick={(code) =>
                      navigate(
                        `/region?sigunguCode=${encodeURIComponent(code)}`
                      )
                    }
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
