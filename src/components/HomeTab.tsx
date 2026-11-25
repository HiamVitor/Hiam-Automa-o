import React from 'react';
import {
  Sliders,
  Tv,
  Wallet,
  ShieldCheck,
  Key,
  CircleDollarSign,
  UserCog,
  CheckCircle2,
} from 'lucide-react';
import type { TabId } from '../types';

interface HomeTabProps {
  onSelectTab: (tab: TabId) => void;
  onRequestProtectedTab: (tab: TabId) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectTab,
  onRequestProtectedTab,
}) => {
  const cards: {
    id: TabId;
    title: string;
    description: string;
    icon: React.ReactNode;
    accentBox: string;
    hoverBorder: string;
    protected?: boolean;
  }[] = [
    {
      id: 'automacao',
      title: 'Automação',
      description: 'Controlo de luzes, tomadas, ar condicionado e portão.',
      icon: <Sliders className="w-6 h-6" />,
      accentBox: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      hoverBorder: 'hover:border-blue-500/50',
    },
    {
      id: 'tv',
      title: 'TV / Séries',
      description: 'Gerencie streamings, lista de filmes e episódios favoritos.',
      icon: <Tv className="w-6 h-6" />,
      accentBox: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      hoverBorder: 'hover:border-indigo-500/50',
    },
    {
      id: 'contas',
      title: 'Contas da Casa',
      description: 'Acompanhe vencimentos de água, luz, internet e rendas.',
      icon: <Wallet className="w-6 h-6" />,
      accentBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50',
      protected: true,
    },
    {
      id: 'senhas',
      title: 'Senhas da Casa',
      description: 'Gerencie chaves Wi-Fi, fechaduras e acessos de streaming.',
      icon: <ShieldCheck className="w-6 h-6" />,
      accentBox: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      hoverBorder: 'hover:border-amber-500/50',
      protected: true,
    },
    {
      id: 'senhas-pessoais',
      title: 'Senhas Pessoais',
      description: 'Consulte e gerencie as suas credenciais e cofres pessoais.',
      icon: <Key className="w-6 h-6" />,
      accentBox: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      hoverBorder: 'hover:border-purple-500/50',
      protected: true,
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      description: 'Controle financeiro completo de contas, cartões, empréstimos e fluxo mensal.',
      icon: <CircleDollarSign className="w-6 h-6" />,
      accentBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50',
      protected: true,
    },
    {
      id: 'administrador',
      title: 'Administrador',
      description: 'Gestão de utilizadores, administradores e definições do sistema.',
      icon: <UserCog className="w-6 h-6" />,
      accentBox: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      hoverBorder: 'hover:border-blue-400/50',
      protected: true,
    },
  ];

  return (
    <section className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
            Painel Geral
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Bem-vindo ao Sistema</h2>
        </div>
        <div className="flex items-center space-x-3 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
            Residência Principal Configurada
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() =>
              card.protected ? onRequestProtectedTab(card.id) : onSelectTab(card.id)
            }
            className={`group text-left cursor-pointer bg-slate-900/80 border border-slate-800 ${card.hoverBorder} p-6 rounded-2xl transition-all duration-200 hover:shadow-xl hover:-translate-y-1`}
          >
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${card.accentBox}`}
            >
              {card.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
};
