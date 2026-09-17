import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { getTheEvent } from '@/lib/event';

export const metadata: Metadata = {
  title: 'Bell & Gui — encontre suas fotos do casamento',
  description: 'Galeria de fotos com reconhecimento facial para os convidados de Bell & Gui.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Paleta oficial "Bell & Gui" (tokens.json) — usada quando o evento ainda
// não existe, ou como base antes de qualquer ajuste feito no painel.
const DEFAULTS = {
  colorBg: '#f5f2ec',
  colorSurface: '#fffdf9',
  colorText: '#050d73',
  colorAccent: '#344b9b',
  colorAccentSoft: '#7185b2',
  colorOrnamental: '#c99a5b',
  colorBorder: '#dfe2ee',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const event = await getTheEvent().catch(() => null);

  const themeStyle = {
    '--color-surface': event?.color_bg || DEFAULTS.colorBg,
    '--color-surface-raised': event?.color_surface || DEFAULTS.colorSurface,
    '--color-ink': event?.color_text || DEFAULTS.colorText,
    '--color-azul': event?.accent_color || DEFAULTS.colorAccent,
    '--color-azul-claro': event?.color_accent_soft || DEFAULTS.colorAccentSoft,
    '--color-dourado': event?.color_ornamental || DEFAULTS.colorOrnamental,
    '--color-border': event?.color_border || DEFAULTS.colorBorder,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full antialiased">
        <div style={themeStyle} className="min-h-screen bg-surface text-ink">
          <ToastProvider>
            <div className="mx-auto flex min-h-screen max-w-xl flex-col">{children}</div>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
