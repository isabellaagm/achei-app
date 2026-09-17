'use client';

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div
        className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-azul px-5 py-2.5 font-body text-sm font-semibold text-surface-raised shadow-lg transition-opacity duration-200 ${
          msg ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}
