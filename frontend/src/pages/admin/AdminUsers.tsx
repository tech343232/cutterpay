import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { Card } from '@/components/ui/Card'
import { PageHeader, Select } from '@/components/ui/Misc'
import { Skeleton, ErrorState, EmptyState, Badge } from '@/components/ui/Feedback'
import { usd, date } from '@/lib/format'
import { StatusActions, StatusBadge } from './StatusActions'
import type { AdminUser } from '@/types'

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const qs = new URLSearchParams({ q, estado }).toString()
  const { data, error, loading, reload } = useApi<{ items: AdminUser[] }>(`/admin/usuarios?${qs}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Usuarios" subtitle="Busca, revisa y suspende o da de baja cuentas." />
      <Card>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <label htmlFor="u-search" className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Buscar</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="u-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o correo"
                className="h-10 w-full rounded-xl border border-line bg-bg/60 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </span>
          </label>
          <Select
            id="u-estado"
            label="Estado"
            value={estado}
            onChange={setEstado}
            options={[
              { value: '', label: 'Todos' },
              { value: 'activo', label: 'Activos' },
              { value: 'suspendido', label: 'Suspendidos' },
              { value: 'baja', label: 'De baja' },
            ]}
          />
        </div>

        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : loading || !data ? (
          <Skeleton className="h-80" />
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Users className="h-6 w-6" />} title="Nadie coincide con la búsqueda" text="Prueba con otro nombre o quita el filtro de estado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-3 pr-4 font-semibold">Usuario</th>
                  <th className="py-3 pr-4 font-semibold">Estado</th>
                  <th className="py-3 pr-4 text-right font-semibold">Saldo</th>
                  <th className="py-3 pr-4 text-right font-semibold">En cripto</th>
                  <th className="py-3 pr-4 text-right font-semibold">Operaciones</th>
                  <th className="py-3 pr-4 font-semibold">Registro</th>
                  <th className="py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link to={`/admin/usuarios/${u.id}`} className="group flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">{u.name[0]}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold group-hover:text-primary">{u.name}</span>
                          <span className="block truncate text-xs text-muted">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{u.role === 'admin' ? <Badge tone="primary">Admin</Badge> : <StatusBadge status={u.status} />}</td>
                    <td className="tabular py-3 pr-4 text-right">{usd(u.balance)}</td>
                    <td className="tabular py-3 pr-4 text-right">{usd(u.cryptoValue)}</td>
                    <td className="tabular py-3 pr-4 text-right font-semibold">{u.txCount}</td>
                    <td className="py-3 pr-4 text-muted">{date(u.createdAt)}</td>
                    <td className="py-3 text-right">
                      {u.role === 'admin' ? <span className="text-xs text-muted">—</span> : <StatusActions userId={u.id} name={u.name} status={u.status} onChanged={reload} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
