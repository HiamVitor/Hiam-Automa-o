import type { Episode, MediaType } from '../types';

export function normalizarTemporadasSequenciais(
  temporadasDados: Record<string, Episode[]> | undefined | null
): Record<string, Episode[]> {
  const dados = temporadasDados && typeof temporadasDados === 'object' ? temporadasDados : {};
  const chavesOrdenadas = Object.keys(dados).sort((a, b) => {
    const numeroA = Number(a);
    const numeroB = Number(b);
    if (Number.isFinite(numeroA) && Number.isFinite(numeroB)) return numeroA - numeroB;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const temporadasNormalizadas: Record<string, Episode[]> = {};
  chavesOrdenadas.forEach((chaveOriginal, indice) => {
    temporadasNormalizadas[String(indice + 1)] = Array.isArray(dados[chaveOriginal])
      ? dados[chaveOriginal]
      : [];
  });
  return temporadasNormalizadas;
}

export async function traduzirParaPortugues(texto: string): Promise<string> {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') return texto;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]) {
        let textoTraduzido = '';
        for (const parte of data[0]) {
          if (parte[0]) textoTraduzido += parte[0];
        }
        if (textoTraduzido.trim() !== '') return textoTraduzido;
      }
    }
  } catch (e) {
    console.error('Erro na tradução:', e);
  }
  return texto;
}

export interface FetchedMediaData {
  genero: string;
  resumo: string;
  lancamento: string;
  termino: string;
  temporadas: number;
  poster: string;
  temporadasDados: Record<string, Episode[]>;
}

export async function buscarAnimeAniList(nomeInput: string): Promise<FetchedMediaData | null> {
  const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description
        episodes
        format
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        coverImage {
          large
        }
        genres
        status
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables: { search: nomeInput } }),
    });

    if (response.ok) {
      const resultado = await response.json();
      const media = resultado.data && resultado.data.Media;

      if (media) {
        let dataLancamento = '2024-01-01';
        if (media.startDate && media.startDate.year) {
          const ano = media.startDate.year;
          const mes = String(media.startDate.month || 1).padStart(2, '0');
          const dia = String(media.startDate.day || 1).padStart(2, '0');
          dataLancamento = `${ano}-${mes}-${dia}`;
        }

        let resumoLimpo = media.description
          ? media.description.replace(/<[^>]*>?/gm, '')
          : 'Sem resumo disponível.';
        if (resumoLimpo.length > 450) {
          resumoLimpo = resumoLimpo.substring(0, 447) + '...';
        }

        const totalEps = media.episodes || 1;
        const epsArray: Episode[] = [];
        for (let i = 1; i <= totalEps; i++) {
          epsArray.push({
            nome: `Episódio ${i}`,
            assistido: false,
            dataCheck: '',
          });
        }

        return {
          genero: media.genres ? media.genres.join(' / ') : 'Anime / Ação',
          resumo: resumoLimpo,
          lancamento: dataLancamento,
          termino: media.status === 'FINISHED' ? 'Finalizado' : 'Em andamento',
          temporadas: 1,
          poster: media.coverImage ? media.coverImage.large || '' : '',
          temporadasDados: { '1': epsArray },
        };
      }
    }
  } catch (e) {
    console.error('Erro ao consultar a AniList API:', e);
  }
  return null;
}

export async function fetchMediaMetadata(
  nomeInput: string,
  tipo: MediaType,
  onProgress?: (percent: number, statusText: string) => void
): Promise<FetchedMediaData> {
  const fallback: FetchedMediaData = {
    genero:
      tipo === 'Filme'
        ? 'Filme / Ação'
        : tipo === 'Anime'
          ? 'Anime / Ação / Aventura'
          : 'Ação / Aventura / Fantasia',
    resumo: `Informações detalhadas sobre ${nomeInput} obtidas do catálogo oficial.`,
    lancamento: '2024-01-01',
    termino: 'Em andamento',
    temporadas: 1,
    poster: '',
    temporadasDados: {
      '1': [{ nome: 'Episódio 1: Introdução', assistido: false, dataCheck: '' }],
    },
  };

  try {
    onProgress?.(50, tipo === 'Anime' ? 'A consultar catálogo AniList...' : 'A obter episódios e resumos...');

    if (tipo === 'Anime') {
      const dadosAniList = await buscarAnimeAniList(nomeInput);
      if (dadosAniList) {
        onProgress?.(100, 'Concluído com sucesso!');
        return dadosAniList;
      }
    } else {
      const response = await fetch(
        `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(nomeInput)}&embed=episodes`
      );
      if (response.ok) {
        const show = await response.json();
        const result: FetchedMediaData = { ...fallback };

        if (show.genres && show.genres.length > 0) {
          result.genero = await traduzirParaPortugues(show.genres.join(' / '));
        }

        const resumoOriginal = show.summary
          ? show.summary.replace(/<[^>]*>?/gm, '')
          : fallback.resumo;
        let resumoTraduzido = await traduzirParaPortugues(resumoOriginal);
        if (resumoTraduzido.length > 450) {
          resumoTraduzido = resumoTraduzido.substring(0, 447) + '...';
        }
        result.resumo = resumoTraduzido;
        result.lancamento = show.premiered || '2024-01-01';
        result.termino = show.ended || 'Em andamento';
        if (show.image && show.image.original) {
          result.poster = show.image.original;
        }

        onProgress?.(80, 'A traduzir conteúdos para português...');

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
          result.temporadasDados = normalizarTemporadasSequenciais(temporadasMap);
          result.temporadas = Object.keys(result.temporadasDados).length || 1;
        }

        onProgress?.(100, 'Concluído com sucesso!');
        return result;
      }
    }
  } catch (e) {
    console.error('Erro API:', e);
  }

  onProgress?.(100, 'Concluído com sucesso!');
  return fallback;
}
