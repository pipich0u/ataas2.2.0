// Configs — IDE-style editor for user-authored RBG yaml templates.
//
// Edit model: a single working copy per path, held in a `drafts` map
// across file switches. Changes accumulate — the user can edit multiple
// files, flip between them via the tree, and only commit when done. One
// Commit button at the bottom submits every dirty file + pending create
// + pending delete in a single atomic git commit (backend config.commit).
// This matches the git mental model: staging is implicit, commit is
// explicit and takes one message covering the whole changeset.
//
// Nothing here touches apiserver — saving a commit only updates the
// config repo on disk. Deploy lives on a separate page.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { MonacoDiffEditor as DiffEditor } from '@/components/shared/MonacoEditor'
import '@/b300/index.css'
// DiffOnMount removed — using native monaco types directly
import * as yaml from 'js-yaml'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { applyShellDecorations, injectShellHighlightCSS } from '@/lib/shell-highlight'
import { lintShell } from '@/lib/shell-lint'
import { parseYamlEnvVars, evalShellVars } from '@/lib/shell-eval'
import { ArrowDownUp, ChevronDown, ChevronRight, Copy, Download, Diff, File, FilePlus, Filter, History, Pencil, Save, Search, Sparkles, Trash2, Undo2, X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { rpc } from '@/lib/bus/rpc'
import { RAIL_WIDTH_KEY, clampRailWidth, loadRailWidth } from '@/lib/configs-rail-width'
import type {
  ConfigCommitEntry,
  ConfigShowCommitResponse,
  ConfigTreeNode,
} from '@/lib/types'
type DraftEntry = {
  // base is the content on disk when this entry was loaded / last
  // committed. null means the file does not exist on disk (pending
  // create). draft is the in-memory edit buffer. deleted marks an entry
  // that the user asked to delete; we keep the entry around so switching
  // back can "undo" the delete.
  base: string | null
  draft: string
  deleted: boolean
}

type Drafts = Record<string, DraftEntry>

const DEFAULT_YAML_TEMPLATE = `apiVersion: workloads.x-k8s.io/v1alpha1
kind: RoleBasedGroup
metadata:
  name: ""
  namespace: default
spec:
  roles: []
`

const STORAGE_DRAFTS = 'b300.configs.drafts'
const STORAGE_TABS = 'b300.configs.tabs'
const STORAGE_ACTIVE = 'b300.configs.active'

function saveDraftsToStorage(d: Drafts) {
  try { sessionStorage.setItem(STORAGE_DRAFTS, JSON.stringify(d)) } catch { /* quota */ }
}
function loadDraftsFromStorage(): Drafts {
  try {
    const raw = sessionStorage.getItem(STORAGE_DRAFTS)
    return raw ? JSON.parse(raw) as Drafts : {}
  } catch { return {} }
}
function saveTabsToStorage(tabs: string[]) {
  try { sessionStorage.setItem(STORAGE_TABS, JSON.stringify(tabs)) } catch { /* quota */ }
}
function loadTabsFromStorage(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_TABS)
    return raw ? JSON.parse(raw) as string[] : []
  } catch { return [] }
}

function isDirty(d: DraftEntry): boolean {
  if (d.deleted) return d.base !== null
  if (d.base === null) return d.draft.length > 0 || true // created-pending → always dirty
  return d.base !== d.draft
}

