import React, { useState } from 'react';
import {
  Plus,
  Home,
  MapPin,
  FileText,
  ShieldCheck,
  ExternalLink,
  Copy,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import type { AccessAccount } from '../types';

interface ContasSenhasTabProps {
  mode: 'contas' | 'senhas';
  acessosList: AccessAccount[];
  isVip: boolean;
  onSaveAcessos: (next: AccessAccount[]) => void;
  onCopy: (text: string) => void;
  onRequestConfirm: (message: string, onConfirm: () => void) => void;
  onNotify: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_TYPES = ['Energia / Luz', 'Água / Saneamento', 'Internet / Outros'];

export const ContasSenhasTab: React.FC<ContasSenhasTabProps> = ({
  mode,
  acessosList,
  isVip,
  onSaveAcessos,
  onCopy,
  onRequestConfirm,
  onNotify,
}) => {
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [tipoConta, setTipoConta] = useState('Energia / Luz');
  const [novoTipoInput, setNovoTipoInput] = useState('');
  const [nomeSite, setNomeSite] = useState('');
  const [portal, setPortal] = useState('');
  const [login, setLogin] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');

  const openAddModal = () => {
    if (!isVip) {
      onNotify('Acesso negado! Apenas administradores VIP.', 'error');
      return;
    }
    setEditingId(null);
    setNome('');
    setMorada('');
    setTipoConta('Energia / Luz');
    setNovoTipoInput('');
    setNomeSite('');
    setPortal('');
    setLogin('');
    setCpf('');
    setMatricula('');
    setSenha('');
    setModalMode('add');
  };

  const openEditModal = (acc: AccessAccount) => {
    if (!isVip) {
      onNotify('Acesso negado! Apenas administradores VIP.', 'error');
      return;
    }
    setEditingId(acc.id);
    setNome(acc.nome);
    setMorada(acc.morada || '');

    if (DEFAULT_TYPES.includes(acc.tipoConta)) {
      setTipoConta(acc.tipoConta);
      setNovoTipoInput('');
    } else if (acc.tipoConta) {
      setTipoConta('novo');
      setNovoTipoInput(acc.tipoConta);
    } else {
      setTipoConta('Energia / Luz');
      setNovoTipoInput('');
    }

    setNomeSite(acc.nomeSite || '');
    setPortal(acc.portal || '');
    setLogin(acc.login || '');
    setCpf(acc.cpf || '');
    setMatricula(acc.matricula || '');
    setSenha(acc.senha || '');
    setModalMode('edit');
  };

  const handleDelete = (id: number) => {
    if (!isVip) {
      onNotify('Acesso negado! Apenas administradores VIP.', 'error');
      return;
    }
    onRequestConfirm('Deseja realmente excluir este registo?', () => {
      onSaveAcessos(acessosList.filter((a) => a.id !== id));
      onNotify('Registo excluído com sucesso.', 'info');
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVip) return;

    const finalTipo =
      tipoConta === 'novo' ? novoTipoInput.trim() || 'Outros' : tipoConta;

    if (modalMode === 'add') {
      const novo: AccessAccount = {
        id: Date.now(),
        nome: nome.trim(),
        morada: morada.trim(),
        tipoConta: finalTipo,
        nomeSite: nomeSite.trim(),
        portal: portal.trim(),
        login: login.trim(),
        cpf: cpf.trim(),
        matricula: matricula.trim(),
        senha: senha.trim(),
      };
      onSaveAcessos([...acessosList, novo]);
      onNotify('Acesso adicionado com sucesso!', 'success');
    } else if (modalMode === 'edit' && editingId !== null) {
      const updated = acessosList.map((a) =>
        a.id === editingId
          ? {
              ...a,
              nome: nome.trim(),
              morada: morada.trim(),
              tipoConta: finalTipo,
              nomeSite: nomeSite.trim(),
              portal: portal.trim(),
              login: login.trim(),
              cpf: cpf.trim(),
              matricula: matricula.trim(),
              senha: senha.trim(),
            }
          : a
      );
      onSaveAcessos(updated);
      onNotify('Alterações salvas com sucesso!', 'success');
    }

    setModalMode(null);
  };

  // Agrupar por casa
  const gruposPorCasa: Record<string, { morada: string; contas: AccessAccount[] }> = {};
  for (const acc of acessosList) {
    const nomeCasa = acc.nome || 'Outra Propriedade';
    if (!gruposPorCasa[nomeCasa]) {
      gruposPorCasa[nomeCasa] = { morada: acc.morada || '', contas: [] };
    }
    if (acc.morada && !gruposPorCasa[nomeCasa].morada) {
      gruposPorCasa[nomeCasa].morada = acc.morada;
    }
    gruposPorCasa[nomeCasa].contas.push(acc);
  }

  const formatNomeSite = (acc: AccessAccount) => {
    if (acc.portal) {
      if (acc.portal.includes('cooperalianca')) return 'Portal Cooperaliança';
      if (acc.portal.includes('coopera')) return 'Portal Coopera';
      if (acc.portal.includes('casan')) return 'Casan';
      if (acc.portal.includes('samaerincao')) return 'Samae Rincão';
    }
    return acc.nomeSite || 'Portal Oficial';
  };

  const isContas = mode === 'contas';

  return (
    <section className="space-y-8">
      <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex justify-between items-center gap-4">
        <div>
          <span
            className={`text-xs uppercase tracking-widest font-bold ${
              isContas ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isContas ? 'Gestão Financeira' : 'Segurança & Portais'}
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            {isContas ? 'Contas da Casa' : 'Senhas e Acessos das Casas'}
          </h2>
        </div>

        {isVip && (
          <button
            type="button"
            onClick={openAddModal}
            className={`${
              isContas
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
            } text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-2 cursor-pointer whitespace-nowrap shrink-0`}
          >
            <Plus className="w-4 h-4" />
            <span>{isContas ? 'Adicionar Conta' : 'Adicionar Acesso'}</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(gruposPorCasa).map(([nomeCasa, grupo]) => (
          <div
            key={nomeCasa}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isContas ? (
                  <Home className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span>{nomeCasa}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Morada / Localização:{' '}
                  <span className="text-slate-200">{grupo.morada || 'Não informada'}</span>
                </span>
              </p>
            </div>

            <div className="space-y-4">
              {grupo.contas.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isContas ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isContas ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>
                        TIPO DE CONTA: {acc.tipoConta || (isContas ? 'ENERGIA / LUZ' : 'SENHA')}
                      </span>
                    </span>
                    {isVip && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(acc)}
                          className="text-amber-400 hover:text-amber-300 p-2 text-xs cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(acc.id)}
                          className="text-rose-400 hover:text-rose-300 p-2 text-xs cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {acc.portal && (
                      <div className="col-span-full mb-1">
                        <a
                          href={acc.portal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>
                            {acc.tipoConta || 'Serviço'} - {formatNomeSite(acc)}
                          </span>
                        </a>
                      </div>
                    )}

                    {acc.login && (
                      <div className="bg-slate-900 p-2.5 rounded-lg flex justify-between items-center gap-2 border border-slate-800">
                        <span className="text-slate-400 truncate">
                          Login / UC / Email: <strong className="text-white">{acc.login}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopy(acc.login!)}
                          className="text-slate-400 hover:text-amber-400 shrink-0 cursor-pointer"
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {acc.cpf && (
                      <div className="bg-slate-900 p-2.5 rounded-lg flex justify-between items-center gap-2 border border-slate-800">
                        <span className="text-slate-400 truncate">
                          CPF:{' '}
                          <strong className="text-white font-mono tabular-nums">{acc.cpf}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopy(acc.cpf!)}
                          className="text-slate-400 hover:text-cyan-400 shrink-0 cursor-pointer"
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {acc.matricula && (
                      <div className="bg-slate-900 p-2.5 rounded-lg flex justify-between items-center gap-2 border border-slate-800">
                        <span className="text-slate-400 truncate">
                          Matrícula:{' '}
                          <strong className="text-white font-mono tabular-nums">
                            {acc.matricula}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopy(acc.matricula!)}
                          className="text-slate-400 hover:text-cyan-400 shrink-0 cursor-pointer"
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {acc.senha && (
                      <div className="bg-slate-900 p-2.5 rounded-lg flex justify-between items-center gap-2 border border-slate-800">
                        <span className="text-slate-400 truncate">
                          Senha: <strong className="text-white">{acc.senha}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopy(acc.senha!)}
                          className="text-slate-400 hover:text-amber-400 shrink-0 cursor-pointer"
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ADICIONAR / EDITAR ACESSO */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {modalMode === 'add' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span>Adicionar Novo Acesso</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-5 h-5 text-amber-400" />
                    <span>Editar Acesso / Conta</span>
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

            <form
              onSubmit={handleSubmit}
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nome da Propriedade / Casa
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Casa Principal - 235"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Morada / Localização
                </label>
                <input
                  type="text"
                  value={morada}
                  onChange={(e) => setMorada(e.target.value)}
                  placeholder="Ex: Rua Dos Crisântemos - Morro Estevão"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Tipo de Conta
                </label>
                <select
                  value={tipoConta}
                  onChange={(e) => setTipoConta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Energia / Luz">Energia / Luz</option>
                  <option value="Água / Saneamento">Água / Saneamento</option>
                  <option value="Internet / Outros">Internet / Outros</option>
                  <option value="novo">+ Novo Tipo</option>
                </select>
              </div>

              {tipoConta === 'novo' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Nome do Novo Tipo de Conta
                  </label>
                  <input
                    type="text"
                    value={novoTipoInput}
                    onChange={(e) => setNovoTipoInput(e.target.value)}
                    placeholder="Ex: Gás, IPTU, Condomínio..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nome Para Aparecer em Vez De Link
                </label>
                <input
                  type="text"
                  value={nomeSite}
                  onChange={(e) => setNomeSite(e.target.value)}
                  placeholder="Ex: Portal Coopera, Casan..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Site (Link do Portal URL)
                </label>
                <input
                  type="text"
                  value={portal}
                  onChange={(e) => setPortal(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Login / UC / Email
                  </label>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Ex: utilizador"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Nº da Matrícula"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Senha
                  </label>
                  <input
                    type="text"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

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
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  {modalMode === 'add' ? 'Salvar Acesso' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
