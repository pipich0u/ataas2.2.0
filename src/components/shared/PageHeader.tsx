// Top of every page: breadcrumbs + title + live connection indicator.
//
// Under the WebSocket bus model every visible number is push-updated, so
// there is no "refresh" concept to expose to the user. The only live-state
// affordance is a connection dot that turns red when the WS is down.

import { Link } from 'react-router'
import { useBusConnected } from '@/hooks/useBus'

export interface Crumb {
  label: string
  to?: string
}

export interface PageHeaderProps {
  crumbs: Crumb[]
  title: string
  subtitle?: string
  /** Optional right-hand slot for page-specific controls. */
  right?: React.ReactNode
}

export function PageHeader({ crumbs, title, subtitle, right }: PageHeaderProps) {
  const connected = useBusConnected()
  return (
    <div
      className="flex flex-col gap-2 px-6 py-4 border-b"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <nav className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {c.to ? (
              <Link to={c.to} className="hover:underline" style={{ color: 'var(--color-secondary)' }}>
                {c.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--color-text)' }}>{c.label}</span>
            )}
            {i < crumbs.length - 1 && <span>/</span>}
          </span>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1
            className="text-lg font-semibold leading-tight truncate"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <span className="text-xs truncate" style={{ color: 'var(--color-secondary)' }}>
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {right}
          <div
            className="flex items-center gap-1.5 text-[11px] tabular-nums"
            style={{ color: connected ? 'var(--color-success)' : 'var(--color-error)' }}
            title={connected ? '实时连接正常' : '实时连接断开'}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                backgroundColor: connected ? 'var(--color-success)' : 'var(--color-error)',
                boxShadow: connected ? '0 0 6px var(--color-success)' : undefined,
              }}
            />
            <span>{connected ? '在线' : '离线'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
