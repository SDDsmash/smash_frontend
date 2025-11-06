export interface BitmaskOption {
  id: string
}

export function encodeBitmask(
  options: readonly BitmaskOption[],
  selectedIds: string[]
): number {
  const optionIndex = new Map<string, number>()
  options.forEach((option, index) => {
    optionIndex.set(option.id, index)
  })

  return selectedIds.reduce((mask, id) => {
    const index = optionIndex.get(id)
    if (index === undefined) return mask
    const bit = 1 << (options.length - 1 - index)
    return mask | bit
  }, 0)
}

export function decodeBitmask(
  options: readonly BitmaskOption[],
  mask: number
): string[] {
  if (!Number.isFinite(mask) || mask <= 0) return []

  return options.reduce<string[]>((acc, option, index) => {
    const bit = 1 << (options.length - 1 - index)
    if ((mask & bit) !== 0) acc.push(option.id)
    return acc
  }, [])
}
