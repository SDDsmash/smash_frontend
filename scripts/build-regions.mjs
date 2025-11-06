import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const assetsDir = path.join(root, 'src', 'assets')
const outFile = path.join(assetsDir, 'regions.json')

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    const rec = {}
    headers.forEach((h, i) => {
      rec[h] = (cols[i] ?? '').replace(/^"|"$/g, '').trim()
    })
    return rec
  })
}

const sigunguRows = readCsv(path.join(assetsDir, 'sigungu.csv'))

// Canonical sido name mapping (dataset uses: 50 제주, 51 강원, 52 전북)
const CANON_SIDO_NAMES = {
  11: '서울특별시',
  26: '부산광역시',
  27: '대구광역시',
  28: '인천광역시',
  29: '광주광역시',
  30: '대전광역시',
  31: '울산광역시',
  36: '세종특별자치시',
  41: '경기도',
  43: '충청북도',
  44: '충청남도',
  46: '전라남도',
  47: '경상북도',
  48: '경상남도',
  50: '제주특별자치도',
  51: '강원특별자치도',
  52: '전라북도'
}

const sidoList = uniqBy(
  sigunguRows
    .map((r) => String(r.sido_code || r.sidoCode || r.sido || '').trim())
    .filter(Boolean)
    .map((code) => ({ code, name: CANON_SIDO_NAMES[Number(code)] || '' }))
    .filter((r) => r.code && r.name),
  (x) => x.code
).sort((a, b) => a.name.localeCompare(b.name))

const sigunguList = sigunguRows
  .map((r) => ({
    sidoCode: (r.sidoCode || r.sido || r.sido_code || '').trim(),
    code: (r.code || r.sigunguCode || r.sigungu_code || '').trim(),
    name: (r.name || r.sigunguName || r.name || '').trim()
  }))
  .filter((r) => r.sidoCode && r.code && r.name)

// Deduplicate and sort
function uniqBy(arr, keyFn) {
  const map = new Map()
  for (const item of arr) {
    map.set(keyFn(item), item)
  }
  return Array.from(map.values())
}

const sidoByCode = {}
for (const s of sidoList) sidoByCode[s.code] = s.name

const bySido = {}
for (const s of sidoList) bySido[s.code] = { code: s.code, name: s.name, sigungu: [] }
for (const g of sigunguList) {
  if (!bySido[g.sidoCode]) bySido[g.sidoCode] = { code: g.sidoCode, name: sidoByCode[g.sidoCode] || '', sigungu: [] }
  bySido[g.sidoCode].sigungu.push({ code: g.code, name: g.name })
}
for (const k of Object.keys(bySido)) {
  bySido[k].sigungu = uniqBy(bySido[k].sigungu, (x) => x.code).sort((a, b) => a.name.localeCompare(b.name))
}

const sigunguByCode = {}
for (const g of sigunguList) sigunguByCode[g.code] = { name: g.name, sidoCode: g.sidoCode, sidoName: sidoByCode[g.sidoCode] }

const regions = {
  sidoList: uniqBy(sidoList, (x) => x.code).sort((a, b) => a.name.localeCompare(b.name)),
  sigunguList: uniqBy(sigunguList, (x) => x.code).sort((a, b) => a.name.localeCompare(b.name)),
  bySido,
  sidoByCode,
  sigunguByCode
}

fs.writeFileSync(outFile, JSON.stringify(regions, null, 2) + '\n', 'utf8')
process.stdout.write(`Generated ${outFile}\n`)


