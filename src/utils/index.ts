import type {
  RegionRecommendation,
  InfraStat,
  RegionDetail,
  RegionDetailInfraItem,
  RegionDetailSupportItem,
  JobInfo,
  DwellingSimpleInfo
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

function toInfraStats(
  list: Array<{ major: InfraStat['major']; num?: number | null }> | undefined
): InfraStat[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && item.major)
    .map((item) => ({
      major: item.major,
      num: Number(item.num ?? 0)
    }))
}

function toJobInfo(data: any): JobInfo | null {
  if (!data || typeof data !== 'object') return null
  const countRaw = 'count' in data ? data.count : undefined
  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw ?? 0)
  return {
    count: Number.isFinite(count) ? count : 0,
    url: typeof data.url === 'string' ? data.url : null
  }
}

function toDwellingSimpleInfo(data: any): DwellingSimpleInfo | null {
  if (!data || typeof data !== 'object') return null
  const monthMid = data.monthMid ?? data.MonthMid ?? data.month_mid
  const jeonseMid = data.jeonseMid ?? data.JeonseMid ?? data.jeonse_mid
  return {
    monthMid: monthMid == null ? null : Number(monthMid),
    jeonseMid: jeonseMid == null ? null : Number(jeonseMid)
  }
}

function toSupportItems(list: any): RegionDetailSupportItem[] {
  const items: RegionDetailSupportItem[] = []
  if (!list) return items

  const source = Array.isArray(list) ? list : list.supportDTOList
  if (!Array.isArray(source)) return items

  for (const item of source) {
    if (!item) continue
    const title = (item.plcyNm as string) || (item.title as string) || ''
    const url = (item.aplyUrlAddr as string) || (item.url as string) || ''
    const keyword = (item.plcyKywdNm as string) ?? null
    if (!title) continue
    items.push({ title, url, keyword })
  }
  return items
}

function mapRecommendationResponse(payload: any): RegionRecommendation {
  const dwellingSimple = toDwellingSimpleInfo(payload?.dwellingSimpleInfo)
  const totalJobInfo = toJobInfo(payload?.totalJobInfo)
  const fitJobInfo = toJobInfo(payload?.fitJobInfo)

  const monthlyMid = dwellingSimple?.monthMid ?? undefined
  const jeonseMid = dwellingSimple?.jeonseMid ?? undefined
  const monthlyAvgApprox = monthlyMid
  const jeonseAvgApprox = jeonseMid

  return {
    sidoCode: String(payload?.sidoCode ?? ''),
    sidoName: String(payload?.sidoName ?? ''),
    sigunguCode: String(payload?.sigunguCode ?? ''),
    sigunguName: String(payload?.sigunguName ?? ''),
    score: payload?.score ?? null,
    totalJobInfo,
    fitJobInfo,
    totalSupportNum: payload?.totalSupportNum ?? null,
    fitSupportNum: payload?.fitSupportNum ?? null,
    dwellingSimpleInfo: dwellingSimple,
    infraMajors: toInfraStats(payload?.infraMajors),

    // legacy flattened fields for existing UI
    totalJobNum: totalJobInfo?.count ?? undefined,
    fitJobNum: fitJobInfo?.count ?? null,
    monthlyRentAvg: monthlyAvgApprox,
    monthlyRentMid: monthlyMid,
    jeonseAvg: jeonseAvgApprox,
    jeonseMid,
    infra: toInfraStats(payload?.infraMajors)
  }
}

function mapDetailResponse(payload: any): RegionDetail {
  const totalJobInfo = toJobInfo(payload?.totalJobInfo)
  const fitJobInfo = toJobInfo(payload?.fitJobInfo)
  const dwellingInfoRaw = payload?.dwellingInfo
  const dwellingInfo = dwellingInfoRaw
    ? {
        monthAvg: dwellingInfoRaw.monthAvg ?? dwellingInfoRaw.MonthAvg ?? null,
        monthMid: dwellingInfoRaw.monthMid ?? dwellingInfoRaw.MonthMid ?? null,
        jeonseAvg:
          dwellingInfoRaw.jeonseAvg ?? dwellingInfoRaw.JeonseAvg ?? null,
        jeonseMid:
          dwellingInfoRaw.jeonseMid ?? dwellingInfoRaw.JeonseMid ?? null
      }
    : null

  const supportItems = toSupportItems(
    payload?.supportList ?? payload?.totalSupportList
  )
  const infraDetails: RegionDetailInfraItem[] = Array.isArray(
    payload?.infraDetails
  )
    ? payload.infraDetails.map((item: any) => ({
        major: item.major,
        name: item.name,
        num: Number(item.num ?? 0)
      }))
    : []

  return {
    sidoCode: String(payload?.sidoCode ?? ''),
    sidoName: String(payload?.sidoName ?? ''),
    sigunguCode: String(payload?.sigunguCode ?? ''),
    sigunguName: String(payload?.sigunguName ?? ''),
    totalJobInfo,
    fitJobInfo,
    totalJobs: totalJobInfo?.count ?? undefined,
    fitJobs: fitJobInfo?.count ?? null,
    jobURL: totalJobInfo?.url ?? payload?.jobURL ?? null,
    monthlyRentAvg: dwellingInfo?.monthAvg ?? undefined,
    monthlyRentMid: dwellingInfo?.monthMid ?? undefined,
    jeonseAvg: dwellingInfo?.jeonseAvg ?? undefined,
    jeonseMid: dwellingInfo?.jeonseMid ?? undefined,
    totalSupportNum: payload?.totalSupportNum ?? null,
    totalSupportList: supportItems,
    supportList: supportItems,
    dwellingInfo,
    infra: infraDetails,
    infraDetails
  }
}

export async function fetchRecommendations(
  filters: RecommendationParams | SearchFilters
): Promise<RegionRecommendation[]> {
  const normalizedFilters = isLegacyFilters(filters)
    ? legacyToRecommendationParams(filters)
    : filters

  const response = await apiGet<any[]>('/api/recommend', {
    supportTag: normalizedFilters.supportTag,
    midJobCode: normalizedFilters.midJobCode,
    dwellingType: normalizedFilters.dwellingType,
    price: normalizedFilters.price,
    infraImportance: normalizedFilters.infraImportance
  })

  return Array.isArray(response) ? response.map(mapRecommendationResponse) : []
}

export async function fetchRegionDetail(params: {
  sigunguCode: string
  midJobCode?: string
  jobCode?: string
}): Promise<RegionDetail> {
  const response = await apiGet<any>('/api/detail', {
    sigunguCode: params.sigunguCode,
    midJobCode: params.midJobCode ?? params.jobCode
  })

  return mapDetailResponse(response)
}

export async function fetchJobTopCodes(): Promise<CodeItem[]> {
  const response = await apiGet<CodeItem[]>('/api/code/jobTop')
  return response ?? []
}

export async function fetchJobMidCodes(topCode: string): Promise<CodeItem[]> {
  if (!topCode) return []
  const response = await apiGet<CodeItem[]>('/api/code/jobMid', { topCode })
  return response ?? []
}

export async function fetchSupportTags(): Promise<CodeItem[]> {
  const response = await apiGet<CodeItem[]>('/api/code/supportTag')
  return response ?? []
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
