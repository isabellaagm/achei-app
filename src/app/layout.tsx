import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { getTheEvent } from '@/lib/event';

// A cor de destaque e o CSS customizado do evento podem mudar a qualquer momento no painel
// do organizador, então nunca cacheia esta busca.
export const dynamic = 'force-dynamic';

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const plexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'achei — encontre suas fotos do evento',
  description: 'Galeria de fotos com reconhecimento facial para convidados do evento.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const event = await getTheEvent().catch(() => null);
  const accentColor =
    event?.accent_color && /^#[0-9a-fA-F]{3,8}$/.test(event.accent_color) ? event.accent_color : null;
  // "</style" no meio do CSS quebraria a tag mais cedo — escapa só isso, o resto é CSS puro (não roda script).
  const customCss = event?.custom_css ? event.custom_css.replace(/<\/style/gi, '<\\/style') : '';

  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full bg-ink text-flash antialiased">
        {accentColor && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{--color-brass:${accentColor};--color-brass-soft:color-mix(in srgb, ${accentColor} 65%, white);}`,
            }}
          />
        )}
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <ToastProvider>
          <div className="mx-auto flex min-h-screen max-w-xl flex-col">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
