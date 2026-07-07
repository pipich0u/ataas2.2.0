import { useEffect, useRef, type CSSProperties } from 'react'
import * as monaco from 'monaco-editor'
import { useTheme } from 'next-themes'

interface MonacoEditorProps {
  value: string
  language?: string
  onChange?: (value: string) => void
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  height?: string | number
  className?: string
  style?: CSSProperties
}

export function MonacoEditor({ value, language = 'yaml', onChange, options, height = '100%', className, style }: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: resolvedTheme === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 12,
      tabSize: 2,
      insertSpaces: true,
      readOnly: !onChange,
      domReadOnly: !onChange,
      ...options,
    })
    editorRef.current = editor
    editor.onDidChangeModelContent(() => {
      const v = editor.getValue()
      valueRef.current = v
      onChangeRef.current?.(v)
    })
    return () => { editor.dispose() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (value !== valueRef.current) {
      valueRef.current = value
      editor.setValue(value)
    }
  }, [value])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const ro = !onChangeRef.current
    editor.updateOptions({ readOnly: ro, domReadOnly: ro, ...options })
  }, [onChange, options])

  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'vs-dark' : 'vs')
  }, [resolvedTheme])

  return <div ref={containerRef} className={className} style={{ height, ...style }} />
}

interface MonacoDiffEditorProps {
  original: string
  modified: string
  language?: string
  options?: monaco.editor.IDiffEditorConstructionOptions
  height?: string | number
  className?: string
  style?: CSSProperties
  onMount?: (editor: monaco.editor.IStandaloneDiffEditor) => void
}

export function MonacoDiffEditor({ original, modified, language = 'yaml', options, height = '100%', className, style, onMount }: MonacoDiffEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return
    const editor = monaco.editor.createDiffEditor(containerRef.current, {
      theme: resolvedTheme === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 12,
      ...options,
    })
    const origModel = monaco.editor.createModel(original, language)
    const modModel = monaco.editor.createModel(modified, language)
    editor.setModel({ original: origModel, modified: modModel })
    editorRef.current = editor
    onMount?.(editor)
    return () => { editor.dispose(); origModel.dispose(); modModel.dispose() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (model) {
      model.original.setValue(original)
      model.modified.setValue(modified)
    }
  }, [original, modified])

  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'vs-dark' : 'vs')
  }, [resolvedTheme])

  return <div ref={containerRef} className={className} style={{ height, ...style }} />
}
