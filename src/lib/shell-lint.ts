// Lightweight shell linter for YAML block scalars.
// Produces Monaco markers (squiggly lines) for common shell mistakes.

import * as monaco from 'monaco-editor'

interface LintIssue {
  line: number      // 1-based
  col: number       // 1-based
  endCol: number    // 1-based
  message: string
  severity: monaco.MarkerSeverity
}

function lintShellLine(line: string, lineNum: number): LintIssue[] {
  const issues: LintIssue[] = []

  // Skip comment lines entirely — apostrophes in English text are not quote errors
  if (/^\s*#/.test(line)) return issues

  // Trailing space after \ (line continuation silently broken)
  if (/\\\s+$/.test(line)) {
    const bs = line.lastIndexOf('\\')
    issues.push({
      line: lineNum, col: bs + 1, endCol: line.length + 1,
      message: '反斜杠后有空格，续行会失效',
      severity: monaco.MarkerSeverity.Warning,
    })
  }

  // Unmatched double quotes (odd count, ignoring escaped)
  const stripped = line.replace(/\\"/g, '')
  const dqCount = (stripped.match(/"/g) || []).length
  if (dqCount % 2 !== 0) {
    issues.push({
      line: lineNum, col: 1, endCol: line.length + 1,
      message: '双引号未闭合',
      severity: monaco.MarkerSeverity.Error,
    })
  }

  // Unmatched single quotes
  const sqStripped = line.replace(/\\'/g, '')
  const sqCount = (sqStripped.match(/'/g) || []).length
  if (sqCount % 2 !== 0) {
    issues.push({
      line: lineNum, col: 1, endCol: line.length + 1,
      message: '单引号未闭合',
      severity: monaco.MarkerSeverity.Error,
    })
  }

  // Unmatched ${ without }
  let braceDepth = 0
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '$' && line[i + 1] === '{') { braceDepth++; i++ }
    else if (line[i] === '}' && braceDepth > 0) braceDepth--
  }
  if (braceDepth > 0) {
    issues.push({
      line: lineNum, col: 1, endCol: line.length + 1,
      message: '${...} 未闭合',
      severity: monaco.MarkerSeverity.Error,
    })
  }

  // Unmatched $( without )
  let parenDepth = 0
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '$' && line[i + 1] === '(') { parenDepth++; i++ }
    else if (line[i] === ')' && parenDepth > 0) parenDepth--
  }
  if (parenDepth > 0) {
    issues.push({
      line: lineNum, col: 1, endCol: line.length + 1,
      message: '$(...) 未闭合',
      severity: monaco.MarkerSeverity.Warning,
    })
  }

  return issues
}

// Same shell region detection as shell-highlight.ts
interface ShellRegion { startLine: number; endLine: number; indent: number }

function findShellRegions(text: string): ShellRegion[] {
  const lines = text.split('\n')
  const regions: ShellRegion[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const blockMatch = line.match(/^(\s*)- [|>][-+]?\d?\s*$/) || line.match(/^(\s*)\w+:\s*[|>][-+]?\d?\s*$/)
    if (blockMatch) {
      const blockIndent = blockMatch[1].length
      const contentStart = i + 1
      let j = contentStart
      while (j < lines.length) {
        const cl = lines[j]
        if (cl.trim() === '') { j++; continue }
        if (cl.search(/\S/) <= blockIndent) break
        j++
      }
      if (j > contentStart) {
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

export function lintShell(editor: monaco.editor.IStandaloneCodeEditor) {
  const model = editor.getModel()
  if (!model) return

  const text = model.getValue()
  const regions = findShellRegions(text)
  const markers: monaco.editor.IMarkerData[] = []

  for (const region of regions) {
    for (let lineNum = region.startLine; lineNum <= region.endLine; lineNum++) {
      const lineContent = model.getLineContent(lineNum)
      if (!lineContent.trim()) continue
      const shellText = lineContent.substring(region.indent)
      const issues = lintShellLine(shellText, lineNum)
      for (const issue of issues) {
        markers.push({
          startLineNumber: issue.line,
          startColumn: region.indent + issue.col,
          endLineNumber: issue.line,
          endColumn: region.indent + issue.endCol,
          message: issue.message,
          severity: issue.severity,
          source: 'shell-lint',
        })
      }
    }
  }

  // Only set our markers, preserve yaml-schema markers
  const existing = monaco.editor.getModelMarkers({ resource: model.uri })
    .filter(m => m.source !== 'shell-lint')
  monaco.editor.setModelMarkers(model, 'shell-lint', markers)
  // Re-add non-shell markers under their original owner — not needed,
  // setModelMarkers with owner='shell-lint' only replaces that owner's markers
  void existing
}
