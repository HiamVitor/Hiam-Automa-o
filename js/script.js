// Normaliza as chaves das temporadas para uma sequência limpa: 1, 2, 3...
function normalizarTemporadasSequenciais(temporadasDados) {
    const dados = temporadasDados && typeof temporadasDados === 'object' ? temporadasDados : {};
    const chavesOrdenadas = Object.keys(dados).sort((a, b) => {
        const numeroA = Number(a);
        const numeroB = Number(b);
        if (Number.isFinite(numeroA) && Number.isFinite(numeroB)) return numeroA - numeroB;
        return a.localeCompare(b, undefined, { numeric: true });
    });
    const temporadasNormalizadas = {};
    chavesOrdenadas.forEach((chaveOriginal, indice) => {
        temporadasNormalizadas[String(indice + 1)] = Array.isArray(dados[chaveOriginal]) ? dados[chaveOriginal] : [];
    });
    return temporadasNormalizadas;
}

let mediaList = JSON.parse(localStorage.getItem('hiam_mediaList')) || [];
let currentActiveCategory = 'filmes';
let currentOpenItemId = null;
let currentSelectedTemp = 1;
let temporadasDadosTempEdicao = {};

let acessosList = JSON.parse(localStorage.getItem('hiam_acessosList')) || [
    {
        id: 1,
        nome: "Casa Principal - 235",
        morada: "Rua Dos Crisântemos - Morro Estevão",
        temLuz: true,
        luzPortal: "https://portal.coopera.com.br/agenciavirtual3",
        luzLogin: "hiamvitorb@gmail.com",
        luzSenha: "Hiam.235",
        temAgua: true,
        aguaPortal: "https://e.casan.com.br/",
        aguaCpf: "75442280968",
        aguaMatricula: "6706592",
        aguaSenha: "Hiam.235"
    },
    {
        id: 2,
        nome: "Casa Velha",
        morada: "Rua Dos Crisântemos - Morro Estevão",
        temLuz: true,
        luzPortal: "https://portal.coopera.com.br/agenciavirtual3",
        luzLogin: "2847",
        luzSenha: "25172517",
        temAgua: true,
        aguaPortal: "https://e.casan.com.br/",
        aguaCpf: "83396861949",
        aguaMatricula: "06175678",
        aguaSenha: ""
    },
    {
        id: 3,
        nome: "Casa Verde - 366",
        morada: "Rua Etelvina de Oliveira Muniz - Morro Estevão",
        temLuz: true,
        luzPortal: "https://portal.coopera.com.br/agenciavirtual3",
        luzLogin: "hiamvitorb@gmail.com",
        luzSenha: "Hiam.235",
        temAgua: true,
        aguaPortal: "https://e.casan.com.br/",
        aguaCpf: "75442280968",
        aguaMatricula: "6706592",
        aguaSenha: "Hiam.235"
    },
    {
        id: 4,
        nome: "Casa da Praia - 153",
        morada: "Rincão Zona Norte",
        temLuz: true,
        luzPortal: "https://agencia.cooperalianca.com.br/AgenciaVirtual/",
        luzLogin: "UC: 12415",
        luzSenha: "25172517",
        temAgua: true,
        aguaPortal: "https://samaerincao.com.br/",
        aguaCpf: "619.481.289-34",
        aguaMatricula: "521071",
        aguaSenha: ""
    },
    {
        id: 5,
        nome: "Casa Nova",
        morada: "",
        temLuz: true,
        luzPortal: "",
        luzLogin: "",
        luzSenha: "",
        temAgua: true,
        aguaPortal: "",
        aguaCpf: "",
        aguaMatricula: "",
        aguaSenha: ""
    }
];

let senhasPessoaisList = JSON.parse(localStorage.getItem('hiam_senhasPessoaisList')) || [
    {
        id: 1,
        userLogin: "admin",
        servico: "GitHub",
        url: "https://github.com",
        login: "hiamvitor",
        senha: "HiamGitHub2026!"
    }
];

let adminsList = JSON.parse(localStorage.getItem('hiam_adminsList')) || [];

if (adminsList.length === 0) {
    adminsList.push({
        id: Date.now(),
        nome: "Administrador Inicial",
        login: "admin",
        senha: "123",
        vip: true
    });
    localStorage.setItem('hiam_adminsList', JSON.stringify(adminsList));
}

let tabPendenteParaDesbloquear = '';
let adminLogadoAtual = null;

// Salva localmente e envia para o Firebase no caminho correto: coleção 'dados', documento 'principal'[cite: 3]
function salvarNoLocalStorage() {
    localStorage.setItem('hiam_mediaList', JSON.stringify(mediaList));
    localStorage.setItem('hiam_acessosList', JSON.stringify(acessosList));
    localStorage.setItem('hiam_senhasPessoaisList', JSON.stringify(senhasPessoaisList));
    localStorage.setItem('hiam_adminsList', JSON.stringify(adminsList));
    
    atualizarTimestampSyncWeb();

    if (window.db && window.dbHelpers) {
        const { doc, setDoc } = window.dbHelpers;
        setDoc(doc(window.db, "dados", "principal"), {
            mediaList,
            acessosList,
            senhasPessoaisList,
            adminsList,
            ultimaAtualizacao: new Date().toISOString()
        }).then(() => {
            console.log("Dados sincronizados com sucesso na nuvem do Firebase.");
        }).catch(e => {
            console.error("Erro ao sincronizar com o Firebase:", e);
        });
    }
}

// Carrega os dados do Firebase e mantém a escuta ativa em tempo real para qualquer aparelho[cite: 1, 3]
async function carregarDadosDaNuvem() {
    if (window.db && window.dbHelpers) {
        try {
            const { doc, getDoc, onSnapshot } = window.dbHelpers;
            const docRef = doc(window.db, "dados", "principal");
            
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const dados = docSnap.data();
                if (dados.mediaList) mediaList = dados.mediaList;
                if (dados.acessosList) acessosList = dados.acessosList;
                if (dados.senhasPessoaisList) senhasPessoaisList = dados.senhasPessoaisList;
                if (dados.adminsList) adminsList = dados.adminsList;

                renderizarInterfaceCompleta();
            }

            onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const dados = doc.data();
                    let novoJson = JSON.stringify(dados.mediaList);
                    let atualJson = JSON.stringify(mediaList);
                    
                    if (novoJson && novoJson !== atualJson) {
                        mediaList = dados.mediaList || mediaList;
                        acessosList = dados.acessosList || acessosList;
                        senhasPessoaisList = dados.senhasPessoaisList || senhasPessoaisList;
                        adminsList = dados.adminsList || adminsList;

                        renderizarInterfaceCompleta();
                        atualizarTimestampSyncWeb();
                    }
                }
            });
        } catch (e) {
            console.error("Erro ao carregar dados do Firebase:", e);
        }
    }
}

