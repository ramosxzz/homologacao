/**
 * Tipos e interfaces de Usuário e Empresa
 * Solaire Solar - Sistema de Homologação Fotovoltaica
 */

import type { Endereco } from './projeto';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Papel do usuário no sistema */
export type UserRole = 'admin' | 'engenheiro';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Responsável técnico da empresa (engenheiro eletricista) */
export interface ResponsavelTecnico {
  /** Nome completo do responsável técnico */
  nome: string;
  /** Registro no CREA (Conselho Regional de Engenharia e Agronomia) */
  crea: string;
  /** CPF do responsável técnico */
  cpf: string;
}

/** Empresa integradora de energia solar */
export interface Empresa {
  /** Identificador único da empresa */
  id: string;
  /** Nome fantasia da empresa */
  nomeFantasia: string;
  /** Razão social registrada */
  razaoSocial: string;
  /** CNPJ da empresa */
  cnpj: string;
  /** E-mail corporativo de contato */
  email: string;
  /** Telefone comercial */
  telefone: string;
  /** Endereço da sede da empresa */
  endereco: Endereco;
  /** URL do logotipo da empresa */
  logo?: string;
  /** Dados do responsável técnico (engenheiro com CREA) */
  responsavelTecnico: ResponsavelTecnico;
  /** Data/hora de criação do cadastro (ISO 8601) */
  criadoEm: string;
}

/** Usuário do sistema */
export interface Usuario {
  /** Identificador único do usuário */
  id: string;
  /** ID da empresa à qual o usuário pertence */
  empresaId: string;
  /** Nome completo do usuário */
  nome: string;
  /** E-mail de acesso (login) */
  email: string;
  /** Papel do usuário no sistema */
  role: UserRole;
  /** Data/hora de criação do usuário (ISO 8601) */
  criadoEm: string;
}
