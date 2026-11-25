import React, { useState } from 'react';
import {
  Film,
  Tv,
  Video,
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  Pencil,
  X,
  Star,
  FileSpreadsheet,
} from 'lucide-react';
import type { Episode, MediaCategory, MediaItem, MediaType, TvSubPage } from '../types';
import {
  buscarAnimeAniList,
  fetchMediaMetadata,
  normalizarTemporadasSequenciais,
  traduzirParaPortugues,
} from '../services/mediaApi';

interface TvTabProps {
  mediaList: MediaItem[];
  onSaveMediaList: (nextList: MediaItem[]) => void;
  onNotify: (msg: string, variant?: 'success' | 'error' | 'info') => void;
}

const PosterImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  tipo: MediaType;
}> = ({ src, alt, className = '', tipo }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    const Icon = tipo === 'Filme' ? Film : tipo === 'Série' ? Tv : Video;
    return (
      <div
        className={`w-full h-full min-h-[240px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <Icon className="w-10 h-10 text-slate-500 mb-2" />
        <span className="text-xs font-medium text-slate-400 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

export const TvTab: React.FC<TvTabProps> = ({ mediaList, onSaveMediaList, onNotify }) => {
  const [subPage, setSubPage] = useState<TvSubPage>('main');
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('filmes');
  const [searchTerm, setSearchTerm] = useState('');
  const [openItemId, setOpenItemId] = useState<number | null>(null);
  const [selectedTemp, setSelectedTemp] = useState<string>('1');
  const [selectedRating, setSelectedRating] = useState<number>(5);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<MediaType>('Filme');
  const [isAdding, setIsAdding] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState('A consultar catálogo e a traduzir...');

  // Reload info state
  const [isReloading, setIsReloading] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editTipo, setEditTipo] = useState<MediaType>('Filme');
  const [editGenero, setEditGenero] = useState('');
  const [editLancamento, setEditLancamento] = useState('');
  const [editTermino, setEditTermino] = useState('');
  const [editTemporadas, setEditTemporadas] = useState(1);
  const [editPoster, setEditPoster] = useState('');
  const [bulkTextarea, setBulkTextarea] = useState('');
  const [tempEdicaoMap, setTempEdicaoMap] = useState<Record<string, Episode[]>>({});

  const openCategory = (cat: MediaCategory) => {
    setSearchTerm('');
    setActiveCategory(cat);
    setSubPage(cat);
  };

  const openAddModal = (defaultType: MediaType) => {
    setNewName('');
    setNewType(defaultType);
    setProgressPercent(0);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeTrim = newName.trim();
    if (!nomeTrim || isAdding) return;

    setIsAdding(true);
    setProgressPercent(20);
    setProgressText('A ligar à API oficial...');

    const dadosMidia = await fetchMediaMetadata(nomeTrim, newType, (pct, text) => {
      setProgressPercent(pct);
      setProgressText(text);
    });

    const newItem: MediaItem = {
      id: Date.now(),
      nome: nomeTrim,
      tipo: newType,
      genero: dadosMidia.genero,
      resumo: dadosMidia.resumo,
      lancamento: dadosMidia.lancamento,
      termino: dadosMidia.termino,
      temporadas: dadosMidia.temporadas,
      poster: dadosMidia.poster,
      temporadasDados: dadosMidia.temporadasDados,
      avaliacao: 0,
    };

    onSaveMediaList([...mediaList, newItem]);

    setTimeout(() => {
      setIsAdding(false);
      setIsAddModalOpen(false);
      setProgressPercent(0);
      const targetCat: MediaCategory =
        newType === 'Filme' ? 'filmes' : newType === 'Série' ? 'series' : 'animes';
      openCategory(targetCat);
      onNotify(`${newType} "${nomeTrim}" adicionado com sucesso!`, 'success');
    }, 300);
  };

  const openDetails = (item: MediaItem) => {
    const tempsDisponiveis = Object.keys(item.temporadasDados || {}).sort(
      (a, b) => Number(a) - Number(b)
    );
    setOpenItemId(item.id);
    setSelectedTemp(tempsDisponiveis.length > 0 ? tempsDisponiveis[0] : '1');
    setSelectedRating(item.avaliacao || 5);
    setSubPage('detalhes');
  };

  const openItem = mediaList.find((m) => m.id === openItemId) || null;

  const toggleEpisodio = (itemId: number, tempNum: string, epIndex: number) => {
    const updated = mediaList.map((m) => {
      if (m.id !== itemId) return m;
      const copyTemps = { ...m.temporadasDados };
      const list = [...(copyTemps[tempNum] || [])];
      const ep = list[epIndex];
      if (!ep) return m;
      const nextAssistido = !ep.assistido;
      const now = new Date();
      list[epIndex] = {
        ...ep,
        assistido: nextAssistido,
        dataCheck: nextAssistido
          ? `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : '',
      };
      copyTemps[tempNum] = list;
      return { ...m, temporadasDados: copyTemps };
    });
    onSaveMediaList(updated);
  };

  const handleSaveRating = (id: number) => {
    const updated = mediaList.map((m) =>
      m.id === id ? { ...m, avaliacao: selectedRating } : m
    );
    onSaveMediaList(updated);
    onNotify('Avaliação salva com sucesso!', 'success');
  };

  const handleDeleteItem = (id: number) => {
    const updated = mediaList.filter((m) => m.id !== id);
    onSaveMediaList(updated);
    onNotify('Título removido com sucesso.', 'info');
  };

  const handleReloadInfo = async () => {
    if (!openItem || isReloading) return;
    setIsReloading(true);
    try {
      if (openItem.tipo === 'Anime') {
        const dadosAniList = await buscarAnimeAniList(openItem.nome);
        if (dadosAniList) {
          const updated = mediaList.map((m) =>
            m.id === openItem.id
              ? {
                  ...m,
                  genero: dadosAniList.genero,
                  resumo: dadosAniList.resumo,
                  lancamento: dadosAniList.lancamento,
                  termino: dadosAniList.termino,
                  poster: dadosAniList.poster || m.poster,
                  temporadasDados: dadosAniList.temporadasDados,
                  temporadas: dadosAniList.temporadas,
                }
              : m
          );
          onSaveMediaList(updated);
          onNotify('Informações do anime recarregadas com sucesso via AniList!', 'success');
        }
      } else {
        const response = await fetch(
          `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(
            openItem.nome
          )}&embed=episodes`
        );
        if (response.ok) {
          const show = await response.json();
          const genero =
            show.genres && show.genres.length > 0
              ? await traduzirParaPortugues(show.genres.join(' / '))
              : openItem.genero;
          const resumoOriginal = show.summary
            ? show.summary.replace(/<[^>]*>?/gm, '')
            : openItem.resumo;
          const resumo = await traduzirParaPortugues(resumoOriginal);
          let temporadasDados = openItem.temporadasDados;
          let temporadas = openItem.temporadas;

          if (show._embedded && Array.isArray(show._embedded.episodes)) {
            const temporadasMap: Record<string, Episode[]> = {};
            for (const ep of show._embedded.episodes) {
              const tempNum = String(ep.season || 1);
              if (!temporadasMap[tempNum]) temporadasMap[tempNum] = [];
              const nomeEpTraduzido = await traduzirParaPortugues(ep.name || 'Sem título');
              temporadasMap[tempNum].push({
                nome: `Episódio ${ep.number}: ${nomeEpTraduzido}`,
                assistido: false,
                dataCheck: '',
              });
            }
            temporadasDados = normalizarTemporadasSequenciais(temporadasMap);
            temporadas = Object.keys(temporadasDados).length || 1;
          }

          const updated = mediaList.map((m) =>
            m.id === openItem.id
              ? {
                  ...m,
                  genero,
                  resumo,
                  lancamento: show.premiered || m.lancamento,
                  termino: show.ended || m.termino,
                  poster: show.image?.original || m.poster,
                  temporadasDados,
                  temporadas,
                }
              : m
          );
          onSaveMediaList(updated);
          onNotify('Informações recarregadas com sucesso!', 'success');
        }
      }
    } catch (e) {
      console.error('Erro ao recarregar:', e);
      onNotify('Não foi possível atualizar as informações da API.', 'error');
    } finally {
      setIsReloading(false);
    }
  };

  const openEditModal = () => {
    if (!openItem) return;
    setEditNome(openItem.nome);
    setEditTipo(openItem.tipo);
    setEditGenero(openItem.genero || '');
    setEditLancamento(openItem.lancamento || '');
    setEditTermino(openItem.termino || '');
    setEditTemporadas(openItem.temporadas || 1);
    setEditPoster(openItem.poster || '');
    setBulkTextarea('');
    setTempEdicaoMap(JSON.parse(JSON.stringify(openItem.temporadasDados || {})));
    setIsEditModalOpen(true);
  };

  const handleBulkPaste = () => {
    if (!bulkTextarea.trim()) {
      onNotify('Cole o conteúdo copiado da planilha no campo de texto primeiro.', 'info');
      return;
    }

    const nextMap: Record<string, Episode[]> = JSON.parse(JSON.stringify(tempEdicaoMap));
    const linhas = bulkTextarea.split('\n');
    let adicionados = 0;

    for (const linha of linhas) {
      if (!linha.trim()) continue;
      const colunas = linha
        .split('\t')
        .map((c) => c.trim())
        .filter((c) => c !== '');

      let temp = '1';
      let numEp = '1';
      let nomeEp = '';

      if (colunas.length >= 3) {
        temp = colunas[0].replace(/\D/g, '') || '1';
        numEp = colunas[1].replace(/\D/g, '') || '1';
        nomeEp = colunas.slice(2).join(' ');
      } else if (colunas.length === 2) {
        numEp = colunas[0].replace(/\D/g, '') || '1';
        nomeEp = colunas[1];
      } else if (colunas.length === 1) {
        nomeEp = colunas[0];
      }

      if (nomeEp) {
        if (!nextMap[temp]) nextMap[temp] = [];
        nextMap[temp].push({
          nome: `Episódio ${numEp}: ${nomeEp}`,
          assistido: false,
          dataCheck: '',
        });
        adicionados++;
      }
    }

    if (adicionados > 0) {
      setTempEdicaoMap(nextMap);
      setBulkTextarea('');
      onNotify(`${adicionados} episódios adicionados! Clique em "Salvar Alterações".`, 'success');
    } else {
      onNotify('Não foi possível detetar dados válidos nas linhas coladas.', 'error');
    }
  };

  const handleRemoveEpManual = (temp: string, idx: number) => {
    const nextMap: Record<string, Episode[]> = JSON.parse(JSON.stringify(tempEdicaoMap));
    if (nextMap[temp]) {
      nextMap[temp].splice(idx, 1);
      if (nextMap[temp].length === 0) delete nextMap[temp];
      setTempEdicaoMap(nextMap);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openItem) return;

    const updated = mediaList.map((m) =>
      m.id === openItem.id
        ? {
            ...m,
            nome: editNome.trim(),
            tipo: editTipo,
            genero: editGenero.trim(),
            lancamento: editLancamento,
            termino: editTermino.trim(),
            temporadas: Number(editTemporadas) || 1,
            poster: editPoster.trim(),
            temporadasDados: tempEdicaoMap,
          }
        : m
    );
    onSaveMediaList(updated);
    setIsEditModalOpen(false);
    onNotify('Alterações salvas com sucesso!', 'success');
  };

  const isItemDone = (item: MediaItem) => {
    const keys = Object.keys(item.temporadasDados || {});
    if (keys.length === 0) return false;
    for (const t of keys) {
      for (const ep of item.temporadasDados[t] || []) {
        if (!ep.assistido) return false;
      }
    }
    return true;
  };

  const renderCatalogSubpage = (cat: MediaCategory) => {
    const config =
      cat === 'filmes'
        ? {
            title: 'Filmes',
            tipo: 'Filme' as MediaType,
            btnLabel: 'Adicionar Filme',
            placeholder: 'Pesquisar filme...',
            accentText: 'text-cyan-400',
            accentBorder: 'hover:border-cyan-500/50',
            accentFocus: 'focus:border-cyan-500',
            btnBg: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20',
            icon: <Film className="w-10 h-10 text-cyan-400 mb-3" />,
          }
        : cat === 'series'
          ? {
              title: 'Séries',
              tipo: 'Série' as MediaType,
              btnLabel: 'Adicionar Série',
              placeholder: 'Pesquisar série...',
              accentText: 'text-indigo-400',
              accentBorder: 'hover:border-indigo-500/50',
              accentFocus: 'focus:border-indigo-500',
              btnBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20',
              icon: <Tv className="w-10 h-10 text-indigo-400 mb-3" />,
            }
          : {
              title: 'Animes',
              tipo: 'Anime' as MediaType,
              btnLabel: 'Adicionar Anime',
              placeholder: 'Pesquisar anime...',
              accentText: 'text-pink-400',
              accentBorder: 'hover:border-pink-500/50',
              accentFocus: 'focus:border-pink-500',
              btnBg: 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/20',
              icon: <Video className="w-10 h-10 text-pink-400 mb-3" />,
            };

    const term = searchTerm.toLowerCase().trim();
    const filteredItems = mediaList.filter((item) => {
      const matchTipo = item.tipo === config.tipo;
      const matchTerm =
        !term ||
        item.nome.toLowerCase().includes(term) ||
        (item.genero && item.genero.toLowerCase().includes(term));
      return matchTipo && matchTerm;
    });

    return (
      <section className="space-y-8">
        <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSubPage('main')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-700 transition flex items-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <div>
              <span className={`text-xs uppercase tracking-widest font-bold ${config.accentText}`}>
                Catálogo
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1">{config.title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={config.placeholder}
              className={`bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none ${config.accentFocus} w-48 md:w-64`}
            />
            <button
              type="button"
              onClick={() => openAddModal(config.tipo)}
              className={`${config.btnBg} text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-2 cursor-pointer whitespace-nowrap shrink-0`}
            >
              <Plus className="w-4 h-4" />
              <span>{config.btnLabel}</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 flex flex-col items-center">
              {config.icon}
              <p className="text-lg font-medium text-white">
                Nenhum {config.tipo.toLowerCase()} encontrado.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const done = isItemDone(item);
              const totalTemps = Object.keys(item.temporadasDados || {}).length;
              return (
                <div
                  key={item.id}
                  onClick={() => openDetails(item)}
                  className={`group cursor-pointer bg-slate-900/90 border border-slate-800 ${config.accentBorder} rounded-2xl overflow-hidden transition-all shadow-xl flex flex-col justify-between hover:-translate-y-1`}
                >
                  <div className="h-64 w-full overflow-hidden relative bg-slate-950 flex items-center justify-center">
                    <PosterImage
                      src={item.poster}
                      alt={item.nome}
                      tipo={item.tipo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md border font-semibold backdrop-blur-md bg-slate-950/80 ${
                          done
                            ? 'text-emerald-400 border-emerald-500/20'
                            : 'text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {done ? 'Concluído' : 'Não Concluído'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 transition">
                        {item.nome}
                      </h3>
                      <p className={`text-xs font-medium mb-3 ${config.accentText}`}>
                        {item.genero || 'Gênero não informado'}
                      </p>
                      <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3 tabular-nums">
                        <p>
                          <strong>Lançamento:</strong>{' '}
                          {item.lancamento ? item.lancamento.split('-').reverse().join('/') : '-'}
                        </p>
                        <p>
                          <strong>Término:</strong> {item.termino || '-'}
                        </p>
                        <p>
                          <strong>Temporadas:</strong> {totalTemps} Temp.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                      <span className="text-amber-400 font-medium flex items-center gap-0.5">
                        {Array.from({ length: item.avaliacao || 0 }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="text-rose-400 hover:text-rose-300 transition font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    );
  };

  const renderDetails = () => {
    if (!openItem) return null;
    const done = isItemDone(openItem);
    const accentText =
      openItem.tipo === 'Filme'
        ? 'text-cyan-400'
        : openItem.tipo === 'Série'
          ? 'text-indigo-400'
          : 'text-pink-400';

    const temporadasChaves = Object.keys(openItem.temporadasDados || {}).sort(
      (a, b) => Number(a) - Number(b)
    );
    const listaEps = openItem.temporadasDados?.[selectedTemp] || [];

    return (
      <section className="space-y-8">
        <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setSubPage(activeCategory)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-700 transition flex items-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <div>
              <span className={`text-xs uppercase tracking-widest font-bold ${accentText}`}>
                {openItem.tipo}
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1">{openItem.nome}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReloadInfo}
              disabled={isReloading}
              className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
              <span>Recarregar Info</span>
            </button>
            <button
              type="button"
              onClick={openEditModal}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Título</span>
            </button>
            <span
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap ${
                done
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {done ? 'Concluído' : 'Não Concluído'}
            </span>
          </div>
        </header>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            <div className="md:col-span-1 overflow-hidden rounded-2xl shadow-2xl bg-slate-950 flex items-center justify-center">
              <PosterImage
                src={openItem.poster}
                alt={openItem.nome}
                tipo={openItem.tipo}
                className="w-full h-auto object-cover rounded-2xl max-h-[450px]"
              />
            </div>

            <div className="md:col-span-3 space-y-6">
              <div>
                <span className={`text-xs uppercase tracking-widest font-bold ${accentText}`}>
                  {openItem.genero}
                </span>
                <h3 className="text-3xl font-extrabold text-white mt-1">{openItem.nome}</h3>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Resumo
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  {openItem.resumo}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Episódios & Progresso
                  </h4>
                  <select
                    value={selectedTemp}
                    onChange={(e) => setSelectedTemp(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {temporadasChaves.map((t) => (
                      <option key={t} value={t}>
                        Temporada {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {listaEps.map((ep, idx) => (
                    <div
                      key={`${selectedTemp}-${idx}`}
                      className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-sm"
                    >
                      <div className="space-y-1">
                        <span className="text-slate-200 block">{ep.nome}</span>
                        {ep.assistido && ep.dataCheck && (
                          <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                            Check em: {ep.dataCheck}
                          </span>
                        )}
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <span
                          className={`text-xs font-semibold ${
                            ep.assistido ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {ep.assistido ? 'Assistido' : 'Não Assistido'}
                        </span>
                        <input
                          type="checkbox"
                          checked={ep.assistido}
                          onChange={() => toggleEpisodio(openItem.id, selectedTemp, idx)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Minha Avaliação
                  </h4>
                  <p className="text-xs text-slate-500">Selecione de 1 a 5 estrelas</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5 estrelas (5/5)</option>
                    <option value={4}>4 estrelas (4/5)</option>
                    <option value={3}>3 estrelas (3/5)</option>
                    <option value={2}>2 estrelas (2/5)</option>
                    <option value={1}>1 estrela (1/5)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveRating(openItem.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      {subPage === 'main' && (
        <section className="space-y-8">
          <header className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md shadow-xl flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">
                Entretenimento
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1">TV, Séries & Animes</h2>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              type="button"
              onClick={() => openCategory('filmes')}
              className="group text-left cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              <div className="h-36 bg-gradient-to-tr from-cyan-950 via-blue-900/60 to-slate-900 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Film className="w-7 h-7" />
                </div>
              </div>
              <div className="p-5 bg-slate-900">
                <h3 className="text-xl font-bold text-white mb-3">Filmes</h3>
                <div className="h-1 w-full bg-cyan-400 rounded-full" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => openCategory('series')}
              className="group text-left cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              <div className="h-36 bg-gradient-to-tr from-indigo-950 via-purple-900/60 to-slate-900 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Tv className="w-7 h-7" />
                </div>
              </div>
              <div className="p-5 bg-slate-900">
                <h3 className="text-xl font-bold text-white mb-3">Séries</h3>
                <div className="h-1 w-full bg-indigo-400 rounded-full" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => openCategory('animes')}
              className="group text-left cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-pink-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              <div className="h-36 bg-gradient-to-tr from-pink-950 via-rose-900/60 to-slate-900 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7" />
                </div>
              </div>
              <div className="p-5 bg-slate-900">
                <h3 className="text-xl font-bold text-white mb-3">Animes</h3>
                <div className="h-1 w-full bg-pink-400 rounded-full" />
              </div>
            </button>
          </div>
        </section>
      )}

      {(subPage === 'filmes' || subPage === 'series' || subPage === 'animes') &&
        renderCatalogSubpage(subPage)}

      {subPage === 'detalhes' && renderDetails()}

      {/* MODAL ADICIONAR TÍTULO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Adicionar Novo Título</h3>
              <button
                type="button"
                onClick={() => !isAdding && setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nome do Filme / Série / Anime
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Naruto, Solo Leveling, Interstellar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Categoria (Tipo)
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MediaType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Filme">Filme</option>
                  <option value="Série">Série</option>
                  <option value="Anime">Anime</option>
                </select>
              </div>

              {isAdding && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-blue-400 font-medium">
                    <span>{progressText}</span>
                    <span className="tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className={`bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 cursor-pointer ${
                    isAdding ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR TÍTULO & EPISÓDIOS */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <span>Editar Informações & Episódios</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="space-y-6 max-h-[75vh] overflow-y-auto pr-2"
            >
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Dados Principais
                </h4>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Nome do Título
                  </label>
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Categoria (Tipo)
                    </label>
                    <select
                      value={editTipo}
                      onChange={(e) => setEditTipo(e.target.value as MediaType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="Filme">Filme</option>
                      <option value="Série">Série</option>
                      <option value="Anime">Anime</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Gênero
                    </label>
                    <input
                      type="text"
                      value={editGenero}
                      onChange={(e) => setEditGenero(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Lançamento
                    </label>
                    <input
                      type="date"
                      value={editLancamento}
                      onChange={(e) => setEditLancamento(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Término
                    </label>
                    <input
                      type="text"
                      value={editTermino}
                      onChange={(e) => setEditTermino(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Temporadas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editTemporadas}
                      onChange={(e) => setEditTemporadas(Number(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    URL do Poster (Imagem)
                  </label>
                  <input
                    type="text"
                    value={editPoster}
                    onChange={(e) => setEditPoster(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Colar Episódios em Massa (Excel / Planilha)</span>
                </h4>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <p className="text-[11px] text-slate-400">
                    Pode copiar as colunas diretamente de uma tabela (ex: Temporada | Episódio |
                    Título) e colar no campo abaixo:
                  </p>
                  <textarea
                    rows={4}
                    value={bulkTextarea}
                    onChange={(e) => setBulkTextarea(e.target.value)}
                    placeholder="Cole aqui os dados copiados da tabela..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkPaste}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Episódios Colados</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                    Episódios Cadastrados Atualmente:
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {Object.keys(tempEdicaoMap).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        Nenhum episódio cadastrado ainda.
                      </p>
                    ) : (
                      Object.entries(tempEdicaoMap).map(([temp, eps]) =>
                        eps.map((ep, idx) => (
                          <div
                            key={`${temp}-${idx}`}
                            className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs"
                          >
                            <span className="text-slate-200">
                              <strong>
                                T{temp} - E{idx + 1}:
                              </strong>{' '}
                              {ep.nome}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEpManual(temp, idx)}
                              className="text-rose-400 hover:text-rose-300 px-2 py-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