function renderizarInterfaceCompleta() {
    renderAcessos();
    renderContasCasa();
    renderSenhasPessoais();
    renderAdmins();
    if (!document.getElementById('subpage-detalhes').classList.contains('hidden')) {
        renderizarConteudoDetalhes();
    }
    if (currentActiveCategory && !document.getElementById('subpage-' + currentActiveCategory).classList.contains('hidden')) {
        renderMediaList(currentActiveCategory);
    }
}

function atualizarTimestampSyncWeb() {
    const el = document.getElementById('timestamp-sync');
    if (el) {
        const agora = new Date();
        el.innerText = `Última sync: ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
}

function forcarAtualizacaoGeralDispositivos() {
    const labelRede = document.getElementById('label-status-rede');
    if (labelRede) labelRede.innerText = "A atualizar...";

    carregarDadosDaNuvem();

    setTimeout(() => {
        renderizarInterfaceCompleta();
        if (labelRede) labelRede.innerText = "Web Sincronizada";
        atualizarTimestampSyncWeb();
        alert("Dispositivos atualizados com sucesso a partir da nuvem!");
    }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
    switchTab('home');
    
    window.addEventListener('firebase-ready', () => {
        carregarDadosDaNuvem();
    });

    renderizarInterfaceCompleta();
    atualizarTimestampSyncWeb();
});

function solicitarSenhaTab(tabId) {
    tabPendenteParaDesbloquear = tabId;
    let nomeAbaFormatado = tabId === 'contas' ? 'Contas da Casa' : (tabId === 'senhas' ? 'Senhas da Casa' : (tabId === 'senhas-pessoais' ? 'Senhas Pessoais' : 'Administrador'));
    document.getElementById('auth-tab-name').innerText = `Insira o login e senha de Administrador para aceder a "${nomeAbaFormatado}".`;
    document.getElementById('input-login-auth').value = '';
    document.getElementById('input-senha-auth').value = '';
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
    tabPendenteParaDesbloquear = '';
}

function verificarLoginSenhaTab(event) {
    event.preventDefault();
    const loginInserido = document.getElementById('input-login-auth').value.trim();
    const senhaInserida = document.getElementById('input-senha-auth').value.trim();

    const adminEncontrado = adminsList.find(adm => adm.login === loginInserido && adm.senha === senhaInserida);

    if (adminEncontrado) {
        adminLogadoAtual = adminEncontrado;
        const abaAlvo = tabPendenteParaDesbloquear;
        closeAuthModal();
        switchTab(abaAlvo);
        renderizarInterfaceCompleta();
    } else {
        alert("Login ou Senha incorretos! Tente novamente.");
        document.getElementById('input-senha-auth').value = '';
    }
}

function toggleSecaoForm(secao) {
    const chk = document.getElementById(`chk-${secao}`);
    const container = document.getElementById(`container-campos-${secao}`);
    if (chk && container) {
        if (chk.checked) container.classList.remove('hidden');
        else container.classList.add('hidden');
    }
}

async function traduzirParaPortugues(texto) {
    if (!texto || typeof texto !== 'string' || texto.trim() === "") return texto;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
                let textoTraduzido = '';
                data[0].forEach(parte => {
                    if (parte[0]) textoTraduzido += parte[0];
                });
                if (textoTraduzido.trim() !== '') return textoTraduzido;
            }
        }
    } catch (e) {
        console.error("Erro na tradução:", e);
    }
    return texto;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const nomeInput = document.getElementById('input-nome').value.trim();
    const tipo = document.getElementById('input-tipo').value;
    
    let dadosMidia = {
        genero: tipo === 'Filme' ? "Filme / Ação" : (tipo === 'Anime' ? "Anime / Ação / Aventura" : "Ação / Aventura / Fantasia"),
        resumo: `Informações detalhadas sobre ${nomeInput} obtidas do catálogo oficial.`,
        lancamento: "2024-01-01",
        termino: "Em andamento",
        temporadas: 1,
        poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=500&auto=format&fit=crop",
        temporadasDados: {
            "1": [
                { nome: "Episódio 1: Introdução", assistido: false, dataCheck: "" }
            ]
        }
    };

    try {
        const response = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(nomeInput)}&embed=episodes`);
        if (response.ok) {
            const show = await response.json();
            if (show.genres && show.genres.length > 0) {
                dadosMidia.genero = await traduzirParaPortugues(show.genres.join(" / "));
            }
            let resumoOriginal = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : dadosMidia.resumo;
            let resumoTraduzido = await traduzirParaPortugues(resumoOriginal);
            if (resumoTraduzido.length > 450) {
                resumoTraduzido = resumoTraduzido.substring(0, 447) + "...";
            }
            dadosMidia.resumo = resumoTraduzido;
            dadosMidia.lancamento = show.premiered || "2024-01-01";
            dadosMidia.termino = show.ended || "Em andamento";
            if (show.image && show.image.original) dadosMidia.poster = show.image.original;

            if (show._embedded && Array.isArray(show._embedded.episodes)) {
                const temporadasMap = {};
                for (const ep of show._embedded.episodes) {
                    const tempNum = ep.season || 1;
                    if (!temporadasMap[tempNum]) temporadasMap[tempNum] = [];
                    let nomeEpTraduzido = await traduzirParaPortugues(ep.name || 'Sem título');
                    temporadasMap[tempNum].push({
                        nome: `Episódio ${ep.number}: ${nomeEpTraduzido}`,
                        assistido: false,
                        dataCheck: ""
                    });
                }
                dadosMidia.temporadasDados = normalizarTemporadasSequenciais(temporadasMap);
                dadosMidia.temporadas = Object.keys(dadosMidia.temporadasDados).length || 1;
            }
        }
    } catch (e) {
        console.error("Erro API:", e);
    }

    mediaList.push({
        id: Date.now(),
        nome: nomeInput,
        tipo: tipo,
        genero: dadosMidia.genero,
        resumo: dadosMidia.resumo,
        lancamento: dadosMidia.lancamento,
        termino: dadosMidia.termino,
        temporadas: dadosMidia.temporadas,
        poster: dadosMidia.poster,
        temporadasDados: dadosMidia.temporadasDados,
        avaliacao: 0
    });

    salvarNoLocalStorage();
    closeModal();

    if (tipo === 'Filme') switchSubPage('filmes');
    else if (tipo === 'Série') switchSubPage('series');
    else if (tipo === 'Anime') switchSubPage('animes');
}

