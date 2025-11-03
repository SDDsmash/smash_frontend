import { create } from 'zustand'
import type { RegionDetail } from 'types/search'
import { fetchRegionDetail } from 'utils'

type ComparisonState = {
  items: RegionDetail[]
  isAdding: boolean
  addBySigunguCode: (sigunguCode: string, options?: { jobCode?: string }) => Promise<void>
  removeBySigunguCode: (sigunguCode: string) => void
  clear: () => void
}

export const useComparison = create<ComparisonState>((set, get) => ({
  items: [],
  isAdding: false,
  addBySigunguCode: async (sigunguCode: string, options?: { jobCode?: string }) => {
    if (!sigunguCode) return
    const exists = get().items.some((x) => String(x.sigunguCode) === String(sigunguCode))
    if (exists) return
    set({ isAdding: true })
    try {
      const data = await fetchRegionDetail({ sigunguCode, midJobCode: options?.jobCode, jobCode: options?.jobCode })
      set((state) => ({ items: [...state.items, data] }))
    } finally {
      set({ isAdding: false })
    }
  },
  removeBySigunguCode: (sigunguCode: string) => {
    set((state) => ({ items: state.items.filter((x) => String(x.sigunguCode) !== String(sigunguCode)) }))
  },
  clear: () => set({ items: [] })
}))


