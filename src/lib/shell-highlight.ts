// Shell syntax highlighting for YAML block scalars (command: |)
// Produces inline decorations for shell content embedded in YAML.

import * as monaco from 'monaco-editor'

// Token types
type TokenType = 'sh-cmd' | 'sh-flag' | 'sh-val' | 'sh-var' | 'sh-comment' | 'sh-string' | 'sh-op'

interface Token { start: number; length: number; type: TokenType }

const COMMANDS = new Set([
  'python3', 'python', 'bash', 'sh', 'set', 'ulimit', 'export',
  'echo', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'awk', 'sed',
  'exec', 'source', 'eval', 'sleep', 'wait', 'kill', 'nohup', 'if', 'then', 'else', 'fi',
  'for', 'do', 'done', 'while', 'case', 'esac', 'exit', 'return', 'true', 'false',
])

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  const used = new Uint8Array(line.length)

  const mark = (start: number, length: number, type: TokenType) => {
    for (let i = start; i < start + length; i++) {
      if (used[i]) return
    }
    tokens.push({ start, length, type })
    for (let i = start; i < start + length; i++) used[i] = 1
  }

  // Comments
  const commentIdx = line.indexOf('#')
  if (commentIdx >= 0) {
    let inStr = false
    for (let i = 0; i < commentIdx; i++) {
      if (line[i] === '"' || line[i] === "'") inStr = !inStr
    }
    if (!inStr) {
      mark(commentIdx, line.length - commentIdx, 'sh-comment')
    }
  }

  // Double-quoted strings — split around $VAR so variables keep their color
  const dqRe = /"(?:[^"\\]|\\.)*"/g
  let m: RegExpExecArray | null
  while ((m = dqRe.exec(line)) !== null) {
    const str = m[0]
    const base = m.index
    // Mark quotes themselves
    mark(base, 1, 'sh-string')
    mark(base + str.length - 1, 1, 'sh-string')
    // Mark segments between $VAR references
    const innerVarRe = /\$\{?[A-Za-z_]\w*\}?/g
    let last = 1 // skip opening quote
    let vm: RegExpExecArray | null
    while ((vm = innerVarRe.exec(str)) !== null) {
      if (vm.index > last) mark(base + last, vm.index - last, 'sh-string')
      // $VAR will be marked by the variable regex below
      last = vm.index + vm[0].length
    }
    if (last < str.length - 1) mark(base + last, str.length - 1 - last, 'sh-string')
  }

  // Single-quoted strings
  const sqRe = /'(?:[^'\\]|\\.)*'/g
  while ((m = sqRe.exec(line)) !== null) mark(m.index, m[0].length, 'sh-string')

  // Variable assignment: VAR_NAME=  (color the name, = is operator)
  const assignRe = /\b([A-Z_][A-Z0-9_]*)=/g
  while ((m = assignRe.exec(line)) !== null) {
    mark(m.index, m[1].length, 'sh-var')
    mark(m.index + m[1].length, 1, 'sh-op')
  }

  // Shell variables $VAR, ${VAR}, $(...), $!, $?, $$, etc.
  const varRe = /\$\{[^}]+\}|\$\([^)]*\)|\$[A-Za-z_]\w*|\$[!?#@*$-]/g
  while ((m = varRe.exec(line)) !== null) mark(m.index, m[0].length, 'sh-var')

  // Flags: --flag-name or -f
  const flagRe = /--?[\w][\w-]*/g
  while ((m = flagRe.exec(line)) !== null) {
    if (m[0].startsWith('--') || (m[0].startsWith('-') && m[0].length <= 3)) {
      mark(m.index, m[0].length, 'sh-flag')
    }
  }

  // Numbers (standalone)
  const numRe = /\b\d+(?:\.\d+)?\b/g
  while ((m = numRe.exec(line)) !== null) mark(m.index, m[0].length, 'sh-val')

  // Operators: |, \, &&, ||, ;, >, >>, <, =
  const opRe = /[|\\;&><]=?|&&|\|\|/g
  while ((m = opRe.exec(line)) !== null) mark(m.index, m[0].length, 'sh-op')

  // Commands (word at start of line or after pipe/semicolon)
  const wordRe = /\b([a-zA-Z_][\w.]*)\b/g
  while ((m = wordRe.exec(line)) !== null) {
    const word = m[1]
    if (COMMANDS.has(word)) {
      mark(m.index, word.length, 'sh-cmd')
    }
  }

  return tokens
}