async function recarregarInformacoesTitulo() {
    const item = mediaList.find(m => m.id === currentOpenItemId);
    if (!item) return;

    const icone = document.getElementById('icone-recarregar');
    if (icone) icone.classList.add('fa-spin');

    try {
        const response = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(item.nome)}&embed=episodes`);
        if (response.ok) {
            const show = await response.json();
            if (show.genres && show.genres.length > 0) {
                item.genero = await traduzirParaPortugues(show.genres.join(" / "));
            }
            let resumoOriginal = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : item.resumo;
            item.resumo = await traduzirParaPortugues(resumoOriginal);
            item.lancamento = show.premiered || item.lancamento;
            item.termino = show.ended || item.termino;
            if (show.image && show.image.original) item.poster = show.image.original;

            if (show._embedded && Array.isArray(show._embedded.episodes)) {
                const temporadasMap = {};
                for (const ep of show._embedded.episodes) {
                    const tempNum = ep.season || 1;
                    if (!temporadasMap[tempNum]) temporadasMap[tempNum] = [];
                    let nomeEpTraduzido = await traduzirParaPortugues(ep.name || 'Sem título');
                    temporadasMap[tempNum].push({
                        nome: `Episódio ${ep.number}: ${nomeEpTraduzido}`,
                        assistido: false,
                        dataCheck: ""
                    });
                }
                item.temporadasDados = normalizarTemporadasSequenciais(temporadasMap);
                item.temporadas = Object.keys(item.temporadasDados).length || 1;
            }
            salvarNoLocalStorage();
            renderizarConteudoDetalhes();
            alert("Informações recarregadas com sucesso!");
        }
    } catch (e) {
        console.error("Erro ao recarregar:", e);
        alert("Não foi possível atualizar as informações da API.");
    } finally {
        if (icone) icone.classList.remove('fa-spin');
    }
}

function openModal(defaultType) {
    const modal = document.getElementById('media-modal');
    if (defaultType) document.getElementById('input-tipo').value = defaultType;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('media-modal').classList.add('hidden');
    const form = document.getElementById('media-form');
    if (form) form.reset();
}

function openEditItemModal() {
    const item = mediaList.find(m => m.id === currentOpenItemId);
    if (!item) return;

    document.getElementById('edit-item-nome').value = item.nome;
    document.getElementById('edit-item-tipo').value = item.tipo;
    document.getElementById('edit-item-genero').value = item.genero || '';
    document.getElementById('edit-item-lancamento').value = item.lancamento || '';
    document.getElementById('edit-item-termino').value = item.termino || '';
    document.getElementById('edit-item-temporadas').value = item.temporadas || 1;
    document.getElementById('edit-item-poster').value = item.poster || '';
    document.getElementById('manual-textarea-massa').value = '';

    temporadasDadosTempEdicao = JSON.parse(JSON.stringify(item.temporadasDados || {}));
    renderizarListaEpisodiosModal();

    document.getElementById('edit-item-modal').classList.remove('hidden');
}

function closeEditItemModal() {
    document.getElementById('edit-item-modal').classList.add('hidden');
}

function renderizarListaEpisodiosModal() {
    const container = document.getElementById('lista-episodios-modal');
    if (!container) return;
    let html = '';
    let temEp = false;

    for (let temp in temporadasDadosTempEdicao) {
        temporadasDadosTempEdicao[temp].forEach((ep, idx) => {
            temEp = true;
            html += `
                <div class="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                    <span class="text-slate-200"><strong>T${temp} - E${idx+1}:</strong> ${ep.nome}</span>
                    <button type="button" onclick="removerEpisodioManual('${temp}', ${idx})" class="text-rose-400 hover:text-rose-300 px-2 py-1"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        });
    }

    if (!temEp) {
        html = `<p class="text-xs text-slate-500 italic">Nenhum episódio cadastrado ainda.</p>`;
    }
    container.innerHTML = html;
}

function processarColagemMassa() {
    const texto = document.getElementById('manual-textarea-massa').value;
    if (!texto || texto.trim() === '') {
        alert("Cole o conteúdo copiado da planilha no campo de texto primeiro.");
        return;
    }

    const linhas = texto.split('\n');
    let adicionados = 0;

    linhas.forEach(linha => {
        if (!linha.trim()) return;
        const colunas = linha.split('\t').map(c => c.trim()).filter(c => c !== '');

        let temp = "1";
        let numEp = "1";
        let nomeEp = "";

        if (colunas.length >= 3) {
            temp = colunas[0].replace(/\D/g, '') || "1";
            numEp = colunas[1].replace(/\D/g, '') || "1";
            nomeEp = colunas.slice(2).join(" ");
        } else if (colunas.length === 2) {
            numEp = colunas[0].replace(/\D/g, '') || "1";
            nomeEp = colunas[1];
        } else if (colunas.length === 1) {
            nomeEp = colunas[0];
        }

        if (nomeEp) {
            if (!temporadasDadosTempEdicao[temp]) {
                temporadasDadosTempEdicao[temp] = [];
            }
            temporadasDadosTempEdicao[temp].push({
                nome: `Episódio ${numEp}: ${nomeEp}`,
                assistido: false,
                dataCheck: ""
            });
            adicionados++;
        }
    });

    if (adicionados > 0) {
        document.getElementById('manual-textarea-massa').value = '';
        renderizarListaEpisodiosModal();
        alert(`${adicionados} episódios adicionados com sucesso! Clique em "Salvar Alterações" no fim do modal para efetivar.`);
    } else {
        alert("Não foi possível detetar dados válidos nas linhas coladas.");
    }
}

