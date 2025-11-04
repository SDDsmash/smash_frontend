import type {
  RegionRecommendation,
  InfraStat,
  RegionDetail,
  RegionDetailInfraItem,
  RegionDetailSupportItem,
  JobInfo,
  DwellingSimpleInfo,
  AiPickRecommendation
} from 'types/search'

export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ')
}

type ApiParamValue = string | number | boolean | null | undefined

export interface RecommendationParams {
  dwellingType: 'MONTHLY' | 'JEONSE'
  price: number
  infraImportance: 'LOW' | 'MID' | 'HIGH'
  midJobCode?: string
  supportTag?: string
}

/**
 * @deprecated 기존 UI 구조 유지용 타입입니다. 곧 RecommendationParams로 대체됩니다.
 */
export interface SearchFilters {
  housingType?: string
  priceRanges?: string[]
  occupation?: string
  supportTags?: string[]
  infraLevel?: string
}

export interface CodeItem {
  code: string
  name: string
}

interface ErrorPayload {
  code?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  code?: string
  retryAfterSeconds?: number
  payload?: ErrorPayload

  constructor(
    message: string,
    options: {
      status: number
      code?: string
      retryAfterSeconds?: number
      payload?: ErrorPayload
    }
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.retryAfterSeconds = options.retryAfterSeconds
    this.payload = options.payload
  }
}

const rawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
const API_BASE_URL = rawBaseUrl.replace(/\/?$/, '')

function ensureApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 설정되어 있지 않습니다.')
  }
  return API_BASE_URL
}

