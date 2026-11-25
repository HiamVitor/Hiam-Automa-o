import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeTab } from './components/HomeTab';
import { AutomacaoTab } from './components/AutomacaoTab';
import { TvTab } from './components/TvTab';
import { ContasSenhasTab } from './components/ContasSenhasTab';
import { SenhasPessoaisTab } from './components/SenhasPessoaisTab';
import { FinanceiroTab } from './components/FinanceiroTab';
import { AdministradorTab } from './components/AdministradorTab';
import { AuthModal } from './components/AuthModal';
import { fetchFromCloudOnce, saveToCloud, subscribeToCloud } from './services/firebase';
import type {
  AccessAccount,
  AdminUser,
  MediaItem,
  PersonalCredential,
  SmartDevice,
  TabId,
  ToastMessage,
} from './types';

const DEFAULT_ACESSOS: AccessAccount[] = [
  {
    id: 1,
    nome: 'Casa Principal - 235',
    morada: 'Rua Dos Crisântemos - Morro Estevão',
    tipoConta: 'Energia / Luz',
    nomeSite: 'Portal Coopera',
    portal: 'https://portal.coopera.com.br/agenciavirtual3',
    login: 'utilizador@email.com',
    senha: 'Senha.235',
  },
  {
    id: 2,
    nome: 'Casa Principal - 235',
    morada: 'Rua Dos Crisântemos - Morro Estevão',
    tipoConta: 'Água / Saneamento',
    nomeSite: 'Casan',
    portal: 'https://e.casan.com.br/',
    cpf: '75442280968',
    matricula: '6706592',
    senha: 'Senha.235',
  },
];

const DEFAULT_ADMIN: AdminUser = {
  id: 1,
  nome: 'Administrador Principal',
  login: 'admin',
  senha: '123',
  vip: true,
};

