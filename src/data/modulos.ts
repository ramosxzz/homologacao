/**
 * Catálogo de Módulos Fotovoltaicos
 * Solaire Solar - Sistema de Homologação Fotovoltaica
 *
 * Especificações técnicas baseadas nos datasheets oficiais dos fabricantes.
 * Todos os valores elétricos em condições STC (Standard Test Conditions):
 *   - Irradiância: 1000 W/m²
 *   - Temperatura da célula: 25°C
 *   - Massa de ar: AM 1.5
 *
 * Fabricantes: ERA Solar, Canadian Solar, Trina Solar, JA Solar
 */

import type { ModuloFotovoltaico } from '../types/equipamento';

export const modulos: ModuloFotovoltaico[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ERA SOLAR — Módulos de alta potência (585Wp+)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'era-585m-144',
    fabricante: 'ERA Solar',
    modelo: 'ERA-585M-144',
    potencia: 585,
    voc: 51.42,
    vmp: 43.31,
    isc: 14.38,
    imp: 13.51,
    eficiencia: 22.27,
    tecnologia: 'Monocristalino PERC',
    certificacoes: ['IEC 61215', 'IEC 61730', 'INMETRO'],
    dimensoes: { comprimento: 2278, largura: 1134, altura: 35 },
    peso: 31.8,
    datasheetUrl: 'https://www.erasolar.com.br/wp-content/uploads/2023/10/ERA-585-590-600-610M-144-Datasheet.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },
  {
    id: 'era-590m-144',
    fabricante: 'ERA Solar',
    modelo: 'ERA-590M-144',
    potencia: 590,
    voc: 51.68,
    vmp: 43.52,
    isc: 14.44,
    imp: 13.56,
    eficiencia: 22.46,
    tecnologia: 'Monocristalino PERC',
    certificacoes: ['IEC 61215', 'IEC 61730', 'INMETRO'],
    dimensoes: { comprimento: 2278, largura: 1134, altura: 35 },
    peso: 31.8,
    datasheetUrl: 'https://www.erasolar.com.br/wp-content/uploads/2023/10/ERA-585-590-600-610M-144-Datasheet.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },
  {
    id: 'era-600m-144',
    fabricante: 'ERA Solar',
    modelo: 'ERA-600M-144',
    potencia: 600,
    voc: 52.18,
    vmp: 43.94,
    isc: 14.56,
    imp: 13.66,
    eficiencia: 22.84,
    tecnologia: 'Monocristalino PERC',
    certificacoes: ['IEC 61215', 'IEC 61730', 'INMETRO'],
    dimensoes: { comprimento: 2278, largura: 1134, altura: 35 },
    peso: 32.0,
    datasheetUrl: 'https://www.erasolar.com.br/wp-content/uploads/2023/10/ERA-585-590-600-610M-144-Datasheet.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },
  {
    id: 'era-610m-144',
    fabricante: 'ERA Solar',
    modelo: 'ERA-610M-144',
    potencia: 610,
    voc: 52.68,
    vmp: 44.36,
    isc: 14.64,
    imp: 13.75,
    eficiencia: 23.22,
    tecnologia: 'Monocristalino TOPCon',
    certificacoes: ['IEC 61215', 'IEC 61730', 'INMETRO'],
    dimensoes: { comprimento: 2278, largura: 1134, altura: 35 },
    peso: 32.2,
    datasheetUrl: 'https://www.erasolar.com.br/wp-content/uploads/2023/10/ERA-585-590-600-610M-144-Datasheet.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CANADIAN SOLAR
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'canadian-cs7l-595ms',
    fabricante: 'Canadian Solar',
    modelo: 'CS7L-595MS',
    potencia: 595,
    voc: 52.2,
    vmp: 43.8,
    isc: 14.45,
    imp: 13.59,
    eficiencia: 22.5,
    tecnologia: 'Monocristalino PERC',
    certificacoes: ['IEC 61215', 'IEC 61730', 'UL 61730', 'INMETRO'],
    dimensoes: { comprimento: 2294, largura: 1134, altura: 35 },
    peso: 32.5,
    datasheetUrl: 'https://www.canadiansolar.com/wp-content/uploads/2022/12/Canadian_Solar-Datasheet-HiKu7_CS7L-MS_v1.0_en.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRINA SOLAR
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'trina-tsm-de21-600',
    fabricante: 'Trina Solar',
    modelo: 'TSM-DE21-600',
    potencia: 600,
    voc: 52.1,
    vmp: 43.8,
    isc: 14.60,
    imp: 13.70,
    eficiencia: 22.6,
    tecnologia: 'Monocristalino TOPCon',
    certificacoes: ['IEC 61215', 'IEC 61730', 'UL 61730', 'INMETRO'],
    dimensoes: { comprimento: 2384, largura: 1134, altura: 35 },
    peso: 33.0,
    datasheetUrl: 'https://www.trinasolar.com/sites/default/files/2023-04/Vertex-S-DE09R-08-1-2-datasheet-V1.4-en.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JA SOLAR
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ja-jam72s30-585mr',
    fabricante: 'JA Solar',
    modelo: 'JAM72S30-585/MR',
    potencia: 585,
    voc: 51.52,
    vmp: 43.38,
    isc: 14.35,
    imp: 13.49,
    eficiencia: 22.3,
    tecnologia: 'Monocristalino PERC',
    certificacoes: ['IEC 61215', 'IEC 61730', 'UL 61730', 'INMETRO'],
    dimensoes: { comprimento: 2278, largura: 1134, altura: 35 },
    peso: 31.5,
    datasheetUrl: 'https://www.jasolar.com/uploadfile/2022/0707/20220707052044986.pdf',
    certificadoUrl: 'https://www.inmetro.gov.br/laboratorios/rble/docs/CertificadoAprovacao.asp',
  },
];

// ─── Helpers de busca ─────────────────────────────────────────────────────────

/** Busca módulo por ID */
export function buscarModuloPorId(id: string): ModuloFotovoltaico | undefined {
  return modulos.find((mod) => mod.id === id);
}

/** Filtra módulos por fabricante */
export function filtrarModulosPorFabricante(fabricante: string): ModuloFotovoltaico[] {
  return modulos.filter((mod) => mod.fabricante.toLowerCase() === fabricante.toLowerCase());
}

/** Filtra módulos por faixa de potência em Wp */
export function filtrarModulosPorPotencia(
  minWp: number,
  maxWp: number
): ModuloFotovoltaico[] {
  return modulos.filter(
    (mod) => mod.potencia >= minWp && mod.potencia <= maxWp
  );
}
