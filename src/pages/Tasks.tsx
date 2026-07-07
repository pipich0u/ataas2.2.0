import '@/b300/index.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { rpc } from '@/lib/bus/rpc'
import { useZone } from '@/contexts/ClusterContext'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, PlayCircle, XCircle, RotateCcw } from 'lucide-react'
import { TaskProgress } from '@/components/shared/TaskProgress'
import type { TaskSnapshot } from '@/lib/types'

const STATUS_COLOR: Record<string, string> = {
  running: 'var(--color-secondary)',
  awaiting: 'var(--color-warning)',
  done: 'var(--color-success)',
  failed: 'var(--color-error)',
  aborted: 'var(--color-muted)',
  interrupted: 'var(--color-warning)',
}

const STATUS_TEXT: Record<string, string> = {
  running: '运行中',
  awaiting: '等待确认',
  done: '已完成',
  failed: '失败',
  aborted: '已终止',
  interrupted: '已中断',
}

const PAGE_SIZE = 10

export default function Tasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskSnapshot[]>([])
  const [err, setErr] = useState<string>()
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPage = useCallback(() => {
    // typed rpc：response 自动推为 { tasks: TaskSnapshot[]; total: number }
    rpc('task.list', { page, page_size: PAGE_SIZE })
      .then((r) => { setTasks(r.tasks ?? []); setTotal(r.total ?? 0); setErr(undefined) })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
  }, [page])

  useEffect(() => {
    fetchPage()
    const timer = setInterval(fetchPage, 5000)
    return () => clearInterval(timer)
  }, [fetchPage])

  const handleConfirm = useCallback(async (taskId: string, step: number, nonce: string, cluster?: string) => {
    setBusy(taskId)
    try {
      // workflow.* 是 cluster-scoped，rpc 第二参数是 cluster 名（非空校验在 dispatcher 内）
      await rpc('workflow.confirm', cluster ?? '', { task_id: taskId, step, nonce })
      toast.success('步骤已确认')
    } catch (e) {
      toast.error(`确认失败：${e instanceof Error ? e.message : String(e)}`)
    } finally { setBusy(null) }
  }, [])

  const handleAbort = useCallback(async (taskId: string, cluster?: string) => {
    setBusy(taskId)
    try {
      await rpc('workflow.abort', cluster ?? '', { task_id: taskId })
      toast.success('流程已终止')
    } catch (e) {
      toast.error(`终止失败：${e instanceof Error ? e.message : String(e)}`)
    } finally { setBusy(null) }
  }, [])

  const handleResume = useCallback(async (taskId: string) => {
    setBusy(taskId)
    try {
      await rpc('task.resume', { id: taskId })
      toast.success('任务已恢复')
    } catch (e) {
      toast.error(`恢复失败：${e instanceof Error ? e.message : String(e)}`)
    } finally { setBusy(null) }
  }, [])

  // task.list 是 global RPC，跨 cluster 拉所有；按 zone selector 过滤显示。
  // TaskSnapshot.cluster 是 backend 注入字段（types.ts 已收紧成 required）。
  const { zone } = useZone()
  const filteredTasks = useMemo(
    () => zone === '*' ? tasks : tasks.filter((t) => t.cluster === zone),
    [tasks, zone],
  )
  const active = filteredTasks.filter((t) => t.status === 'running' || t.status === 'interrupted')
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        crumbs={[{ label: '任务流程' }]}
        title="任务流程"
        subtitle={`共 ${total} 个任务 · 当前页 ${active.length} 个活跃任务`}
        right={
          <Link to="/workflow/new">
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> 新建流程</Button>
          </Link>
        }
      />

      {err && <div className="px-6 py-2 text-xs" style={{ color: 'var(--color-error)' }}>{err}</div>}

      <div className="flex-1 overflow-auto p-6">
        {filteredTasks.length === 0 && (
          <div className="text-xs py-12 text-center" style={{ color: 'var(--color-muted)' }}>
            暂无任务，点击“新建流程”创建一个任务。
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filteredTasks.map((t) => {
            const isWaiting = t.status === 'awaiting'
            const waitingStepIdx = t.awaiting_step ?? -1
            const waitingStepName = waitingStepIdx >= 0 && t.steps?.[waitingStepIdx] ? t.steps[waitingStepIdx].name : undefined
            const waitingNonce = t.awaiting_nonce ?? ''
            const displayStatus = isWaiting ? '等待确认' : (STATUS_TEXT[t.status] ?? t.status)
            const statusColor = isWaiting ? 'var(--color-warning)' : (STATUS_COLOR[t.status] ?? 'var(--color-muted)')

            return (
              <div
                key={t.id}
                className="rounded-lg border p-4 cursor-pointer transition-colors"
                style={{
                  borderColor: selected === t.id ? statusColor : isWaiting ? 'var(--color-warning)' : 'var(--color-border)',
                  backgroundColor: selected === t.id ? 'var(--color-elevated)' : isWaiting ? 'color-mix(in srgb, var(--color-warning) 5%, transparent)' : 'transparent',
                }}
                onClick={() => {
                  if (t.type === 'workflow') {
                    navigate(`/workflow/${t.id}`)
                  } else {
                    setSelected(selected === t.id ? null : t.id)
                  }
                }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]"
                    style={{ color: statusColor, borderColor: statusColor }}>
                    {displayStatus}
                  </Badge>
                  <span className="font-mono" style={{ color: 'var(--color-text-heading)' }}>
                    {t.meta?.name || t.type}
                  </span>
                  {/* cluster chip —— TaskSnapshot.cluster 由 backend 写入，
                      跟 Routes/Services/Groups 卡片同视觉。 */}
                  {t.cluster && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono leading-none"
                      style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}>
                      {t.cluster}
                    </span>
                  )}
                  {(t.exec_user || t.meta?.exec_user) && (
                    <span className="text-[10px]" style={{ color: 'var(--color-info)' }}>
                      {t.exec_user || t.meta?.exec_user}
                    </span>
                  )}
                  {t.meta && ['model', 'group_index'].map((k) => t.meta![k] && (
                    <span key={k} className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>
                      {k}={t.meta![k]}
                    </span>
                  ))}

                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    {/* Workflow continue button */}
                    {isWaiting && (
                      <Button size="sm" className="h-6 text-[10px] gap-1"
                        style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
                        disabled={busy === t.id}
                        onClick={(e) => { e.stopPropagation(); handleConfirm(t.id, waitingStepIdx, waitingNonce, t.cluster) }}>
                        <PlayCircle className="h-3 w-3" /> 确认步骤 {waitingStepIdx + 1}
                      </Button>
                    )}
                    {/* Abort button for running/waiting workflows */}
                    {(t.status === 'running' || t.status === 'awaiting') && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"
                        disabled={busy === t.id}
                        onClick={(e) => { e.stopPropagation(); handleAbort(t.id, t.cluster) }}>
                        <XCircle className="h-3 w-3" /> 终止
                      </Button>
                    )}
                    {/* Resume button for interrupted/failed tasks */}
                    {(t.status === 'interrupted' || t.status === 'failed' || t.status === 'aborted') && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"
                        disabled={busy === t.id}
                        onClick={(e) => { e.stopPropagation(); handleResume(t.id) }}>
                        <RotateCcw className="h-3 w-3" /> 恢复
                      </Button>
                    )}
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--color-muted)' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Deep preview for waiting step */}
                {isWaiting && waitingStepIdx >= 0 && t.steps?.[waitingStepIdx]?.preview && (
                  <div className="mt-2 rounded border text-xs" style={{ borderColor: 'var(--color-warning)', backgroundColor: 'color-mix(in srgb, var(--color-warning) 5%, transparent)' }}>
                    <div className="px-3 py-2" style={{ color: 'var(--color-warning)' }}>
                      下一步：<span className="font-semibold">{waitingStepName ?? '未知步骤'}</span>
                    </div>
                    {t.steps[waitingStepIdx].preview?.description && (
                      <div className="px-3 pb-2 text-[11px]" style={{ color: 'var(--color-secondary)' }}>
                        {t.steps[waitingStepIdx].preview!.description}
                      </div>
                    )}
                  </div>
                )}

                {selected === t.id && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <TaskProgress taskId={t.id} />
                  </div>
                )}
              </div>
            )
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button variant="outline" size="sm" className="h-7 text-xs"
                disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                上一页
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm"
                  className="h-7 w-7 text-xs p-0" onClick={() => setPage(p)}>
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs"
                disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                下一页
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
