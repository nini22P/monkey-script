import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

interface ScriptMeta {
  name: string
  description?: string
  icon?: string
  match?: string[]
  grant?: string[]
  require?: string[]
  externals?: Record<string, string>
}

interface ScriptState {
  version: string
  hash: string
}

const ORDER: (keyof Required<ScriptMeta> | 'namespace' | 'version' | 'author' | 'license' | 'downloadURL' | 'updateURL')[] = [
  'name', 'namespace', 'version', 'description', 'author',
  'icon', 'match', 'grant', 'require', 'license',
  'downloadURL', 'updateURL',
]

const RAW_URL = 'https://github.com/nini22P/monkey-script/raw/refs/heads/main'
const DEFAULT_AUTHOR = '22'
const DEFAULT_LICENSE = 'MIT'
const STATE_FILE = '.userscript-state.json'

function namespaceFor(dir: string): string {
  return `https://github.com/nini22P/monkey-script/tree/main/${dir}`
}

function today(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function isDateFormat(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v)
}

function isSemver(v: string): boolean {
  return /^\d+\.\d+(\.\d+)?$/.test(v)
}

function nextVersion(current: string): string {
  if (isDateFormat(current)) return today()
  if (isSemver(current)) {
    const parts = current.split('.').map(Number)
    parts[parts.length - 1]++
    return parts.join('.')
  }
  return today()
}

function hash(content: string): string {
  return createHash('md5').update(content).digest('hex')
}

function loadState(root: string): Record<string, ScriptState> {
  const p = join(root, STATE_FILE)
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function saveState(root: string, state: Record<string, ScriptState>): void {
  writeFileSync(join(root, STATE_FILE), JSON.stringify(state, null, 2) + '\n')
}

function generateBanner(meta: ScriptMeta & { namespace: string; version: string; author: string; license: string; downloadURL: string; updateURL: string }): string {
  const lines: string[] = ['// ==UserScript==']
  for (const key of ORDER) {
    const val = (meta as any)[key]
    if (val == null) continue
    if (Array.isArray(val)) {
      for (const v of val) lines.push(`// @${key} ${v}`)
    } else {
      lines.push(`// @${key} ${val}`)
    }
  }
  lines.push('// ==/UserScript==')
  return lines.join('\n')
}

export default function userscriptPlugin(): Plugin {
  const metas: Record<string, ScriptMeta> = {}
  let root = ''

  return {
    name: 'vite-plugin-userscript',

    configResolved(c) {
      root = c.root
    },

    config() {
      const cwd = root || process.cwd()
      const entries: Record<string, string> = {}
      const external: string[] = []
      const globals: Record<string, string> = {}

      const dirs = readdirSync(cwd)
        .filter(f => statSync(join(cwd, f)).isDirectory())
        .filter(f => existsSync(join(cwd, f, 'index.ts')))

      for (const dir of dirs) {
        entries[dir] = join(cwd, dir, 'index.ts')
        const metaPath = join(cwd, dir, 'meta.json')
        if (existsSync(metaPath)) {
          metas[dir] = JSON.parse(readFileSync(metaPath, 'utf-8'))
        }
      }

      return {
        build: {
          rollupOptions: {
            input: entries,
            output: {
              entryFileNames: '[name].user.js',
              format: 'es',
              inlineDynamicImports: false,
              globals: Object.keys(globals).length > 0 ? globals : undefined,
            },
            external: external.length > 0 ? external : undefined,
          },
        },
      }
    },

    generateBundle(_, bundle) {
      const state = loadState(root)

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        const scriptName = chunk.name
        const rawMeta = metas[scriptName]
        if (!rawMeta) continue

        const dir = scriptName

        const jsHash = hash(chunk.code)

        const prev = state[dir]
        const oldVersion = (rawMeta as any).version
        let version: string
        if (prev && prev.hash === jsHash) {
          version = prev.version
        } else if (prev) {
          version = nextVersion(prev.version)
        } else if (oldVersion) {
          version = oldVersion
        } else {
          version = today()
        }

        const fullMeta = {
          ...rawMeta,
          namespace: namespaceFor(dir),
          version,
          author: DEFAULT_AUTHOR,
          license: DEFAULT_LICENSE,
          downloadURL: `${RAW_URL}/${dir}/${dir}.user.js`,
          updateURL: `${RAW_URL}/${dir}/${dir}.user.js`,
        }

        chunk.code = generateBanner(fullMeta) + '\n' + chunk.code
        state[dir] = { version, hash: jsHash }
      }

      saveState(root, state)
    },
  }
}
