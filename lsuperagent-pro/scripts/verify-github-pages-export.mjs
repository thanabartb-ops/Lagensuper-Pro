import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

const basePath = process.env.PAGES_BASE_PATH || ''
const outputDirectory = path.resolve('out')
const requiredPages = [
  'index.html',
  'api/health',
  'audit/index.html',
  'chat/index.html',
  'projects/index.html',
  'memory/index.html',
  'runtime/index.html',
  'settings/index.html',
  'tools/index.html',
  'tools/agent-mode/index.html',
  'tools/create-image/index.html',
  'tools/deep-research/index.html',
]

for (const page of requiredPages) {
  await access(path.join(outputDirectory, page), constants.R_OK)
}

const chatHtml = await readFile(path.join(outputDirectory, 'chat/index.html'), 'utf8')
const assetPrefix = `${basePath}/_next/`
const assetReferences = [...chatHtml.matchAll(/\b(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => reference.includes('/_next/'))

if (assetReferences.length === 0 || assetReferences.some((reference) => !reference.startsWith(assetPrefix))) {
  throw new Error(`Chat export does not reference assets below ${assetPrefix}`)
}

console.log(`Verified GitHub Pages export at ${basePath || '/'} (${requiredPages.length} routes).`)
