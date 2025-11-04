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
  aiUse?: boolean | null
  aiSummary?: string | null
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