function removerEpisodioManual(temp, idx) {
    if (temporadasDadosTempEdicao[temp]) {
        temporadasDadosTempEdicao[temp].splice(idx, 1);
        if (temporadasDadosTempEdicao[temp].length === 0) {
            delete temporadasDadosTempEdicao[temp];
        }
        renderizarListaEpisodiosModal();
    }
}

function handleEditItemSubmit(event) {
    event.preventDefault();
    const item = mediaList.find(m => m.id === currentOpenItemId);
    if (!item) return;

    item.nome = document.getElementById('edit-item-nome').value.trim();
    item.tipo = document.getElementById('edit-item-tipo').value;
    item.genero = document.getElementById('edit-item-genero').value.trim();
    item.lancamento = document.getElementById('edit-item-lancamento').value;
    item.termino = document.getElementById('edit-item-termino').value.trim();
    item.temporadas = parseInt(document.getElementById('edit-item-temporadas').value) || 1;
    item.poster = document.getElementById('edit-item-poster').value.trim();
    item.temporadasDados = temporadasDadosTempEdicao;

    salvarNoLocalStorage();
    closeEditItemModal();
    
    document.getElementById('detalhe-titulo-topo').innerText = item.nome;
    document.getElementById('detalhe-categoria-tag').innerText = item.tipo;
    renderizarConteudoDetalhes();
}