// Find shell block regions in YAML: lines after "command:" or "args:" with "- |" block scalar
interface ShellRegion {
  startLine: number  // 1-based, first line of shell content
  endLine: number    // 1-based, last line of shell content
  indent: number     // column offset of the shell content
}

function findShellRegions(text: string): ShellRegion[] {
  const lines = text.split('\n')
  const regions: ShellRegion[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    // Block scalar: "- |", "- |-", "- |+", "- |2", "key: |", etc.
    const blockMatch = line.match(/^(\s*)- [|>][-+]?\d?\s*$/) || line.match(/^(\s*)\w+:\s*[|>][-+]?\d?\s*$/)
    if (blockMatch) {
      const blockIndent = blockMatch[1].length
      const contentStart = i + 1
      // Content lines: everything indented deeper than the block indicator
      let j = contentStart
      while (j < lines.length) {
        const cl = lines[j]
        if (cl.trim() === '') { j++; continue }
        const clIndent = cl.search(/\S/)
        if (clIndent <= blockIndent) break
        j++
      }
      if (j > contentStart) {
        // Determine content indent from first non-empty line
        let contentIndent = 999
        for (let k = contentStart; k < j; k++) {
          if (lines[k].trim()) contentIndent = Math.min(contentIndent, lines[k].search(/\S/))
        }
        regions.push({ startLine: contentStart + 1, endLine: j, indent: contentIndent })
      }
    }
    i++
  }
  return regions
}

let cssInjected = false
export function injectShellHighlightCSS() {
  if (cssInjected) return
  cssInjected = true
  const style = document.createElement('style')
  style.textContent = `
    /* Dark theme */
    [data-theme="dark"] .sh-cmd     { color: #dcdcaa !important; }
    [data-theme="dark"] .sh-flag    { color: #9cdcfe !important; }
    [data-theme="dark"] .sh-val     { color: #b5cea8 !important; }
    [data-theme="dark"] .sh-var     { color: #4fc1ff !important; }
    [data-theme="dark"] .sh-comment { color: #6a9955 !important; font-style: italic; }
    [data-theme="dark"] .sh-string  { color: #ce9178 !important; }
    [data-theme="dark"] .sh-op      { color: #d4d4d4 !important; }
    /* Light theme */
    [data-theme="light"] .sh-cmd     { color: #795e26 !important; }
    [data-theme="light"] .sh-flag    { color: #0451a5 !important; }
    [data-theme="light"] .sh-val     { color: #098658 !important; }
    [data-theme="light"] .sh-var     { color: #0070c1 !important; }
    [data-theme="light"] .sh-comment { color: #008000 !important; font-style: italic; }
    [data-theme="light"] .sh-string  { color: #a31515 !important; }
    [data-theme="light"] .sh-op      { color: #000000 !important; }
  `
  document.head.appendChild(style)
}

export function applyShellDecorations(
  editor: monaco.editor.IStandaloneCodeEditor,
  oldIds: string[],
): string[] {
  const model = editor.getModel()
  if (!model) return []

  const text = model.getValue()
  const regions = findShellRegions(text)
  const decorations: monaco.editor.IModelDeltaDecoration[] = []

  for (const region of regions) {
    for (let lineNum = region.startLine; lineNum <= region.endLine; lineNum++) {
      const lineContent = model.getLineContent(lineNum)
      if (!lineContent.trim()) continue

      const shellText = lineContent.substring(region.indent)
      const tokens = tokenizeLine(shellText)

      for (const tok of tokens) {
        const startCol = region.indent + tok.start + 1
        const endCol = startCol + tok.length
        decorations.push({
          range: new monaco.Range(lineNum, startCol, lineNum, endCol),
          options: { inlineClassName: tok.type },
        })
      }
    }
  }

  return editor.deltaDecorations(oldIds, decorations)
}