export default function Configs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPath = searchParams.get('path') ?? ''

  const [tree, setTree] = useState<ConfigTreeNode | null>(null)
  const [treeErr, setTreeErr] = useState<string | null>(null)
  const [treeLoading, setTreeLoading] = useState(true)

  const [drafts, setDrafts] = useState<Drafts>(loadDraftsFromStorage)
  const [openTabs, setOpenTabs] = useState<string[]>(loadTabsFromStorage)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileErr, setFileErr] = useState<string | null>(null)

  // 仅"新建文件"。目录由文件路径隐含(在文件名里写 a/b/x.yaml 即在 a/b 下建文件,
  // insertSyntheticFile 会渲染出目录节点);git 配置仓库无法持久化空目录,故不提供
  // 独立的"新建文件夹"——它只会产生一条无法提交的裸路径草稿(write path 校验要求 .yaml)。
  const [creating, setCreating] = useState<{ parentDir: string } | null>(null)
  const [sortByTime, setSortByTime] = useState(() => sessionStorage.getItem('b300.configs.sortByTime') === '1')
  // Explorer 顶部:文件名搜索 + 仅看 dirty(uncommitted)开关。dirty 偏好持久化
  // 到 sessionStorage 跟 sortByTime 对齐;搜索字符串本身不持久化(每次打开页面
  // 都从空开始,刷新不留过期 query 误导用户)。
  const [filterQuery, setFilterQuery] = useState('')
  const [dirtyOnly, setDirtyOnly] = useState(() => sessionStorage.getItem('b300.configs.dirtyOnly') === '1')
  const [historyPath, setHistoryPath] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<{ sourcePath: string; sourceYaml: string } | null>(null)
  // rename = drafts 里把旧 path 标删 + 用同 draft 内容新建 new path,一次 commit
  // 走 delete + write。git 层会按 blob 相似度自动识别成 rename(同 commit 里
  // add+delete 等价 `git mv`),`git log --follow` / `git show` 都展示为 R100。
  // 后端 commitRequest 协议只有 writes/deletes 没 renames,前端这条 UX 是
  // sugar:dirty 列表里仍是两条,commit dialog 显示 "1 write + 1 delete"。
  const [renaming, setRenaming] = useState<{ sourcePath: string; sourceYaml: string } | null>(null)
  const [committing, setCommitting] = useState<boolean>(false)
  const [commitOpen, setCommitOpen] = useState<boolean>(false)
  const [commitMessage, setCommitMessage] = useState<string>('')
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(false)
  const [suggestions, setSuggestions] = useState<FileSuggestions[]>([])
  // Line numbers (1-based, in the post-apply draft) that came from
  // accepting a template suggestion. The commit dialog highlights these
  // with an amber decoration so the operator can tell at a glance which
  // hunks were auto-substituted.
  const [appliedSuggestions, setAppliedSuggestions] = useState<Map<string, Set<number>>>(new Map())
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; path: string; isDir: boolean } | null>(null)
  const [tabCtxMenu, setTabCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [diffPair, setDiffPair] = useState<{ left: string; right: string } | null>(null)
  const [compareBase, setCompareBase] = useState<string | null>(null)

  // --- 左栏可拖动调宽 (resizable sidebar) ---------------------------------
  // railWidth 跨会话持久化到 localStorage;railDrag 为拖拽态。拖拽的全局副作用
  // (document listener + body 样式)放进 useEffect,由 cleanup return 保证任何
  // 中断路径(松手 setRailDrag(null) / 组件卸载 / 失焦卸载)都还原 body 样式并摘除
  // listener,避免 cursor='col-resize' 全局卡死。镜像 PodsTable.tsx:449 同款模式。
  const [railWidth, setRailWidth] = useState<number>(loadRailWidth)
  const [railDrag, setRailDrag] = useState<{ startX: number; startW: number } | null>(null)
  useEffect(() => {
    if (!railDrag) return
    const { startX, startW } = railDrag
    const onUp = () => {
      // 仅在真实 mouseup 落盘最终宽度;随后 setRailDrag(null) 触发本 effect cleanup。
      setRailWidth((w) => { try { localStorage.setItem(RAIL_WIDTH_KEY, String(w)) } catch { /* quota */ } return w })
      setRailDrag(null)
    }
    const onMove = (ev: MouseEvent) => {
      // 若鼠标已在浏览器窗口外松开,document 收不到 mouseup,onUp 不会触发。
      // 此时回到页面的第一个 mousemove 必然 buttons===0,据此收尾——否则会出现
      // 「窗外松手后左栏仍粘着光标继续 resize」的粘滞拖拽,且 cursor/listener 不还原。
      if (ev.buttons === 0) { onUp(); return }
      setRailWidth(clampRailWidth(startW + (ev.clientX - startX)))
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [railDrag])
  // 抓手只负责进入拖拽态,记录起始光标 x 与起始宽度。
  const beginRailResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setRailDrag({ startX: e.clientX, startW: railWidth })
  }

  // Persist drafts, tabs, and active tab to sessionStorage
  useEffect(() => { saveDraftsToStorage(drafts) }, [drafts])
  useEffect(() => { saveTabsToStorage(openTabs) }, [openTabs])
  useEffect(() => { if (selectedPath) try { sessionStorage.setItem(STORAGE_ACTIVE, selectedPath) } catch {} }, [selectedPath])

  // Tab management
  const openTab = useCallback((path: string) => {
    setOpenTabs((tabs) => tabs.includes(path) ? tabs : [...tabs, path])
  }, [])
  const closeTab = useCallback((path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t !== path)
      // If closing the active tab, switch to the nearest remaining tab
      if (path === selectedPath && next.length > 0) {
        const idx = tabs.indexOf(path)
        const newActive = next[Math.min(idx, next.length - 1)]
        // Defer URL update to avoid state conflicts
        setTimeout(() => {
          const sp = new URLSearchParams(window.location.search)
          sp.set('path', newActive)
          setSearchParams(sp, { replace: true })
        }, 0)
      } else if (next.length === 0) {
        setTimeout(() => {
          const sp = new URLSearchParams(window.location.search)
          sp.delete('path')
          setSearchParams(sp, { replace: true })
        }, 0)
      }
      return next
    })
  }, [selectedPath, setSearchParams])
  const closeAllTabs = useCallback(() => {
    setOpenTabs([])
    const sp = new URLSearchParams(window.location.search)
    sp.delete('path')
    setSearchParams(sp, { replace: true })
  }, [setSearchParams])

  const reloadTree = useCallback(() => {
    setTreeLoading(true)
    setTreeErr(null)
    // config.list_tree 是 void params
    rpc('config.list_tree')
      .then((resp) => setTree(resp.root))
      .catch((e) => setTreeErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setTreeLoading(false))
  }, [])

  useEffect(() => {
    reloadTree()
  }, [reloadTree])

  // Seed drafts for a newly-selected file. If it's already tracked (user
  // edited it before and switched away), reuse the existing draft so
  // round-tripping doesn't lose in-flight edits.
  useEffect(() => {
    if (!selectedPath) return
    if (drafts[selectedPath]) return
    let alive = true
    setFileLoading(true)
    setFileErr(null)
    rpc('config.get', { path: selectedPath })
      .then((resp) => {
        if (!alive) return
        const base = resp.exists ? resp.yaml : null
        const draft = resp.exists ? resp.yaml : DEFAULT_YAML_TEMPLATE
        setDrafts((d) => ({ ...d, [selectedPath]: { base, draft, deleted: false } }))
      })
      .catch((e) => {
        if (!alive) return
        setFileErr(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (alive) setFileLoading(false)
      })
    return () => {
      alive = false
    }
  }, [selectedPath, drafts])

  const currentDraft = selectedPath ? drafts[selectedPath] : undefined

  const dirtyEntries = useMemo(() => {
    return Object.entries(drafts)
      .filter(([, d]) => isDirty(d))
      .map(([path, d]) => ({ path, entry: d }))
  }, [drafts])

  const pendingCount = dirtyEntries.length

  const selectPath = useCallback(
    (path: string) => {
      const next = new URLSearchParams(searchParams)
      if (path) {
        next.set('path', path)
        openTab(path)
      } else {
        next.delete('path')
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, openTab],
  )

  // Edit current file's draft content.
  const setDraft = useCallback(
    (path: string, nextDraft: string) => {
      setDrafts((d) => {
        const curr = d[path]
        if (!curr) return d
        return { ...d, [path]: { ...curr, draft: nextDraft, deleted: false } }
      })
    },
    [],
  )

  // Mark current file pending-delete. Keeps the entry so "undo" works.
  const markDelete = useCallback(
    (path: string) => {
      setDrafts((d) => {
        const curr = d[path]
        if (!curr) return d
        // If the file was only created in this session (no base), drop it
        // entirely rather than ferrying a "deleted: true, base: null"
        // ghost around.
        if (curr.base === null) {
          const { [path]: _drop, ...rest } = d
          void _drop
          return rest
        }
        return { ...d, [path]: { ...curr, deleted: true } }
      })
    },
    [],
  )

  // Revert a file's draft to its on-disk base (or un-mark delete).
  const undoDraft = useCallback(
    (path: string) => {
      setDrafts((d) => {
        const curr = d[path]
        if (!curr) return d
        if (curr.base === null) {
          // Pending create → drop entirely
          const { [path]: _drop, ...rest } = d
          void _drop
          return rest
        }
        return { ...d, [path]: { ...curr, draft: curr.base, deleted: false } }
      })
    },
    [],
  )

  const discardAll = useCallback(() => {
    setDrafts({})
    setCommitOpen(false)
    setCommitMessage('')
    try { sessionStorage.removeItem(STORAGE_DRAFTS) } catch { /* noop */ }
  }, [])

  const onCommit = useCallback(async () => {
    if (commitMessage.trim().length < 3) {
      toast.error('请输入提交说明（至少 3 个字符）')
      return
    }
    const writes = dirtyEntries
      .filter(({ entry }) => !entry.deleted)
      .map(({ path, entry }) => ({ path, yaml: entry.draft }))
    const deletes = dirtyEntries
      .filter(({ entry }) => entry.deleted && entry.base !== null)
      .map(({ path }) => path)
    if (writes.length === 0 && deletes.length === 0) {
      toast.info('没有需要提交的变更')
      return
    }
    setCommitting(true)
    try {
      // config.commit schema 要求 { path, content, message }，但 backend 实际接受
      // bulk { writes, deletes, message }（多文件原子 commit）。typed registry 的
      // params shape 是简化值，这里用 cast 保留 bulk 语义。
      const resp = await rpc('config.commit', {
        writes,
        deletes,
        message: commitMessage.trim(),
      } as unknown as { path: string; content: string; message: string })
      if (resp.no_change) {
        toast.info('没有实际变更')
      } else {
        const hash = resp.commit_hash ? ` (${resp.commit_hash.slice(0, 7)})` : ''
        toast.success(`已提交 ${resp.written_paths.length} 个写入 + ${resp.deleted_paths.length} 个删除${hash}`)
      }
      // Rebase: drop deleted entries; for written ones, shift base to the
      // just-committed draft so they're no longer dirty.
      setDrafts((d) => {
        const next: Drafts = { ...d }
        for (const p of resp.deleted_paths) delete next[p]
        for (const p of resp.written_paths) {
          const entry = next[p]
          if (entry) next[p] = { base: entry.draft, draft: entry.draft, deleted: false }
        }
        return next
      })
      setCommitMessage('')
      setCommitOpen(false)
      reloadTree()
      // If the selected file was deleted, clear selection.
      if (selectedPath && resp.deleted_paths.includes(selectedPath)) {
        selectPath('')
      }
    } catch (e) {
      toast.error(`提交失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCommitting(false)
    }
  }, [commitMessage, dirtyEntries, reloadTree, selectPath, selectedPath])

  // Tree paths: merge on-disk paths with pending-create entries so newly
  // created but uncommitted files show up in the left pane.
  const pendingCreatedPaths = useMemo(
    () => Object.entries(drafts).filter(([, d]) => d.base === null && !d.deleted).map(([p]) => p),
    [drafts],
  )
  const pendingDeletedPaths = useMemo(
    () => new Set(Object.entries(drafts).filter(([, d]) => d.deleted && d.base !== null).map(([p]) => p)),
    [drafts],
  )
  const dirtyPathSet = useMemo(() => new Set(dirtyEntries.map(({ path }) => path)), [dirtyEntries])

  // Close context menu on any click
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])
  useEffect(() => {
    if (!tabCtxMenu) return
    const close = () => setTabCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [tabCtxMenu])

  const handleDownload = useCallback(async (path: string) => {
    const d = drafts[path]
    let content: string
    if (d) {
      content = d.draft
    } else {
      try {
        const resp = await rpc('config.get', { path })
        content = resp.yaml
      } catch { toast.error('读取失败'); return }
    }
    const blob = new Blob([content], { type: 'text/yaml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = path.split('/').pop() ?? 'config.yaml'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [drafts])

  const handleTreeContextMenu = useCallback((e: React.MouseEvent, path: string, isDir: boolean) => {
    e.preventDefault()
    // If right-clicking an item not in the current selection, replace selection with just this item
    if (!selection.has(path)) {
      setSelection(new Set([path]))
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, path, isDir })
  }, [selection])

  // Collect all file paths under a directory path
  const filesUnderDir = useCallback((dirPath: string): string[] => {
    const results: string[] = []
    const walk = (n: ConfigTreeNode) => {
      if (!n.is_dir && n.path) results.push(n.path)
      if (n.children) n.children.forEach(walk)
    }
    const findDir = (n: ConfigTreeNode): ConfigTreeNode | null => {
      if (n.path === dirPath) return n
      for (const c of n.children ?? []) {
        const found = findDir(c)
        if (found) return found
      }
      return null
    }
    if (tree) {
      const dir = findDir(tree)
      if (dir) walk(dir)
    }
    return results
  }, [tree])

  const handleTreeClick = useCallback((e: React.MouseEvent, path: string, isDir: boolean) => {
    if (isDir) {
      // Dirs: toggle expand handled internally by TreeNodeRow
      // Ctrl/Cmd+click: toggle dir in selection
      if (e.metaKey || e.ctrlKey) {
        setSelection((s) => {
          const next = new Set(s)
          if (next.has(path)) next.delete(path)
          else next.add(path)
          return next
        })
      }
      return
    }
    if (e.metaKey || e.ctrlKey) {
      setSelection((s) => {
        const next = new Set(s)
        if (next.has(path)) next.delete(path)
        else next.add(path)
        return next
      })
    } else {
      setSelection(new Set())
      selectPath(path)
    }
  }, [selectPath])

  const deleteSelection = useCallback(() => {
    // Expand dirs to files, then mark all for delete
    const filesToDelete = new Set<string>()
    for (const p of selection) {
      // Check if it's a dir by looking at tree
      const files = filesUnderDir(p)
      if (files.length > 0) {
        files.forEach((f) => filesToDelete.add(f))
      } else {
        filesToDelete.add(p)
      }
    }
    for (const p of filesToDelete) {
      markDelete(p)
    }
    setSelection(new Set())
    toast.success(`已标记删除 ${filesToDelete.size} 个文件`)
  }, [selection, filesUnderDir, markDelete])

  // Monaco editor ref
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const activePathRef = useRef(selectedPath)
  const prevPathRef = useRef(selectedPath)
  activePathRef.current = selectedPath

  const { resolvedTheme } = useTheme()

  // Per-tab editor view state (scroll position, cursor, etc.)
  const viewStates = useRef<Map<string, monaco.editor.ICodeEditorViewState | null>>(new Map())

  // Stable refs for keyboard handler closures
  const openTabsRef = useRef(openTabs)
  openTabsRef.current = openTabs
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const closeTabRef = useRef(closeTab)
  closeTabRef.current = closeTab
  const selectPathRef = useRef(selectPath)
  selectPathRef.current = selectPath
  const startCommitFlowRef = useRef(() => {})

  // Native Monaco editor — created once via monaco.editor.create()
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const suppressOnChange = useRef(false)

  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    monaco.editor.defineTheme('ataas-config-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'type.yaml', foreground: '008A8A' },
        { token: 'string.yaml', foreground: '1456A8' },
        { token: 'number.yaml', foreground: '16A34A' },
        { token: 'keyword.yaml', foreground: '5B35D5' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#1F2937',
        'editorLineNumber.foreground': '#8EA0B8',
        'editorLineNumber.activeForeground': '#6951FF',
        'editorCursor.foreground': '#6951FF',
        'editor.lineHighlightBackground': '#F7F8FC',
        'editor.lineHighlightBorder': '#F7F8FC',
        'editor.selectionBackground': '#DCD7FF',
        'editor.inactiveSelectionBackground': '#EEEAFE',
        'editorIndentGuide.background1': '#D7DDE8',
        'editorIndentGuide.activeBackground1': '#AEB8C8',
      },
    })

    const model = monaco.editor.createModel('', 'yaml')
    const editor = monaco.editor.create(container, {
      model,
      language: 'yaml',
      theme: resolvedTheme === 'dark' ? 'vs-dark' : 'ataas-config-light',
      minimap: {
        enabled: true,
        size: 'proportional',
        maxColumn: 80,
        renderCharacters: false,
        showSlider: 'mouseover',
      },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineHeight: 22,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
      glyphMargin: false,
      folding: true,
      renderLineHighlight: 'line',
      padding: { top: 8, bottom: 8 },
      automaticLayout: true,
      wordWrap: 'on',
      contextmenu: true,
      quickSuggestions: { other: true, comments: false, strings: true },
      suggestOnTriggerCharacters: true,
      tabSize: 2,
      insertSpaces: true,
      bracketPairColorization: { enabled: true },
      guides: { indentation: true },
      scrollbar: { vertical: 'auto', horizontal: 'auto' },
    })
    editorRef.current = editor

    // Keyboard shortcuts inside Monaco — use addAction to avoid clobbering built-in commands (like Cmd+F find)
    /* eslint-disable no-bitwise */
    const CMD = monaco.KeyMod.CtrlCmd
    editor.addAction({ id: 'b300.save', label: '保存草稿', keybindings: [CMD | monaco.KeyCode.KeyS],
      run: () => { toast.success('已保存到浏览器（刷新不丢失）') } })
    editor.addAction({ id: 'b300.closeTab', label: '关闭标签', keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyW],
      run: () => { if (activePathRef.current) closeTabRef.current(activePathRef.current) } })
    editor.addAction({ id: 'b300.commit', label: '提交变更', keybindings: [CMD | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => { startCommitFlowRef.current() } })
    editor.addAction({ id: 'b300.prevTab', label: '上一个标签', keybindings: [CMD | monaco.KeyMod.Alt | monaco.KeyCode.BracketLeft],
      run: () => { const tabs = openTabsRef.current; const idx = tabs.indexOf(activePathRef.current); if (idx > 0) selectPathRef.current(tabs[idx - 1]) } })
    editor.addAction({ id: 'b300.nextTab', label: '下一个标签', keybindings: [CMD | monaco.KeyMod.Alt | monaco.KeyCode.BracketRight],
      run: () => { const tabs = openTabsRef.current; const idx = tabs.indexOf(activePathRef.current); if (idx >= 0 && idx < tabs.length - 1) selectPathRef.current(tabs[idx + 1]) } })
    /* eslint-enable no-bitwise */

    // Template variable decorations
    const tplPattern = /\$\{(MODEL|INDEX|ROUTER_RBG|WORKERS_RBG|NS|ROUTER_REPLICAS|PREFILL_REPLICAS|DECODE_REPLICAS|ENCODE_REPLICAS)\}/g
    const style = document.createElement('style')
    style.textContent = `
      [data-theme="dark"] .b300-tplvar { color: #dcdcaa !important; font-style: italic; }
      [data-theme="light"] .b300-tplvar { color: #795e26 !important; font-style: italic; font-weight: 600; }
    `
    document.head.appendChild(style)
    injectShellHighlightCSS()
    let tplDecoIds: string[] = []
    let shellDecoIds: string[] = []
    let highlightTimer: ReturnType<typeof setTimeout> | null = null
    const applyDecos = () => {
      // Template variables
      const m2 = editor.getModel()
      if (!m2) return
      const lines = m2.getValue().split('\n')
      const decos: monaco.editor.IModelDeltaDecoration[] = []
      for (let i = 0; i < lines.length; i++) {
        tplPattern.lastIndex = 0
        let mm: RegExpExecArray | null
        while ((mm = tplPattern.exec(lines[i])) !== null) {
          decos.push({
            range: new monaco.Range(i + 1, mm.index + 1, i + 1, mm.index + 1 + mm[0].length),
            options: { inlineClassName: 'b300-tplvar' },
          })
        }
      }
      tplDecoIds = editor.deltaDecorations(tplDecoIds, decos)
      // Shell highlighting + lint (debounced for performance)
      if (highlightTimer) clearTimeout(highlightTimer)
      highlightTimer = setTimeout(() => {
        shellDecoIds = applyShellDecorations(editor, shellDecoIds)
        lintShell(editor)
      }, 200)
    }

    // Content change → update draft + decorations
    editor.onDidChangeModelContent(() => {
      applyDecos()
      if (suppressOnChange.current) return
      setDraft(activePathRef.current, editor.getValue())
    })
    applyDecos()

    // Template variable hover + completion providers
    const VARS: { token: string; label: string; desc: string }[] = [
      { token: 'MODEL', label: '模型名', desc: '模型名（如 kimi-k25）' },
      { token: 'INDEX', label: 'group index', desc: 'Group index（如 0, 1, 2）' },
      { token: 'ROUTER_RBG', label: 'router RBG 名', desc: '展开为 <model>-router-<index>' },
      { token: 'WORKERS_RBG', label: 'workers RBG 名', desc: '展开为 <model>-workers-<index>' },
      { token: 'NS', label: 'namespace', desc: 'Namespace（通常 default）' },
      { token: 'ROUTER_REPLICAS', label: 'router 副本数', desc: 'Router 副本数' },
      { token: 'PREFILL_REPLICAS', label: 'prefill 副本数', desc: 'Prefill 副本数' },
      { token: 'DECODE_REPLICAS', label: 'decode 副本数', desc: 'Decode 副本数' },
      { token: 'ENCODE_REPLICAS', label: 'encode 副本数', desc: 'Encode 副本数(EPD,最小 1)' },
    ]
    const varMap = new Map(VARS.map(v => [`\${${v.token}}`, v]))

    const hoverDisposable = monaco.languages.registerHoverProvider('yaml', {
      provideHover(mdl, position) {
        const line = mdl.getLineContent(position.lineNumber)
        tplPattern.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = tplPattern.exec(line)) !== null) {
          const startCol = m.index + 1
          const endCol = startCol + m[0].length
          if (position.column >= startCol && position.column <= endCol) {
            const v = varMap.get(m[0])
            return {
              range: new monaco.Range(position.lineNumber, startCol, position.lineNumber, endCol),
              contents: [
                { value: `**模板变量** \`${m[0]}\`` },
                { value: v?.desc ?? '' },
                { value: '_部署时自动替换为实际值_' },
              ],
            }
          }
        }
        return null
      },
    })

    const completionDisposable = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: ['{'],
      provideCompletionItems(mdl, position) {
        const lineContent = mdl.getLineContent(position.lineNumber)
        const textBefore = lineContent.substring(0, position.column - 1)
        if (!textBefore.endsWith('${')) return { suggestions: [] }
        const startCol = position.column - 2
        const range = new monaco.Range(position.lineNumber, startCol, position.lineNumber, position.column)
        return {
          suggestions: VARS.map(v => ({
            label: `\${${v.token}}`,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: `\${${v.token}}`,
            range,
            detail: v.label,
            documentation: v.desc,
          })),
        }
      },
    })

    // InlayHints: resolve env + shell variable values inline (like clangd)
    const inlayDisposable = monaco.languages.registerInlayHintsProvider('yaml', {
      provideInlayHints(mdl, range) {
        const text = mdl.getValue()
        const lines = text.split('\n')

        // 1. Parse env vars from YAML
        const envVars = parseYamlEnvVars(lines)

        // 2. Find shell regions and evaluate variable assignments
        const hints: monaco.languages.InlayHint[] = []
        const shellVarRe = /\$\{([A-Za-z_]\w*)\}|\$([A-Za-z_]\w*)/g
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const blockMatch = line.match(/^(\s*)- [|>][-+]?\d?\s*$/) || line.match(/^(\s*)\w+:\s*[|>][-+]?\d?\s*$/)
          if (!blockMatch) continue
          const blockIndent = blockMatch[1].length

          // Collect shell lines for this block
          const shellLines: { lineNum: number; text: string }[] = []
          let contentIndent = 999
          for (let j = i + 1; j < lines.length; j++) {
            const cl = lines[j]
            if (cl.trim() === '') { shellLines.push({ lineNum: j + 1, text: '' }); continue }
            if (cl.search(/\S/) <= blockIndent) break
            contentIndent = Math.min(contentIndent, cl.search(/\S/))
            shellLines.push({ lineNum: j + 1, text: cl.substring(contentIndent < 999 ? contentIndent : 0) })
          }

          // Evaluate: env vars + sequential assignments
          const resolved = evalShellVars(
            shellLines.map(sl => ({ lineNum: sl.lineNum, text: sl.text })),
            envVars,
          )

          // Add hints for $VAR references
          for (const sl of shellLines) {
            if (!sl.text.trim()) continue
            shellVarRe.lastIndex = 0
            let vm: RegExpExecArray | null
            while ((vm = shellVarRe.exec(lines[sl.lineNum - 1])) !== null) {
              const varName = vm[1] || vm[2]
              const info = resolved.get(varName)
              if (!info) continue
              // Skip if value is just the variable reference itself
              if (info.value === `$${varName}`) continue
              const display = info.value.length > 50 ? info.value.substring(0, 47) + '…' : info.value
              hints.push({
                kind: monaco.languages.InlayHintKind.Parameter,
                position: { lineNumber: sl.lineNum, column: vm.index + 1 + vm[0].length },
                label: ` = ${display}`,
                paddingLeft: false,
              })
            }
          }
        }
        const filtered = hints.filter(h =>
          h.position.lineNumber >= range.startLineNumber &&
          h.position.lineNumber <= range.endLineNumber
        )
        return { hints: filtered, dispose() {} }
      },
    })

    // Global keyboard shortcuts
    const keyHandler = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey
      if (e.altKey && e.key === 'w') {
        e.preventDefault()
        if (activePathRef.current) closeTabRef.current(activePathRef.current)
        return
      }
      if (!cmd) return
      if (e.key === 's') { e.preventDefault(); toast.success('已保存到浏览器（刷新不丢失）') }
      if (e.key === '[') { e.preventDefault(); const tabs = openTabsRef.current; const idx = tabs.indexOf(activePathRef.current); if (idx > 0) selectPathRef.current(tabs[idx - 1]) }
      if (e.key === ']') { e.preventDefault(); const tabs = openTabsRef.current; const idx = tabs.indexOf(activePathRef.current); if (idx >= 0 && idx < tabs.length - 1) selectPathRef.current(tabs[idx + 1]) }
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); startCommitFlowRef.current() }
    }
    window.addEventListener('keydown', keyHandler)

    return () => {
      window.removeEventListener('keydown', keyHandler)
      hoverDisposable.dispose()
      completionDisposable.dispose()
      inlayDisposable.dispose()
      editor.dispose()
      model.dispose()
      style.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync Monaco theme with next-themes
  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'vs-dark' : 'ataas-config-light')
  }, [resolvedTheme])

  // Tab switch: save/restore viewState
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const prev = prevPathRef.current
    if (prev && prev !== selectedPath) {
      viewStates.current.set(prev, editor.saveViewState())
    }
    prevPathRef.current = selectedPath

    const saved = viewStates.current.get(selectedPath)
    if (saved) {
      editor.restoreViewState(saved)
    } else {
      editor.setScrollTop(0)
      editor.setPosition({ lineNumber: 1, column: 1 })
    }
  }, [selectedPath]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync model content when draft arrives (file load, revert, tab switch)
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !currentDraft) return
    const model = editor.getModel()
    if (!model) return
    if (model.getValue() !== currentDraft.draft) {
      suppressOnChange.current = true
      model.setValue(currentDraft.draft)
      suppressOnChange.current = false
    }
  }, [selectedPath, currentDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore last active tab on mount, or open from URL
  useEffect(() => {
    if (selectedPath) { openTab(selectedPath); return }
    const saved = sessionStorage.getItem(STORAGE_ACTIVE)
    if (saved) selectPath(saved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedPath) openTab(selectedPath)
  }, [selectedPath, openTab])

  const startCommitFlow = useCallback(() => {
    const found: FileSuggestions[] = []
    for (const { path, entry } of dirtyEntries) {
      if (entry.deleted) continue
      const s = detectFileSuggestions(path, entry.draft) ?? detectDevPodSuggestions(path, entry.draft)
      if (s && s.patterns.length > 0) found.push(s)
    }
    if (found.length === 0) {
      setAppliedSuggestions(new Map())
      setCommitOpen(true)
      return
    }
    setSuggestions(found)
    setSuggestionsOpen(true)
  }, [dirtyEntries])
  startCommitFlowRef.current = startCommitFlow

  return (
    <div className="b300-config-root flex flex-col h-[100dvh]">
      {/* Thin top bar */}
      <div className="b300-config-topbar flex items-center gap-2 px-3 py-1.5 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="b300-config-title flex-1 min-w-0">
          <span>资源文件</span>
          {selectedPath && (
            <em title={selectedPath}>{selectedPath.split('/').join(' / ')}</em>
          )}
        </div>
        {selectedPath && currentDraft && (
          <>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1"
              onClick={() => undoDraft(selectedPath)} disabled={!isDirty(currentDraft)} title="还原当前文件">
              <Undo2 className="h-3 w-3" /> 还原
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1"
              onClick={() => setHistoryPath(selectedPath)} title="查看历史">
              <History className="h-3 w-3" /> 历史
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1"
              onClick={() => setDuplicating({ sourcePath: selectedPath, sourceYaml: currentDraft.draft })} title="复制文件">
              <Copy className="h-3 w-3" /> 复制
            </Button>
            <Button variant="outline" size="sm" className="h-6 w-6 p-0"
              onClick={() => markDelete(selectedPath)} disabled={currentDraft.deleted}
              title="删除文件" style={{ color: 'var(--color-danger, #c0392b)' }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
        {pendingCount > 0 && (
          <>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--color-border)' }} />
            <button type="button" onClick={startCommitFlow}
              className="b300-config-change-pill inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors hover:bg-[var(--color-elevated)] cursor-pointer"
              style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
              {pendingCount} 项变更
            </button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={discardAll}>放弃</Button>
            <Button size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={startCommitFlow}>
              <Save className="h-3 w-3" /> 提交
            </Button>
          </>
        )}
      </div>

      {/* Main IDE area */}
      <div className="flex-1 flex min-h-0">
        {/* File tree sidebar */}
        <div className="b300-config-rail shrink-0 border-r flex flex-col relative" style={{ width: railWidth, borderColor: 'var(--color-border)' }}>
          <div className="b300-config-rail-head flex items-center gap-1 px-2 py-1 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-[10px] uppercase tracking-wide flex-1" style={{ color: 'var(--color-secondary)' }}>文件</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
              title={dirtyOnly ? '显示全部文件' : '仅显示有变更的文件 (A/M/D)'}
              onClick={() => setDirtyOnly(v => { const next = !v; sessionStorage.setItem('b300.configs.dirtyOnly', next ? '1' : '0'); return next })}
              style={{ color: dirtyOnly ? 'var(--color-warning)' : undefined }}>
              <Filter className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
              title={sortByTime ? '按名称排序' : '按修改时间排序'}
              onClick={() => setSortByTime(v => { const next = !v; sessionStorage.setItem('b300.configs.sortByTime', next ? '1' : '0'); return next })}
              style={{ color: sortByTime ? 'var(--color-primary)' : undefined }}>
              <ArrowDownUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" title="新建文件（文件名可包含 / 创建目录）" onClick={() => {
              // 顶部工具栏 New File 固定在最顶层(根目录)建,不跟随当前选中项落到子目录;
              // 在某子目录下建文件请用该目录的右键菜单 New File,或在文件名里写 sub/dir/x.yaml。
              setCreating({ parentDir: '' })
            }}>
              <FilePlus className="h-3 w-3" />
            </Button>
          </div>
          {/* 搜索框单独一行,避免挤压上面的图标按钮。子串匹配文件名或完整路径
              (case-insensitive),激活时下方树会过滤+自动展开所有命中节点的祖先。
              不持久化到 sessionStorage,刷新页面从空开始,避免遗留 query 误导。 */}
          <div className="b300-config-search px-2 py-1 border-b shrink-0 flex items-center gap-1" style={{ borderColor: 'var(--color-border)' }}>
            <Search className="h-3 w-3 shrink-0" style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="搜索文件..."
              className="flex-1 min-w-0 bg-transparent text-[11px] font-mono outline-none border-0"
              style={{ color: 'var(--color-text-heading)' }}
            />
            {filterQuery && (
              <button type="button" onClick={() => setFilterQuery('')}
                className="shrink-0 p-0.5 rounded hover:bg-[var(--color-elevated)] transition-colors"
                title="清空">
                <X className="h-3 w-3" style={{ color: 'var(--color-muted)' }} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto py-1" onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              setCtxMenu({ x: e.clientX, y: e.clientY, path: '', isDir: false })
            }
          }}>
            {treeLoading && <div className="text-[10px] py-4 text-center" style={{ color: 'var(--color-muted)' }}>加载中...</div>}
            {treeErr && <div className="text-[10px] py-2 px-2" style={{ color: 'var(--color-warning)' }}>{treeErr}</div>}
            {tree && (
              <TreeView node={tree} selectedPath={selectedPath} onSelect={handleTreeClick}
                onContextMenu={handleTreeContextMenu} selection={selection}
                sortByTime={sortByTime}
                filterQuery={filterQuery}
                dirtyOnly={dirtyOnly}
                creating={creating}
                onCreateConfirm={(path) => {
                  setCreating(null)
                  setDrafts((d) => ({ ...d, [path]: { base: null, draft: DEFAULT_YAML_TEMPLATE, deleted: false } }))
                  selectPath(path)
                }}
                onCreateCancel={() => setCreating(null)}
                pendingCreated={pendingCreatedPaths} pendingDeleted={pendingDeletedPaths} dirty={dirtyPathSet} />
            )}
            {tree && (!tree.children || tree.children.length === 0) && pendingCreatedPaths.length === 0 && (
              <div className="text-[10px] py-4 text-center" style={{ color: 'var(--color-muted)' }}>
                暂无配置文件
              </div>
            )}
          </div>
          {/* 可拖动抓手:跨在左栏右边缘(right:-3),默认透明、hover 染色给出可拖提示。
              role/aria 让辅助技术可见;实际拖拽逻辑在 beginRailResize + 上面的 effect。 */}
          <div onMouseDown={beginRailResize}
            role="separator" aria-orientation="vertical"
            title="拖动调整左栏宽度"
            className="absolute top-0 h-full cursor-col-resize hover:bg-[var(--color-border)] transition-colors"
            style={{ right: -3, width: 6, zIndex: 10 }} />
        </div>

        {/* Editor area */}
        <div className="b300-config-editor flex-1 min-w-0 flex flex-col">
          {/* Tab bar */}
          {openTabs.length > 0 && (
            <div
              className="b300-config-tabs flex items-stretch border-b shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
              onContextMenu={(e) => {
                e.preventDefault()
                setTabCtxMenu({ x: e.clientX, y: e.clientY })
              }}
            >
              <div className="b300-config-tabs-scroll flex items-end min-w-0 flex-1 overflow-x-auto">
                {openTabs.map((tab) => {
                  const active = tab === selectedPath
                  const d = drafts[tab]
                  const dirty = d && isDirty(d)
                  const deleted = d?.deleted
                  const created = d?.base === null
                  return (
                    <button key={tab} type="button"
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono border-r shrink-0 group"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: active ? 'var(--color-card, transparent)' : 'transparent',
                        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: active ? 'var(--color-primary)' : 'var(--color-secondary)',
                      }}
                      onClick={() => selectPath(tab)}
                    >
                      <span className="truncate max-w-[160px]" style={{
                        textDecoration: deleted ? 'line-through' : undefined,
                      }}>
                        {tab.split('/').pop()}
                      </span>
                      {dirty && !deleted && !created && (
                        <span className="b300-tab-state" data-state="modified">已改</span>
                      )}
                      {created && <span className="b300-tab-state" data-state="created">新增</span>}
                      {deleted && <span className="b300-tab-state" data-state="deleted">删除</span>}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => closeTab(tab, e)}>
                        <X className="h-3 w-3" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Editor content — Monaco always mounted, overlays for empty/loading/error states */}
          <div className="flex-1 min-h-0 relative">
            {/* Native monaco.editor.create container */}
            <div ref={editorContainerRef} className="absolute inset-0" style={{
              visibility: (selectedPath && currentDraft && !fileErr && !currentDraft.deleted) ? 'visible' : 'hidden',
            }} />
            {/* Overlay states */}
            {!selectedPath && (
              <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: 'var(--color-muted)' }}>
                从左侧选择一个文件，或新建配置文件
              </div>
            )}
            {selectedPath && fileLoading && !currentDraft && (
              <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: 'var(--color-muted)' }}>加载中...</div>
            )}
            {selectedPath && fileErr && (
              <div className="absolute inset-0 p-4 text-xs" style={{ color: 'var(--color-warning)' }}>{fileErr}</div>
            )}
            {selectedPath && currentDraft?.deleted && (
              <div className="absolute inset-0 flex items-center justify-center text-xs"
                style={{ color: 'var(--color-danger, #c0392b)' }}>
                当前文件已标记删除，点击“还原”可恢复
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CreateFileDialog removed — inline creation handled inside TreeView */}

      {commitOpen && (
        <CommitDialog
          entries={dirtyEntries}
          drafts={drafts}
          appliedSuggestions={appliedSuggestions}
          message={commitMessage}
          setMessage={setCommitMessage}
          committing={committing}
          onClose={() => setCommitOpen(false)}
          onCommit={onCommit}
        />
      )}

      {historyPath && (
        <ConfigHistoryDialog
          path={historyPath}
          currentDraft={drafts[historyPath]?.draft}
          onClose={() => setHistoryPath(null)}
          onRevert={(yaml) => {
            setDraft(historyPath, yaml)
            toast.success(`已还原到历史版本（未提交）`)
          }}
          onCreateFrom={(sourceYaml) => {
            setDuplicating({ sourcePath: historyPath, sourceYaml })
          }}
        />
      )}

      {duplicating && (
        <DuplicateFileDialog
          sourcePath={duplicating.sourcePath}
          sourceYaml={duplicating.sourceYaml}
          existingPaths={collectAllPaths(tree, pendingCreatedPaths)}
          onClose={() => setDuplicating(null)}
          onDuplicated={(newPath) => {
            // Stage a pending-create entry with the copied yaml content,
            // then select the new file so the editor shows it. No write
            // hits disk until the user clicks Commit — same atomic model
            // as New File.
            setDrafts((d) => ({
              ...d,
              [newPath]: { base: null, draft: duplicating.sourceYaml, deleted: false },
            }))
            setDuplicating(null)
            selectPath(newPath)
          }}
        />
      )}

      {renaming && (
        <RenameFileDialog
          sourcePath={renaming.sourcePath}
          sourceYaml={renaming.sourceYaml}
          existingPaths={collectAllPaths(tree, pendingCreatedPaths)}
          onClose={() => setRenaming(null)}
          onRenamed={(newPath) => {
            // Rename = stage 新 path(carry 当前 draft,把未提交修改一并搬过去)
            //       + 旧 path 标删(若磁盘有这文件)或直接 drop(若是 pending-create)。
            // 一次 commit 走 delete + write,git 内部按 blob 相似度自动识别为
            // rename —— `git log --follow newpath` 能追到旧文件历史。
            setDrafts((d) => {
              const old = d[renaming.sourcePath]
              const carriedDraft = old?.draft ?? renaming.sourceYaml
              const next = { ...d }
              if (old && old.base === null) {
                // pending-create:从未落盘,无需 commit 一个 delete,直接丢条目。
                delete next[renaming.sourcePath]
              } else {
                // 磁盘有这文件:标删,后续 commit 会 emit 一个 delete。draft 字
                // 段在 deleted entry 上不参与 commit,设回 base 让 dirty 判定
                // 仅 by deleted=true 触发,不带额外噪声。
                const base = old?.base ?? renaming.sourceYaml
                next[renaming.sourcePath] = { base, draft: base, deleted: true }
              }
              next[newPath] = { base: null, draft: carriedDraft, deleted: false }
              return next
            })
            // 选区 / 比较基准跟随新 path
            if (compareBase === renaming.sourcePath) setCompareBase(newPath)
            setRenaming(null)
            selectPath(newPath)
          }}
        />
      )}

      {suggestionsOpen && (
        <TemplateSuggestionsDialog
          suggestions={suggestions}
          onApply={(selected) => {
            // Apply every selected pattern as a global string replace on
            // the file's draft. Patterns are non-overlapping (full name
            // vs underscored prefix) so sequential split/join is safe.
            // Our substitutions never change line count, so the original
            // matched line numbers are still valid in the post-apply
            // text — we stash them to drive the commit dialog's amber
            // "suggestion-replaced" highlighting.
            const applied = new Map<string, Set<number>>()
            setDrafts((d) => {
              const next = { ...d }
              for (const [path, ids] of selected) {
                const entry = next[path]
                if (!entry) continue
                const fileSugg = suggestions.find((s) => s.path === path)
                if (!fileSugg) continue
                let text = entry.draft
                const lines = new Set<number>()
                for (const p of fileSugg.patterns) {
                  if (!ids.has(p.id)) continue
                  text = text.split(p.pattern).join(p.replacement)
                  for (const ml of p.matchedLines) lines.add(ml.lineNumber)
                }
                next[path] = { ...entry, draft: text }
                applied.set(path, lines)
              }
              return next
            })
            setAppliedSuggestions(applied)
            setSuggestionsOpen(false)
            setCommitOpen(true)
          }}
          onSkip={() => {
            setAppliedSuggestions(new Map())
            setSuggestionsOpen(false)
            setCommitOpen(true)
          }}
          onClose={() => setSuggestionsOpen(false)}
        />
      )}

      {/* Right-click context menu */}
      {ctxMenu && (() => {
        const multiSelected = selection.size > 1
        const isBlank = ctxMenu.path === ''
        const isFile = !isBlank && !ctxMenu.isDir
        return (
          <div className="fixed z-50 rounded border shadow-lg py-1 min-w-[180px]"
            style={{ left: ctxMenu.x, top: ctxMenu.y, backgroundColor: 'var(--color-card, #1e1e1e)', borderColor: 'var(--color-border)' }}>
            {isBlank && (
              <CtxMenuItem icon={<FilePlus className="h-3 w-3" />} label="新建文件"
                onClick={() => { setCreating({ parentDir: '' }); setCtxMenu(null) }} />
            )}
            {ctxMenu.isDir && !multiSelected && (
              <CtxMenuItem icon={<FilePlus className="h-3 w-3" />} label="新建文件"
                onClick={() => { setCreating({ parentDir: ctxMenu.path }); setCtxMenu(null) }} />
            )}
            {isFile && !multiSelected && (
              <>
                <CtxMenuItem icon={<File className="h-3 w-3" />} label="打开"
                  onClick={() => { selectPath(ctxMenu.path); setCtxMenu(null) }} />
                <CtxMenuItem icon={<Download className="h-3 w-3" />} label="下载"
                  onClick={() => { handleDownload(ctxMenu.path); setCtxMenu(null) }} />
                <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }} />
                <CtxMenuItem icon={<Copy className="h-3 w-3" />} label="复制"
                  onClick={() => {
                    const d = drafts[ctxMenu.path]
                    setDuplicating({ sourcePath: ctxMenu.path, sourceYaml: d?.draft ?? '' })
                    if (!d) {
                      rpc('config.get', { path: ctxMenu.path })
                        .then((r) => setDuplicating({ sourcePath: ctxMenu.path, sourceYaml: r.yaml }))
                        .catch(() => {})
                    }
                    setCtxMenu(null)
                  }} />
                <CtxMenuItem icon={<Pencil className="h-3 w-3" />} label="重命名"
                  onClick={() => {
                    // 拿源 yaml:已经在 drafts 里就用 draft(把未提交修改一并带走),
                    // 否则从磁盘 fetch。Dialog 打开瞬间先开起来给个 sourceYaml='',
                    // fetch 回来再补,UX 跟 Duplicate 一致。
                    const d = drafts[ctxMenu.path]
                    setRenaming({ sourcePath: ctxMenu.path, sourceYaml: d?.draft ?? '' })
                    if (!d) {
                      rpc('config.get', { path: ctxMenu.path })
                        .then((r) => setRenaming({ sourcePath: ctxMenu.path, sourceYaml: r.yaml }))
                        .catch(() => {})
                    }
                    setCtxMenu(null)
                  }} />
                <CtxMenuItem icon={<History className="h-3 w-3" />} label="历史"
                  onClick={() => { setHistoryPath(ctxMenu.path); setCtxMenu(null) }} />
                {compareBase && compareBase !== ctxMenu.path && (
                  <CtxMenuItem icon={<Diff className="h-3 w-3" />}
                    label={`与 ${compareBase.split('/').pop()} 对比`}
                    onClick={() => { setDiffPair({ left: compareBase, right: ctxMenu.path }); setCtxMenu(null) }} />
                )}
                <CtxMenuItem icon={<Diff className="h-3 w-3" />} label="选择用于对比"
                  onClick={() => { setCompareBase(ctxMenu.path); setCtxMenu(null); toast.success(`已选择 ${ctxMenu.path.split('/').pop()}`) }} />
              </>
            )}
            {!isBlank && (
              <>
                <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }} />
                <CtxMenuItem icon={<Trash2 className="h-3 w-3" />}
                  label={multiSelected ? `删除 ${selection.size} 项` : '删除'}
                  onClick={() => { deleteSelection(); setCtxMenu(null) }}
                  danger />
              </>
            )}
          </div>
        )
      })()}

      {tabCtxMenu && (
        <div
          className="fixed z-50 rounded border shadow-lg py-1 min-w-[150px]"
          style={{
            left: tabCtxMenu.x,
            top: tabCtxMenu.y,
            backgroundColor: 'var(--color-card, #1e1e1e)',
            borderColor: 'var(--color-border)',
          }}
        >
          <CtxMenuItem
            icon={<X className="h-3 w-3" />}
            label="关闭全部"
            onClick={() => {
              closeAllTabs()
              setTabCtxMenu(null)
            }}
          />
        </div>
      )}

      {/* Diff viewer */}
      {diffPair && (
        <FileDiffDialog left={diffPair.left} right={diffPair.right} drafts={drafts}
          onClose={() => setDiffPair(null)} />
      )}
    </div>
  )
}

