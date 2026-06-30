/**
 * Tipos e interfaces do modelo de dados do Projeto de Homologação
 * Solaire Solar - Sistema de Homologação Fotovoltaica
 */

// ─── Enums e Tipos Literais ───────────────────────────────────────────────────

/** Status do projeto no fluxo de homologação */
export type ProjetoStatus = 'rascunho' | 'em_andamento' | 'concluido' | 'enviado';

/** Distribuidoras atendidas no RS */
export type Distribuidora = 'CEEE' | 'RGE';

/** Classe da Unidade Consumidora conforme ANEEL */
export type ClasseUC =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'rural'
  | 'poder_publico'
  | 'iluminacao_publica'
  | 'servico_publico';

/** Tipo de conexão à rede elétrica */
export type TipoConexao = 'monofasico' | 'bifasico' | 'trifasico';

/** Tipo do ramal de entrada */
export type TipoRamal = 'aereo' | 'subterraneo';

/** Tipo de telhado para instalação dos módulos */
export type TipoTelhado =
  | 'ceramico'
  | 'fibrocimento'
  | 'metalico'
  | 'laje'
  | 'solo'
  | 'outro';

/** Modalidade de compensação de energia conforme REN 482/2012 */
export type ModalidadeCompensacao =
  | 'geracao_local'               // Geração junto à carga
  | 'autoconsumo_remoto'          // Autoconsumo remoto
  | 'geracao_compartilhada'       // Geração compartilhada (consórcio/cooperativa)
  | 'empreendimento_multiplas_uc'; // Empreendimento com múltiplas UCs

// ─── Interfaces de Endereço e Localização ─────────────────────────────────────

/** Endereço completo do local de instalação */
export interface Endereco {
  /** Logradouro (rua, avenida, etc.) */
  logradouro: string;
  /** Número do imóvel */
  numero: string;
  /** Complemento (apto, sala, bloco, etc.) */
  complemento?: string;
  /** Bairro */
  bairro: string;
  /** Cidade */
  cidade: string;
  /** Unidade Federativa (ex: RS) */
  uf: string;
  /** CEP no formato XXXXX-XXX */
  cep: string;
}

/** Dados de geolocalização e características do telhado */
export interface Localizacao {
  /** Latitude em graus decimais */
  latitude: number;
  /** Longitude em graus decimais */
  longitude: number;
  /** Orientação azimutal do telhado em graus (0° = Norte, 180° = Sul) */
  orientacaoTelhado: number;
  /** Inclinação do telhado em graus (0° = horizontal, 90° = vertical) */
  inclinacaoTelhado: number;
  /** Tipo de telhado/estrutura de fixação */
  tipoTelhado: TipoTelhado;
  /** Área disponível para instalação dos módulos em m² */
  areaDisponivel: number;
}

// ─── Interfaces de Cliente ────────────────────────────────────────────────────

/** Dados cadastrais do cliente (titular da UC) */
export interface Cliente {
  /** Nome completo ou razão social */
  nome: string;
  /** CPF (pessoa física) ou CNPJ (pessoa jurídica) */
  cpfCnpj: string;
  /** Registro Geral (RG) - obrigatório para PF */
  rg?: string;
  /** Endereço de e-mail de contato */
  email: string;
  /** Telefone fixo */
  telefone?: string;
  /** Telefone celular */
  celular: string;
}

// ─── Interfaces da Unidade Consumidora ────────────────────────────────────────

/** Dados da Unidade Consumidora junto à distribuidora */
export interface UnidadeConsumidora {
  /** Código da UC (número do medidor ou identificação na distribuidora) */
  codigo: string;
  /** Número da conta/contrato com a distribuidora */
  contaContrato: string;
  /** Classe de consumo da UC */
  classe: ClasseUC;
  /** Tipo de conexão elétrica */
  tipoConexao: TipoConexao;
  /** Tensão de atendimento em Volts (ex: 127/220, 220/380) */
  tensaoAtendimento: string;
  /** Carga instalada em kW */
  cargaInstalada: number;
  /** Consumo médio mensal dos últimos 12 meses em kWh */
  consumoMedio: number;
  /** Demanda de carga contratada em kW (quando aplicável) */
  demandaCarga?: number;
  /** Tipo do ramal de entrada de energia */
  tipoRamal: TipoRamal;
  /** URL da fatura de energia para referência */
  faturaUrl?: string;
}

// ─── Interfaces do Sistema Fotovoltaico ───────────────────────────────────────

