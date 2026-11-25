import React, { useState } from 'react';
import { Plus, Key, ExternalLink, Copy, Pencil, Trash2, X } from 'lucide-react';
import type { AdminUser, PersonalCredential } from '../types';

interface SenhasPessoaisTabProps {
  senhasPessoaisList: PersonalCredential[];
  currentAdmin: AdminUser | null;
  onSaveSenhasPessoais: (next: PersonalCredential[]) => void;
  onCopy: (text: string) => void;
  onRequestConfirm: (message: string, onConfirm: () => void) => void;
  onNotify: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

export const SenhasPessoaisTab: React.FC<SenhasPessoaisTabProps> = ({
  senhasPessoaisList,
  currentAdmin,
  onSaveSenhasPessoais,
  onCopy,
  onRequestConfirm,
  onNotify,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [servico, setServico] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');

  const minhasSenhas = currentAdmin
    ? senhasPessoaisList.filter((item) => item.userLogin === currentAdmin.login)
    : [];

  const openAdd = () => {
    if (!currentAdmin) {
      onNotify('Efetue login primeiro.', 'error');
      return;
    }
    setEditingId(null);
    setServico('');
    setUrl('');
    setLogin('');
    setSenha('');
    setModalOpen(true);
  };

  const openEdit = (item: PersonalCredential) => {
    setEditingId(item.id);
    setServico(item.servico);
    setUrl(item.url || '');
    setLogin(item.login);
    setSenha(item.senha);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    onRequestConfirm('Deseja realmente remover esta credencial?', () => {
      onSaveSenhasPessoais(senhasPessoaisList.filter((p) => p.id !== id));
      onNotify('Credencial removida.', 'info');
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    if (editingId !== null) {
      const updated = senhasPessoaisList.map((p) =>
        p.id === editingId && p.userLogin === currentAdmin.login
          ? {
              ...p,
              servico: servico.trim(),
              url: url.trim(),
              login: login.trim(),
              senha: senha.trim(),
            }
          : p
      );
      onSaveSenhasPessoais(updated);
      onNotify('Credencial atualizada com sucesso!', 'success');
    } else {
      const nova: PersonalCredential = {
        id: Date.now(),
        userLogin: currentAdmin.login,
        servico: servico.trim(),
        url: url.trim(),
        login: login.trim(),
        senha: senha.trim(),
      };
      onSaveSenhasPessoais([...senhasPessoaisList, nova]);
      onNotify('Credencial adicionada com sucesso!', 'success');
    }

    setModalOpen(false);
  };

  return (
    <section className="space-y-8">
      <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
            Cofre Pessoal
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Senhas e Contas Pessoais
          </h2>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center space-x-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Credencial</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!currentAdmin ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
            <p className="text-white">
              Faça login com a sua conta para ver as suas senhas pessoais.
            </p>
          </div>
        ) : minhasSenhas.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
            <p className="text-white">Nenhuma credencial pessoal encontrada.</p>
          </div>
        ) : (
          minhasSenhas.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-3 gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">{item.servico}</span>
                  </h3>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 mt-1 truncate max-w-full"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.url}</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="text-amber-400 hover:text-amber-300 p-2 text-xs cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-rose-400 hover:text-rose-300 p-2 text-xs cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg flex justify-between items-center gap-2 border border-slate-800">
                  <span className="text-slate-400 truncate">
                    Login: <strong className="text-white">{item.login}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(item.login)}
                    className="text-slate-400 hover:text-purple-400 shrink-0 cursor-pointer"
                    title="Copiar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg flex justify-between items-center gap-2 border border-slate-800">
                  <span className="text-slate-400 truncate">
                    Senha: <strong className="text-white">{item.senha}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(item.senha)}
                    className="text-slate-400 hover:text-purple-400 shrink-0 cursor-pointer"
                    title="Copiar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ADICIONAR / EDITAR SENHA PESSOAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {editingId !== null ? (
                  <>
                    <Pencil className="w-5 h-5 text-amber-400" />
                    <span>Editar Credencial Pessoal</span>
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5 text-purple-400" />
                    <span>Nova Credencial Pessoal</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Serviço / Site / App
                </label>
                <input
                  type="text"
                  required
                  value={servico}
                  onChange={(e) => setServico(e.target.value)}
                  placeholder="Ex: GitHub, Banco, E-mail..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  URL (Link Opcional)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Utilizador / Login / E-mail
                </label>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Ex: utilizador"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Senha
                </label>
                <input
                  type="text"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite ou gere a senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  Salvar Credencial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