// --- context menu item ---------------------------------------------------

function CtxMenuItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--color-elevated)] transition-colors"
      style={{ color: danger ? 'var(--color-danger, #c0392b)' : 'var(--color-primary)' }}>
      {icon} {label}
    </button>
  )
}

// --- file diff dialog ----------------------------------------------------

function FileDiffDialog({ left, right, drafts, onClose }: {
  left: string; right: string; drafts: Drafts; onClose: () => void
}) {
  const [leftYaml, setLeftYaml] = useState('')
  const [rightYaml, setRightYaml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const fetchContent = async (path: string): Promise<string> => {
      const d = drafts[path]
      if (d) return d.draft
      const resp = await rpc('config.get', { path })
      return resp.yaml
    }
    Promise.all([fetchContent(left), fetchContent(right)])
      .then(([l, r]) => { if (alive) { setLeftYaml(l); setRightYaml(r) } })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [left, right, drafts])

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Diff className="h-4 w-4" />
            <span className="font-mono">{left}</span>
            <span style={{ color: 'var(--color-muted)' }}>vs</span>
            <span className="font-mono">{right}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--color-muted)' }}>加载中...</div>
          ) : (
            <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border)', height: '70vh' }}>
              <DiffEditor original={leftYaml} modified={rightYaml} language="yaml"
                options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false },
                  fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true }} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- template suggestions ------------------------------------------------

