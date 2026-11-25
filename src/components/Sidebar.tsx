import React from 'react';
import {
  Home,
  Sliders,
  Tv,
  Wallet,
  ShieldCheck,
  Key,
  CircleDollarSign,
  UserCog,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  House,
} from 'lucide-react';
import type { TabId } from '../types';

interface SidebarProps {
  activeTab: TabId;
  menuMinimizado: boolean;
  onToggleMinimizar: () => void;
  onSelectTab: (tab: TabId) => void;
  onRequestProtectedTab: (tab: TabId) => void;
  syncStatusLabel: string;
  lastSyncTime: string;
  onForceRefresh: () => void;
  isSyncing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  menuMinimizado,
  onToggleMinimizar,
  onSelectTab,
  onRequestProtectedTab,
  syncStatusLabel,
  lastSyncTime,
  onForceRefresh,
  isSyncing,
}) => {
  const navItems: {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    protected?: boolean;
  }[] = [
    {
      id: 'home',
      label: 'Tela Inicial',
      icon: <Home className="w-5 h-5 shrink-0 text-blue-400" />,
    },
    {
      id: 'automacao',
      label: 'Automação',
      icon: <Sliders className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'tv',
      label: 'TV / Séries',
      icon: <Tv className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'contas',
      label: 'Contas da Casa',
      icon: <Wallet className="w-5 h-5 shrink-0" />,
      protected: true,
    },
    {
      id: 'senhas',
      label: 'Senhas da Casa',
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
      protected: true,
    },
    {
      id: 'senhas-pessoais',
      label: 'Senhas Pessoais',
      icon: <Key className="w-5 h-5 shrink-0 text-purple-400" />,
      protected: true,
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: <CircleDollarSign className="w-5 h-5 shrink-0 text-emerald-400" />,
      protected: true,
    },
    {
      id: 'administrador',
      label: 'Administrador',
      icon: <UserCog className="w-5 h-5 shrink-0" />,
      protected: true,
    },
  ];

  return (
    <aside
      className={`${
        menuMinimizado ? 'w-24' : 'w-72 lg:w-80'
      } shrink-0 bg-slate-900/90 border-r border-slate-800/80 p-5 flex flex-col justify-between select-none shadow-2xl z-20 transition-all duration-300`}
    >
      <div>
        <div className="mb-8 text-center relative">
          <button
            type="button"
            onClick={onToggleMinimizar}
            className="absolute -right-2 top-0 bg-slate-800 hover:bg-slate-700 text-cyan-400 p-2 rounded-full border border-slate-700 shadow-md transition cursor-pointer"
            title="Minimizar / Aumentar Menu"
            aria-label="Minimizar ou aumentar menu"
          >
            {menuMinimizado ? (
              <ChevronsRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronsLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {!menuMinimizado && (
            <div className="pt-1">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-3">
                <House className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-wider text-white">AUTOMAÇÃO CASA</h1>
              <p className="text-xs text-blue-400 font-medium tracking-widest mt-1">
                SISTEMA INTELIGENTE
              </p>
            </div>
          )}
          {menuMinimizado && <div className="h-8" />}
        </div>

        <nav className="space-y-3" aria-label="Menu de Navegação">
          {!menuMinimizado && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
              Menu de Navegação
            </p>
          )}
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.protected ? onRequestProtectedTab(item.id) : onSelectTab(item.id)
                }
                title={menuMinimizado ? item.label : undefined}
                className={`sidebar-tab w-full text-left py-3.5 ${
                  menuMinimizado ? 'px-0 justify-center' : 'px-5'
                } rounded-xl border flex items-center gap-3.5 font-semibold cursor-pointer ${
                  isActive
                    ? 'active border-slate-700/50 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                {!menuMinimizado && (
                  <span className="tracking-wide whitespace-nowrap shrink-0 text-sm">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-800/80 space-y-3">
        {!menuMinimizado && (
          <>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 truncate">Residência Principal</span>
              <span className="text-emerald-400 font-medium whitespace-nowrap shrink-0">
                {syncStatusLabel}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
              Última sync: {lastSyncTime}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onForceRefresh}
          title="Atualizar Todos Dispositivos"
          className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700/60 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
          {!menuMinimizado && (
            <span className="whitespace-nowrap shrink-0">Atualizar Todos Dispositivos</span>
          )}
        </button>
      </div>
    </aside>
  );
};
