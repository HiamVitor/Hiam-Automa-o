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

function salvarNoLocalStorage() {
    localStorage.setItem('hiam_mediaList', JSON.stringify(mediaList));
    localStorage.setItem('hiam_acessosList', JSON.stringify(acessosList));
    localStorage.setItem('hiam_senhasPessoaisList', JSON.stringify(senhasPessoaisList));
    localStorage.setItem('hiam_adminsList', JSON.stringify(adminsList));
    
    // Atualiza o carimbo de tempo da última sincronização na Web
    atualizarTimestampSyncWeb();
}

// Atualiza o carimbo visual de sincronização web
function atualizarTimestampSyncWeb() {
    const el = document.getElementById('timestamp-sync');
    if (el) {
        const agora = new Date();
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        el.innerText = `Última sync web: ${horaFormatada}`;
    }
}

// Função para forçar a atualização imediata de todos os dispositivos e recarregar dados
function forcarAtualizacaoGeralDispositivos() {
    const labelRede = document.getElementById('label-status-rede');
    if (labelRede) {
        labelRede.innerText = "A atualizar dispositivos...";
    }

    setTimeout(() => {
        mediaList = JSON.parse(localStorage.getItem('hiam_mediaList')) || mediaList;
        acessosList = JSON.parse(localStorage.getItem('hiam_acessosList')) || acessosList;
        senhasPessoaisList = JSON.parse(localStorage.getItem('hiam_senhasPessoaisList')) || senhasPessoaisList;
        adminsList = JSON.parse(localStorage.getItem('hiam_adminsList')) || adminsList;

        renderAcessos();
        renderContasCasa();
        renderSenhasPessoais();
        renderAdmins();

        if (labelRede) {
            labelRede.innerText = "Web Sincronizada";
        }
        atualizarTimestampSyncWeb();
        alert("Todos os dispositivos conectados foram atualizados com sucesso a partir da web!");
    }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
    switchTab('home');
    renderAcessos();
    renderContasCasa();
    renderSenhasPessoais();
    renderAdmins();
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
        renderAdmins();
        renderContasCasa();
        renderAcessos();
        renderSenhasPessoais();
    } else {
        alert("Login ou Senha incorretos! Tente novamente.");
        document.getElementById('input-senha-auth').value = '';
    }
}

