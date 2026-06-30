/**
 * Tipos e interfaces de Equipamentos Fotovoltaicos
 * Solaire Solar - Sistema de Homologação Fotovoltaica
 *
 * Especificações técnicas conforme datasheets dos fabricantes
 * em condições STC (Standard Test Conditions):
 *   - Irradiância: 1000 W/m²
 *   - Temperatura da célula: 25°C
 *   - Massa de ar: AM 1.5
 */

// ─── Tipos Auxiliares ─────────────────────────────────────────────────────────

/** Tecnologia de célula fotovoltaica */
export type TecnologiaModulo =
  | 'Monocristalino PERC'
  | 'Monocristalino TOPCon'
  | 'Monocristalino HJT'
  | 'Policristalino'
  | 'Filme Fino';

/** Fase de conexão do inversor */
export type FaseInversor = 'monofasico' | 'trifasico';

// ─── Interface do Módulo Fotovoltaico ─────────────────────────────────────────

/** Dimensões físicas do módulo em milímetros */
export interface DimensoesModulo {
  /** Comprimento do módulo em mm */
  comprimento: number;
  /** Largura do módulo em mm */
  largura: number;
  /** Altura (espessura) do módulo em mm */
  altura: number;
}

/** Módulo fotovoltaico com especificações técnicas completas (STC) */
export interface ModuloFotovoltaico {
  /** Identificador único do módulo no catálogo */
  id: string;
  /** Nome do fabricante */
  fabricante: string;
  /** Modelo comercial do módulo */
  modelo: string;
  /** Potência máxima (Pmax) em Wp (Watt-pico) */
  potencia: number;
  /** Tensão de circuito aberto (Voc) em Volts */
  voc: number;
  /** Tensão no ponto de máxima potência (Vmp) em Volts */
  vmp: number;
  /** Corrente de curto-circuito (Isc) em Amperes */
  isc: number;
  /** Corrente no ponto de máxima potência (Imp) em Amperes */
  imp: number;
  /** Eficiência de conversão do módulo em % */
  eficiencia: number;
  /** Tecnologia da célula fotovoltaica */
  tecnologia: TecnologiaModulo;
  /** Lista de certificações do módulo */
  certificacoes: string[];
  /** Dimensões físicas do módulo em mm */
  dimensoes: DimensoesModulo;
  /** Peso do módulo em kg */
  peso: number;
  /** URL do datasheet técnico do fabricante */
  datasheetUrl?: string;
  /** URL do certificado de conformidade (INMETRO, etc.) */
  certificadoUrl?: string;
}

// ─── Interface do Inversor Fotovoltaico ───────────────────────────────────────

/** Faixa de tensão de operação do MPPT */
export interface FaixaTensaoMPPT {
  /** Tensão mínima de operação do MPPT em Volts */
  min: number;
  /** Tensão máxima de operação do MPPT em Volts */
  max: number;
}

/** Inversor fotovoltaico (grid-tie) com especificações técnicas completas */
export interface InversorFotovoltaico {
  /** Identificador único do inversor no catálogo */
  id: string;
  /** Nome do fabricante */
  fabricante: string;
  /** Modelo comercial do inversor */
  modelo: string;
  /** Potência nominal de saída CA em kW */
  potenciaNominal: number;
  /** Potência máxima de entrada CC em kW */
  potenciaMaxCC: number;
  /** Tensão máxima de entrada CC em Volts */
  tensaoMaxEntrada: number;
  /** Faixa de tensão de operação do MPPT em Volts */
  faixaTensaoMPPT: FaixaTensaoMPPT;
  /** Número de rastreadores MPPT */
  numMPPTs: number;
  /** Número de entradas (strings) por MPPT */
  entradasPorMPPT: number;
  /** Corrente máxima de entrada por MPPT em Amperes */
  correnteMaxEntradaMPPT: number;
  /** Tensão nominal de saída CA em Volts */
  tensaoSaida: number;
  /** Corrente máxima de saída CA em Amperes */
  correnteMaxSaida: number;
  /** Frequência de saída CA em Hz */
  frequencia: number;
  /** Eficiência máxima de conversão em % */
  eficienciaMax: number;
  /** Fase de conexão (monofásico ou trifásico) */
  fase: FaseInversor;
  /** Grau de proteção IP */
  grauProtecao: string;
  /** Possui certificado INMETRO */
  certificadoINMETRO: boolean;
  /** Lista de certificações e normas atendidas */
  certificacoes: string[];
  /** URL do datasheet técnico do fabricante */
  datasheetUrl?: string;
  /** URL do certificado de conformidade */
  certificadoUrl?: string;
}
