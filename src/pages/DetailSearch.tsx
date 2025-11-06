import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegionCard from 'components/RegionCard'
import LoadingIndicator from 'components/LoadingIndicator'
import { useComparison } from 'state/comparisonStore'
import { useRecommendationFilters } from 'state/recommendationFilters'
import {
  ApiError,
  fetchJobMidCodes,
  fetchJobTopCodes,
  fetchSupportTags,
  fetchRecommendations,
  type CodeItem,
  type RecommendationParams
} from 'utils'
import { encodeBitmask } from 'utils/bitmask'
import type { RegionRecommendation } from 'types/search'

type DwellingTypeOption = RecommendationParams['dwellingType']

interface PriceOption {
  value: number
  label: string
}

interface JobSuggestion {
  code: string
  name: string
  topCode: string
  topName: string
}

const HOUSING_OPTIONS: Array<{ id: DwellingTypeOption; label: string }> = [
  { id: 'MONTHLY', label: '월세' },
  { id: 'JEONSE', label: '전세' }
]

const MONTHLY_PRICE_OPTIONS: PriceOption[] = [
  { value: 20, label: '20만원' },
  { value: 30, label: '30만원' },
  { value: 40, label: '40만원' },
  { value: 50, label: '50만원' },
  { value: 60, label: '60만원' },
  { value: 70, label: '70만원' },
  { value: 80, label: '80만원' },
  { value: 90, label: '90만원' },
  { value: 100, label: '100만원' },
  { value: 110, label: '110만원 이상' }
]

const JEONSE_PRICE_OPTIONS: PriceOption[] = [
  { value: 3000, label: '3,000만원' },
  { value: 6000, label: '6,000만원' },
  { value: 9000, label: '9,000만원' },
  { value: 12000, label: '1억 2,000만원' },
  { value: 15000, label: '1억 5,000만원' },
  { value: 18000, label: '1억 8,000만원' },
  { value: 21000, label: '2억 1,000만원 이상' }
]

const INFRA_MAJORS = [
  { id: 'HEALTH', label: '건강' },
  { id: 'FOOD', label: '식생활' },
  { id: 'CULTURE', label: '문화' },
  { id: 'LIFE', label: '생활편의' }
] as const

const SUPPORT_MAJOR_OPTIONS = [
  { id: 'HOUSING_SUPPORT', label: '주거지원' },
  { id: 'LONG_TERM_UNEMPLOYED', label: '장기미취업청년' },
  { id: 'INTERN', label: '인턴' },
  { id: 'LOAN', label: '대출' }
] as const

