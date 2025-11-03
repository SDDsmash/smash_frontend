import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { REGION_JSON } from '../utils/regionCodes'
import sidoData from '../assets/sido.json'
import sigunguData from '../assets/sigungu.json'

type PathsMap = Record<string, string>

export default function RegionPreviewMap({
  sigunguCode
}: {
  sigunguCode?: string | null
}) {
  const sidoPaths = useMemo(() => sidoData as PathsMap, [])
  const sigunguPaths = useMemo(() => sigunguData as PathsMap, [])

  const selectedSigunguPath = sigunguCode
    ? sigunguPaths[sigunguCode]
    : undefined
  const parentInfo = sigunguCode
    ? REGION_JSON.sigunguByCode?.[sigunguCode]
    : undefined
  const parentSidoCode = parentInfo?.sidoCode
  const siblingSigungu = useMemo(() => {
    if (!parentSidoCode) return [] as Array<[string, string]>
    return Object.entries(sigunguPaths).filter(([code]) =>
      code.startsWith(parentSidoCode)
    )
  }, [parentSidoCode, sigunguPaths])

  const measureGroupRef = useRef<SVGGElement | null>(null)
  const [fitTransform, setFitTransform] = useState('')

  useLayoutEffect(() => {
    const g = measureGroupRef.current
    if (!g) return
    const raf = requestAnimationFrame(() => {
      try {
        const bbox = g.getBBox()
        const viewW = 800
        const viewH = 1000
        if (
          !isFinite(bbox.width) ||
          !isFinite(bbox.height) ||
          bbox.width === 0 ||
          bbox.height === 0
        ) {
          setFitTransform('')
          return
        }
        const padRatio = 0.04
        const pad = Math.max(5, Math.min(bbox.width, bbox.height) * padRatio)
        const scale = Math.min(
          viewW / (bbox.width + pad * 2),
          viewH / (bbox.height + pad * 2)
        )
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        const centerX = viewW / 2
        const centerY = viewH / 2
        const transform = `translate(${centerX} ${centerY}) scale(${scale}) translate(${-cx} ${-cy})`
        setFitTransform(transform)
      } catch {
        setFitTransform('')
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [siblingSigungu, selectedSigunguPath, parentSidoCode])

  return (
    <div className="flex size-full min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-inner">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 1000"
        className="size-full max-h-80 max-w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <g transform={fitTransform} ref={measureGroupRef}>
          {siblingSigungu.length > 0
            ? siblingSigungu.map(([code, d]) => (
                <path
                  key={code}
                  d={d}
                  className={`stroke-white stroke-[0.5] ${
                    code === sigunguCode ? 'fill-brand-600' : 'fill-gray-400'
                  }`}
                />
              ))
            : Object.entries(sidoPaths).map(([code, d]) => (
                <path
                  key={code}
                  d={d}
                  className={`stroke-white stroke-[0.5] ${
                    code === parentSidoCode ? 'fill-brand-600' : 'fill-gray-400'
                  }`}
                />
              ))}
          {selectedSigunguPath ? (
            <path
              d={selectedSigunguPath}
              className="fill-brand-600 stroke-white stroke-[0.8]"
            />
          ) : null}
        </g>
      </svg>
    </div>
  )
}
