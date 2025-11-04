import type { RegionRecommendation, InfraStat } from 'types/search'
import { formatKRWMan, formatNumberComma } from 'utils'
import { useComparison } from 'state/comparisonStore'

function InfraBadge({ item }: { item: InfraStat }) {
  const label = item.major
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
      <span className="font-medium">{label}</span>
      <span className="tabular-nums text-gray-500">{item.num}</span>
    </span>
  )
}

type MetricsHighlight = {
  jobs?: boolean
  support?: boolean
  monthly?: boolean
  jeonse?: boolean
}

export default function RegionCard({
  item,
  metricsColsClass = 'sm:grid-cols-4',
  metricsHighlight,
  canAdd = false,
  onCardClick = undefined,
  jobCodeForDetail
}: {
  item: RegionRecommendation
  metricsColsClass?: string
  metricsHighlight?: MetricsHighlight
  canAdd?: boolean
  onCardClick?: (sigunguCode: string) => void
  jobCodeForDetail?: string
}) {
  const { addBySigunguCode } = useComparison()
  const infra = item.infraMajors ?? []

  const jobInfo = item.fitJobInfo ?? item.totalJobInfo
  const jobValue = jobInfo?.count
  const hasFitJobData = Boolean(item.fitJobInfo && jobInfo?.count !== undefined)
  const jobLabel = hasFitJobData ? '맞춤 일자리' : '전체 일자리'

  const totalJobFallback = item.totalJobInfo?.count ?? 0
  const displayJobValue = jobValue ?? totalJobFallback

  const supportValue =
    typeof item.fitSupportNum === 'number'
      ? item.fitSupportNum
      : item.totalSupportNum ?? null
  const supportLabel =
    typeof item.fitSupportNum === 'number' ? '맞춤 지원사업' : '전체 지원사업'

  const monthlyValue = item.dwellingSimpleInfo?.monthMid ?? null
  const jeonseValue = item.dwellingSimpleInfo?.jeonseMid ?? null

  const hasScore =
    typeof item.score === 'number' && !item.isAiPick && item.score !== null

  return (
    <article
      className={`w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 ${
        onCardClick !== undefined ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={() => {
        if (!item.sigunguCode) return
        onCardClick?.(String(item.sigunguCode))
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mr-auto">
          <h3 className="text-xl font-semibold text-gray-900">
            {item.sidoName}
            {item.sigunguName ? (
              <span className="text-gray-400"> · </span>
            ) : null}
            <span className="text-gray-900">{item.sigunguName}</span>
          </h3>
        </div>
        <div className="flex flex-row items-end gap-2">
          {item.isAiPick ? (
            <div className="rounded-lg bg-gradient-to-r from-indigo-500 via-brand-500 to-sky-500 px-3 py-1.5 text-white">
              <span className="text-sm font-semibold">AI Pick</span>
            </div>
          ) : hasScore ? (
            <div className="rounded-lg bg-brand-50 px-3 py-1.5 text-brand-700 ring-1 ring-inset ring-brand-600/20">
              <span className="text-sm font-semibold">Score</span>{' '}
              <span className="tabular-nums">{item.score}</span>
            </div>
          ) : null}

          {canAdd && (
            <button
              type="button"
              onClick={(event) => {
                addBySigunguCode(
                  String(item.sigunguCode),
                  jobCodeForDetail ? { jobCode: jobCodeForDetail } : undefined
                )
                event.preventDefault()
                event.stopPropagation()
              }}
              className="inline-flex rounded-md border border-brand-600 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
            >
              비교에 추가
            </button>
          )}
        </div>
      </div>

      {item.isAiPick &&
        item.aiPickReason &&
        item.aiPickReason.trim().length > 0 && (
          <p className="mt-4 rounded-xl bg-gradient-to-r from-brand-50 via-white to-white px-4 py-3 text-sm text-gray-700 ring-1 ring-brand-100">
            {item.aiPickReason}
          </p>
        )}

      <div className={`mt-4 grid grid-cols-2 gap-4 ${metricsColsClass}`}>
        {typeof displayJobValue === 'number' && (
          <div
            className={`rounded-lg border p-3 ${
              metricsHighlight?.jobs
                ? 'border-green-200 bg-green-50 ring-1 ring-green-200'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-500 ">{jobLabel}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
              {formatNumberComma(displayJobValue)}
            </p>
          </div>
        )}

        {typeof supportValue === 'number' && (
          <div
            className={`rounded-lg border p-3 ${
              metricsHighlight?.support
                ? 'border-green-200 bg-green-50 ring-1 ring-green-200'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-500">{supportLabel}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
              {formatNumberComma(supportValue)}
            </p>
          </div>
        )}

        {typeof monthlyValue === 'number' && monthlyValue > 0 && (
          <div
            className={`rounded-lg border p-3 ${
              metricsHighlight?.monthly
                ? 'border-green-200 bg-green-50 ring-1 ring-green-200'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-500">월세 중앙값</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
              {formatKRWMan(monthlyValue)}
            </p>
          </div>
        )}

        {typeof jeonseValue === 'number' && jeonseValue > 0 && (
          <div
            className={`rounded-lg border p-3 ${
              metricsHighlight?.jeonse
                ? 'border-green-200 bg-green-50 ring-1 ring-green-200'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-500">전세 중앙값</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
              {formatKRWMan(jeonseValue)}
            </p>
          </div>
        )}
      </div>

      {infra.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {infra.map((i) => (
            <InfraBadge key={`${i.major}`} item={i} />
          ))}
        </div>
      )}
    </article>
  )
}
