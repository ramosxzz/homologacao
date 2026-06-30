/**
 * Utilitários de Validação e Formatação
 * Solaire Solar - Sistema de Homologação Fotovoltaica
 *
 * Inclui validação de documentos brasileiros (CPF, CNPJ),
 * formatação de campos e validação técnica de configuração FV.
 */

import type { StringConfig } from '../types/projeto';
import type { InversorFotovoltaico, ModuloFotovoltaico } from '../types/equipamento';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO DE DOCUMENTOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida um CPF (Cadastro de Pessoa Física) usando o algoritmo oficial.
 * Aceita CPF com ou sem formatação (xxx.xxx.xxx-xx).
 *
 * @param cpf - CPF a ser validado
 * @returns true se o CPF é válido
 */
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const numeros = cpf.replace(/\D/g, '');

  // Deve ter exatamente 11 dígitos
  if (numeros.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(numeros.charAt(9), 10)) return false;

  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(numeros.charAt(10), 10)) return false;

  return true;
}

/**
 * Valida um CNPJ (Cadastro Nacional de Pessoa Jurídica) usando o algoritmo oficial.
 * Aceita CNPJ com ou sem formatação (xx.xxx.xxx/xxxx-xx).
 *
 * @param cnpj - CNPJ a ser validado
 * @returns true se o CNPJ é válido
 */
export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, '');

  // Deve ter exatamente 14 dígitos
  if (numeros.length !== 14) return false;

  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  // Pesos para cálculo dos dígitos verificadores
  const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numeros.charAt(i), 10) * pesosPrimeiroDigito[i];
  }
  let resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  if (primeiroDigito !== parseInt(numeros.charAt(12), 10)) return false;

  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numeros.charAt(i), 10) * pesosSegundoDigito[i];
  }
  resto = soma % 11;
  const segundoDigito = resto < 2 ? 0 : 11 - resto;
  if (segundoDigito !== parseInt(numeros.charAt(13), 10)) return false;

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Formata um CPF no padrão XXX.XXX.XXX-XX
 *
 * @param cpf - CPF com apenas dígitos
 * @returns CPF formatado
 */
