import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = process.cwd()
const [, , inputArg, outputArg] = process.argv
const svgPath = resolve(projectRoot, inputArg || 'src/assets/output3.svg')
const computedDefaultOut = inputArg
  ? inputArg.replace(/\.svg$/i, '.json')
  : 'src/assets/output3.json'
const outPath = resolve(projectRoot, outputArg || computedDefaultOut)

const svgContent = readFileSync(svgPath, 'utf8')

// Match <path ...> tags (self-closing or not), non-greedy
const pathTagRegex = /<path\b[^>]*?>/g

/**
 * Extract attribute value by name from a single tag string.
 * The regex searches within the tag for name="..." and returns the first match.
 */
function getAttribute(tag, name) {
  const re = new RegExp(`\\s${name}="([^"]+)"`)
  const match = tag.match(re)
  return match ? match[1] : null
}

const idToD = {}
let match
while ((match = pathTagRegex.exec(svgContent)) !== null) {
  const tag = match[0]
  const id = getAttribute(tag, 'id')
  const d = getAttribute(tag, 'd')
  if (id && d) {
    idToD[id] = d
  }
}

writeFileSync(outPath, JSON.stringify(idToD, null, 2), 'utf8')

const count = Object.keys(idToD).length
console.log(`Wrote ${count} entries to ${outPath}`)
