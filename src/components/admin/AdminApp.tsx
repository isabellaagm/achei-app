'use client';

import { useState } from 'react';
import { EventHero, PublicEvent } from '@/components/EventHero';
import { SetupForm } from './SetupForm';
import { LoginForm } from './LoginForm';
import { PhotosTab } from './PhotosTab';
import { GuestsTab } from './GuestsTab';
import { ShareTab } from './ShareTab';
import { ConfigTab } from './ConfigTab';

type Tab = 'fotos' | 'convidados' | 'compartilhar' | 'config';
const TABS: { key: Tab; label: string }[] = [
  { key: 'fotos', label: 'Fotos' },
  { key: 'convidados', label: 'Convidados' },
  { key: 'compartilhar', label: 'Compartilhar' },
  { key: 'config', label: 'Config' },
];

export function AdminApp({ event, isAdmin }: { event: PublicEvent | null; isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>('fotos');

  if (!event) return <SetupForm />;
  if (!isAdmin) return <LoginForm event={event} />;

  return (
    <div className="flex flex-1 flex-col">
      <EventHero event={event} compact />
      <div className="flex-1 px-5 pb-14 pt-4">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-2 font-mono text-xs uppercase tracking-wide transition ${
                tab === t.key
                  ? 'border-brass bg-brass font-semibold text-ink'
                  : 'border-white/15 text-white/60 hover:border-white/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'fotos' && <PhotosTab />}
        {tab === 'convidados' && <GuestsTab event={event} />}
        {tab === 'compartilhar' && <ShareTab event={event} />}
        {tab === 'config' && <ConfigTab event={event} />}
      </div>
    </div>
  );
}
