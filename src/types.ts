export type TabId =
  | 'home'
  | 'automacao'
  | 'tv'
  | 'contas'
  | 'senhas'
  | 'senhas-pessoais'
  | 'financeiro'
  | 'administrador';

export type TvSubPage = 'main' | 'filmes' | 'series' | 'animes' | 'detalhes';
export type MediaCategory = 'filmes' | 'series' | 'animes';
export type MediaType = 'Filme' | 'Série' | 'Anime';

export interface Episode {
  nome: string;
  assistido: boolean;
  dataCheck: string;
}

export interface MediaItem {
  id: number;
  nome: string;
  tipo: MediaType;
  genero: string;
  resumo: string;
  lancamento: string;
  termino: string;
  temporadas: number;
  poster: string;
  temporadasDados: Record<string, Episode[]>;
  avaliacao: number;
}

export interface AccessAccount {
  id: number;
  nome: string;
  morada?: string;
  tipoConta: string;
  nomeSite?: string;
  portal?: string;
  login?: string;
  cpf?: string;
  matricula?: string;
  senha?: string;
}

export interface PersonalCredential {
  id: number;
  userLogin: string;
  servico: string;
  url?: string;
  login: string;
  senha: string;
}

export interface AdminUser {
  id: number;
  nome: string;
  login: string;
  senha: string;
  vip: boolean;
}

export interface SmartDevice {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface ToastMessage {
  id: number;
  text: string;
  variant?: 'success' | 'error' | 'info';
}