async function apiGet<T>(
  path: string,
  params?: Record<string, ApiParamValue>
): Promise<T> {
  const baseUrl = ensureApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(normalizedPath, `${baseUrl}/`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.append(key, String(value))
    })
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'omit'
  })

  const retryAfterHeader = response.headers.get('Retry-After')
  const retryAfterSeconds = retryAfterHeader
    ? Number(retryAfterHeader)
    : undefined

  if (!response.ok) {
    let payload: ErrorPayload | undefined
    let message = '요청 처리에 실패했습니다.'

    try {
      const body = (await response.json()) as ErrorPayload
      payload = body
      if (body?.message) message = body.message
    } catch (error) {
      if (response.status === 429 && retryAfterSeconds) {
        message = `요청 한도를 초과했습니다. ${retryAfterSeconds}초 뒤 다시 시도해 주세요.`
      }
    }

    throw new ApiError(message, {
      status: response.status,
      code: payload?.code,
      retryAfterSeconds,
      payload
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function isLegacyFilters(
  filters: RecommendationParams | SearchFilters
): filters is SearchFilters {
  if (!filters || typeof filters !== 'object') return false
  const legacy = filters as SearchFilters
  return (
    legacy.housingType !== undefined ||
    legacy.priceRanges !== undefined ||
    legacy.occupation !== undefined ||
    legacy.supportTags !== undefined ||
    legacy.infraLevel !== undefined
  )
}

const legacySupportTagMap: Record<string, string> = {
  주거지원: 'HOUSING_SUPPORT'
}

let supportTagsCache: CodeItem[] | null = null
let supportTagsPromise: Promise<CodeItem[]> | null = null

let jobTopCodesCache: CodeItem[] | null = null
let jobTopCodesPromise: Promise<CodeItem[]> | null = null

const jobMidCodesCache: Record<string, CodeItem[] | undefined> = {}
const jobMidCodesPromises: Record<string, Promise<CodeItem[]> | undefined> = {}

const VALID_INFRA_MAJORS: InfraStat['major'][] = [
  'HEALTH',
  'FOOD',
  'CULTURE',
  'LIFE'
]

function legacyToRecommendationParams(
  filters: SearchFilters
): RecommendationParams {
  const dwellingType = filters.housingType === '전세' ? 'JEONSE' : 'MONTHLY'
  const price = dwellingType === 'MONTHLY' ? 60 : 9000
  const infraImportance =
    filters.infraLevel === '3'
      ? 'HIGH'
      : filters.infraLevel === '2'
        ? 'MID'
        : 'LOW'
  const supportTagName = filters.supportTags?.find(
    (tag) => legacySupportTagMap[tag]
  )

  return {
    dwellingType,
    price,
    infraImportance,
    supportTag: supportTagName ? legacySupportTagMap[supportTagName] : undefined
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toInfraStats(
  list:
    | Array<{
        major: InfraStat['major']
        num?: number | null
        score?: number | string | null
      }>
    | undefined
): InfraStat[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && item.major)
    .map((item) => ({
      major: item.major,
      num: Number(item.num ?? 0),
      score: toNullableNumber(item.score ?? null)
    }))
}

function toJobInfo(data: unknown): JobInfo | null {
  const record = toRecord(data)
  if (!record) return null
  const countRaw = record.count
  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw ?? 0)
  return {
    count: Number.isFinite(count) ? count : 0,
    url: typeof record.url === 'string' ? record.url : null
  }
}

function toDwellingSimpleInfo(data: unknown): DwellingSimpleInfo | null {
  const record = toRecord(data)
  if (!record) return null
  const monthMidRaw =
    record.monthMid ?? record.MonthMid ?? record['month_mid'] ?? null
  const jeonseMidRaw =
    record.jeonseMid ?? record.JeonseMid ?? record['jeonse_mid'] ?? null
  return {
    monthMid: toNullableNumber(monthMidRaw),
    jeonseMid: toNullableNumber(jeonseMidRaw)
  }
}

function toSupportItems(list: unknown): RegionDetailSupportItem[] {
  const items: RegionDetailSupportItem[] = []
  if (!list) return items

  const rawSource = Array.isArray(list) ? list : toRecord(list)?.supportDTOList
  const source = Array.isArray(rawSource) ? rawSource : []

  for (const raw of source) {
    const item = toRecord(raw)
    if (!item) continue
    const title = (item.plcyNm as string) || (item.title as string) || ''
    const url = (item.aplyUrlAddr as string) || (item.url as string) || ''
    const keyword = (item.plcyKywdNm as string) ?? null
    if (!title) continue
    items.push({ title, url, keyword })
  }
  return items
}

function mapRecommendationResponse(payload: unknown): RegionRecommendation {
  const source = toRecord(payload) ?? {}
  const dwellingSimple = toDwellingSimpleInfo(source.dwellingSimpleInfo)
  const totalJobInfo = toJobInfo(source.totalJobInfo)
  const fitJobInfo = toJobInfo(source.fitJobInfo)
  const totalSupportNum =
    typeof source.totalSupportNum === 'number' ? source.totalSupportNum : null
  const fitSupportNum =
    typeof source.fitSupportNum === 'number' ? source.fitSupportNum : null

  return {
    sidoCode: String(source.sidoCode ?? ''),
    sidoName: String(source.sidoName ?? ''),
    sigunguCode: String(source.sigunguCode ?? ''),
    sigunguName: String(source.sigunguName ?? ''),
    score: (source.score as number | null | undefined) ?? null,
    totalJobInfo,
    fitJobInfo,
    totalSupportNum,
    fitSupportNum,
    dwellingSimpleInfo: dwellingSimple,
    infraMajors: toInfraStats(
      source.infraMajors as
        | Array<{ major: InfraStat['major']; num?: number | null }>
        | undefined
    )
  }
}

function mapAiPick(payload: unknown): AiPickRecommendation | null {
  const record = toRecord(payload)
  if (!record) return null
  const codeRaw = record.aiPickSigunguCode
  const reasonRaw = record.aiPickReason
  const code = typeof codeRaw === 'string' ? codeRaw.trim() : ''
  const reason = typeof reasonRaw === 'string' ? reasonRaw.trim() : ''
  if (!code) return null
  return {
    aiPickSigunguCode: code,
    aiPickReason: reason
  }
}

function mapDetailResponse(payload: unknown): RegionDetail {
  const source = toRecord(payload) ?? {}
  const totalJobInfo = toJobInfo(source.totalJobInfo)
  const fitJobInfo = toJobInfo(source.fitJobInfo)
  const dwellingInfoRaw =
    source.dwellingInfo && typeof source.dwellingInfo === 'object'
      ? (source.dwellingInfo as Record<string, unknown>)
      : undefined
  const dwellingInfo = dwellingInfoRaw
    ? {
        monthAvg: toNullableNumber(
          dwellingInfoRaw.monthAvg ?? dwellingInfoRaw.MonthAvg ?? null
        ),
        monthMid: toNullableNumber(
          dwellingInfoRaw.monthMid ?? dwellingInfoRaw.MonthMid ?? null
        ),
        jeonseAvg: toNullableNumber(
          dwellingInfoRaw.jeonseAvg ?? dwellingInfoRaw.JeonseAvg ?? null
        ),
        jeonseMid: toNullableNumber(
          dwellingInfoRaw.jeonseMid ?? dwellingInfoRaw.JeonseMid ?? null
        )
      }
    : null

  const supportItems = toSupportItems(
    source.supportList ?? source.totalSupportList
  )
  const aiUseRaw = source.aiUse
  const aiUse =
    typeof aiUseRaw === 'boolean'
      ? aiUseRaw
      : typeof aiUseRaw === 'string'
        ? aiUseRaw.toLowerCase() === 'true'
        : null
  const aiSummaryRaw = source.aiSummary
  const aiSummary =
    typeof aiSummaryRaw === 'string' && aiSummaryRaw.trim().length > 0
      ? aiSummaryRaw.trim()
      : null
  const infraDetails: RegionDetailInfraItem[] = Array.isArray(
    source.infraDetails
  )
    ? (source.infraDetails as unknown[])
        .map((item) => {
          const record = toRecord(item)
          if (!record) return null
          const major = record.major
          const name = record.name
          const num = Number(record.num ?? 0)
          if (
            typeof major !== 'string' ||
            typeof name !== 'string' ||
            !VALID_INFRA_MAJORS.includes(major as InfraStat['major'])
          ) {
            return null
          }
          return { major: major as InfraStat['major'], name, num }
        })
        .filter((entry): entry is RegionDetailInfraItem => entry !== null)
    : []

  return {
    sidoCode: String(source.sidoCode ?? ''),
    sidoName: String(source.sidoName ?? ''),
    sigunguCode: String(source.sigunguCode ?? ''),
    sigunguName: String(source.sigunguName ?? ''),
    totalJobInfo,
    fitJobInfo,
    totalJobs: totalJobInfo?.count ?? undefined,
    fitJobs: fitJobInfo?.count ?? null,
    jobURL:
      totalJobInfo?.url ?? (source.jobURL as string | null | undefined) ?? null,
    monthlyRentAvg: dwellingInfo?.monthAvg ?? undefined,
    monthlyRentMid: dwellingInfo?.monthMid ?? undefined,
    jeonseAvg: dwellingInfo?.jeonseAvg ?? undefined,
    jeonseMid: dwellingInfo?.jeonseMid ?? undefined,
    totalSupportNum:
      typeof source.totalSupportNum === 'number'
        ? source.totalSupportNum
        : null,
    totalSupportList: supportItems,
    supportList: supportItems,
    aiUse,
    aiSummary,
    dwellingInfo,
    infra: infraDetails,
    infraDetails
  }
}

export async function fetchRecommendations(
  filters: RecommendationParams | SearchFilters
): Promise<{ items: RegionRecommendation[]; aiPick: AiPickRecommendation[] }> {
  const normalizedFilters = isLegacyFilters(filters)
    ? legacyToRecommendationParams(filters)
    : filters

  const response = await apiGet<unknown>('/api/recommend', {
    supportTag: normalizedFilters.supportTag,
    midJobCode: normalizedFilters.midJobCode,
    dwellingType: normalizedFilters.dwellingType,
    price: normalizedFilters.price,
    infraImportance: normalizedFilters.infraImportance,
    aiUse: 'true'
  })

  const root = toRecord(response) ?? {}
  const itemsRaw = Array.isArray(root.items) ? root.items : []
  const aiPickRaw = Array.isArray(root.aiPick) ? root.aiPick : []

  const items = itemsRaw.map(mapRecommendationResponse)
  const aiPick = aiPickRaw
    .map(mapAiPick)
    .filter((entry): entry is AiPickRecommendation => entry !== null)

  return { items, aiPick }
}

export async function fetchRegionDetail(params: {
  sigunguCode: string
  midJobCode?: string
  jobCode?: string
  aiUse?: boolean
}): Promise<RegionDetail> {
  const response = await apiGet<unknown>('/api/detail', {
    sigunguCode: params.sigunguCode,
    midJobCode: params.midJobCode ?? params.jobCode,
    aiUse: params.aiUse === true ? 'true' : undefined
  })

  return mapDetailResponse(response)
}

export async function fetchJobTopCodes(): Promise<CodeItem[]> {
  if (jobTopCodesCache) return jobTopCodesCache

  if (!jobTopCodesPromise) {
    jobTopCodesPromise = apiGet<CodeItem[]>('/api/code/jobTop')
      .then((response) => response ?? [])
      .then((data) => {
        jobTopCodesCache = data
        return data
      })
      .catch((error) => {
        jobTopCodesCache = null
        throw error
      })
      .finally(() => {
        jobTopCodesPromise = null
      })
  }

  if (!jobTopCodesPromise) return jobTopCodesCache ?? []
  return jobTopCodesPromise
}

export async function fetchJobMidCodes(topCode: string): Promise<CodeItem[]> {
  if (!topCode) return []
  const cached = jobMidCodesCache[topCode]
  if (cached) return cached

  if (!jobMidCodesPromises[topCode]) {
    jobMidCodesPromises[topCode] = apiGet<CodeItem[]>('/api/code/jobMid', {
      topCode
    })
      .then((response) => response ?? [])
      .then((data) => {
        jobMidCodesCache[topCode] = data
        return data
      })
      .catch((error) => {
        delete jobMidCodesCache[topCode]
        throw error
      })
      .finally(() => {
        delete jobMidCodesPromises[topCode]
      })
  }

  const promise = jobMidCodesPromises[topCode]
  if (!promise) return jobMidCodesCache[topCode] ?? []
  return promise
}

export async function fetchSupportTags(): Promise<CodeItem[]> {
  if (supportTagsCache) return supportTagsCache

  if (!supportTagsPromise) {
    supportTagsPromise = apiGet<CodeItem[]>('/api/code/supportTag')
      .then((response) => response ?? [])
      .then((data) => {
        supportTagsCache = data
        return data
      })
      .catch((error) => {
        supportTagsCache = null
        throw error
      })
      .finally(() => {
        supportTagsPromise = null
      })
  }

  if (!supportTagsPromise) return supportTagsCache ?? []
  return supportTagsPromise
}

export async function fetchSidoCodes(): Promise<CodeItem[]> {
  const response = await apiGet<CodeItem[]>('/api/code/sido')
  return response ?? []
}

export async function fetchSigunguCodes(sidoCode: string): Promise<CodeItem[]> {
  if (!sidoCode) return []
  const response = await apiGet<CodeItem[]>('/api/code/sigungu', { sidoCode })
  return response ?? []
}

export function formatNumberComma(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function formatKRW(value: number): string {
  return `${formatNumberComma(value)}원`
}

export function formatKRWMan(value: number): string {
  return `${formatNumberComma(value)}만원`
}