type MatchedLine = {
  lineNumber: number
  lineText: string
  /** Up to 2 lines of context before the matched line. */
  contextBefore: { lineNumber: number; lineText: string }[]
  /** Up to 2 lines of context after the matched line. */
  contextAfter: { lineNumber: number; lineText: string }[]
}

type PatternSuggestion = {
  id: string
  pattern: string
  replacement: string
  label: string
  matchedLines: MatchedLine[]
}

type FileSuggestions = {
  path: string
  model: string
  index: string
  role: 'router' | 'workers'
  patterns: PatternSuggestion[]
}

// ConfigHistoryDialog — git log viewer for a single config file. Left
// pane lists commits (short hash, time, author, message); clicking one
// shows the DiffEditor of that commit vs its parent on the right. All
// data comes from config.history + config.show_commit RPCs.
function ConfigHistoryDialog({
  path,
  currentDraft,
  onClose,
  onRevert,
  onCreateFrom,
}: {
  path: string
  currentDraft?: string
  onClose: () => void
  onRevert: (yaml: string) => void
  onCreateFrom: (sourceYaml: string) => void
}) {
  const WORKING_COPY = '__working__'
  const [commits, setCommits] = useState<ConfigCommitEntry[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [show, setShow] = useState<ConfigShowCommitResponse | null>(null)
  const [showLoading, setShowLoading] = useState(false)

  // Latest commit yaml for working-copy diff
  const [latestYaml, setLatestYaml] = useState<string>('')

  useEffect(() => {
    let alive = true
    setCommits(null)
    setLoadErr(null)
    rpc('config.history', { path, limit: 200 })
      .then((resp) => {
        if (!alive) return
        setCommits(resp.commits)
        // Default: if we have a current draft, show working copy diff first
        if (currentDraft !== undefined && resp.commits.length > 0) {
          setSelected(WORKING_COPY)
        } else if (resp.commits.length > 0) {
          setSelected(resp.commits[0].hash)
        }
      })
      .catch((e) => {
        if (alive) setLoadErr(e instanceof Error ? e.message : String(e))
      })
    return () => { alive = false }
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch latest commit content for working-copy diff
  useEffect(() => {
    if (!commits || commits.length === 0) return
    let alive = true
    rpc('config.show_commit', { path, hash: commits[0].hash })
      .then((resp) => { if (alive) setLatestYaml(resp.yaml) })
      .catch(() => {})
    return () => { alive = false }
  }, [path, commits])

  useEffect(() => {
    if (!selected || selected === WORKING_COPY) { setShow(null); return }
    let alive = true
    setShowLoading(true)
    rpc('config.show_commit', { path, hash: selected })
      .then((resp) => { if (alive) setShow(resp) })
      .catch(() => { if (alive) setShow(null) })
      .finally(() => { if (alive) setShowLoading(false) })
    return () => { alive = false }
  }, [path, selected])

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            历史 · <span className="font-mono">{path}</span>
            {commits && (
              <span className="text-[11px] font-normal" style={{ color: 'var(--color-muted)' }}>
                {commits.length} 次提交
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="b300-history-description text-xs">
            左侧展示该文件的提交记录，选择任一记录可查看与上一版本的差异。
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 min-h-0"
          style={{
            // Grid with an explicit track for each pane keeps Monaco's
            // parent at a definite width. `flex-1 + min-w-0` on the diff
            // side measures to 0 at Dialog animation start, which Monaco
            // then never re-lays-out even with automaticLayout.
            display: 'grid',
            gridTemplateColumns: '320px minmax(0, 1fr)',
            gap: 12,
          }}
        >
          <div
            className="rounded border overflow-auto"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {loadErr && <div className="text-xs p-3" style={{ color: 'var(--color-warning)' }}>{loadErr}</div>}
            {!loadErr && commits === null && (
              <div className="text-xs p-3" style={{ color: 'var(--color-muted)' }}>加载中...</div>
            )}
            {commits && commits.length === 0 && (
              <div className="text-xs p-3" style={{ color: 'var(--color-muted)' }}>该文件暂无提交记录</div>
            )}
            {currentDraft !== undefined && commits && commits.length > 0 && (
              <button type="button"
                onClick={() => setSelected(WORKING_COPY)}
                className="w-full text-left flex flex-col gap-0.5 px-3 py-2 text-xs border-b transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: selected === WORKING_COPY ? 'var(--color-elevated)' : undefined,
                  color: selected === WORKING_COPY ? 'var(--color-primary)' : 'var(--color-secondary)',
                }}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]" style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
                    当前编辑
                  </Badge>
                </div>
                <div className="truncate">未提交的修改 vs 最新提交</div>
              </button>
            )}
            {commits && commits.map((c) => {
              const ts = new Date(c.ts_ms)
              const stamp = `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}`
              const active = selected === c.hash
              return (
                <button
                  key={c.hash}
                  type="button"
                  onClick={() => setSelected(c.hash)}
                  className="w-full text-left flex flex-col gap-0.5 px-3 py-2 text-xs border-b last:border-b-0 transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: active ? 'var(--color-elevated)' : undefined,
                    color: active ? 'var(--color-primary)' : 'var(--color-secondary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{c.hash.slice(0, 7)}</Badge>
                    <span className="tabular-nums" style={{ color: 'var(--color-secondary)' }}>{stamp}</span>
                  </div>
                  <div className="font-mono truncate" style={{ color: 'var(--color-secondary)' }}>{c.author}</div>
                  <div className="truncate">{c.message}</div>
                </button>
              )
            })}
          </div>

          <div className="min-w-0 flex flex-col gap-2">
            {selected === WORKING_COPY && currentDraft !== undefined && (
              <>
                <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-warning)' }}>
                  当前编辑 vs 最新提交
                </div>
                <div className="rounded overflow-hidden"
                  style={{ border: '1px solid var(--color-border)', height: '65vh', width: '100%' }}>
                  <DiffEditor original={latestYaml} modified={currentDraft} language="yaml"
                    options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false },
                      fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true }} />
                </div>
              </>
            )}
            {selected && selected !== WORKING_COPY && show && (
              <>
                <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-secondary)' }}>
                  {show.parent_hash ? `对比 ${show.parent_hash.slice(0, 7)}` : '初始提交'}
                </div>
                <div
                  className="rounded overflow-hidden"
                  style={{ border: '1px solid var(--color-border)', height: '65vh', width: '100%' }}
                >
                  <DiffEditor
                    original={show.parent_yaml}
                    modified={show.yaml}
                    language="yaml"
                   
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </>
            )}
            {selected && showLoading && !show && (
              <div className="text-xs py-12 text-center" style={{ color: 'var(--color-muted)' }}>正在加载差异...</div>
            )}
            {!selected && (
              <div className="text-xs py-12 text-center" style={{ color: 'var(--color-muted)' }}>
                请从左侧选择一条提交记录
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {selected && selected !== WORKING_COPY && show && show.yaml && (
            <>
              <Button variant="outline" size="sm" className="gap-1"
                onClick={() => { onCreateFrom(show.yaml); onClose() }}>
                <FilePlus className="h-3 w-3" /> 基于此版本创建
              </Button>
              <Button variant="outline" size="sm" className="gap-1"
                onClick={() => { onRevert(show.yaml); onClose() }}>
                <Undo2 className="h-3 w-3" /> 还原到此版本
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ContextLine renders one yaml line inside a suggestion preview block.
// `dim=true` styles surrounding context lines muted; `highlight=pattern`
// wraps the matched substring in a warning-tinted span so the operator
// can instantly see what's being replaced.
function ContextLine({
  line,
  dim,
  highlight,
}: {
  line: { lineNumber: number; lineText: string }
  dim?: boolean
  highlight?: string
}) {
  // Preserve leading indentation so yaml nesting is visible, but still
  // truncate long values to keep each row one line in the dialog.
  const raw = line.lineText.length > 110 ? `${line.lineText.slice(0, 109)}…` : line.lineText
  let body: React.ReactNode = raw
  if (highlight && raw.includes(highlight)) {
    const parts = raw.split(highlight)
    body = parts.flatMap((seg, i) => {
      if (i === 0) return [<span key={`s${i}`}>{seg}</span>]
      return [
        <span
          key={`h${i}`}
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 28%, transparent)',
            color: 'var(--color-warning)',
            fontWeight: 600,
          }}
        >
          {highlight}
        </span>,
        <span key={`s${i}`}>{seg}</span>,
      ]
    })
  }
  return (
    <div
      className="text-[10px] font-mono whitespace-pre"
      style={{
        color: dim ? 'var(--color-muted)' : 'var(--color-primary)',
      }}
    >
      <span style={{ color: 'var(--color-muted)', userSelect: 'none' }}>
        {String(line.lineNumber).padStart(4, ' ')}{' '}
      </span>
      {body}
    </div>
  )
}

// detectFileSuggestions: read the yaml, derive (model, role, index) from
// metadata.name, and propose literal → token replacements that are safe
// (exact string matches, no regex voodoo, no overlap).
function detectFileSuggestions(path: string, yamlText: string): FileSuggestions | null {
  let parsed: unknown
  try {
    parsed = yaml.load(yamlText)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const meta = (parsed as { metadata?: unknown }).metadata
  if (!meta || typeof meta !== 'object') return null
  const name = (meta as { name?: unknown }).name
  if (typeof name !== 'string') return null
  const m = name.match(/^(.+?)-(router|workers)-(\d+)$/)
  if (!m) return null
  const [, model, role, index] = m as unknown as [string, string, 'router' | 'workers', string]
  const sisterRole: 'router' | 'workers' = role === 'router' ? 'workers' : 'router'
  const sisterName = `${model}-${sisterRole}-${index}`

  // Suggestion policy: never templatise the model — keep "glm51" literal.
  // Only INDEX gets replaced, so each config file stays tied to its
  // model family but can be reused across indices. The backend still
  // supports ${MODEL} / ${ROUTER_RBG} / ${WORKERS_RBG} for hand-written
  // templates; we just don't push the user into that territory.
  type Cand = { pattern: string; replacement: string; label: string }
  const candidates: Cand[] = [
    {
      pattern: name,
      replacement: `${model}-${role}-\${INDEX}`,
      label: `${name} → ${model}-${role}-${'${INDEX}'}`,
    },
    {
      pattern: sisterName,
      replacement: `${model}-${sisterRole}-\${INDEX}`,
      label: `${sisterName} → ${model}-${sisterRole}-${'${INDEX}'}`,
    },
    // nodeSelector.deployment values like "glm51_4_decode" — only the
    // "4" becomes ${INDEX}; model stays literal, role suffix stays
    // untouched so the operator's label scheme keeps working.
    {
      pattern: `${model}_${index}_`,
      replacement: `${model}_\${INDEX}_`,
      label: `${model}_${index}_ → ${model}_${'${INDEX}'}_`,
    },
  ]

  const lines = yamlText.split('\n')
  const patterns: PatternSuggestion[] = []
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const matched: MatchedLine[] = []
    for (let ln = 0; ln < lines.length; ln++) {
      const line = lines[ln]
      // Skip lines already templatised so we don't re-suggest.
      if (line.includes('${')) continue
      if (line.includes(c.pattern)) {
        const before: { lineNumber: number; lineText: string }[] = []
        const after: { lineNumber: number; lineText: string }[] = []
        for (let k = Math.max(0, ln - 2); k < ln; k++) {
          before.push({ lineNumber: k + 1, lineText: lines[k] })
        }
        for (let k = ln + 1; k < Math.min(lines.length, ln + 3); k++) {
          after.push({ lineNumber: k + 1, lineText: lines[k] })
        }
        matched.push({ lineNumber: ln + 1, lineText: line, contextBefore: before, contextAfter: after })
      }
    }
    if (matched.length === 0) continue
    patterns.push({
      id: `${path}:${i}`,
      pattern: c.pattern,
      replacement: c.replacement,
      label: c.label,
      matchedLines: matched,
    })
  }
  if (patterns.length === 0) return null
  return { path, model, index, role: role as 'router' | 'workers', patterns }
}

// DevPod 模板建议：检测 devpod/ 下文件中的硬编码值，建议替换为 ${NODE}/${OWNER}/${NAME}
function detectDevPodSuggestions(path: string, yamlText: string): FileSuggestions | null {
  if (!path.startsWith('devpod/')) return null
  let parsed: unknown
  try { parsed = yaml.load(yamlText) } catch { return null }
  if (!parsed || typeof parsed !== 'object') return null

  // 提取可能被参数化的值
  const obj = parsed as Record<string, unknown>
  const spec = (obj.spec ?? obj) as Record<string, unknown>
  const podSpec = (spec.pod as Record<string, unknown>)?.spec as Record<string, unknown> | undefined

  type Cand = { pattern: string; replacement: string; label: string }
  const candidates: Cand[] = []

  // kubernetes.io/hostname 硬编码节点名 → ${NODE}（精确匹配 hostname: 行，避免误命中 name 字段）
  const nodeSelector = podSpec?.nodeSelector as Record<string, string> | undefined
  const hostname = nodeSelector?.['kubernetes.io/hostname']
  if (hostname && !hostname.includes('${')) {
    candidates.push({
      pattern: `hostname: ${hostname}`,
      replacement: 'hostname: ${NODE}',
      label: `hostname: ${hostname} → hostname: \${NODE}`,
    })
  }

  // owner 硬编码 → ${OWNER}
  const owner = spec.owner as string | undefined
  if (owner && typeof owner === 'string' && !owner.includes('${')) {
    candidates.push({
      pattern: `owner: ${owner}`,
      replacement: 'owner: ${OWNER}',
      label: `owner: ${owner} → owner: \${OWNER}`,
    })
  }

  // metadata.name 硬编码 → ${NAME}
  const meta = obj.metadata as Record<string, unknown> | undefined
  const metaName = meta?.name as string | undefined
  if (metaName && typeof metaName === 'string' && !metaName.includes('${')) {
    candidates.push({
      pattern: `name: ${metaName}`,
      replacement: 'name: ${NAME}',
      label: `name: ${metaName} → name: \${NAME}`,
    })
  }

  const lines = yamlText.split('\n')
  const patterns: PatternSuggestion[] = []
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const matched: MatchedLine[] = []
    for (let ln = 0; ln < lines.length; ln++) {
      const line = lines[ln]
      if (line.includes('${')) continue
      if (line.includes(c.pattern)) {
        const before: { lineNumber: number; lineText: string }[] = []
        const after: { lineNumber: number; lineText: string }[] = []
        for (let k = Math.max(0, ln - 2); k < ln; k++) before.push({ lineNumber: k + 1, lineText: lines[k] })
        for (let k = ln + 1; k < Math.min(lines.length, ln + 3); k++) after.push({ lineNumber: k + 1, lineText: lines[k] })
        matched.push({ lineNumber: ln + 1, lineText: line, contextBefore: before, contextAfter: after })
      }
    }
    if (matched.length === 0) continue
    patterns.push({ id: `${path}:devpod:${i}`, pattern: c.pattern, replacement: c.replacement, label: c.label, matchedLines: matched })
  }
  if (patterns.length === 0) return null
  return { path, model: 'devpod', index: '0', role: 'workers', patterns }
}