/** Configuração de uma string fotovoltaica */
export interface StringConfig {
  /** Quantidade de módulos conectados em série na string */
  modulosEmSerie: number;
  /** Quantidade de strings em paralelo nesta configuração */
  stringsParalelo: number;
  /** Índice do MPPT do inversor ao qual esta string está conectada (0-based) */
  mpptIndex: number;
}

/** Dados de proteção elétrica do sistema */
export interface ProtecaoSistema {
  /** Disjuntor geral CA em Amperes */
  disjuntorGeralCA: number;
  /** Disjuntor de string CC em Amperes */
  disjuntorStringCC?: number;
  /** DPS (Dispositivo de Proteção contra Surto) CA - classe */
  dpsCA: string;
  /** DPS (Dispositivo de Proteção contra Surto) CC - classe */
  dpsCC: string;
  /** Possui chave seccionadora CC */
  chaveSeccionadoraCC: boolean;
  /** Aterramento conforme NBR 5410 */
  aterramento: string;
}

/** Configuração completa do sistema fotovoltaico */
export interface SistemaFV {
  /** ID do módulo fotovoltaico selecionado */
  moduloId: string;
  /** Fabricante do módulo (redundância para exibição rápida) */
  moduloFabricante: string;
  /** Modelo do módulo (redundância para exibição rápida) */
  moduloModelo: string;
  /** Potência unitária do módulo em Wp */
  moduloPotencia: number;
  /** Quantidade total de módulos no sistema */
  quantidadeModulos: number;
  /** ID do inversor fotovoltaico selecionado */
  inversorId: string;
  /** Fabricante do inversor (redundância para exibição rápida) */
  inversorFabricante: string;
  /** Modelo do inversor (redundância para exibição rápida) */
  inversorModelo: string;
  /** Potência nominal do inversor em kW */
  inversorPotencia: number;
  /** Quantidade de inversores */
  quantidadeInversores: number;
  /** Potência total instalada (pico) em kWp */
  potenciaInstalada: number;
  /** Configuração das strings fotovoltaicas */
  stringsConfig: StringConfig[];
  /** Dados de proteção elétrica */
  protecao: ProtecaoSistema;
}

// ─── Interfaces de Compensação ────────────────────────────────────────────────

/** Beneficiário de créditos de energia no sistema de compensação */
export interface Beneficiario {
  /** Nome completo ou razão social do beneficiário */
  nome: string;
  /** CPF ou CNPJ do beneficiário */
  cpfCnpj: string;
  /** Código da Unidade Consumidora beneficiária */
  codigoUC: string;
  /** Percentual de créditos destinados a este beneficiário (0-100) */
  percentual: number;
}

/** Configuração de compensação de energia */
export interface Compensacao {
  /** Modalidade de compensação conforme regulamentação ANEEL */
  modalidade: ModalidadeCompensacao;
  /** Lista de beneficiários dos créditos de energia */
  beneficiarios: Beneficiario[];
}

// ─── Interfaces de Documentos ─────────────────────────────────────────────────

/** Documento gerado pelo sistema */
export interface DocumentoGerado {
  /** Identificador do tipo de documento */
  id: string;
  /** Nome descritivo do documento */
  nome: string;
  /** URL para download do documento gerado */
  url: string;
  /** Data/hora de geração */
  geradoEm: string;
  /** Formato do arquivo (pdf, xlsx, docx) */
  formato: 'pdf' | 'xlsx' | 'docx';
}

// ─── Interface Principal: Projeto ─────────────────────────────────────────────

/** Projeto completo de homologação de sistema fotovoltaico */
export interface Projeto {
  /** Identificador único do projeto */
  id: string;
  /** ID da empresa responsável pelo projeto */
  empresaId: string;
  /** ID do usuário que criou/gerencia o projeto */
  usuarioId: string;
  /** Status atual do projeto no fluxo */
  status: ProjetoStatus;
  /** Distribuidora de energia (CEEE ou RGE) */
  distribuidora: Distribuidora;
  /** Dados cadastrais do cliente */
  cliente: Cliente;
  /** Dados da Unidade Consumidora */
  unidadeConsumidora: UnidadeConsumidora;
  /** Endereço do local de instalação */
  endereco: Endereco;
  /** Dados de geolocalização e telhado */
  localizacao: Localizacao;
  /** Configuração do sistema fotovoltaico */
  sistemaFV: SistemaFV;
  /** Configuração de compensação de energia */
  compensacao: Compensacao;
  /** Data/hora de criação do projeto (ISO 8601) */
  criadoEm: string;
  /** Data/hora da última atualização (ISO 8601) */
  atualizadoEm: string;
  /** Lista de documentos já gerados para este projeto */
  documentosGerados: DocumentoGerado[];
}
