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
    }
];

let senhasPessoaisList = JSON.parse(localStorage.getItem('hiam_senhasPessoaisList')) || [];
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

// Salva localmente e envia para o Firebase no caminho correto: coleção 'dados', documento 'principal'
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

// Carrega os dados do Firebase e mantém a escuta ativa em tempo real para qualquer aparelho[cite: 1]
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
    if (!document.getElementById('subpage-' + currentActiveCategory).classList.contains('hidden')) {
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
            dadosMidia.resumo = await traduzirParaPortugues(resumoOriginal);
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
    if (!container) return;
    let html = '';
    acessosList.forEach(acc => {
        html += `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 class="text-lg font-bold text-white flex items-center">
                    <i class="fa-solid fa-house-user text-emerald-400 mr-2"></i> ${acc.nome}
                </h3>
                <p class="text-xs text-slate-400">${acc.morada || ''}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderAcessos() {
    const container = document.getElementById('grid-acessos');
    if (!container) return;
    let html = '';
    acessosList.forEach(acc => {
        html += `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 class="text-lg font-bold text-white flex items-center">
                    <i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i> ${acc.nome}
                </h3>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderSenhasPessoais() {
    const container = document.getElementById('grid-senhas-pessoais');
    if (!container) return;
    if (!adminLogadoAtual) {
        container.innerHTML = `<div class="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400"><p class="text-white">Efetue login para ver as suas senhas pessoais.</p></div>`;
        return;
    }
    container.innerHTML = `<div class="col-span-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400"><p class="text-white">Cofre Pessoal Desbloqueado.</p></div>`;
}

function renderAdmins() {
    const container = document.getElementById('lista-admins');
    if (!container) return;
    let html = '';
    adminsList.forEach(adm => {
        html += `<div class="bg-slate-950 border border-slate-800 rounded-xl p-4"><h4 class="text-sm font-bold text-white">${adm.nome} (${adm.login})</h4></div>`;
    });
    container.innerHTML = html;
}

function switchTab(tabId) {
    ['home', 'automacao', 'tv', 'contas', 'senhas', 'senhas-pessoais', 'administrador'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        const btn = document.getElementById('btn-' + t);
        if (el) el.classList.add('hidden');
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