const TEMPO_LIMITE_INATIVIDADE = 5 * 60 * 1000;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [menuMinimizado, setMenuMinimizado] = useState(false);

  const [mediaList, setMediaList] = useState<MediaItem[]>(() =>
    readStorage<MediaItem[]>('hiam_mediaList', [])
  );
  const [acessosList, setAcessosList] = useState<AccessAccount[]>(() =>
    readStorage<AccessAccount[]>('hiam_acessosList', DEFAULT_ACESSOS)
  );
  const [senhasPessoaisList, setSenhasPessoaisList] = useState<PersonalCredential[]>(() =>
    readStorage<PersonalCredential[]>('hiam_senhasPessoaisList', [])
  );
  const [adminsList, setAdminsList] = useState<AdminUser[]>(() => {
    const stored = readStorage<AdminUser[]>('hiam_adminsList', []);
    if (stored.length === 0) {
      const initial = [DEFAULT_ADMIN];
      localStorage.setItem('hiam_adminsList', JSON.stringify(initial));
      return initial;
    }
    return stored;
  });

  const [devices, setDevices] = useState<SmartDevice[]>([
    {
      id: 'luz-sala',
      nome: 'Luz da Sala',
      descricao: 'Lâmpada Inteligente RGB',
      ativo: true,
    },
  ]);

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const stored = readStorage<AdminUser[]>('hiam_adminsList', [DEFAULT_ADMIN]);
    return stored.find((a) => a.vip) || stored[0] || DEFAULT_ADMIN;
  });

  const [pendingProtectedTab, setPendingProtectedTab] = useState<TabId | null>(null);
  const [syncStatusLabel, setSyncStatusLabel] = useState('Web Sincronizada');
  const [lastSyncTime, setLastSyncTime] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const notify = useCallback(
    (text: string, variant: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, text, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const updateTimestamp = useCallback(() => {
    const agora = new Date();
    setLastSyncTime(
      agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, []);

  // Refs for latest state during cloud sync
  const stateRef = useRef({
    mediaList,
    acessosList,
    senhasPessoaisList,
    adminsList,
  });
  stateRef.current = { mediaList, acessosList, senhasPessoaisList, adminsList };

  const persistAll = useCallback(
    (next: {
      mediaList?: MediaItem[];
      acessosList?: AccessAccount[];
      senhasPessoaisList?: PersonalCredential[];
      adminsList?: AdminUser[];
    }) => {
      const merged = {
        mediaList: next.mediaList ?? stateRef.current.mediaList,
        acessosList: next.acessosList ?? stateRef.current.acessosList,
        senhasPessoaisList: next.senhasPessoaisList ?? stateRef.current.senhasPessoaisList,
        adminsList: next.adminsList ?? stateRef.current.adminsList,
      };

      localStorage.setItem('hiam_mediaList', JSON.stringify(merged.mediaList));
      localStorage.setItem('hiam_acessosList', JSON.stringify(merged.acessosList));
      localStorage.setItem(
        'hiam_senhasPessoaisList',
        JSON.stringify(merged.senhasPessoaisList)
      );
      localStorage.setItem('hiam_adminsList', JSON.stringify(merged.adminsList));
      updateTimestamp();

      saveToCloud(merged).catch((e) => {
        console.error('Erro ao sincronizar com o Firebase:', e);
      });
    },
    [updateTimestamp]
  );

  // Firebase Firestore Real-time Sync
  useEffect(() => {
    const unsubscribe = subscribeToCloud(
      (dados) => {
        if (dados) {
          if (dados.mediaList) {
            setMediaList(dados.mediaList);
            localStorage.setItem('hiam_mediaList', JSON.stringify(dados.mediaList));
          }
          if (dados.acessosList) {
            setAcessosList(dados.acessosList);
            localStorage.setItem('hiam_acessosList', JSON.stringify(dados.acessosList));
          }
          if (dados.senhasPessoaisList) {
            setSenhasPessoaisList(dados.senhasPessoaisList);
            localStorage.setItem(
              'hiam_senhasPessoaisList',
              JSON.stringify(dados.senhasPessoaisList)
            );
          }
          if (dados.adminsList && dados.adminsList.length > 0) {
            setAdminsList(dados.adminsList);
            localStorage.setItem('hiam_adminsList', JSON.stringify(dados.adminsList));
            setCurrentAdmin((prev) => {
              if (!prev) return dados.adminsList!.find((a) => a.vip) || dados.adminsList![0];
              return dados.adminsList!.find((a) => a.login === prev.login) || prev;
            });
          }
          updateTimestamp();
        } else {
          saveToCloud({
            mediaList: stateRef.current.mediaList,
            acessosList: stateRef.current.acessosList,
            senhasPessoaisList: stateRef.current.senhasPessoaisList,
            adminsList: stateRef.current.adminsList,
          }).catch((e) => console.error('Erro ao inicializar nuvem:', e));
        }
      },
      (err) => {
        console.error('Erro no listener onSnapshot do Firebase:', err);
      }
    );

    return () => unsubscribe();
  }, [updateTimestamp]);

  // 5-minute inactivity auto-lock
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setCurrentAdmin(
          stateRef.current.adminsList.find((a) => a.vip) ||
            stateRef.current.adminsList[0] ||
            null
        );
        setActiveTab('home');
      }, TEMPO_LIMITE_INATIVIDADE);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  const handleForceRefresh = async () => {
    setIsSyncing(true);
    setSyncStatusLabel('A atualizar...');
    try {
      const dados = await fetchFromCloudOnce();
      if (dados) {
        if (dados.mediaList) setMediaList(dados.mediaList);
        if (dados.acessosList) setAcessosList(dados.acessosList);
        if (dados.senhasPessoaisList) setSenhasPessoaisList(dados.senhasPessoaisList);
        if (dados.adminsList && dados.adminsList.length > 0) {
          setAdminsList(dados.adminsList);
        }
      }
      updateTimestamp();
      notify('Dispositivos atualizados com sucesso a partir da nuvem!', 'success');
    } catch {
      notify('Atualizado localmente.', 'info');
    } finally {
      setSyncStatusLabel('Web Sincronizada');
      setIsSyncing(false);
    }
  };

  const handleCopy = (texto: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(texto)
        .then(() => notify(`Copiado: ${texto}`, 'success'))
        .catch(() => notify('Não foi possível copiar.', 'error'));
    } else {
      notify(`Valor: ${texto}`, 'info');
    }
  };

  const handleAuthenticate = (login: string, senha: string): boolean => {
    const found = adminsList.find((adm) => adm.login === login && adm.senha === senha);
    if (!found) return false;
    setCurrentAdmin(found);
    if (pendingProtectedTab) {
      setActiveTab(pendingProtectedTab);
    }
    setPendingProtectedTab(null);
    return true;
  };

  const handleSaveMediaList = (nextList: MediaItem[]) => {
    setMediaList(nextList);
    persistAll({ mediaList: nextList });
  };

  const handleSaveAcessos = (nextAcessos: AccessAccount[]) => {
    setAcessosList(nextAcessos);
    persistAll({ acessosList: nextAcessos });
  };

  const handleSaveSenhasPessoais = (nextSenhas: PersonalCredential[]) => {
    setSenhasPessoaisList(nextSenhas);
    persistAll({ senhasPessoaisList: nextSenhas });
  };

  const handleSaveAdmins = (nextAdmins: AdminUser[], updatedCurrent?: AdminUser) => {
    setAdminsList(nextAdmins);
    if (updatedCurrent) setCurrentAdmin(updatedCurrent);
    persistAll({ adminsList: nextAdmins });
  };

  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ativo: !d.ativo } : d))
    );
  };

  const isVipLogado = Boolean(currentAdmin && currentAdmin.vip === true);

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen flex overflow-x-hidden">
      <Sidebar
        activeTab={activeTab}
        menuMinimizado={menuMinimizado}
        onToggleMinimizar={() => setMenuMinimizado((prev) => !prev)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onRequestProtectedTab={(tab) => setPendingProtectedTab(tab)}
        syncStatusLabel={syncStatusLabel}
        lastSyncTime={lastSyncTime}
        onForceRefresh={handleForceRefresh}
        isSyncing={isSyncing}
      />

      <main
        className={
          activeTab === 'financeiro'
            ? 'flex-1 p-0 overflow-hidden bg-slate-950 relative min-w-0 h-screen'
            : 'flex-1 p-6 lg:p-10 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative min-w-0'
        }
      >
        {activeTab === 'home' && (
          <HomeTab
            onSelectTab={(tab) => setActiveTab(tab)}
            onRequestProtectedTab={(tab) => setPendingProtectedTab(tab)}
          />
        )}

        {activeTab === 'automacao' && (
          <AutomacaoTab devices={devices} onToggleDevice={handleToggleDevice} />
        )}

        {activeTab === 'tv' && (
          <TvTab
            mediaList={mediaList}
            onSaveMediaList={handleSaveMediaList}
            onNotify={notify}
          />
        )}

        {activeTab === 'contas' && (
          <ContasSenhasTab
            mode="contas"
            acessosList={acessosList}
            isVip={isVipLogado}
            onSaveAcessos={handleSaveAcessos}
            onCopy={handleCopy}
            onRequestConfirm={(message, onConfirm) =>
              setConfirmState({ message, onConfirm })
            }
            onNotify={notify}
          />
        )}

        {activeTab === 'senhas' && (
          <ContasSenhasTab
            mode="senhas"
            acessosList={acessosList}
            isVip={isVipLogado}
            onSaveAcessos={handleSaveAcessos}
            onCopy={handleCopy}
            onRequestConfirm={(message, onConfirm) =>
              setConfirmState({ message, onConfirm })
            }
            onNotify={notify}
          />
        )}

        {activeTab === 'senhas-pessoais' && (
          <SenhasPessoaisTab
            senhasPessoaisList={senhasPessoaisList}
            currentAdmin={currentAdmin}
            onSaveSenhasPessoais={handleSaveSenhasPessoais}
            onCopy={handleCopy}
            onRequestConfirm={(message, onConfirm) =>
              setConfirmState({ message, onConfirm })
            }
            onNotify={notify}
          />
        )}

        {activeTab === 'financeiro' && <FinanceiroTab currentAdmin={currentAdmin} />}

        {activeTab === 'administrador' && (
          <AdministradorTab
            adminsList={adminsList}
            currentAdmin={currentAdmin}
            onSaveAdmins={handleSaveAdmins}
            onRequestConfirm={(message, onConfirm) =>
              setConfirmState({ message, onConfirm })
            }
            onNotify={notify}
          />
        )}
      </main>

      <AuthModal
        isOpen={pendingProtectedTab !== null}
        pendingTab={pendingProtectedTab}
        onClose={() => {
          setPendingProtectedTab(null);
          setActiveTab('home');
        }}
        onAuthenticate={handleAuthenticate}
      />

      {/* MODAL DE CONFIRMAÇÃO */}
      {confirmState && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">Confirmar Ação</h3>
            <p className="text-sm text-slate-300">{confirmState.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = confirmState.onConfirm;
                  setConfirmState(null);
                  fn();
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-xs">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur-md ${
                t.variant === 'error'
                  ? 'bg-rose-950/90 border-rose-700 text-rose-200'
                  : t.variant === 'success'
                    ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
                    : 'bg-slate-900/95 border-slate-700 text-slate-200'
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
