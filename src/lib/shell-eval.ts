// Lightweight shell variable evaluator for inlay hints.
// Tracks assignments through a shell script, resolves string interpolation,
// and produces a symbol table that maps variable names to resolved values.

export interface VarInfo {
  value: string
  source: 'env' | 'assign' | 'subshell'
}

// Resolve ${VAR} and $VAR references in a string using the current symbol table
function interpolate(s: string, vars: Map<string, VarInfo>): string {
  return s.replace(/\$\{([A-Za-z_]\w*)\}|\$([A-Za-z_]\w*)/g, (_, braced, plain) => {
    const name = braced || plain
    const v = vars.get(name)
    return v ? v.value : `$${name}`
  })
}

// Parse top-level YAML metadata for fieldRef resolution
function parseYamlMetadata(lines: string[]): Map<string, string> {
  const meta = new Map<string, string>()
  let inMetadata = false
  let metaIndent = -1
  for (const line of lines) {
    if (/^\s*metadata:\s*$/.test(line)) {
      inMetadata = true
      metaIndent = line.search(/\S/)
      continue
    }
    if (inMetadata) {
      if (line.trim() === '') continue
      const indent = line.search(/\S/)
      if (indent <= metaIndent) { inMetadata = false; continue }
      const kv = line.match(/^\s*(name|namespace):\s*['"]?(.+?)['"]?\s*$/)
      if (kv) meta.set(`metadata.${kv[1]}`, kv[2])
    }
  }
  // Pod name in RBG = {rbg-name}-{role}-{ordinal}, approximate with rbg name
  if (meta.has('metadata.name')) {
    // status.podIP can't be resolved statically
    meta.set('spec.nodeName', '(node)')
  }
  return meta
}

// Parse env vars from YAML env: sections, resolving fieldRef via YAML metadata
export function parseYamlEnvVars(lines: string[]): Map<string, VarInfo> {
  const vars = new Map<string, VarInfo>()
  const yamlMeta = parseYamlMetadata(lines)
  const envRe = /^\s*-\s*name:\s*(.+)$/
  const valRe = /^\s*value:\s*['"]?(.+?)['"]?\s*$/
  const fieldRefRe = /^\s*fieldPath:\s*(.+)$/
  for (let i = 0; i < lines.length; i++) {
    const nm = envRe.exec(lines[i])
    if (!nm) continue
    const name = nm[1].trim()
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const vm = valRe.exec(lines[j])
      if (vm) {
        let v = vm[1]
        if (/^[|>][-+]?\d?$/.test(v)) {
          for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
            const cl = lines[k].trim()
            if (cl) { v = cl; break }
          }
        }
        vars.set(name, { value: v, source: 'env' })
        break
      }
      const fm = fieldRefRe.exec(lines[j])
      if (fm) {
        const fieldPath = fm[1].trim()
        const resolved = yamlMeta.get(fieldPath)
        if (resolved) {
          vars.set(name, { value: resolved, source: 'env' })
        } else {
          vars.set(name, { value: `↑${fieldPath}`, source: 'env' })
        }
        break
      }
      if (/^\s*valueFrom:/.test(lines[j])) continue
      if (/^\s*fieldRef:/.test(lines[j])) continue
      if (/^\s*-\s*name:/.test(lines[j])) break
    }
  }
  return vars
}

// Walk shell lines and track variable assignments
export function evalShellVars(
  shellLines: { lineNum: number; text: string }[],
  initial: Map<string, VarInfo>,
): Map<string, VarInfo> {
  const vars = new Map(initial)

  for (const { text } of shellLines) {
    const trimmed = text.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Special shell variables — assign descriptive values
    const specialMatch = trimmed.match(/^(?:export\s+)?([A-Za-z_]\w*)=\$([!?#@*$-])$/)
    if (specialMatch) {
      const descs: Record<string, string> = {
        '!': '(上一个后台进程 PID)', '?': '(上一个命令退出码)',
        '#': '(参数个数)', '@': '(所有参数)', '*': '(所有参数)',
        '$': '(当前 PID)', '-': '(当前 shell 选项)',
      }
      vars.set(specialMatch[1], { value: descs[specialMatch[2]] ?? `$${specialMatch[2]}`, source: 'assign' })
      continue
    }

    // export VAR=value or VAR=value
    const assignMatch = trimmed.match(/^(?:export\s+)?([A-Za-z_]\w*)=(.*)$/)
    if (!assignMatch) continue
    const [, name, rhs] = assignMatch
    let value = rhs

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // $(command) — try to describe
    const subshellMatch = value.match(/^\$\((.+)\)$/)
    if (subshellMatch) {
      const cmd = subshellMatch[1]
      // Try to evaluate simple patterns
      const echoSed = cmd.match(/echo\s+\$(\w+)\s*\|\s*sed\s+'s\/(.+)\/(.*)\//)
      if (echoSed) {
        const src = vars.get(echoSed[1])
        if (src) {
          try {
            const re = new RegExp(echoSed[2])
            value = src.value.replace(re, echoSed[3])
            vars.set(name, { value, source: 'assign' })
            continue
          } catch { /* regex failed, fall through */ }
        }
      }
      const echoGrep = cmd.match(/echo\s+\$(\w+)\s*\|\s*grep\s+-oP\s+'(.+)'/)
      if (echoGrep) {
        vars.set(name, { value: `$(grep -oP '${echoGrep[2]}' ← $${echoGrep[1]})`, source: 'subshell' })
        continue
      }
      vars.set(name, { value: `$(${cmd.length > 30 ? cmd.substring(0, 27) + '…' : cmd})`, source: 'subshell' })
      continue
    }

    // String interpolation
    value = interpolate(value, vars)
    vars.set(name, { value, source: 'assign' })
  }

  return vars
}
