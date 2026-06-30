/**
 * Configuração das Distribuidoras de Energia
 * Solaire Solar - Sistema de Homologação Fotovoltaica
 *
 * Distribuidoras atendidas no estado do Rio Grande do Sul:
 * - CEEE Equatorial (Grupo Equatorial Energia)
 * - RGE Sul (CPFL Energia)
 *
 * Informações sobre normas técnicas, documentos exigidos e canais de submissão.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Documento exigido pela distribuidora para homologação */
export interface DocumentoDistribuidora {
  /** Identificador único do documento */
  id: string;
  /** Nome descritivo do documento */
  nome: string;
  /** Se o documento é obrigatório para submissão */
  obrigatorio: boolean;
}

/** Configuração completa de uma distribuidora */
export interface ConfigDistribuidora {
  /** Nome curto/comercial da distribuidora */
  nome: string;
  /** Nome completo com grupo controlador */
  nomeCompleto: string;
  /** Norma técnica aplicável para micro/minigeração */
  normaTecnica: string;
  /** E-mail para envio de documentos de geração distribuída */
  email: string;
  /** URL do portal da distribuidora */
  portal: string;
  /** Lista de documentos exigidos para homologação */
  documentos: DocumentoDistribuidora[];
  /** Canal de submissão dos documentos */
  submissao: 'email' | 'portal';
}

// ─── Dados ────────────────────────────────────────────────────────────────────

export const distribuidoras: Record<'CEEE' | 'RGE', ConfigDistribuidora> = {
  CEEE: {
    nome: 'CEEE Equatorial',
    nomeCompleto: 'CEEE Equatorial - Grupo Equatorial Energia',
    normaTecnica: 'NT.00020.EQTL',
    email: 'geracaodistribuida.ceee@equatorialenergia.com.br',
    portal: 'https://ceee.equatorialenergia.com.br',
    documentos: [
      {
        id: 'anexo_ii',
        nome: 'Anexo II - Formulário de Solicitação de Orçamento',
        obrigatorio: true,
      },
      {
        id: 'anexo_iii',
        nome: 'Anexo III - Memorial Técnico Descritivo',
        obrigatorio: true,
      },
      {
        id: 'memorial',
        nome: 'Memorial Descritivo',
        obrigatorio: true,
      },
      {
        id: 'diagrama_unifilar',
        nome: 'Diagrama Unifilar da Instalação',
        obrigatorio: true,
      },
      {
        id: 'art',
        nome: 'ART (Anotação de Responsabilidade Técnica)',
        obrigatorio: true,
      },
      {
        id: 'datasheet_modulo',
        nome: 'Datasheet do Módulo Fotovoltaico',
        obrigatorio: true,
      },
      {
        id: 'datasheet_inversor',
        nome: 'Datasheet do Inversor',
        obrigatorio: true,
      },
      {
        id: 'certificado_inmetro_inversor',
        nome: 'Certificado INMETRO do Inversor',
        obrigatorio: true,
      },
      {
        id: 'procuracao',
        nome: 'Procuração (se aplicável)',
        obrigatorio: false,
      },
    ],
    submissao: 'email',
  },
  RGE: {
    nome: 'RGE Sul',
    nomeCompleto: 'RGE Sul - CPFL Energia',
    normaTecnica: 'GED 15303',
    email: '',
    portal: 'https://www.rge-rs.com.br',
    documentos: [
      {
        id: 'anexo_e',
        nome: 'Anexo E - Formulário de Solicitação de Conexão',
        obrigatorio: true,
      },
      {
        id: 'anexo_f',
        nome: 'Anexo F - Dados para Registro Central Geradora',
        obrigatorio: true,
      },
      {
        id: 'memorial',
        nome: 'Memorial Descritivo',
        obrigatorio: true,
      },
      {
        id: 'diagrama_unifilar',
        nome: 'Diagrama Unifilar da Instalação',
        obrigatorio: true,
      },
      {
        id: 'art',
        nome: 'ART (Anotação de Responsabilidade Técnica)',
        obrigatorio: true,
      },
      {
        id: 'datasheet_modulo',
        nome: 'Datasheet do Módulo Fotovoltaico',
        obrigatorio: true,
      },
      {
        id: 'datasheet_inversor',
        nome: 'Datasheet do Inversor',
        obrigatorio: true,
      },
      {
        id: 'certificado_inmetro_inversor',
        nome: 'Certificado INMETRO do Inversor',
        obrigatorio: true,
      },
      {
        id: 'procuracao',
        nome: 'Procuração (se aplicável)',
        obrigatorio: false,
      },
    ],
    submissao: 'portal',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna a configuração de uma distribuidora pelo código */
export function obterDistribuidora(codigo: 'CEEE' | 'RGE'): ConfigDistribuidora {
  return distribuidoras[codigo];
}

/** Retorna apenas os documentos obrigatórios de uma distribuidora */
export function documentosObrigatorios(codigo: 'CEEE' | 'RGE'): DocumentoDistribuidora[] {
  return distribuidoras[codigo].documentos.filter((doc) => doc.obrigatorio);
}