export default function DetailSearch() {
  const navigate = useNavigate()
  const { items: compareItems } = useComparison()

  const {
    housingType,
    setHousingType,
    selectedPrice,
    setSelectedPrice,
    infraChoices,
    toggleInfraChoice,
    supportTagCodes,
    setSupportTagCodes,
    toggleSupportTagCode,
    occupationQuery,
    setOccupationQuery,
    selectedJobMid,
    setSelectedJobMid,
    selectedJobTop,
    setSelectedJobTop,
    reset: resetRecommendationFilters
  } = useRecommendationFilters()

  const priceOptions = useMemo(
    () =>
      housingType === 'MONTHLY' ? MONTHLY_PRICE_OPTIONS : JEONSE_PRICE_OPTIONS,
    [housingType]
  )
  const infraImportance: RecommendationParams['infraImportance'] = 'LOW'

  const [supportTags, setSupportTags] = useState<CodeItem[]>([])
  const [supportTagsLoading, setSupportTagsLoading] = useState(false)
  const [supportTagsError, setSupportTagsError] = useState<string | null>(null)
  const [jobTopCodes, setJobTopCodes] = useState<CodeItem[]>([])
  const [jobMidByTop, setJobMidByTop] = useState<Record<string, CodeItem[]>>({})

  useEffect(() => {
    let mounted = true
    setSupportTagsLoading(true)
    setSupportTagsError(null)
    fetchSupportTags()
      .then((tags) => {
        if (!mounted) return
        setSupportTags(tags ?? [])
      })
      .catch(() => {
        if (!mounted) return
        setSupportTagsError('지원 태그를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (mounted) setSupportTagsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!supportTags.length || !supportTagCodes.length) return
    const availableCodes = new Set(supportTags.map((tag) => tag.code))
    const filtered = supportTagCodes.filter((code) => availableCodes.has(code))
    if (filtered.length !== supportTagCodes.length) {
      setSupportTagCodes(filtered)
    }
  }, [supportTags, supportTagCodes, setSupportTagCodes])

  const [jobInputFocused, setJobInputFocused] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<RegionRecommendation[]>([])

  useEffect(() => {
    if (!priceOptions.length) return
    if (!priceOptions.some((opt) => opt.value === selectedPrice)) {
      setSelectedPrice(priceOptions[0].value)
    }
  }, [priceOptions, selectedPrice, setSelectedPrice])

  const topNameMap = useMemo(() => {
    const map = new Map<string, string>()
    jobTopCodes.forEach((top) => {
      map.set(top.code, top.name)
    })
    return map
  }, [jobTopCodes])

  const jobSuggestions = useMemo<JobSuggestion[]>(() => {
    return Object.entries(jobMidByTop).flatMap(([topCode, mids]) => {
      const topName = topNameMap.get(topCode) ?? ''
      return mids.map((mid) => ({
        code: mid.code,
        name: mid.name,
        topCode,
        topName
      }))
    })
  }, [jobMidByTop, topNameMap])

  const filteredJobSuggestions = useMemo(() => {
    const q = occupationQuery.trim().toLowerCase()
    if (!q) {
      return jobSuggestions
    }
    return jobSuggestions.filter((suggestion) =>
      suggestion.name.toLowerCase().includes(q)
    )
  }, [occupationQuery, jobSuggestions])

  const supportTagCodeToMajorId = useMemo(() => {
    const map = new Map<string, string>()
    SUPPORT_MAJOR_OPTIONS.forEach((option) => {
      map.set(option.id, option.id)
    })
    supportTags.forEach((tag) => {
      const option = SUPPORT_MAJOR_OPTIONS.find(
        (item) => item.id === tag.code || item.label === tag.name.trim()
      )
      if (option) {
        map.set(tag.code, option.id)
      }
    })
    return map
  }, [supportTags])

  const supportMajorIds = useMemo(() => {
    const ids = new Set<string>()
    supportTagCodes.forEach((code) => {
      const majorId = supportTagCodeToMajorId.get(code)
      if (majorId) ids.add(majorId)
    })
    return Array.from(ids)
  }, [supportTagCodes, supportTagCodeToMajorId])

  useEffect(() => {
    let mounted = true
    async function loadFilters() {
      try {
        const topCodes = await fetchJobTopCodes()
        if (!mounted) return
        setJobTopCodes(topCodes)

        const entries: Array<[string, CodeItem[]]> = await Promise.all(
          topCodes.map(async (top) => {
            try {
              const mids = await fetchJobMidCodes(top.code)
              return [top.code, mids] as [string, CodeItem[]]
            } catch (err) {
              console.error(err)
              return [top.code, [] as CodeItem[]]
            }
          })
        )

        if (!mounted) return
        const map: Record<string, CodeItem[]> = {}
        entries.forEach(([code, mids]) => {
          map[code] = mids
        })
        setJobMidByTop(map)
      } catch (err) {
        if (!mounted) return
        setError('필터 데이터를 불러오지 못했습니다.')
      }
    }

    loadFilters()
    return () => {
      mounted = false
    }
  }, [])

  const selectedJobTopName = selectedJobTop
    ? topNameMap.get(selectedJobTop)
    : ''

  const handleSelectJobSuggestion = (suggestion: JobSuggestion) => {
    setOccupationQuery(suggestion.name)
    setSelectedJobMid(suggestion.code)
    setSelectedJobTop(suggestion.topCode)
    setJobInputFocused(false)
  }

  const handleJobInputBlur = () => {
    setTimeout(() => {
      setJobInputFocused(false)
      const match = jobSuggestions.find((item) => item.name === occupationQuery)
      if (!match) {
        setOccupationQuery('')
        setSelectedJobMid('')
        setSelectedJobTop('')
      } else {
        setSelectedJobMid(match.code)
        setSelectedJobTop(match.topCode)
      }
    }, 120)
  }

  const resetFilters = () => {
    resetRecommendationFilters()
    setJobInputFocused(false)
    setResults([])
    setError(null)
  }

  const infraChoiceValue = useMemo(
    () => encodeBitmask(INFRA_MAJORS, infraChoices),
    [infraChoices]
  )
  const supportChoiceValue = useMemo(
    () => encodeBitmask(SUPPORT_MAJOR_OPTIONS, supportMajorIds),
    [supportMajorIds]
  )

  async function onSearch() {
    setIsLoading(true)
    setError(null)
    try {
      const filters: RecommendationParams = {
        dwellingType: housingType,
        price: selectedPrice,
        infraImportance,
        infraChoice: infraChoiceValue,
        supportChoice: supportChoiceValue,
        midJobCode: selectedJobMid || undefined
      }
      const { items, aiPick } = await fetchRecommendations(filters)

      const aiOrder = aiPick
        .map((entry) => entry.aiPickSigunguCode?.trim())
        .filter((code): code is string => Boolean(code))
      const aiReasonMap = new Map<string, string>()
      aiPick.forEach((entry) => {
        const code = entry.aiPickSigunguCode?.trim()
        if (!code) return
        aiReasonMap.set(code, entry.aiPickReason?.trim() ?? '')
      })

      const annotated = items.map((item) => {
        const code = String(item.sigunguCode ?? '').trim()
        const reason = aiReasonMap.get(code) ?? null
        return {
          ...item,
          isAiPick: reason != null,
          aiPickReason: reason
        }
      })

      const aiPickSet = new Set<string>()
      const aiPickItems: RegionRecommendation[] = []
      aiOrder.forEach((code) => {
        const match = annotated.find(
          (item) => String(item.sigunguCode ?? '').trim() === code
        )
        if (match) {
          aiPickSet.add(code)
          aiPickItems.push(match)
        }
      })

      const remainingItems = annotated.filter((item) => {
        const code = String(item.sigunguCode ?? '').trim()
        return !aiPickSet.has(code)
      })

      setResults([...aiPickItems, ...remainingItems])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('추천 데이터를 불러오지 못했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900">조건 설정</h2>

          {/* 주거 유형 */}
          <div className="mt-5">
            <h3 className="text-sm font-medium text-gray-600">주거 유형</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {HOUSING_OPTIONS.map((option) => {
                const active = housingType === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setHousingType(option.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 예산 버튼 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600">예산</h3>
            <p className="mt-1 text-xs text-gray-500">
              선택한 금액을 기준으로 추천 점수를 계산합니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {priceOptions.map((option) => {
                const active = selectedPrice === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedPrice(option.value)}
                    className={`rounded-lg px-4 py-2 text-sm transition ${
                      active
                        ? 'border border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="my-6 border-t border-gray-100" />

          {/* 직종 자동완성 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600">희망 직종</h3>
            <div className="mt-3 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  value={occupationQuery}
                  onChange={(e) => {
                    setOccupationQuery(e.target.value)
                    setSelectedJobMid('')
                    setSelectedJobTop('')
                  }}
                  onFocus={() => setJobInputFocused(true)}
                  onBlur={handleJobInputBlur}
                  placeholder="직종명을 입력하세요"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
                {occupationQuery && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOccupationQuery('')
                      setSelectedJobMid('')
                      setSelectedJobTop('')
                    }}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label="선택 해제"
                  >
                    ×
                  </button>
                )}
                {jobInputFocused && filteredJobSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredJobSuggestions.map((suggestion) => (
                      <li key={suggestion.code}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectJobSuggestion(suggestion)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span>{suggestion.name}</span>
                          <span className="text-xs text-gray-400">
                            {suggestion.topName}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedJobTopName && (
                <p className="mt-2 text-xs text-gray-500">
                  선택된 직종 대분류: {selectedJobTopName}
                </p>
              )}
            </div>
          </div>

          <div className="my-6 border-t border-gray-100" />

          {/* 지원사업 주요 카테고리 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600">지원사업</h3>
            <p className="mt-1 text-xs text-gray-500">
              필요한 지원사업을 자유롭게 선택하세요. (중복 선택 가능)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {supportTags.map((tag) => {
                const active = supportTagCodes.includes(tag.code)
                return (
                  <button
                    key={tag.code}
                    type="button"
                    onClick={() => toggleSupportTagCode(tag.code)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    aria-pressed={active}
                  >
                    #{tag.name}
                  </button>
                )
              })}
              {supportTagsLoading && (
                <LoadingIndicator
                  compact
                  className="text-xs text-gray-500"
                  messages={[
                    '지원 정책 태그를 불러오는 중입니다...',
                    '지역별 지원사업 분류를 준비하고 있어요.'
                  ]}
                  description="조금만 기다려 주시면 필터를 사용할 수 있어요."
                />
              )}
              {!supportTagsLoading && supportTagsError && (
                <span className="text-xs text-red-500">{supportTagsError}</span>
              )}
              {!supportTagsLoading &&
                !supportTagsError &&
                supportTags.length === 0 && (
                  <span className="text-xs text-gray-400">
                    표시할 지원정책 태그가 없습니다.
                  </span>
                )}
            </div>
          </div>

          <div className="my-6 border-t border-gray-100" />

          {/* 인프라 대분류 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600">인프라</h3>
            <p className="mt-1 text-xs text-gray-500">
              필요한 인프라를 자유롭게 선택하세요. (중복 선택 가능)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INFRA_MAJORS.map((option, idx) => {
                const active = infraChoices.includes(option.id)
                const bitValue = 1 << (INFRA_MAJORS.length - 1 - idx)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleInfraChoice(option.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    aria-pressed={active}
                    data-bit={bitValue}
                  >
                    #{option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-700 transition hover:border-gray-400"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={onSearch}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {isLoading && (
          <LoadingIndicator
            className="py-10"
            messages={[
              '추천 결과를 계산하는 중입니다...',
              '지역과 조건을 분석하고 있어요.',
              '맞춤 데이터를 준비 중입니다. 잠시만 기다려 주세요.'
            ]}
            description="선택한 조건에 따라 추천을 산출하고 있습니다."
          />
        )}
        {error && <p className="text-red-600">{error}</p>}
        {!isLoading && !error && results.length === 0 && (
          <p className="text-gray-500">
            조건에 맞는 추천 결과를 검색해 주세요.
          </p>
        )}
        {!isLoading &&
          !error &&
          results.map((r, idx) => {
            const fitJobCount = r.fitJobInfo?.count
            const jobsHighlight =
              !!selectedJobMid &&
              typeof fitJobCount === 'number' &&
              fitJobCount > 0
            const hasSupportFilter = supportMajorIds.length > 0
            const supportHighlight =
              hasSupportFilter &&
              typeof r.fitSupportNum === 'number' &&
              r.fitSupportNum > 0

            const monthlyMid = r.dwellingSimpleInfo?.monthMid ?? null
            const jeonseMid = r.dwellingSimpleInfo?.jeonseMid ?? null
            const priceBasis =
              housingType === 'MONTHLY' ? monthlyMid : jeonseMid
            const priceDiff =
              priceBasis == null
                ? Number.POSITIVE_INFINITY
                : Math.abs(priceBasis - selectedPrice)
            const tolerance = housingType === 'MONTHLY' ? 10 : 3000
            const monthlyHighlight =
              housingType === 'MONTHLY' &&
              monthlyMid != null &&
              priceDiff <= tolerance
            const jeonseHighlight =
              housingType === 'JEONSE' &&
              jeonseMid != null &&
              priceDiff <= tolerance

            const key = `${r.sigunguCode}-${idx}`
            const canAdd =
              !!r.sigunguCode &&
              !compareItems.some(
                (item) => String(item.sigunguCode) === String(r.sigunguCode)
              )

            return (
              <div key={key} className="relative">
                <RegionCard
                  item={r}
                  metricsHighlight={{
                    jobs: jobsHighlight,
                    support: supportHighlight,
                    monthly: monthlyHighlight,
                    jeonse: jeonseHighlight
                  }}
                  canAdd={canAdd}
                  jobCodeForDetail={selectedJobMid || undefined}
                  onCardClick={(code) => {
                    const search = new URLSearchParams({ sigunguCode: code })
                    if (selectedJobMid) search.set('jobCode', selectedJobMid)
                    navigate(`/region?${search.toString()}`)
                  }}
                />
              </div>
            )
          })}
      </section>
    </div>
  )
}
