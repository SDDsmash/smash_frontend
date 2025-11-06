import { create } from 'zustand'

import type { RecommendationParams } from 'utils'

type DwellingTypeOption = RecommendationParams['dwellingType']

type RecommendationFiltersState = {
  housingType: DwellingTypeOption
  selectedPrice: number
  infraChoices: string[]
  supportTagCodes: string[]
  occupationQuery: string
  selectedJobMid: string
  selectedJobTop: string
  setHousingType: (value: DwellingTypeOption) => void
  setSelectedPrice: (value: number) => void
  setInfraChoices: (choices: string[]) => void
  toggleInfraChoice: (choice: string) => void
  setSupportTagCodes: (codes: string[]) => void
  toggleSupportTagCode: (code: string) => void
  setOccupationQuery: (value: string) => void
  setSelectedJobMid: (value: string) => void
  setSelectedJobTop: (value: string) => void
  reset: () => void
}

const DEFAULT_PRICE = 20

export const useRecommendationFilters = create<RecommendationFiltersState>(
  (set, get) => ({
    housingType: 'MONTHLY',
    selectedPrice: DEFAULT_PRICE,
    infraChoices: [],
    supportTagCodes: [],
    occupationQuery: '',
    selectedJobMid: '',
    selectedJobTop: '',
    setHousingType: (value) => set({ housingType: value }),
    setSelectedPrice: (value) => set({ selectedPrice: value }),
    setInfraChoices: (choices) =>
      set({ infraChoices: Array.from(new Set(choices)) }),
    toggleInfraChoice: (choice) => {
      const { infraChoices } = get()
      if (infraChoices.includes(choice)) {
        set({ infraChoices: infraChoices.filter((item) => item !== choice) })
      } else {
        set({ infraChoices: [...infraChoices, choice] })
      }
    },
    setSupportTagCodes: (codes) =>
      set({ supportTagCodes: Array.from(new Set(codes)) }),
    toggleSupportTagCode: (code) => {
      const { supportTagCodes } = get()
      if (supportTagCodes.includes(code)) {
        set({
          supportTagCodes: supportTagCodes.filter((item) => item !== code)
        })
      } else {
        set({ supportTagCodes: [...supportTagCodes, code] })
      }
    },
    setOccupationQuery: (value) => set({ occupationQuery: value }),
    setSelectedJobMid: (value) => set({ selectedJobMid: value }),
    setSelectedJobTop: (value) => set({ selectedJobTop: value }),
    reset: () =>
      set({
        housingType: 'MONTHLY',
        selectedPrice: DEFAULT_PRICE,
        infraChoices: [],
        supportTagCodes: [],
        occupationQuery: '',
        selectedJobMid: '',
        selectedJobTop: ''
      })
  })
)