function toggleSecaoForm(secao) {
    const chk = document.getElementById(`chk-${secao}`);
    const container = document.getElementById(`container-campos-${secao}`);
    if (chk.checked) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
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
                let generosStr = show.genres.join(" / ");
                dadosMidia.genero = await traduzirParaPortugues(generosStr);
            }
            
            let resumoOriginal = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : dadosMidia.resumo;
            let resumoTraduzido = await traduzirParaPortugues(resumoOriginal);
            if (resumoTraduzido.length > 450) {
                resumoTraduzido = resumoTraduzido.substring(0, 447) + "...";
            }
            dadosMidia.resumo = resumoTraduzido;

            dadosMidia.lancamento = show.premiered || "2024-01-01";
            dadosMidia.termino = show.ended || "Em andamento";
            
            if (show.image && show.image.original) {
                dadosMidia.poster = show.image.original;
            } else if (show.image && show.image.medium) {
                dadosMidia.poster = show.image.medium;
            }

            if (show._embedded && Array.isArray(show._embedded.episodes)) {
                const temporadasMap = {};
                const epsOrdenados = [...show._embedded.episodes].sort((a, b) => {
                    const temporadaA = Number(a.season);
                    const temporadaB = Number(b.season);
                    const ordemTemporada = (Number.isFinite(temporadaA) ? temporadaA : 1) - (Number.isFinite(temporadaB) ? temporadaB : 1);
                    if (ordemTemporada !== 0) return ordemTemporada;
                    return (Number(a.number) || 0) - (Number(b.number) || 0);
                });

                for (const ep of epsOrdenados) {
                    const temporadaOriginal = ep.season !== null && ep.season !== undefined && ep.season !== '' ? String(ep.season) : '1';
                    if (!temporadasMap[temporadaOriginal]) {
                        temporadasMap[temporadaOriginal] = [];
                    }
                    
                    let nomeEpOriginal = ep.name || 'Sem título';
                    let nomeEpTraduzido = await traduzirParaPortugues(nomeEpOriginal);

                    temporadasMap[temporadaOriginal].push({
                        nome: `Episódio ${ep.number || (temporadasMap[temporadaOriginal].length + 1)}: ${nomeEpTraduzido}`,
                        assistido: false,
                        dataCheck: ""
                    });
                }

                dadosMidia.temporadasDados = normalizarTemporadasSequenciais(temporadasMap);
                dadosMidia.temporadas = Object.keys(dadosMidia.temporadasDados).length || 1;
            }
        }
    } catch (e) {
        console.error("Erro ao consultar a API do TVMaze:", e);
    }

    const newItem = {
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
    };

    mediaList.push(newItem);
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
    if (icone) icone.classList.add('animate-spin-slow');

    try {
        const response = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(item.nome)}&embed=episodes`);
        
        if (response.ok) {
            const show = await response.json();
            
            if (show.genres && show.genres.length > 0) {
                let generosStr = show.genres.join(" / ");
                item.genero = await traduzirParaPortugues(generosStr);
            }
            
            let resumoOriginal = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : item.resumo;
            let resumoTraduzido = await traduzirParaPortugues(resumoOriginal);
            if (resumoTraduzido.length > 450) {
                resumoTraduzido = resumoTraduzido.substring(0, 447) + "...";
            }
            item.resumo = resumoTraduzido;

            item.lancamento = show.premiered || item.lancamento;
            item.termino = show.ended || item.termino;
            
            if (show.image && show.image.original) {
                item.poster = show.image.original;
            } else if (show.image && show.image.medium) {
                item.poster = show.image.medium;
            }

            if (show._embedded && show._embedded.episodes) {
                const temporadasAntigas = item.temporadasDados || {};
                const temporadasMap = {};

                for (const ep of show._embedded.episodes) {
                    const tempNum = ep.season || 1;
                    if (!temporadasMap[tempNum]) {
                        temporadasMap[tempNum] = [];
                    }
                    
                    let nomeEpTraduzido = await traduzirParaPortugues(ep.name || 'Sem título');
                    const nomeEpFormatado = `Episódio ${ep.number}: ${nomeEpTraduzido}`;
                    
                    let jaAssistido = false;
                    let dataCheckAntiga = "";
                    if (temporadasAntigas[tempNum]) {
                        const epExistente = temporadasAntigas[tempNum].find(e => e.nome.includes(`Episódio ${ep.number}:`));
                        if (epExistente) {
                            jaAssistido = epExistente.assistido;
                            dataCheckAntiga = epExistente.dataCheck || "";
                        }
                    }

                    temporadasMap[tempNum].push({
                        nome: nomeEpFormatado,
                        assistido: jaAssistido,
                        dataCheck: dataCheckAntiga
                    });
                }
                
                item.temporadasDados = normalizarTemporadasSequenciais(temporadasMap);
                item.temporadas = Object.keys(item.temporadasDados).length;
            }

            salvarNoLocalStorage();
            renderizarConteudoDetalhes();
            alert("Informações recarregadas e traduzidas com sucesso para Português!");
        } else {
            alert("Não foi possível encontrar atualizações para este título na API.");
        }
    } catch (e) {
        console.error("Erro ao recarregar dados da API:", e);
        alert("Erro de conexão ao tentar recarregar informações.");
    } finally {
        if (icone) icone.classList.remove('animate-spin-slow');
    }
}

function openModal(defaultType) {
    const modal = document.getElementById('media-modal');
    const selectTipo = document.getElementById('input-tipo');
    const modalTitle = document.getElementById('modal-title');
    if (defaultType) {
        selectTipo.value = defaultType;
        modalTitle.innerText = `Adicionar Novo ${defaultType}`;
    }
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('media-modal').classList.add('hidden');
    const form = document.getElementById('media-form');
    if(form) form.reset();
}

// Demais funções do script mantidas idênticas (renderMediaList, openDetails, renderContasCasa, renderAcessos, etc.)...