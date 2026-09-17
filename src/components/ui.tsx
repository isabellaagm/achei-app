'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const base =
    'w-full flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold text-[15px] font-body transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-azul text-surface-raised hover:opacity-90',
    ghost: 'bg-transparent text-ink border border-border hover:border-azul hover:text-azul',
    danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/5',
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-border bg-surface-raised p-5 ${className}`}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-[0.15em] text-azul">
      <span className="inline-block h-px w-3.5 bg-dourado" />
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wide text-ink/55">
      {children}
    </label>
  );
}

export function FieldNote({ children }: { children: ReactNode }) {
  return <p className="-mt-2 mb-3.5 font-body text-xs text-ink/50">{children}</p>;
}

export function StepRail({ step, of = 3 }: { step: number; of?: number }) {
  return (
    <div className="mb-5 flex items-center gap-1.5 px-0.5">
      {Array.from({ length: of }).map((_, i) => {
        const n = i + 1;
        const cls = n < step ? 'bg-dourado' : n === step ? 'bg-azul' : 'bg-border';
        return <div key={n} className={`h-[3px] flex-1 rounded ${cls}`} />;
      })}
    </div>
  );
}

export function Spinner() {
  return <div className="spinner" />;
}

export function StatusLine({ children }: { children: ReactNode }) {
  return (
    <div className="my-2.5 flex items-center gap-2 font-body text-xs text-ink/55">
      <Spinner />
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="mt-2.5 font-body text-sm text-danger">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-dashed border-border px-4 py-10 text-center font-body text-sm text-ink/50">
      {children}
    </div>
  );
}
