import regionsJson from 'assets/regions.json'

export type SidoItem = { code: string; name: string }
export type SigunguItem = { sidoCode: string; code: string; name: string }

export interface RegionJson {
  sidoList: SidoItem[]
  sigunguList: SigunguItem[]
  bySido: Record<
    string,
    {
      code: string
      name: string
      sigungu: Array<{ code: string; name: string }>
    }
  >
  sidoByCode: Record<string, string>
  sigunguByCode: Record<
    string,
    { name: string; sidoCode: string; sidoName?: string }
  >
}

export const REGION_JSON = regionsJson as RegionJson

export function loadSidoList(): SidoItem[] {
  return REGION_JSON.sidoList
}

export function loadSigunguList(): SigunguItem[] {
  return REGION_JSON.sigunguList
}

export function getSigunguBySido(sidoCode: string): SigunguItem[] {
  return REGION_JSON.sigunguList.filter((s) => s.sidoCode === sidoCode)
}
