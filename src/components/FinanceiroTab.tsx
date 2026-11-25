import React, { useEffect, useRef } from 'react';
import {
  fetchFinanceiroFromCloud,
  saveFinanceiroToCloud,
  subscribeFinanceiroCloud,
} from '../services/firebase';
import type { AdminUser } from '../types';

interface FinanceiroTabProps {
  currentAdmin: AdminUser | null;
}

export const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ currentAdmin }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastCloudJsonRef = useRef<string>('');

  const userKey = currentAdmin ? currentAdmin.login.trim().toLowerCase() : '';
  const userName = currentAdmin ? currentAdmin.nome.trim() : '';
  const userVip = currentAdmin?.vip ? '1' : '0';

  useEffect(() => {
    if (!userKey) return;
    lastCloudJsonRef.current = '';

    const pushToIframe = (data: unknown) => {
      if (!data) return;
      const serialized = JSON.stringify(data);
      if (serialized === lastCloudJsonRef.current) return;
      lastCloudJsonRef.current = serialized;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'FLUXO_LOAD',
          userId: userKey,
          data,
        },
        window.location.origin
      );
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as
        | { type?: string; userId?: string; data?: unknown }
        | undefined;
      if (!payload || payload.userId !== userKey) return;

      if (payload.type === 'FLUXO_READY') {
        fetchFinanceiroFromCloud(userKey)
          .then((cloudState) => {
            if (cloudState) {
              pushToIframe(cloudState);
            }
          })
          .catch(() => {
            // Keep local per-user storage if cloud fetch fails
          });
      } else if (payload.type === 'FLUXO_SAVE' && payload.data) {
        lastCloudJsonRef.current = JSON.stringify(payload.data);
        saveFinanceiroToCloud(userKey, payload.data).catch((err) => {
          console.error('Erro ao sincronizar financeiro do utilizador:', err);
        });
      }
    };

    window.addEventListener('message', handleMessage);
    const unsubscribe = subscribeFinanceiroCloud(userKey, (cloudState) => {
      if (cloudState) {
        pushToIframe(cloudState);
      }
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      unsubscribe();
    };
  }, [userKey]);

  if (!currentAdmin) {
    return (
      <section
        id="tab-financeiro"
        className="h-screen w-full flex items-center justify-center bg-slate-950 p-6"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-sm">
          <p className="text-sm text-slate-300">
            Efetue login com o seu utilizador e senha para aceder ao seu painel financeiro.
          </p>
        </div>
      </section>
    );
  }

  const iframeSrc = `/assets/aistudio/ABRIR_DIRETO_34659a41.html?userId=${encodeURIComponent(
    userKey
  )}&userName=${encodeURIComponent(userName)}&userVip=${userVip}`;

  return (
    <section id="tab-financeiro" className="h-screen w-full flex flex-col bg-slate-950">
      <iframe
        key={userKey}
        ref={iframeRef}
        src={iframeSrc}
        title={`Financeiro — ${userName}`}
        className="w-full h-full flex-1 border-0 bg-slate-950"
        allow="clipboard-read; clipboard-write"
      />
    </section>
  );
};
