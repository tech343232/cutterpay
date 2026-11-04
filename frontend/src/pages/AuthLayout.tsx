import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { AuthShowcase } from '@/components/motion/AuthShowcase'

/** Formulario a la izquierda; a la derecha (o arriba en celular) la historia animada de CUTTERPAY. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Link to="/" className="w-fit">
          <Logo size={34} />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start gap-6 py-6 lg:justify-center lg:py-8">
          <div className="rounded-4xl border border-line bg-surface/70 p-5 lg:hidden">
            <AuthShowcase compact />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{title}</h1>
            <p className="mt-2 text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        <div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-aurora opacity-25 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[420px] w-[420px] rounded-full bg-primary opacity-15 blur-3xl" />
        <div className="relative flex h-full items-center justify-center p-12">
          <AuthShowcase />
        </div>
      </div>
    </div>
  )
}
