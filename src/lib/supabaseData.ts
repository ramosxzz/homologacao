import { supabase } from './supabase';
import type { Empresa, Usuario } from '@/types/usuario';
import type { Distribuidora, Projeto, ProjetoStatus } from '@/types/projeto';

type UsuarioRow = {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  role: Usuario['role'];
  criado_em: string;
};

type EmpresaRow = {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  endereco: Empresa['endereco'];
  logo: string | null;
  responsavel_tecnico: Empresa['responsavelTecnico'];
  criado_em: string;
};

type ProjetoRow = {
  id: string;
  empresa_id: string;
  usuario_id: string;
  status: Projeto['status'];
  distribuidora: Projeto['distribuidora'];
  cliente: Projeto['cliente'];
  unidade_consumidora: Projeto['unidadeConsumidora'];
  endereco: Projeto['endereco'];
  localizacao: Projeto['localizacao'];
  sistema_fv: Projeto['sistemaFV'];
  compensacao: Projeto['compensacao'];
  documentos_gerados: Projeto['documentosGerados'];
  criado_em: string;
  atualizado_em: string;
};

export type ProjetoPayload = {
  empresaId: string;
  usuarioId: string;
  status: ProjetoStatus;
  distribuidora: Distribuidora;
  cliente: unknown;
  unidadeConsumidora: unknown;
  endereco: unknown;
  localizacao: unknown;
  sistemaFV: unknown;
  compensacao: unknown;
  documentosGerados?: unknown[];
  criadoEm: string;
  atualizadoEm: string;
};

function mapUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nome: row.nome,
    email: row.email,
    role: row.role,
    criadoEm: row.criado_em,
  };
}

function mapEmpresa(row: EmpresaRow): Empresa {
  return {
    id: row.id,
    nomeFantasia: row.nome_fantasia,
    razaoSocial: row.razao_social,
    cnpj: row.cnpj,
    email: row.email,
    telefone: row.telefone || '',
    endereco: row.endereco,
    logo: row.logo || '',
    responsavelTecnico: row.responsavel_tecnico,
    criadoEm: row.criado_em,
  };
}

function mapProjeto(row: ProjetoRow): Projeto {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    usuarioId: row.usuario_id,
    status: row.status,
    distribuidora: row.distribuidora,
    cliente: row.cliente,
    unidadeConsumidora: row.unidade_consumidora,
    endereco: row.endereco,
    localizacao: row.localizacao,
    sistemaFV: row.sistema_fv,
    compensacao: row.compensacao,
    documentosGerados: row.documentos_gerados || [],
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function fetchUsuarioEmpresa(userId: string): Promise<{
  usuario: Usuario | null;
  empresa: Empresa | null;
}> {
  if (!supabase) return { usuario: null, empresa: null };

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .maybeSingle<UsuarioRow>();

  if (usuarioError) throw usuarioError;
  if (!usuario) return { usuario: null, empresa: null };

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', usuario.empresa_id)
    .maybeSingle<EmpresaRow>();

  if (empresaError) throw empresaError;

  return {
    usuario: mapUsuario(usuario),
    empresa: empresa ? mapEmpresa(empresa) : null,
  };
}

export async function listProjetos(empresaId: string): Promise<Projeto[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projetos')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('atualizado_em', { ascending: false });

  if (error) throw error;
  return (data as ProjetoRow[]).map(mapProjeto);
}

export async function insertProjeto(payload: ProjetoPayload): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('projetos')
    .insert({
      empresa_id: payload.empresaId,
      usuario_id: payload.usuarioId,
      status: payload.status,
      distribuidora: payload.distribuidora,
      cliente: payload.cliente,
      unidade_consumidora: payload.unidadeConsumidora,
      endereco: payload.endereco,
      localizacao: payload.localizacao,
      sistema_fv: payload.sistemaFV,
      compensacao: payload.compensacao,
      documentos_gerados: payload.documentosGerados || [],
      criado_em: payload.criadoEm,
      atualizado_em: payload.atualizadoEm,
    })
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;
  return data.id;
}