function TemplateSuggestionsDialog({
  suggestions,
  onApply,
  onSkip,
  onClose,
}: {
  suggestions: FileSuggestions[]
  onApply: (selected: Map<string, Set<string>>) => void
  onSkip: () => void
  onClose: () => void
}) {
  // Pre-select everything — these are all high-confidence exact-string
  // replacements derived from the file's own metadata.name. User still
  // has one-click uncheck per pattern.
  const [checked, setChecked] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const f of suggestions) for (const p of f.patterns) s.add(p.id)
    return s
  })

  const total = suggestions.reduce((n, f) => n + f.patterns.length, 0)
  const totalMatches = suggestions.reduce(
    (n, f) => n + f.patterns.reduce((m, p) => m + p.matchedLines.length, 0),
    0,
  )
  const checkedCount = checked.size

  const toggle = (id: string) => {
    setChecked((c) => {
      const next = new Set(c)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const apply = () => {
    // Group selected IDs by file path so each file's draft gets patched
    // independently.
    const selected = new Map<string, Set<string>>()
    for (const f of suggestions) {
      const picked = new Set<string>()
      for (const p of f.patterns) {
        if (checked.has(p.id)) picked.add(p.id)
      }
      if (picked.size > 0) selected.set(f.path, picked)
    }
    onApply(selected)
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
            模板化建议
            <span className="text-[11px] font-normal" style={{ color: 'var(--color-muted)' }}>
              {total} 个规则 · {totalMatches} 行命中
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {suggestions.some(s => s.path.startsWith('devpod/'))
              ? <>检测到硬编码值，可替换为 <span className="font-mono">${'{NODE}'}</span>/<span className="font-mono">${'{OWNER}'}</span>/<span className="font-mono">${'{NAME}'}</span>，让模板可复用于不同节点和用户。不需要替换的项可以取消勾选。</>
              : <>检测到与文件命名一致的字面量，可替换为 <span className="font-mono">${'{MODEL}'}</span>/<span className="font-mono">${'{INDEX}'}</span>/<span className="font-mono">${'{ROUTER_RBG}'}</span>/<span className="font-mono">${'{WORKERS_RBG}'}</span>，让同一文件可复用于不同模型和实例。不需要替换的项可以取消勾选。</>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-3 pr-1">
          {suggestions.map((f) => (
            <div
              key={f.path}
              className="rounded border p-2 flex flex-col gap-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-elevated)' }}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono" style={{ color: 'var(--color-primary)' }}>{f.path}</span>
                <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {f.model === 'devpod' ? 'DevPod 模板' : `检测到 ${f.role} · ${f.model} · index ${f.index}`}
                </span>
              </div>
              {f.patterns.map((p) => {
                const on = checked.has(p.id)
                return (
                  <label
                    key={p.id}
                    className="flex items-start gap-2 text-[11px] font-mono cursor-pointer rounded px-1 py-1 hover:bg-[var(--color-surface)]"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(p.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <div>
                        <span style={{ color: 'var(--color-warning)' }}>{p.pattern}</span>
                        <span style={{ color: 'var(--color-muted)' }}> → </span>
                        <span style={{ color: 'var(--color-success)' }}>{p.replacement}</span>
                        <span className="ml-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          {p.matchedLines.length} 行
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {p.matchedLines.slice(0, 2).map((ml, mIdx) => (
                          <div key={ml.lineNumber} className="flex flex-col rounded px-1.5 py-1"
                            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            {ml.contextBefore.map((c) => (
                              <ContextLine key={c.lineNumber} line={c} dim />
                            ))}
                            <ContextLine line={ml} highlight={p.pattern} />
                            {ml.contextAfter.map((c) => (
                              <ContextLine key={c.lineNumber} line={c} dim />
                            ))}
                            {mIdx === 1 && p.matchedLines.length > 2 && (
                              <div className="text-[10px] pt-0.5" style={{ color: 'var(--color-muted)' }}>
                                ... 还有 {p.matchedLines.length - 2} 处命中
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onSkip}>
            跳过，直接提交
          </Button>
          <Button size="sm" onClick={apply} disabled={checkedCount === 0}>
            应用 {checkedCount} 项建议并继续
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Tree view -----------------------------------------------------------

function TreeView({
  node,
  selectedPath,
  onSelect,
  onContextMenu,
  selection,
  sortByTime,
  filterQuery,
  dirtyOnly,
  creating,
  onCreateConfirm,
  onCreateCancel,
  pendingCreated,
  pendingDeleted,
  dirty,
}: {
  node: ConfigTreeNode
  selectedPath: string
  onSelect: (e: React.MouseEvent, path: string, isDir: boolean) => void
  onContextMenu?: (e: React.MouseEvent, path: string, isDir: boolean) => void
  selection: Set<string>
  sortByTime: boolean
  filterQuery: string
  dirtyOnly: boolean
  creating: { parentDir: string } | null
  onCreateConfirm: (path: string) => void
  onCreateCancel: () => void
  pendingCreated: string[]
  pendingDeleted: Set<string>
  dirty: Set<string>
}) {
  // 任一过滤激活,树要按需保留祖先目录;两个过滤都没开时走原逻辑(零开销),
  // 仍受 sortByTime + 合并 pendingCreated 影响。
  const filterActive = filterQuery.trim() !== '' || dirtyOnly
  const queryLower = filterQuery.trim().toLowerCase()

  // 单个 leaf 是否通过过滤:同时满足 dirty(若开了)和 query(若非空)。
  // dirty 集合:on-disk M(dirty) + A(pendingCreated) + D(pendingDeleted)。
  const pendingCreatedSet = useMemo(() => new Set(pendingCreated), [pendingCreated])
  const leafPasses = (n: ConfigTreeNode): boolean => {
    if (dirtyOnly) {
      const isDirty = dirty.has(n.path) || pendingCreatedSet.has(n.path) || pendingDeleted.has(n.path)
      if (!isDirty) return false
    }
    if (queryLower) {
      // 既匹配 basename 也匹配完整 path(后者让 "devpod/foo" 这种带目录段的
      // 查询也工作),case-insensitive。
      if (!n.name.toLowerCase().includes(queryLower) && !n.path.toLowerCase().includes(queryLower)) {
        return false
      }
    }
    return true
  }

  // 递归过滤:目录只在有任一后代叶子通过时保留。
  const filterNode = (n: ConfigTreeNode): ConfigTreeNode | null => {
    if (!n.is_dir) return leafPasses(n) ? n : null
    const kept: ConfigTreeNode[] = []
    for (const c of n.children ?? []) {
      const f = filterNode(c)
      if (f) kept.push(f)
    }
    if (kept.length === 0) return null
    return { ...n, children: kept }
  }

  const mergedRoot = useMemo(() => {
    const clone: ConfigTreeNode = JSON.parse(JSON.stringify(node))
    for (const p of pendingCreated) {
      insertSyntheticFile(clone, p)
    }
    if (sortByTime) sortTreeByTime(clone)
    if (filterActive) {
      const filtered = filterNode(clone)
      // root 自身是合成的容器,即使所有子被过滤掉也保留(让下方 empty 提示显示)
      return filtered ?? { ...clone, children: [] }
    }
    return clone
  // filterNode 闭包依赖 dirtyOnly / queryLower / dirty / pendingCreatedSet /
  // pendingDeleted,这些 deps 都列上;leafPasses 是纯函数无副作用。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, pendingCreated, sortByTime, filterActive, queryLower, dirtyOnly, dirty, pendingCreatedSet, pendingDeleted])

  const noMatches = filterActive && (mergedRoot.children ?? []).length === 0

  return (
    <div className="flex flex-col">
      {(mergedRoot.children ?? []).map((child) => (
        <TreeNodeRow
          key={child.path}
          node={child}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          selection={selection}
          sortByTime={sortByTime}
          // 过滤激活时强制展开所有目录,让命中文件不必手动点开目录就能看到
          forceOpen={filterActive}
          creating={creating}
          onCreateConfirm={onCreateConfirm}
          onCreateCancel={onCreateCancel}
          pendingCreated={pendingCreatedSet}
          pendingDeleted={pendingDeleted}
          dirty={dirty}
        />
      ))}
      {/* Inline input at root level */}
      {creating && creating.parentDir === '' && (
        <InlineCreateInput depth={0} parentDir=""
          onConfirm={onCreateConfirm} onCancel={onCreateCancel} />
      )}
      {noMatches && (
        <div className="text-[10px] py-4 text-center" style={{ color: 'var(--color-muted)' }}>
          No files match filter
        </div>
      )}
    </div>
  )
}

function insertSyntheticFile(root: ConfigTreeNode, relPath: string) {
  const parts = relPath.split('/')
  let node = root
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLeaf = i === parts.length - 1
    const partialPath = parts.slice(0, i + 1).join('/')
    let child = (node.children ?? []).find((c) => c.name === part)
    if (!child) {
      child = { name: part, path: partialPath, is_dir: !isLeaf, children: [] }
      node.children = [...(node.children ?? []), child]
    }
    node = child
  }
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 0) return 'now'
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h${m % 60 ? ` ${m % 60}m` : ''}`
  const d = Math.floor(h / 24)
  return `${d}d${h % 24 ? ` ${h % 24}h` : ''}`
}

function sortTreeByTime(node: ConfigTreeNode) {
  if (!node.children) return
  for (const c of node.children) sortTreeByTime(c)
  node.children.sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
    const ta = latestModified(a)
    const tb = latestModified(b)
    return tb - ta
  })
}

function latestModified(node: ConfigTreeNode): number {
  if (!node.is_dir) return node.modified_ms ?? 0
  let max = 0
  for (const c of node.children ?? []) {
    max = Math.max(max, latestModified(c))
  }
  return max
}

const FILE_COLOR_RULES: [RegExp, string][] = [
  [/router|smg/i, '#2F80C8'],
  [/worker/i, '#8E5BBE'],
  [/glm|kimi|qwen/i, '#D59A00'],
]

function ColoredFileName({ name }: { name: string }) {
  const parts: { text: string; color?: string }[] = []
  let remaining = name
  while (remaining) {
    let earliest = remaining.length
    let matchLen = 0
    let matchColor = ''
    for (const [re, color] of FILE_COLOR_RULES) {
      re.lastIndex = 0
      const m = re.exec(remaining)
      if (m && m.index < earliest) {
        earliest = m.index
        matchLen = m[0].length
        matchColor = color
      }
    }
    if (matchLen === 0) {
      parts.push({ text: remaining })
      break
    }
    if (earliest > 0) parts.push({ text: remaining.substring(0, earliest) })
    parts.push({ text: remaining.substring(earliest, earliest + matchLen), color: matchColor })
    remaining = remaining.substring(earliest + matchLen)
  }
  return <>{parts.map((p, i) => p.color
    ? <span key={i} style={{ color: p.color, fontWeight: 600 }}>{p.text}</span>
    : <span key={i}>{p.text}</span>
  )}</>
}

function TreeNodeRow({
  node,
  depth,
  selectedPath,
  onSelect,
  onContextMenu,
  selection,
  sortByTime,
  forceOpen,
  creating,
  onCreateConfirm,
  onCreateCancel,
  pendingCreated,
  pendingDeleted,
  dirty,
}: {
  node: ConfigTreeNode
  depth: number
  selectedPath: string
  onSelect: (e: React.MouseEvent, path: string, isDir: boolean) => void
  onContextMenu?: (e: React.MouseEvent, path: string, isDir: boolean) => void
  selection: Set<string>
  sortByTime: boolean
  // 过滤激活时(search query / dirty-only),TreeView 传 true 让每个目录无视
  // sessionStorage 持久态强制展开,使所有命中节点可见。过滤关闭后恢复原 open 态。
  forceOpen: boolean
  creating: { parentDir: string } | null
  onCreateConfirm: (path: string) => void
  onCreateCancel: () => void
  pendingCreated: Set<string>
  pendingDeleted: Set<string>
  dirty: Set<string>
}) {
  const containsSelected =
    node.is_dir && !!selectedPath && selectedPath.startsWith(node.path + '/')
  const storageKey = node.is_dir ? `b300.tree.${node.path}` : ''
  const [open, setOpenRaw] = useState<boolean>(() => {
    if (!node.is_dir) return false
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved !== null) return saved === '1'
    } catch { /* noop */ }
    return depth === 0 || containsSelected
  })
  // forceOpen 优先于持久态 / 用户态:过滤激活期间所有目录展开。
  const effectiveOpen = forceOpen || open
  const setOpen = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setOpenRaw((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      if (storageKey) try { sessionStorage.setItem(storageKey, next ? '1' : '0') } catch { /* noop */ }
      return next
    })
  }, [storageKey])
  useEffect(() => {
    if (containsSelected) setOpen(true)
  }, [containsSelected, setOpen])

  const creatingHere = node.is_dir && creating?.parentDir === node.path
  useEffect(() => {
    if (creatingHere) setOpen(true)
  }, [creatingHere, setOpen])

  const isActive = !node.is_dir && node.path === selectedPath
  const isInSelection = selection.has(node.path)
  const isDirty = !node.is_dir && dirty.has(node.path)
  const isPendingCreate = !node.is_dir && pendingCreated.has(node.path)
  const isPendingDelete = !node.is_dir && pendingDeleted.has(node.path)

  // Per-file decoration: letter-badge (A/M/D) + colour tint.
  const statusLetter = isPendingCreate ? '新' : isPendingDelete ? '删' : isDirty ? '改' : ''
  const statusColor = isPendingCreate
    ? 'var(--color-success)'
    : isPendingDelete
      ? 'var(--color-danger, #c0392b)'
      : isDirty
        ? 'var(--color-warning)'
        : 'var(--color-secondary)'

  return (
    <div className="flex flex-col">
      <button
        type="button"
        className={`flex items-center gap-1 py-1 px-1 text-xs text-left rounded hover:bg-[var(--color-elevated)] transition-colors${isActive ? ' b300-tree-row-active' : ''}`}
        style={{
          paddingLeft: depth * 12 + 4,
          color: 'var(--color-text-heading, #e1e4e8)',
        }}
        onClick={(e) => {
          if (node.is_dir && !(e.metaKey || e.ctrlKey)) setOpen((v) => !v)
          onSelect(e, node.path, node.is_dir)
        }}
        onContextMenu={(e) => {
          if (onContextMenu) onContextMenu(e, node.path, node.is_dir)
        }}
      >
        {node.is_dir ? (
          effectiveOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )
        ) : (
          <File className="h-3 w-3 shrink-0" />
        )}
        <span
          className="font-mono truncate flex-1"
          // 仅文件 hover ~1s 显示完整文件名(原生 title);目录不给 tooltip。
          title={node.is_dir ? undefined : node.name}
          style={{ textDecoration: isPendingDelete ? 'line-through' : undefined }}
        >
          <ColoredFileName name={node.name} />
        </span>
        {statusLetter && (
          <span className="b300-tree-state shrink-0" style={{ color: statusColor }}>
            {statusLetter}
          </span>
        )}
        {!node.is_dir && node.modified_ms && (
          <span className="text-[9px] shrink-0 tabular-nums" style={{ color: 'var(--color-muted)' }}
            title={new Date(node.modified_ms).toLocaleString()}>
            {relativeTime(node.modified_ms)}
          </span>
        )}
      </button>
      {node.is_dir && effectiveOpen &&
        (node.children ?? []).map((child) => (
          <TreeNodeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            selection={selection}
            sortByTime={sortByTime}
            forceOpen={forceOpen}
            creating={creating}
            onCreateConfirm={onCreateConfirm}
            onCreateCancel={onCreateCancel}
            pendingCreated={pendingCreated}
            pendingDeleted={pendingDeleted}
            dirty={dirty}
          />
        ))}
      {/* Inline creation input inside this folder */}
      {creatingHere && (
        <InlineCreateInput depth={depth + 1} parentDir={node.path}
          onConfirm={onCreateConfirm} onCancel={onCreateCancel} />
      )}
    </div>
  )
}

function InlineCreateInput({ depth, parentDir, onConfirm, onCancel }: {
  depth: number; parentDir: string
  onConfirm: (path: string) => void; onCancel: () => void
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  // 只建文件。名字里可含 `/`(如 sub/dir/x.yaml)以隐式建目录;缺省补 .yaml。
  const submit = () => {
    let name = value.trim()
    if (!name) { onCancel(); return }
    if (!name.endsWith('.yaml') && !name.endsWith('.yml')) name += '.yaml'
    const path = parentDir ? `${parentDir}/${name}` : name
    onConfirm(path)
  }

  return (
    <div className="flex items-center gap-1 py-0.5 px-1" style={{ paddingLeft: depth * 12 + 4 }}>
      <File className="h-3 w-3 shrink-0" />
      <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
        className="flex-1 min-w-0 bg-transparent outline-none text-xs font-mono"
        style={{ color: 'var(--color-text-heading, #e1e4e8)', borderBottom: '1px solid var(--color-cyan, #58a6ff)' }}
        placeholder="filename.yaml(可含 / 建目录)"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={submit}
      />
    </div>
  )
}

function collectAllPaths(tree: ConfigTreeNode | null, pendingCreated: string[]): Set<string> {
  const paths = new Set<string>(pendingCreated)
  if (!tree) return paths
  const walk = (n: ConfigTreeNode) => {
    if (n.path) paths.add(n.path)
    if (n.children) n.children.forEach(walk)
  }
  walk(tree)
  return paths
}

// DuplicateFileDialog — clones a config's content under a new path. Runs
// in-memory only: the new path enters the drafts map as a pending-create
// entry, exactly like a freshly-created file; nothing is written to the
// config repo until the user clicks Commit.
function DuplicateFileDialog({
  sourcePath,
  sourceYaml,
  existingPaths,
  onClose,
  onDuplicated,
}: {
  sourcePath: string
  sourceYaml: string
  existingPaths: Set<string>
  onClose: () => void
  onDuplicated: (newPath: string) => void
}) {
  // Heuristic default: if source is "foo/bar-4.yaml" we suggest
  // "foo/bar-5.yaml" by bumping a trailing numeric index; otherwise fall
  // back to "-copy". Operators usually duplicate to create the next
  // group index, so the numeric bump saves a couple of keystrokes.
  const suggestNext = (src: string): string => {
    const m = src.match(/^(.*?)(\d+)(\.ya?ml)$/)
    if (m) {
      const next = parseInt(m[2], 10) + 1
      return `${m[1]}${next}${m[3]}`
    }
    if (src.endsWith('.yaml')) return src.replace(/\.yaml$/, '-copy.yaml')
    if (src.endsWith('.yml')) return src.replace(/\.yml$/, '-copy.yml')
    return `${src}-copy.yaml`
  }
  const [path, setPath] = useState(() => suggestNext(sourcePath))

  const normalizedPath = useMemo(() => {
    let p = path.trim().replace(/^\/+/, '')
    if (!p.endsWith('.yaml') && !p.endsWith('.yml')) p = `${p}.yaml`
    return p
  }, [path])

  const collision = existingPaths.has(normalizedPath)
  const sameAsSource = normalizedPath === sourcePath

  const onCreate = () => {
    if (collision) {
      toast.error(`${normalizedPath} 已存在`)
      return
    }
    if (sameAsSource) {
      toast.error('新路径不能与源文件相同')
      return
    }
    onDuplicated(normalizedPath)
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">复制配置</DialogTitle>
          <DialogDescription className="text-xs" style={{ color: 'var(--color-muted)' }}>
            将 <span className="font-mono">{sourcePath}</span> 的内容复制到新路径。新文件会先进入暂存状态，提交后生效。
            {sourceYaml.length > 0 && (
              <span className="block mt-1">
                {sourceYaml.split('\n').length} 行 · {sourceYaml.length} 字节
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>新路径</div>
            <Input
              className="font-mono text-xs"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !collision && !sameAsSource && path.trim()) onCreate()
              }}
            />
            <div
              className="text-[10px]"
              style={{
                color: collision || sameAsSource ? 'var(--color-warning)' : 'var(--color-muted)',
              }}
            >
              解析为：{normalizedPath}
              {collision ? ' · 已存在' : sameAsSource ? ' · 与源文件相同' : ''}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={onCreate} disabled={collision || sameAsSource || !path.trim()}>
            确认复制
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// RenameFileDialog — 跟 DuplicateFileDialog 几乎同形,差别在语义:
// 选完新路径,父组件会把旧 path 标删 + 新 path 标新建(同一 commit 内
// delete + write,git 内部按 blob 相似度识别成 rename)。
// 后端协议没有原生 renames 字段,这条 UX 是前端 sugar;commit dialog
// 仍会显示 "1 write + 1 delete",但 `git log --follow newpath` 能追到旧
// 文件的全部历史。
function RenameFileDialog({
  sourcePath,
  sourceYaml,
  existingPaths,
  onClose,
  onRenamed,
}: {
  sourcePath: string
  sourceYaml: string
  existingPaths: Set<string>
  onClose: () => void
  onRenamed: (newPath: string) => void
}) {
  // 默认显示当前 path,光标聚焦让用户直接改文件名段。跟 Duplicate 的
  // "数字 +1 / -copy" 建议不同 —— rename 没有"自动取下一个名字"的合理猜测。
  const [path, setPath] = useState(() => sourcePath)

  const normalizedPath = useMemo(() => {
    let p = path.trim().replace(/^\/+/, '')
    if (!p.endsWith('.yaml') && !p.endsWith('.yml')) p = `${p}.yaml`
    return p
  }, [path])

  // existingPaths 包含源文件自己,所以 "改回原名" 走 sameAsSource 检测,不算
  // collision。
  const collision = normalizedPath !== sourcePath && existingPaths.has(normalizedPath)
  const sameAsSource = normalizedPath === sourcePath

  const onConfirm = () => {
    if (collision) {
      toast.error(`${normalizedPath} 已存在`)
      return
    }
    if (sameAsSource) {
      toast.error('新路径不能与源文件相同')
      return
    }
    onRenamed(normalizedPath)
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">重命名配置</DialogTitle>
          <DialogDescription className="text-xs" style={{ color: 'var(--color-muted)' }}>
            将 <span className="font-mono">{sourcePath}</span> 重命名到新路径。重命名会先进入暂存状态，提交后生效。
            {sourceYaml.length > 0 && (
              <span className="block mt-1">
                {sourceYaml.split('\n').length} 行 · {sourceYaml.length} 字节
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>新路径</div>
            <Input
              className="font-mono text-xs"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !collision && !sameAsSource && path.trim()) onConfirm()
              }}
            />
            <div
              className="text-[10px]"
              style={{
                color: collision || sameAsSource ? 'var(--color-warning)' : 'var(--color-muted)',
              }}
            >
              解析为：{normalizedPath}
              {collision ? ' · 已存在' : sameAsSource ? ' · 与源文件相同' : ''}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={onConfirm} disabled={collision || sameAsSource || !path.trim()}>
            确认重命名
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Create dialog -------------------------------------------------------

// --- Commit dialog -------------------------------------------------------

function CommitDialog({
  entries,
  drafts,
  appliedSuggestions,
  message,
  setMessage,
  committing,
  onClose,
  onCommit,
}: {
  entries: { path: string; entry: DraftEntry }[]
  drafts: Drafts
  appliedSuggestions: Map<string, Set<number>>
  message: string
  setMessage: (v: string) => void
  committing: boolean
  onClose: () => void
  onCommit: () => void
}) {
  const [activePath, setActivePath] = useState<string>(entries[0]?.path ?? '')
  const active = entries.find((e) => e.path === activePath) ?? entries[0]
  const activeDraft = active ? drafts[active.path] : undefined

  const totalSuggestionLines = useMemo(
    () => Array.from(appliedSuggestions.values()).reduce((n, s) => n + s.size, 0),
    [appliedSuggestions],
  )

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            提交 {entries.length} 项变更
            {totalSuggestionLines > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] gap-1"
                style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
              >
                <Sparkles className="h-3 w-3" />
                {totalSuggestionLines} 行来自建议
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs" style={{ color: 'var(--color-muted)' }}>
            提交前可检查每个文件的差异。本操作只写入配置仓库，不会直接影响集群。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1 flex-wrap shrink-0">
          {entries.map(({ path, entry }) => {
            const kind = entry.deleted ? 'D' : entry.base === null ? 'A' : 'M'
            const color =
              kind === 'A'
                ? 'var(--color-success)'
                : kind === 'D'
                  ? 'var(--color-danger, #c0392b)'
                  : 'var(--color-warning)'
            const selected = path === activePath
            const appliedN = appliedSuggestions.get(path)?.size ?? 0
            return (
              <button
                key={path}
                type="button"
                onClick={() => setActivePath(path)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors"
                style={{
                  backgroundColor: selected ? 'var(--color-elevated)' : 'transparent',
                  border: `1px solid ${selected ? color : 'var(--color-border)'}`,
                  color: selected ? 'var(--color-primary)' : 'var(--color-secondary)',
                }}
              >
                <span style={{ color, width: 10 }}>{kind}</span>
                <span className="truncate max-w-[240px]" style={{
                  textDecoration: kind === 'D' ? 'line-through' : undefined,
                }}>{path}</span>
                {appliedN > 0 && (
                  <span
                    className="text-[9px] px-1 rounded"
                    style={{
                      color: 'var(--color-warning)',
                      border: '1px solid var(--color-warning)',
                    }}
                    title={`${appliedN} suggestion-replaced line(s)`}
                  >
                    ✦ {appliedN}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {active && activeDraft && (
            active.entry.deleted ? (
              <div
                className="rounded border p-4 text-xs flex-1 flex items-center justify-center"
                style={{
                  borderColor: 'var(--color-danger, #c0392b)',
                  color: 'var(--color-danger, #c0392b)',
                }}
              >
                提交后将删除此文件
              </div>
            ) : (
              <FileDiffView
                path={active.path}
                base={activeDraft.base}
                draft={activeDraft.draft}
                suggestionLines={appliedSuggestions.get(active.path) ?? new Set()}
              />
            )
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            提交说明（必填）
          </div>
          <Input
            className="font-mono text-xs"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="例如：调整 decode 副本数"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !committing && message.trim().length >= 3) onCommit()
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={onCommit} disabled={committing || message.trim().length < 3}>
            {committing ? '提交中...' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// FileDiffView shows base → draft for a single file. For A (added)
// files there's no base so we render the draft in a single Monaco with
// suggestion lines highlighted. For M (modified) we render Monaco's
// DiffEditor side-by-side and overlay the same amber decoration on the
// modified editor.
function FileDiffView({
  path,
  base,
  draft,
  suggestionLines,
}: {
  path: string
  base: string | null
  draft: string
  suggestionLines: Set<number>
}) {
  const added = base === null
  const lines = useMemo(() => [...suggestionLines].sort((a, b) => a - b), [suggestionLines])
  if (added) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-[10px] uppercase tracking-wide py-1" style={{ color: 'var(--color-muted)' }}>
          新文件 · {path}
        </div>
        <ReadonlyYamlBlock value={draft} height="60vh" />
      </div>
    )
  }
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="text-[10px] uppercase tracking-wide py-1" style={{ color: 'var(--color-muted)' }}>
        Modified · {path}
      </div>
      <DiffViewWithHighlight original={base ?? ''} modified={draft} highlightLines={lines} />
    </div>
  )
}

// DiffViewWithHighlight: Monaco DiffEditor with decorations applied to
// the modified side so suggestion-replaced lines get the amber overlay
// on top of the standard green "added" marker.
function ReadonlyYamlBlock({ value, height }: { value: string; height: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // monaco 的 theme 是全局 API(`monaco.editor.create({theme})` 内部走
  // `setTheme` 切所有实例),之前硬编 'vs-dark' 会把整个 page 的 editor
  // 跟着切暗、commit dialog 上下文整片变黑、不跟随 next-themes 全局主题。
  // 改成读 resolvedTheme;主组件已经在 `[resolvedTheme]` 依赖里跑过一次
  // `monaco.editor.setTheme(...)`(line ~730),所以 dialog 中途切主题也能
  // 联动,这里只负责初始值。
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    if (!ref.current) return
    const editor = monaco.editor.create(ref.current, {
      value, language: 'yaml',
      theme: resolvedTheme === 'dark' ? 'vs-dark' : 'vs',
      readOnly: true, domReadOnly: true,
      minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true,
    })
    return () => editor.dispose()
  }, [value, resolvedTheme])
  return <div ref={ref} className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border)', height }} />
}

function DiffViewWithHighlight({
  original,
  modified,
  highlightLines,
}: {
  original: string
  modified: string
  highlightLines: number[]
}) {
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

  const applyHighlights = useCallback((diff: monaco.editor.IStandaloneDiffEditor, lines: number[]) => {
    const modifiedEditor = diff.getModifiedEditor()
    if (!modifiedEditor) return
    // @ts-expect-error stash decoration ids
    const prev = modifiedEditor.__b300SuggestionIds ?? []
    const ids = modifiedEditor.deltaDecorations(prev,
      lines.map((ln) => ({
        range: new monaco.Range(ln, 1, ln, 1),
        options: { isWholeLine: true, className: 'b300-replaced-line', linesDecorationsClassName: 'b300-replaced-gutter' },
      })),
    )
    // @ts-expect-error
    modifiedEditor.__b300SuggestionIds = ids
  }, [])

  useEffect(() => {
    if (editorRef.current) applyHighlights(editorRef.current, highlightLines)
  }, [highlightLines, applyHighlights])

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: '1px solid var(--color-border)', height: '60vh' }}
    >
      <DiffEditor
        original={original}
        modified={modified}
        height="60vh"
        onMount={(editor) => { editorRef.current = editor; applyHighlights(editor, highlightLines) }}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
