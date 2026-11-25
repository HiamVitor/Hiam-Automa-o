import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import type { TabId } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  pendingTab: TabId | null;
  onClose: () => void;
  onAuthenticate: (login: string, senha: string) => boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  pendingTab,
  onClose,
  onAuthenticate,
}) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !pendingTab) return null;

  const nomeAbaFormatado =
    pendingTab === 'contas'
      ? 'Contas da Casa'
      : pendingTab === 'senhas'
        ? 'Senhas da Casa'
        : pendingTab === 'senhas-pessoais'
          ? 'Senhas Pessoais'
          : pendingTab === 'financeiro'
            ? 'Financeiro'
            : 'Administrador';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onAuthenticate(login.trim(), senha.trim());
    if (ok) {
      setLogin('');
      setSenha('');
      setErrorMsg('');
    } else {
      setErrorMsg('Login ou Senha incorretos! Tente novamente.');
      setSenha('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Acesso Restrito</h3>
          <p className="text-xs text-slate-400 mt-1">
            Insira o login e senha de Administrador para aceder a &quot;{nomeAbaFormatado}&quot;.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Login / Utilizador
            </label>
            <input
              type="text"
              required
              autoFocus
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Digite o seu login"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              Desbloquear
            </button>
            <button
              type="button"
              onClick={() => {
                setLogin('');
                setSenha('');
                setErrorMsg('');
                onClose();
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-3 rounded-xl transition cursor-pointer"
            >
              Voltar para Início
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
