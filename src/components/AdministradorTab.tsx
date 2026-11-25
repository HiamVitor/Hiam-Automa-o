import React, { useState } from 'react';
import { UserPlus, Users, Shield, Pencil, Trash2, X } from 'lucide-react';
import type { AdminUser } from '../types';

interface AdministradorTabProps {
  adminsList: AdminUser[];
  currentAdmin: AdminUser | null;
  onSaveAdmins: (nextAdmins: AdminUser[], updatedCurrent?: AdminUser) => void;
  onRequestConfirm: (message: string, onConfirm: () => void) => void;
  onNotify: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

export const AdministradorTab: React.FC<AdministradorTabProps> = ({
  adminsList,
  currentAdmin,
  onSaveAdmins,
  onRequestConfirm,
  onNotify,
}) => {
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [vip, setVip] = useState(false);

  const isVip = Boolean(currentAdmin && currentAdmin.vip === true);

  const openAdd = () => {
    if (!isVip) {
      onNotify('Acesso negado! Apenas administradores VIP.', 'error');
      return;
    }
    setEditingId(null);
    setNome('');
    setLogin('');
    setSenha('');
    setVip(false);
    setModalMode('add');
  };

  const openEdit = (adm: AdminUser) => {
    if (!isVip) {
      onNotify('Acesso negado! Apenas administradores VIP.', 'error');
      return;
    }
    setEditingId(adm.id);
    setNome(adm.nome);
    setLogin(adm.login);
    setSenha(adm.senha);
    setVip(adm.vip);
    setModalMode('edit');
  };

  const handleDelete = (id: number) => {
    if (!isVip) return;
    onRequestConfirm('Deseja realmente remover este administrador?', () => {
      onSaveAdmins(adminsList.filter((a) => a.id !== id));
      onNotify('Administrador removido.', 'info');
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVip) return;

    if (modalMode === 'add') {
      const novo: AdminUser = {
        id: Date.now(),
        nome: nome.trim(),
        login: login.trim(),
        senha: senha.trim(),
        vip,
      };
      onSaveAdmins([...adminsList, novo]);
      onNotify('Administrador cadastrado com sucesso!', 'success');
    } else if (modalMode === 'edit' && editingId !== null) {
      let updatedSelf: AdminUser | undefined;
      const updated = adminsList.map((a) => {
        if (a.id !== editingId) return a;
        const edited: AdminUser = {
          ...a,
          nome: nome.trim(),
          login: login.trim(),
          senha: senha.trim(),
          vip,
        };
        if (currentAdmin && currentAdmin.id === a.id) {
          updatedSelf = edited;
        }
        return edited;
      });
      onSaveAdmins(updated, updatedSelf);
      onNotify('Administrador atualizado com sucesso!', 'success');
    }

    setModalMode(null);
  };

  return (
    <section className="space-y-8">
      <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
            Painel de Controlo
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Administração do Sistema
          </h2>
        </div>

        {isVip && (
          <button
            type="button"
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center space-x-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Administrador</span>
          </button>
        )}
      </header>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span>Administradores Registados</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminsList.map((adm) => (
            <div
              key={adm.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center gap-3"
            >
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{adm.nome}</span>
                  <span
                    className={`text-[11px] font-semibold uppercase ${
                      adm.vip ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    · {adm.vip ? 'VIP' : 'Normal'}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Login: <span className="text-slate-200">{adm.login}</span>
                </p>
              </div>

              {isVip && (
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(adm)}
                    className="text-amber-400 hover:text-amber-300 p-2 text-xs cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(adm.id)}
                    className="text-rose-400 hover:text-rose-300 p-2 text-xs cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CADASTRO / EDIÇÃO DE ADMIN */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {modalMode === 'add' ? (
                  <>
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span>Novo Administrador</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-5 h-5 text-amber-400" />
                    <span>Editar Administrador</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nome / Identificação
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Administrador"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Login / Utilizador
                </label>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Ex: admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {modalMode === 'add' ? 'Senha de Acesso' : 'Nova Senha (ou manter atual)'}
                </label>
                <input
                  type={modalMode === 'add' ? 'password' : 'text'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl cursor-pointer select-none hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={vip}
                  onChange={(e) => setVip(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Definir como Administrador VIP
                  </span>
                  <span className="text-slate-400">
                    Atribui privilégios e distintivo VIP à conta.
                  </span>
                </div>
              </label>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`${
                    modalMode === 'add'
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  } text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer`}
                >
                  {modalMode === 'add' ? 'Cadastrar Admin' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
