import { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react'
import { REGION_JSON } from '../utils/regionCodes'
import sidoData from '../assets/sido.json'
import sigunguData from '../assets/sigungu.json'

type PathsMap = Record<string, string>

type ViewLevel = 'sido' | 'sigungu'

export default function InteractiveMap({
  onSidoChange,
  onViewLevelChange,
  externalResetToken,
  onSigunguClick,
  activeSigunguCode
}: {
  onSidoChange?: (code: string | null, name: string | null) => void
  onViewLevelChange?: (view: ViewLevel) => void
  externalResetToken?: number
  onSigunguClick?: (sigunguCode: string) => void
  activeSigunguCode?: string | null
}) {
  const [sidoPaths, setSidoPaths] = useState<PathsMap>({})
  const [sigunguPaths, setSigunguPaths] = useState<PathsMap>({})
  const [viewLevel, setViewLevel] = useState<ViewLevel>('sido')
  const [selectedSido, setSelectedSido] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const measureGroupRef = useRef<SVGGElement | null>(null)
  const [fitTransform, setFitTransform] = useState<string>('')

  useEffect(() => {
    setSidoPaths(sidoData as PathsMap)
    setSigunguPaths(sigunguData as PathsMap)
  }, [])

  const sigunguEntries = useMemo(() => {
    if (!selectedSido) return [] as Array<[string, string]>
    return Object.entries(sigunguPaths).filter(([code]) =>
      code.startsWith(selectedSido)
    )
  }, [sigunguPaths, selectedSido])

  useEffect(() => {
    if (!activeSigunguCode) return
    const parent = REGION_JSON.sigunguByCode?.[activeSigunguCode]
    const parentCode = parent?.sidoCode ?? activeSigunguCode.slice(0, 2)
    if (!parentCode) return

    setViewLevel('sigungu')
    if (selectedSido !== parentCode) {
      setSelectedSido(parentCode)
      onSidoChange?.(
        parentCode,
        REGION_JSON.sidoByCode?.[parentCode] ?? parent?.sidoName ?? parentCode
      )
    }
  }, [activeSigunguCode, onSidoChange, selectedSido])

  const tooltipLabel = useMemo(() => {
    if (!hoveredId) return ''
    if (viewLevel === 'sido') {
      return REGION_JSON.sidoByCode?.[hoveredId] ?? hoveredId
    }
    const found = REGION_JSON.sigunguByCode?.[hoveredId]
    return found?.name ?? hoveredId
  }, [hoveredId, viewLevel])

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
    setMouse({ x: e.clientX + 12, y: e.clientY + 12 })
  }

  const resetToSido = () => {
    setViewLevel('sido')
    setSelectedSido(null)
    setHoveredId(null)
    onSidoChange?.(null, null)
  }

  // notify parent when view changes (to show/hide external back button)
  useEffect(() => {
    onViewLevelChange?.(viewLevel)
  }, [viewLevel, onViewLevelChange])

  // allow parent to request reset via token change
  useEffect(() => {
    if (externalResetToken !== undefined) {
      resetToSido()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalResetToken])

  // Auto-fit currently visible shapes into the fixed viewBox (800x1000)
  useLayoutEffect(() => {
    const g = measureGroupRef.current
    if (!g) return
    // Defer to next frame to ensure DOM updated
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
        const padRatio = 0.02
        const pad = Math.max(5, Math.min(bbox.width, bbox.height) * padRatio)
        const s = Math.min(
          viewW / (bbox.width + pad * 2),
          viewH / (bbox.height + pad * 2)
        )
        const cx = bbox.x + bbox.width / 2
        const cy = bbox.y + bbox.height / 2
        // Center the bbox at view center with padding considered in scaling
        // translate(viewCenter) • scale(s) • translate(-bboxCenter)
        const centerX = viewW / 2
        const centerY = viewH / 2
        const t = `translate(${centerX} ${centerY}) scale(${s}) translate(${-cx} ${-cy})`
        setFitTransform(t)
      } catch {
        setFitTransform('')
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [viewLevel, selectedSido, sigunguEntries, sidoPaths])

  return (
    <div className="relative w-full">
      {/* external header is rendered by parent; keep component body minimal */}

      <div
        className="w-full"
        style={{
          aspectRatio: '4/5',
          maxWidth: 900,
          maxHeight: '55vh',
          margin: '0 auto'
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 1000"
          className="size-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredId(null)}
        >
          <g transform={fitTransform}>
            <g ref={measureGroupRef}>
              {viewLevel === 'sido'
                ? Object.entries(sidoPaths).map(([code, d]) => {
                    return (
                      <path
                        key={code}
                        d={d}
                        className="cursor-pointer fill-gray-300 stroke-white stroke-[0.5] transition-colors hover:fill-brand-400"
                        onMouseEnter={() => setHoveredId(code)}
                        onMouseMove={handleMouseMove}
                        onFocus={() => setHoveredId(code)}
                        onClick={() => {
                          setSelectedSido(code)
                          setViewLevel('sigungu')
                          onSidoChange?.(
                            code,
                            REGION_JSON.sidoByCode?.[code] ?? code
                          )
                        }}
                      />
                    )
                  })
                : sigunguEntries.map(([code, d]) => {
                    const isActive = activeSigunguCode === code
                    return (
                      <path
                        key={code}
                        d={d}
                        className={`cursor-pointer ${
                          isActive
                            ? 'fill-brand-500'
                            : 'fill-gray-300 hover:fill-brand-400'
                        } stroke-white stroke-[0.5] transition-colors`}
                        onMouseEnter={() => setHoveredId(code)}
                        onMouseMove={handleMouseMove}
                        onFocus={() => setHoveredId(code)}
                        onClick={() => onSigunguClick?.(code)}
                      />
                    )
                  })}
            </g>
          </g>
        </svg>
      </div>

      {hoveredId && tooltipLabel && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-black/70 px-2 py-1 text-xs text-white shadow"
          style={{ left: mouse.x, top: mouse.y }}
        >
          {tooltipLabel}
        </div>
      )}
    </div>
  )
}