function renderMediaList(category) {
    let containerId = '', tipoFiltro = '', accentColor = '', iconClass = '';
    if (category === 'filmes') { containerId = 'grid-filmes'; tipoFiltro = 'Filme'; accentColor = 'cyan'; iconClass = 'fa-film'; }
    else if (category === 'series') { containerId = 'grid-series'; tipoFiltro = 'Série'; accentColor = 'indigo'; iconClass = 'fa-tv'; }
    else if (category === 'animes') { containerId = 'grid-animes'; tipoFiltro = 'Anime'; accentColor = 'pink'; iconClass = 'fa-video'; }

    const container = document.getElementById(containerId);
    if (!container) return;
    const filteredItems = mediaList.filter(item => item.tipo === tipoFiltro);

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                <i class="fa-solid ${iconClass} text-4xl text-${accentColor}-400 mb-3"></i>
                <p class="text-lg font-medium text-white">Nenhum ${tipoFiltro.toLowerCase()} adicionado ainda.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filteredItems.forEach(item => {
        let allDone = true;
        for (let t in item.temporadasDados) {
            item.temporadasDados[t].forEach(ep => { if (!ep.assistido) allDone = false; });
        }
        let statusText = allDone ? "Concluído" : "Não Concluído";
        let badgeStyle = allDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20";
        const totalTemps = Object.keys(item.temporadasDados || {}).length;

        html += `
            <div onclick="openDetails(${item.id})" class="group cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-${accentColor}-500/50 rounded-2xl overflow-hidden transition-all shadow-xl flex flex-col justify-between hover:-translate-y-1">
                <div class="h-64 w-full overflow-hidden relative bg-slate-950 flex items-center justify-center">
                    <img src="${item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'}" alt="${item.nome}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <div class="absolute top-3 right-3">
                        <span class="text-xs px-2.5 py-1 rounded-md border font-semibold backdrop-blur-md bg-slate-950/80 ${badgeStyle}">${statusText}</span>
                    </div>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-white mb-1 group-hover:text-${accentColor}-400 transition">${item.nome}</h3>
                        <p class="text-xs text-${accentColor}-400 font-medium mb-3">${item.genero || 'Gênero não informado'}</p>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                            <p><strong>Lançamento:</strong> ${item.lancamento ? item.lancamento.split('-').reverse().join('/') : '-'}</p>
                            <p><strong>Término:</strong> ${item.termino || '-'}</p>
                            <p><strong>Temporadas:</strong> ${totalTemps} Temp.</p>
                        </div>
                    </div>
                    <div class="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                        <span class="text-amber-400 font-medium">${'⭐'.repeat(item.avaliacao || 0)}</span>
                        <span onclick="event.stopPropagation(); deleteItem(${item.id}, '${category}')" class="text-rose-400 hover:text-rose-300 transition font-medium"><i class="fa-solid fa-trash mr-1"></i> Apagar</span>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function openDetails(id) {
    const item = mediaList.find(m => m.id === id);
    if (!item) return;

    currentOpenItemId = id;
    const tempsDisponiveis = Object.keys(item.temporadasDados || {});
    currentSelectedTemp = tempsDisponiveis.length > 0 ? tempsDisponiveis[0] : 1;

    ['filmes', 'series', 'animes'].forEach(s => {
        const el = document.getElementById('subpage-' + s);
        if (el) el.classList.add('hidden');
    });

    document.getElementById('subpage-detalhes').classList.remove('hidden');
    document.getElementById('detalhe-titulo-topo').innerText = item.nome;
    document.getElementById('detalhe-categoria-tag').innerText = item.tipo;
    document.getElementById('btn-voltar-detalhes').setAttribute('onclick', `switchSubPage('${currentActiveCategory}')`);

    renderizarConteudoDetalhes();
}

function renderizarConteudoDetalhes() {
    const item = mediaList.find(m => m.id === currentOpenItemId);
    if (!item) return;

    let accentColor = item.tipo === 'Filme' ? 'cyan' : (item.tipo === 'Série' ? 'indigo' : 'pink');
    let allDone = true;
    for (let t in item.temporadasDados) {
        item.temporadasDados[t].forEach(ep => { if (!ep.assistido) allDone = false; });
    }

    const badgeStatus = document.getElementById('detalhe-status-badge');
    if (allDone) {
        badgeStatus.innerText = "Concluído";
        badgeStatus.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    } else {
        badgeStatus.innerText = "Não Concluído";
        badgeStatus.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }

    let optionsTemp = '';
    const temporadasChaves = Object.keys(item.temporadasDados || {}).sort((a, b) => Number(a) - Number(b));
    temporadasChaves.forEach(t => {
        optionsTemp += `<option value="${t}" ${currentSelectedTemp == t ? 'selected' : ''}>Temporada ${t}</option>`;
    });

    let epsHtml = '';
    let listaEps = item.temporadasDados[currentSelectedTemp] || [];
    listaEps.forEach((ep, idx) => {
        epsHtml += `
            <div class="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-sm">
                <div class="space-y-1">
                    <span class="text-slate-200 block">${ep.nome}</span>
                    <span class="text-[10px] text-slate-500 block">${ep.assistido && ep.dataCheck ? 'Check em: ' + ep.dataCheck : ''}</span>
                </div>
                <label class="flex items-center space-x-2 cursor-pointer select-none">
                    <span class="text-xs font-semibold ${ep.assistido ? 'text-emerald-400' : 'text-slate-400'}">${ep.assistido ? 'Assistido' : 'Não Assistido'}</span>
                    <input type="checkbox" ${ep.assistido ? 'checked' : ''} onchange="toggleEpisodio(${item.id}, '${currentSelectedTemp}', ${idx})" class="w-4 h-4 rounded accent-blue-600 cursor-pointer">
                </label>
            </div>
        `;
    });

    document.getElementById('detalhe-conteudo').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            <div class="md:col-span-1 overflow-hidden rounded-2xl shadow-2xl bg-slate-950 flex items-center justify-center">
                <img src="${item.poster}" alt="${item.nome}" class="w-full h-auto object-cover rounded-2xl max-h-[450px]">
            </div>
            <div class="md:col-span-3 space-y-6">
                <div>
                    <span class="text-xs uppercase tracking-widest text-${accentColor}-400 font-bold">${item.genero}</span>
                    <h3 class="text-3xl font-extrabold text-white mt-1">${item.nome}</h3>
                </div>
                <div>
                    <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Resumo</h4>
                    <p class="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">${item.resumo}</p>
                </div>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Episódios & Progresso</h4>
                        <select onchange="mudarTemporada(this.value)" class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer">
                            ${optionsTemp}
                        </select>
                    </div>
                    <div class="space-y-2 max-h-60 overflow-y-auto pr-2">${epsHtml}</div>
                </div>

                <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Minha Avaliação ⭐</h4>
                        <p class="text-xs text-slate-500">Selecione de 1 a 5 estrelas</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <select id="select-avaliacao-${item.id}" class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                            <option value="5" ${item.avaliacao === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5/5)</option>
                            <option value="4" ${item.avaliacao === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4/5)</option>
                            <option value="3" ${item.avaliacao === 3 ? 'selected' : ''}>⭐⭐⭐ (3/5)</option>
                            <option value="2" ${item.avaliacao === 2 ? 'selected' : ''}>⭐⭐ (2/5)</option>
                            <option value="1" ${item.avaliacao === 1 ? 'selected' : ''}>⭐ (1/5)</option>
                        </select>
                        <button onclick="salvarAvaliacao(${item.id})" class="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function mudarTemporada(tempNum) {
    currentSelectedTemp = tempNum;
    renderizarConteudoDetalhes();
}

function toggleEpisodio(itemId, tempNum, epIndex) {
    const item = mediaList.find(m => m.id === itemId);
    if (item && item.temporadasDados[tempNum] && item.temporadasDados[tempNum][epIndex]) {
        const ep = item.temporadasDados[tempNum][epIndex];
        ep.assistido = !ep.assistido;
        ep.dataCheck = ep.assistido ? new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "";
        salvarNoLocalStorage();
        renderizarConteudoDetalhes();
    }
}

function salvarAvaliacao(id) {
    const select = document.getElementById(`select-avaliacao-${id}`);
    const novaNota = parseInt(select.value);
    const item = mediaList.find(m => m.id === id);
    if (item) {
        item.avaliacao = novaNota;
        salvarNoLocalStorage();
        alert("Avaliação salva com sucesso!");
    }
}

function deleteItem(id, category) {
    mediaList = mediaList.filter(item => item.id !== id);
    salvarNoLocalStorage();
    switchSubPage(category);
}

function removerPorCategoria(tipoCategoria) {
    if (confirm(`Deseja realmente remover todos os itens de ${tipoCategoria}?`)) {
        mediaList = mediaList.filter(item => item.tipo !== tipoCategoria);
        salvarNoLocalStorage();
        renderMediaList(tipoCategoria === 'Filme' ? 'filmes' : (tipoCategoria === 'Série' ? 'series' : 'animes'));
    }
}

function removerTodosTitulos() {
    if (confirm("Deseja realmente remover TODOS os títulos?")) {
        mediaList = [];
        salvarNoLocalStorage();
        switchSubPage('main');
    }
}

function renderContasCasa() {
    const container = document.getElementById('grid-contas-casa');
    const btnAddContas = document.getElementById('btn-add-contas');
    if (!container) return;

    const isVipLogado = adminLogadoAtual && adminLogadoAtual.vip === true;
    if (btnAddContas) {
        if (isVipLogado) btnAddContas.classList.remove('hidden');
        else btnAddContas.classList.add('hidden');
    }

    let html = '';
    acessosList.forEach(acc => {
        let exibirLuz = acc.temLuz !== false;
        let exibirAgua = acc.temAgua !== false;

        let luzCamposHtml = '';
        if (acc.luzPortal) luzCamposHtml += `<div class="col-span-full mb-1"><a href="${acc.luzPortal}" target="_blank" class="text-xs text-blue-400 hover:underline">Energia - ${acc.luzPortal}</a></div>`;
        if (acc.luzLogin) luzCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Login/UC: <strong class="text-white">${acc.luzLogin}</strong></span><button onclick="copiarTexto('${acc.luzLogin}')" class="text-slate-400 hover:text-amber-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;
        if (acc.luzSenha) luzCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Senha: <strong class="text-white">${acc.luzSenha}</strong></span><button onclick="copiarTexto('${acc.luzSenha}')" class="text-slate-400 hover:text-amber-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;

        let aguaCamposHtml = '';
        if (acc.aguaPortal) aguaCamposHtml += `<div class="col-span-full mb-1"><a href="${acc.aguaPortal}" target="_blank" class="text-xs text-blue-400 hover:underline">Água - ${acc.aguaPortal}</a></div>`;
        if (acc.aguaCpf) aguaCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">CPF: <strong class="text-white">${acc.aguaCpf}</strong></span><button onclick="copiarTexto('${acc.aguaCpf}')" class="text-slate-400 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;
        if (acc.aguaMatricula) aguaCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Matrícula: <strong class="text-white">${acc.aguaMatricula}</strong></span><button onclick="copiarTexto('${acc.aguaMatricula}')" class="text-slate-400 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;
        if (acc.aguaSenha) aguaCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Senha: <strong class="text-white">${acc.aguaSenha}</strong></span><button onclick="copiarTexto('${acc.aguaSenha}')" class="text-slate-400 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;

        let botoesAcaoItem = isVipLogado ? `
            <div class="flex items-center space-x-1">
                <button onclick="openEditAccessModal(${acc.id})" class="text-amber-400 hover:text-amber-300 p-2 text-xs" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteAccess(${acc.id})" class="text-rose-400 hover:text-rose-300 p-2 text-xs" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : '';

        html += `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div class="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                        <h3 class="text-lg font-bold text-white flex items-center"><i class="fa-solid fa-house-user text-emerald-400 mr-2"></i> ${acc.nome}</h3>
                        <p class="text-xs text-slate-400 mt-0.5">${acc.morada || 'Morada não informada'}</p>
                    </div>
                    ${botoesAcaoItem}
                </div>
                ${exibirLuz && luzCamposHtml ? `<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"><span class="text-xs font-bold text-amber-400 uppercase">Energia / Luz</span><div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">${luzCamposHtml}</div></div>` : ''}
                ${exibirAgua && aguaCamposHtml ? `<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"><span class="text-xs font-bold text-cyan-400 uppercase">Água / Saneamento</span><div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">${aguaCamposHtml}</div></div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderAcessos() {
    const container = document.getElementById('grid-acessos');
    const btnAddSenhas = document.getElementById('btn-add-senhas');
    if (!container) return;

    const isVipLogado = adminLogadoAtual && adminLogadoAtual.vip === true;
    if (btnAddSenhas) {
        if (isVipLogado) btnAddSenhas.classList.remove('hidden');
        else btnAddSenhas.classList.add('hidden');
    }

    let html = '';
    acessosList.forEach(acc => {
        let exibirLuz = acc.temLuz !== false;
        let exibirAgua = acc.temAgua !== false;

        let luzCamposHtml = '';
        if (acc.luzLogin) luzCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Login/UC: <strong class="text-white">${acc.luzLogin}</strong></span><button onclick="copiarTexto('${acc.luzLogin}')" class="text-slate-400 hover:text-amber-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;
        if (acc.luzSenha) luzCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Senha: <strong class="text-white">${acc.luzSenha}</strong></span><button onclick="copiarTexto('${acc.luzSenha}')" class="text-slate-400 hover:text-amber-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;

        let aguaCamposHtml = '';
        if (acc.aguaCpf) aguaCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">CPF: <strong class="text-white">${acc.aguaCpf}</strong></span><button onclick="copiarTexto('${acc.aguaCpf}')" class="text-slate-400 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;
        if (acc.aguaMatricula) aguaCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Matrícula: <strong class="text-white">${acc.aguaMatricula}</strong></span><button onclick="copiarTexto('${acc.aguaMatricula}')" class="text-slate-400 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;
        if (acc.aguaSenha) aguaCamposHtml += `<div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Senha: <strong class="text-white">${acc.aguaSenha}</strong></span><button onclick="copiarTexto('${acc.aguaSenha}')" class="text-slate-400 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>`;

        let botoesAcaoItem = isVipLogado ? `
            <div class="flex items-center space-x-1">
                <button onclick="openEditAccessModal(${acc.id})" class="text-amber-400 hover:text-amber-300 p-2 text-xs" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteAccess(${acc.id})" class="text-rose-400 hover:text-rose-300 p-2 text-xs" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : '';

        html += `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div class="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                        <h3 class="text-lg font-bold text-white flex items-center"><i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i> ${acc.nome}</h3>
                        <p class="text-xs text-slate-400 mt-0.5">${acc.morada || ''}</p>
                    </div>
                    ${botoesAcaoItem}
                </div>
                ${exibirLuz && luzCamposHtml ? `<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"><span class="text-xs font-bold text-amber-400 uppercase">Energia / Luz</span><div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">${luzCamposHtml}</div></div>` : ''}
                ${exibirAgua && aguaCamposHtml ? `<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"><span class="text-xs font-bold text-cyan-400 uppercase">Água / Saneamento</span><div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">${aguaCamposHtml}</div></div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderSenhasPessoais() {
    const container = document.getElementById('grid-senhas-pessoais');
    if (!container) return;

    if (!adminLogadoAtual) {
        container.innerHTML = `<div class="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400"><p class="text-white">Faça login com a sua conta para ver as suas senhas pessoais.</p></div>`;
        return;
    }

    const minhasSenhas = senhasPessoaisList.filter(item => item.userLogin === adminLogadoAtual.login);
    if (minhasSenhas.length === 0) {
        container.innerHTML = `<div class="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400"><p class="text-white">Nenhuma credencial pessoal encontrada.</p></div>`;
        return;
    }

    let html = '';
    minhasSenhas.forEach(item => {
        let linkHtml = item.url ? `<a href="${item.url}" target="_blank" class="text-xs text-blue-400 hover:underline flex items-center mt-1"><i class="fa-solid fa-arrow-up-right-from-square mr-1 text-[10px]"></i> ${item.url}</a>` : '';
        html += `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div class="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                        <h3 class="text-lg font-bold text-white flex items-center"><i class="fa-solid fa-key text-purple-400 mr-2"></i> ${item.servico}</h3>
                        ${linkHtml}
                    </div>
                    <div class="flex items-center space-x-1">
                        <button onclick="openEditPersonalPassModal(${item.id})" class="text-amber-400 p-2 text-xs"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deletePersonalPass(${item.id})" class="text-rose-400 p-2 text-xs"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Login: <strong class="text-white">${item.login}</strong></span><button onclick="copiarTexto('${item.login}')" class="text-slate-400 hover:text-purple-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>
                    <div class="bg-slate-900 p-2 rounded-lg flex justify-between items-center border border-slate-800"><span class="text-slate-400 truncate">Senha: <strong class="text-white">${item.senha}</strong></span><button onclick="copiarTexto('${item.senha}')" class="text-slate-400 hover:text-purple-400 text-[10px]"><i class="fa-regular fa-copy"></i></button></div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function openPersonalPassModal() {
    if (!adminLogadoAtual) {
        alert("Efetue login primeiro.");
        solicitarSenhaTab('senhas-pessoais');
        return;
    }
    document.getElementById('personal-id').value = '';
    document.getElementById('personal-pass-form').reset();
    document.getElementById('personal-modal-title').innerHTML = '<i class="fa-solid fa-key text-purple-400 mr-2"></i> Nova Credencial Pessoal';
    document.getElementById('personal-pass-modal').classList.remove('hidden');
}

function closePersonalPassModal() {
    document.getElementById('personal-pass-modal').classList.add('hidden');
}

function handlePersonalPassSubmit(event) {
    event.preventDefault();
    if (!adminLogadoAtual) return;

    const idInput = document.getElementById('personal-id').value;
    const servico = document.getElementById('pers-servico').value.trim();
    const url = document.getElementById('pers-url').value.trim();
    const login = document.getElementById('pers-login').value.trim();
    const senha = document.getElementById('pers-senha').value.trim();

    if (idInput) {
        const item = senhasPessoaisList.find(p => p.id == idInput);
        if (item && item.userLogin === adminLogadoAtual.login) {
            item.servico = servico;
            item.url = url;
            item.login = login;
            item.senha = senha;
        }
    } else {
        senhasPessoaisList.push({
            id: Date.now(),
            userLogin: adminLogadoAtual.login,
            servico,
            url,
            login,
            senha
        });
    }

    salvarNoLocalStorage();
    closePersonalPassModal();
    renderSenhasPessoais();
}

function openEditPersonalPassModal(id) {
    const item = senhasPessoaisList.find(p => p.id === id);
    if (!item) return;

    document.getElementById('personal-id').value = item.id;
    document.getElementById('pers-servico').value = item.servico;
    document.getElementById('pers-url').value = item.url || '';
    document.getElementById('pers-login').value = item.login;
    document.getElementById('pers-senha').value = item.senha;
    document.getElementById('personal-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-400 mr-2"></i> Editar Credencial Pessoal';
    document.getElementById('personal-pass-modal').classList.remove('hidden');
}

function deletePersonalPass(id) {
    if (confirm("Deseja realmente remover esta credencial?")) {
        senhasPessoaisList = senhasPessoaisList.filter(p => p.id !== id);
        salvarNoLocalStorage();
        renderSenhasPessoais();
    }
}

function renderAdmins() {
    const container = document.getElementById('lista-admins');
    const btnAddAdmin = document.getElementById('btn-add-admin-container');
    if (!container) return;

    const isVipLogado = adminLogadoAtual && adminLogadoAtual.vip === true;
    if (btnAddAdmin) {
        if (isVipLogado) btnAddAdmin.classList.remove('hidden');
        else btnAddAdmin.classList.add('hidden');
    }

    let html = '';
    adminsList.forEach(adm => {
        let badgeVip = adm.vip ? `<span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 uppercase">VIP</span>` : `<span class="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md ml-2 uppercase">Normal</span>`;
        let botoesAcao = isVipLogado ? `
            <div class="flex items-center space-x-1">
                <button onclick="openEditAdminModal(${adm.id})" class="text-amber-400 p-2 text-xs"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteAdmin(${adm.id})" class="text-rose-400 p-2 text-xs"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : '';

        html += `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div class="space-y-1">
                    <h4 class="text-sm font-bold text-white flex items-center"><i class="fa-solid fa-user-shield text-blue-400 mr-2 text-xs"></i> ${adm.nome} ${badgeVip}</h4>
                    <p class="text-xs text-slate-400">Login: <span class="text-slate-200">${adm.login}</span></p>
                </div>
                ${botoesAcao}
            </div>
        `;
    });
    container.innerHTML = html;
}

function openAdminModal() {
    if (!adminLogadoAtual || !adminLogadoAtual.vip) {
        alert("Acesso negado! Apenas administradores VIP.");
        return;
    }
    document.getElementById('admin-modal').classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.add('hidden');
    document.getElementById('admin-form').reset();
}

function handleAdminSubmit(event) {
    event.preventDefault();
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;

    adminsList.push({
        id: Date.now(),
        nome: document.getElementById('adm-nome').value,
        login: document.getElementById('adm-login').value,
        senha: document.getElementById('adm-senha').value,
        vip: document.getElementById('adm-vip').checked
    });
    salvarNoLocalStorage();
    closeAdminModal();
    renderAdmins();
}

function openEditAdminModal(id) {
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;
    const adm = adminsList.find(a => a.id === id);
    if (!adm) return;

    document.getElementById('edit-adm-id').value = adm.id;
    document.getElementById('edit-adm-nome').value = adm.nome;
    document.getElementById('edit-adm-login').value = adm.login;
    document.getElementById('edit-adm-senha').value = adm.senha;
    document.getElementById('edit-adm-vip').checked = adm.vip;
    document.getElementById('edit-admin-modal').classList.remove('hidden');
}

function closeEditAdminModal() {
    document.getElementById('edit-admin-modal').classList.add('hidden');
}

function handleEditAdminSubmit(event) {
    event.preventDefault();
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;

    const id = parseInt(document.getElementById('edit-adm-id').value);
    const adm = adminsList.find(a => a.id === id);
    if (!adm) return;

    adm.nome = document.getElementById('edit-adm-nome').value;
    adm.login = document.getElementById('edit-adm-login').value;
    adm.senha = document.getElementById('edit-adm-senha').value;
    adm.vip = document.getElementById('edit-adm-vip').checked;

    salvarNoLocalStorage();
    closeEditAdminModal();
    renderAdmins();
}

function deleteAdmin(id) {
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;
    if (confirm("Deseja realmente remover este administrador?")) {
        adminsList = adminsList.filter(a => a.id !== id);
        salvarNoLocalStorage();
        renderAdmins();
    }
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert("Copiado para a área de transferência: " + texto);
    });
}

function openAccessModal() {
    if (!adminLogadoAtual || !adminLogadoAtual.vip) {
        alert("Acesso negado! Apenas administradores VIP.");
        return;
    }
    document.getElementById('access-modal').classList.remove('hidden');
}

function closeAccessModal() {
    document.getElementById('access-modal').classList.add('hidden');
}

function handleAccessSubmit(event) {
    event.preventDefault();
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;

    const temLuz = document.getElementById('chk-luz').checked;
    const temAgua = document.getElementById('chk-agua').checked;

    acessosList.push({
        id: Date.now(),
        nome: document.getElementById('acc-nome').value,
        morada: document.getElementById('acc-morada').value,
        temLuz,
        luzPortal: temLuz ? document.getElementById('acc-luz-portal').value : '',
        luzLogin: temLuz ? document.getElementById('acc-luz-login').value : '',
        luzSenha: temLuz ? document.getElementById('acc-luz-senha').value : '',
        temAgua,
        aguaPortal: temAgua ? document.getElementById('acc-agua-portal').value : '',
        aguaCpf: temAgua ? document.getElementById('acc-agua-cpf').value : '',
        aguaMatricula: temAgua ? document.getElementById('acc-agua-mat').value : '',
        aguaSenha: temAgua ? document.getElementById('acc-agua-senha').value : ''
    });

    salvarNoLocalStorage();
    closeAccessModal();
    renderAcessos();
    renderContasCasa();
}

function openEditAccessModal(id) {
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;
    const acc = acessosList.find(a => a.id === id);
    if (!acc) return;

    document.getElementById('edit-acc-id').value = acc.id;
    document.getElementById('edit-acc-nome').value = acc.nome;
    document.getElementById('edit-acc-morada').value = acc.morada || '';
    document.getElementById('edit-acc-luz-portal').value = acc.luzPortal || '';
    document.getElementById('edit-acc-luz-login').value = acc.luzLogin || '';
    document.getElementById('edit-acc-luz-senha').value = acc.luzSenha || '';
    document.getElementById('edit-acc-agua-portal').value = acc.aguaPortal || '';
    document.getElementById('edit-acc-agua-cpf').value = acc.aguaCpf || '';
    document.getElementById('edit-acc-agua-mat').value = acc.aguaMatricula || '';
    document.getElementById('edit-acc-agua-senha').value = acc.aguaSenha || '';

    document.getElementById('edit-access-modal').classList.remove('hidden');
}

function closeEditAccessModal() {
    document.getElementById('edit-access-modal').classList.add('hidden');
}

function handleEditAccessSubmit(event) {
    event.preventDefault();
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;

    const id = parseInt(document.getElementById('edit-acc-id').value);
    const acc = acessosList.find(a => a.id === id);
    if (!acc) return;

    acc.nome = document.getElementById('edit-acc-nome').value;
    acc.morada = document.getElementById('edit-acc-morada').value;
    acc.luzPortal = document.getElementById('edit-acc-luz-portal').value;
    acc.luzLogin = document.getElementById('edit-acc-luz-login').value;
    acc.luzSenha = document.getElementById('edit-acc-luz-senha').value;
    acc.aguaPortal = document.getElementById('edit-acc-agua-portal').value;
    acc.aguaCpf = document.getElementById('edit-acc-agua-cpf').value;
    acc.aguaMatricula = document.getElementById('edit-acc-agua-mat').value;
    acc.aguaSenha = document.getElementById('edit-acc-agua-senha').value;

    salvarNoLocalStorage();
    closeEditAccessModal();
    renderAcessos();
    renderContasCasa();
}

function deleteAccess(id) {
    if (!adminLogadoAtual || !adminLogadoAtual.vip) return;
    if (confirm("Deseja realmente excluir este registo?")) {
        acessosList = acessosList.filter(a => a.id !== id);
        salvarNoLocalStorage();
        renderAcessos();
        renderContasCasa();
    }
}

function switchTab(tabId) {
    ['home', 'automacao', 'tv', 'contas', 'senhas', 'senhas-pessoais', 'administrador'].forEach(t => {
        const element = document.getElementById('tab-' + t);
        const btn = document.getElementById('btn-' + t);
        if (element) element.classList.add('hidden');
        if (btn) {
            btn.classList.remove('active', 'text-white');
            btn.classList.add('bg-slate-900/60', 'text-slate-400');
        }
    });

    ['filmes', 'series', 'animes', 'detalhes'].forEach(sub => {
        const subEl = document.getElementById('subpage-' + sub);
        if (subEl) subEl.classList.add('hidden');
    });

    const targetTab = document.getElementById('tab-' + tabId);
    const targetBtn = document.getElementById('btn-' + tabId);
    if (targetTab) targetTab.classList.remove('hidden');
    if (targetBtn) {
        targetBtn.classList.add('active', 'text-white');
        targetBtn.classList.remove('bg-slate-900/60', 'text-slate-400');
    }

    if (tabId === 'senhas') renderAcessos();
    if (tabId === 'contas') renderContasCasa();
    if (tabId === 'senhas-pessoais') renderSenhasPessoais();
    if (tabId === 'administrador') renderAdmins();
}

function switchSubPage(page) {
    const tabTv = document.getElementById('tab-tv');
    ['filmes', 'series', 'animes', 'detalhes'].forEach(s => {
        const el = document.getElementById('subpage-' + s);
        if (el) el.classList.add('hidden');
    });

    if (page === 'main') {
        if (tabTv) tabTv.classList.remove('hidden');
    } else {
        if (tabTv) tabTv.classList.add('hidden');
        currentActiveCategory = page;
        const targetSub = document.getElementById('subpage-' + page);
        if (targetSub) {
            targetSub.classList.remove('hidden');
            renderMediaList(page);
        }
    }
}