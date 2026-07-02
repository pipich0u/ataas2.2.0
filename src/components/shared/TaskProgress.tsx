import { useCallback, useEffect, useState } from 'react'
// typed bus：task 是 session-scoped retained topic（wire `task.<id>`，payload TaskSnapshot），
// task.resume 是 global RPC。topicSubscribe + 命令式 listener 接 tombstone null。
import { topicSubscribe } from '@/lib/bus/topic-subscribe'
import { rpc } from '@/lib/bus/rpc'
import type { TaskSnapshot, TaskStepStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Loader2, XCircle, SkipForward, AlertTriangle, Play } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_ICON: Record<TaskStepStatus, React.ReactNode> = {
  pending: <Circle size={14} style={{ color: 'var(--color-muted)' }} />,
  running: <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-secondary)' }} />,
  done: <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />,
  error: <XCircle size={14} style={{ color: 'var(--color-error)' }} />,
  skipped: <SkipForward size={14} style={{ color: 'var(--color-muted)' }} />,
}

export function TaskProgress({
  taskId,
  onDone,
}: {
  taskId: string
  onDone?: (task: TaskSnapshot) => void
}) {
  const [task, setTask] = useState<TaskSnapshot | null>(null)
  const [resuming, setResuming] = useState(false)

  useEffect(() => {
    // typed topicSubscribe：task 是 session-scoped，listener (data: TaskSnapshot | null)。
    // tombstone null = retained delete → 跳过保留旧值（之后 onDone 还能看到末态）。
    const unsub = topicSubscribe('task', taskId, (data) => {
      if (data != null) {
        setTask(data)
        if (data.status === 'done' || data.status === 'failed') {
          onDone?.(data)
        }
      }
    })
    return () => unsub()
  }, [taskId, onDone])

  const onResume = useCallback(async () => {
    setResuming(true)
    try {
      // typed dispatcher：task.resume 是 global RPC，response { status: string }。
      await rpc('task.resume', { id: taskId })
      toast.success('正在恢复任务')
    } catch (e) {
      toast.error(`恢复失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setResuming(false)
    }
  }, [taskId])

  if (!task) {
    return (
      <div className="py-4 text-xs" style={{ color: 'var(--color-muted)' }}>
        正在连接任务 {taskId}…
      </div>
    )
  }

  const now = Date.now()
  const createdMs = new Date(task.created_at).getTime()
  const finishedMs = task.finished_at ? new Date(task.finished_at).getTime() : now
  const elapsed = ((finishedMs - createdMs) / 1000).toFixed(task.finished_at ? 1 : 0)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs mb-2">
        <span className="font-mono" style={{ color: 'var(--color-muted)' }}>
          {task.type}
        </span>
        {task.meta &&
          Object.entries(task.meta).map(([k, v]) => (
            <span key={k} className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {k}={v}
            </span>
          ))}
        <span className="ml-auto tabular-nums text-[10px]" style={{ color: 'var(--color-muted)' }}>
          {elapsed}s
        </span>
      </div>

      {task.steps.map((step, i) => (
        <div
          key={i}
          className="flex items-start gap-2 py-1 text-xs"
          style={{
            opacity: step.status === 'pending' || step.status === 'skipped' ? 0.5 : 1,
          }}
        >
          <span className="mt-0.5 shrink-0">{STATUS_ICON[step.status]}</span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-mono">{step.name}</span>
            {step.detail && (
              <span
                className="text-[11px] break-all"
                style={{
                  color: step.status === 'error' ? 'var(--color-error)' : 'var(--color-muted)',
                }}
              >
                {step.detail}
              </span>
            )}
          </div>
        </div>
      ))}

      {task.status === 'done' && (
        <div className="mt-2 text-xs font-mono" style={{ color: 'var(--color-success)' }}>
          已完成，用时 {elapsed}s
        </div>
      )}
      {task.status === 'failed' && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--color-error)' }}>
            失败：{task.error}
          </span>
          <Button size="sm" variant="outline" onClick={onResume} disabled={resuming}>
            <Play size={12} /> {resuming ? '恢复中…' : '重试'}
          </Button>
        </div>
      )}
      {task.status === 'interrupted' && (
        <div className="mt-2 flex items-center gap-2">
          <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
          <span className="text-xs" style={{ color: 'var(--color-warning)' }}>
            服务重启导致任务中断
          </span>
          <Button size="sm" variant="outline" onClick={onResume} disabled={resuming}>
            <Play size={12} /> {resuming ? '恢复中…' : '恢复'}
          </Button>
        </div>
      )}
    </div>
  )
}
