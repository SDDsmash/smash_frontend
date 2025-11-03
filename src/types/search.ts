export type InfraMajor = 'HEALTH' | 'FOOD' | 'CULTURE' | 'LIFE'

export interface InfraStat {
  major: InfraMajor
  num: number
}

export interface JobInfo {
  count: number
  url?: string | null
}

export interface DwellingSimpleInfo {
  monthMid?: number | null
  jeonseMid?: number | null
}

export interface DwellingInfo extends DwellingSimpleInfo {
  monthAvg?: number | null
  jeonseAvg?: number | null
}

export interface RegionRecommendation {
  sidoCode: string
  sidoName: string
  sigunguCode: string
  sigunguName: string
  score?: number | null
  totalJobInfo?: JobInfo | null
  fitJobInfo?: JobInfo | null
  totalSupportNum?: number | null
  fitSupportNum?: number | null
  dwellingSimpleInfo?: DwellingSimpleInfo | null
  infraMajors?: InfraStat[]

  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  totalJobNum?: number
  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  fitJobNum?: number | null
  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  monthlyRentAvg?: number
  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  monthlyRentMid?: number
  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  jeonseAvg?: number
  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  jeonseMid?: number
  /** @deprecated 기존 UI 호환성을 위한 플랫 필드 */
  infra?: InfraStat[]
}

export interface RegionDetailInfraItem {
  major: InfraMajor
  name: string
  num: number
}

export interface RegionDetailSupportItem {
  title: string
  url: string
  keyword?: string | null
}

export interface RegionDetail {
  sidoCode: string
  sidoName: string
  sigunguCode: string
  sigunguName: string
  totalJobInfo?: JobInfo | null
  fitJobInfo?: JobInfo | null
  totalJobs?: number
  fitJobs?: number | null
  jobURL?: string | null
  monthlyRentAvg?: number
  monthlyRentMid?: number
  jeonseAvg?: number
  jeonseMid?: number
  totalSupportNum?: number | null
  totalSupportList?: RegionDetailSupportItem[]
  supportList?: RegionDetailSupportItem[]
  dwellingInfo?: DwellingInfo | null
  infra?: RegionDetailInfraItem[]
  infraDetails?: RegionDetailInfraItem[]
}

// Region code aliases for clarity
export type SidoCode = string
export type SigunguCode = string