export function formatarCPF(cpf: string): string {
  const n = cpf.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

/**
 * Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX
 *
 * @param cnpj - CNPJ com apenas dígitos
 * @returns CNPJ formatado
 */
export function formatarCNPJ(cnpj: string): string {
  const n = cnpj.replace(/\D/g, '').slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

/**
 * Formata um telefone no padrão brasileiro.
 * Suporta fixo (XX) XXXX-XXXX e celular (XX) XXXXX-XXXX.
 *
 * @param tel - Telefone com apenas dígitos
 * @returns Telefone formatado
 */
export function formatarTelefone(tel: string): string {
  const numeros = tel.replace(/\D/g, '');

  if (numeros.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  if (numeros.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  // Retorna sem formatação se não se encaixa nos padrões
  return numeros;
}

/**
 * Formata um CEP no padrão XXXXX-XXX
 *
 * @param cep - CEP com apenas dígitos
 * @returns CEP formatado
 */
export function formatarCEP(cep: string): string {
  const n = cep.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO DE E-MAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida um endereço de e-mail usando expressão regular padrão RFC 5322 simplificada.
 *
 * @param email - Endereço de e-mail a ser validado
 * @returns true se o e-mail é válido
 */
export function validarEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regex.test(email);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULOS TÉCNICOS FV
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula a potência total instalada do sistema fotovoltaico em kWp.
 *
 * @param potenciaModulo - Potência do módulo em Wp (Watt-pico)
 * @param quantidade - Número total de módulos
 * @returns Potência instalada em kWp (kilowatt-pico)
 */
export function calcularPotenciaInstalada(
  potenciaModulo: number,
  quantidade: number
): number {
  return (potenciaModulo * quantidade) / 1000;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO DE CONFIGURAÇÃO DE STRINGS FV
// ═══════════════════════════════════════════════════════════════════════════════

/** Resultado da validação da configuração de strings */
export interface ResultadoValidacao {
  /** Se a configuração é válida */
  valido: boolean;
  /** Lista de erros encontrados */
  erros: string[];
}

/**
 * Valida a configuração de strings fotovoltaicas contra os limites do inversor.
 *
 * Verifica:
 * 1. Tensão da string (Voc × módulos em série) não ultrapassa tensão máxima de entrada
 * 2. Tensão da string (Vmp × módulos em série) está dentro da faixa MPPT
 * 3. Corrente total por MPPT (Isc × strings paralelo) não excede limite do MPPT
 * 4. Índice do MPPT é válido para o inversor
 * 5. Número de strings por MPPT não excede entradas disponíveis
 * 6. Potência total CC não excede potência máxima de entrada CC do inversor
 *
 * @param strings - Array de configurações de string
 * @param inversor - Inversor fotovoltaico selecionado
 * @param modulo - Módulo fotovoltaico selecionado
 * @returns Objeto com resultado da validação e lista de erros
 */
export function validarConfiguracao(
  strings: StringConfig[],
  inversor: InversorFotovoltaico,
  modulo: ModuloFotovoltaico
): ResultadoValidacao {
  const erros: string[] = [];

  if (strings.length === 0) {
    erros.push('Nenhuma configuração de string definida.');
    return { valido: false, erros };
  }

  // Agrupar strings por MPPT para verificar limites por tracker
  const stringsPorMPPT = new Map<number, StringConfig[]>();

  for (const stringConfig of strings) {
    // Validação do índice MPPT
    if (stringConfig.mpptIndex < 0 || stringConfig.mpptIndex >= inversor.numMPPTs) {
      erros.push(
        `Índice MPPT ${stringConfig.mpptIndex + 1} inválido. ` +
        `O inversor ${inversor.modelo} possui ${inversor.numMPPTs} MPPT(s) (índices 0 a ${inversor.numMPPTs - 1}).`
      );
      continue;
    }

    // Agrupa
    const existentes = stringsPorMPPT.get(stringConfig.mpptIndex) ?? [];
    existentes.push(stringConfig);
    stringsPorMPPT.set(stringConfig.mpptIndex, existentes);

    // ── 1. Verificação de tensão máxima de entrada (Voc × módulos em série) ──
    const tensaoVocString = modulo.voc * stringConfig.modulosEmSerie;
    if (tensaoVocString > inversor.tensaoMaxEntrada) {
      erros.push(
        `MPPT ${stringConfig.mpptIndex + 1}: Tensão Voc da string (${tensaoVocString.toFixed(1)} V = ` +
        `${modulo.voc} V × ${stringConfig.modulosEmSerie} módulos) excede a tensão máxima de entrada ` +
        `do inversor (${inversor.tensaoMaxEntrada} V).`
      );
    }

    // ── 2. Verificação da faixa MPPT (Vmp × módulos em série) ──
    const tensaoVmpString = modulo.vmp * stringConfig.modulosEmSerie;
    if (tensaoVmpString < inversor.faixaTensaoMPPT.min) {
      erros.push(
        `MPPT ${stringConfig.mpptIndex + 1}: Tensão Vmp da string (${tensaoVmpString.toFixed(1)} V = ` +
        `${modulo.vmp} V × ${stringConfig.modulosEmSerie} módulos) está abaixo da faixa mínima do MPPT ` +
        `(${inversor.faixaTensaoMPPT.min} V).`
      );
    }
    if (tensaoVmpString > inversor.faixaTensaoMPPT.max) {
      erros.push(
        `MPPT ${stringConfig.mpptIndex + 1}: Tensão Vmp da string (${tensaoVmpString.toFixed(1)} V = ` +
        `${modulo.vmp} V × ${stringConfig.modulosEmSerie} módulos) excede a faixa máxima do MPPT ` +
        `(${inversor.faixaTensaoMPPT.max} V).`
      );
    }

    // ── 3. Verificação de corrente por MPPT (Isc × strings paralelo) ──
    const correnteMPPT = modulo.isc * stringConfig.stringsParalelo;
    if (correnteMPPT > inversor.correnteMaxEntradaMPPT) {
      erros.push(
        `MPPT ${stringConfig.mpptIndex + 1}: Corrente total (${correnteMPPT.toFixed(2)} A = ` +
        `${modulo.isc} A × ${stringConfig.stringsParalelo} strings) excede a corrente máxima ` +
        `de entrada por MPPT (${inversor.correnteMaxEntradaMPPT} A).`
      );
    }
  }

  // ── 4. Verificação de entradas por MPPT ──
  const mpptEntries = Array.from(stringsPorMPPT.entries());
  for (const [mpptIndex, stringsNoMPPT] of mpptEntries) {
    const totalStringsParalelo = stringsNoMPPT.reduce(
      (acc: number, s: StringConfig) => acc + s.stringsParalelo,
      0
    );
    if (totalStringsParalelo > inversor.entradasPorMPPT) {
      erros.push(
        `MPPT ${mpptIndex + 1}: Total de ${totalStringsParalelo} strings em paralelo excede ` +
        `o número de entradas do MPPT (${inversor.entradasPorMPPT}).`
      );
    }
  }

  // ── 5. Verificação de potência total CC ──
  const totalModulos = strings.reduce(
    (acc: number, s: StringConfig) => acc + s.modulosEmSerie * s.stringsParalelo,
    0
  );
  const potenciaTotalCC = (modulo.potencia * totalModulos) / 1000; // kW
  if (potenciaTotalCC > inversor.potenciaMaxCC) {
    erros.push(
      `Potência total CC (${potenciaTotalCC.toFixed(2)} kW = ` +
      `${modulo.potencia} Wp × ${totalModulos} módulos) excede a potência máxima ` +
      `de entrada CC do inversor (${inversor.potenciaMaxCC} kW).`
    );
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
