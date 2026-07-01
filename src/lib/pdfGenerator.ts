/**
 * Gerador de PDFs Oficiais — Solaire Solar
 *
 * Usa pdf-lib para sobrepor texto nos formulários oficiais em branco.
 *
 * RGE/CPFL:
 *   - /documentos/rge/anexo-e.pdf     (3 páginas)
 *   - /documentos/rge/anexo-f.pdf     (7 páginas)
 *   - /documentos/rge/diagrama-unifilar.pdf (1 página)
 *
 * CEEE Equatorial:
 *   - /documentos/ceee/diagrama-blocos.pdf  (1 página)
 *   - /documentos/ceee/anexo-i.xlsx         (download direto, sem preenchimento aqui)
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ProjetoData {
  cliente: {
    nome: string;
    cpfCnpj: string;
    rg: string;
    email: string;
    telefone: string;
    celular: string;
  };
  unidadeConsumidora: {
    codigo: string;
    contaContrato: string;
    classe: string;
    tipoConexao: string;
    tensaoAtendimento: string;
    cargaInstalada: string;
    consumoMedio: string;
    tipoRamal: string;
  };
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  localizacao: {
    latitude: number;
    longitude: number;
    inclinacaoTelhado: number;
    orientacaoTelhado: number;
    tipoTelhado: string;
    areaTelhado: string;
    telhadoImagem?: string;
    fachadaImagem?: string;
  };
  sistemaFV: {
    moduloFabricante: string;
    moduloModelo: string;
    moduloPotencia: number;
    quantidadeModulos: string;
    potenciaInstalada: number;
    inversorFabricante: string;
    inversorModelo: string;
    inversorPotencia: number;
    quantidadeInversores: string;
    strings: Array<{ modulosEmSerie: string; stringsParalelo: string; mpptIndex: number }>;
    disjuntorGeracao: string;
    dpsCC: string;
    dpsCA: string;
  };
  engenheiro?: string;
  crea?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Align = 'left' | 'center' | 'right';

function text(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  font: PDFFont,
  size = 8.5,
  align: Align = 'left'
) {
  if (value === undefined || value === null || value === '') return;
  let drawX = x;
  if (align !== 'left') {
    const w = font.widthOfTextAtSize(value, size);
    drawX = align === 'right' ? x - w : x - w / 2;
  }
  page.drawText(value, { x: drawX, y, size, font, color: rgb(0, 0, 0) });
}

/** Cobre texto pré-existente do template com um retângulo branco (x,y = canto inferior-esquerdo) */
function mask(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1) });
}

async function loadTemplate(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Erro ao carregar template: ${path} (${res.status})`);
  return res.arrayBuffer();
}

function today(): string {
  return new Date().toLocaleDateString('pt-BR');
}

const faseLabel: Record<string, string> = {
  monofasica: 'Monofásica',
  bifasica: 'Bifásica',
  trifasica: 'Trifásica',
};

// ─────────────────────────────────────────────────────────────────────────────
// RGE — ANEXO E (3 páginas)
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarAnexoERGE(data: ProjetoData): Promise<Uint8Array> {
  const bytes = await loadTemplate('/documentos/rge/anexo-e.pdf');
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  drawAnexoERGE(doc, font, data);
  return doc.save();
}

/**
 * Desenho puro do Anexo E (sem fetch — usado pelo navegador e pelo calibrador Node).
 * Coordenadas ancoradas nos bounding boxes reais dos rótulos do PDF (origem inferior-esquerda).
 * Página A4 595.5 x 842.25 pt.
 */
export function drawAnexoERGE(doc: PDFDocument, font: PDFFont, data: ProjetoData) {
  // MediaBox deste template tem origem Y = 7.83 (não zero); coords de bbox precisam desse offset.
  const OY = 7.83;

  // ── Página 1 — Seção 2: Dados Técnicos ──
  const p1 = doc.getPage(0);

  // 1.1 Código da UC (rótulo termina em x=146.4, baseline y=715.2)
  text(p1, data.unidadeConsumidora.codigo, 152, 714 + OY, font, 9);

  // 2.2 Potência instalada (kW à direita em x=218 / baseline 340.5)
  text(p1, data.sistemaFV.potenciaInstalada.toFixed(2), 213, 340.5 + OY, font, 9, 'right');

  // 2.4 Dados do inversor (rótulos em x≈198; valores logo após cada rótulo)
  const invDesc = [data.sistemaFV.inversorFabricante, data.sistemaFV.inversorModelo].filter(Boolean).join(' ');
  text(p1, invDesc, 253, 265.5 + OY, font, 8);                                   // Fabricante (term. 248.8)
  text(p1, `${data.sistemaFV.quantidadeInversores}`, 301, 236.2 + OY, font, 8.5); // Quantidade instalada (term. 296.5)
  text(p1, data.unidadeConsumidora.tensaoAtendimento, 364, 222 + OY, font, 8);   // Tensão nominal (term. 359.2)
  text(p1, `${data.sistemaFV.inversorPotencia} kW`, 370, 206.2 + OY, font, 8);   // Potência nominal (term. 364.8)

  // ── Página 2 — Seção 5: Identificação + rodapé ──
  const p2 = doc.getPage(1);

  // 5.1 Nome do consumidor / representante (rótulo termina em x=291, baseline 195.4)
  text(p2, data.cliente.nome, 297, 195.4 + OY, font, 8.5);

  // 5.2 Contato (telefone / e-mail) (rótulo termina em x=273, baseline 169.1)
  const contato = [data.cliente.celular || data.cliente.telefone, data.cliente.email].filter(Boolean).join(' · ');
  text(p2, contato, 279, 169.1 + OY, font, 8.5);

  // Rodapé — cobre o "Sapucaia do Sul" embutido no template e escreve Local/Data reais
  // (ghost em baseline 142.2; rótulos "Local"/"Data" em baseline 129.9)
  mask(p2, 58, 138 + OY, 150, 22);
  text(p2, `${data.endereco.cidade} - ${data.endereco.uf}`, 128, 142.2 + OY, font, 9, 'center'); // sobre "Local" (x 116-140)
  text(p2, today(), 282, 142.2 + OY, font, 9, 'center');                                          // sobre "Data" (x 272-293)
}

// ─────────────────────────────────────────────────────────────────────────────
// RGE — ANEXO F (7 páginas)
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarAnexoFRGE(data: ProjetoData): Promise<Uint8Array> {
  const bytes = await loadTemplate('/documentos/rge/anexo-f.pdf');
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  drawAnexoFRGE(doc, font, data);
  return doc.save();
}

export function drawAnexoFRGE(doc: PDFDocument, font: PDFFont, data: ProjetoData) {
  // MediaBox com origem Y=7.83; todas as coords abaixo são baselines de bbox + OY.
  const OY = 7.83;
  // Colunas de valor (ancoradas nos bounding boxes reais dos cabeçalhos):
  const SV = 292;   // coluna única (seções 1, 2a, datas)
  const C_ATUAL = 288, C_ACRESC = 353, C_TOTAL = 450; // colunas Situação: Atual / Acréscimo / Total Previsto

  const endCompleto = `${data.endereco.logradouro}, ${data.endereco.numero}${data.endereco.complemento ? ' - ' + data.endereco.complemento : ''}, ${data.endereco.bairro}`;
  const carga = data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW` : '';
  const potInst = data.sistemaFV.potenciaInstalada.toFixed(2);

  // ── Página 1 — Seção 1: Dados da UC (coluna de valor em x≈292) ──
  const p1 = doc.getPage(0);
  text(p1, data.cliente.nome,                                   SV, 435.4 + OY, font, 9); // 1.1 Nome do titular
  text(p1, data.cliente.cpfCnpj,                                SV, 408.0 + OY, font, 9); // 1.2 CNPJ/CPF
  text(p1, data.unidadeConsumidora.codigo,                      SV, 390.8 + OY, font, 9); // 1.3 Número UC
  text(p1, endCompleto,                                         SV, 359.8 + OY, font, 7.5); // 1.4 Endereço
  text(p1, data.endereco.cep,                                   SV, 342.7 + OY, font, 9); // 1.5 CEP
  text(p1, `${data.endereco.cidade} / ${data.endereco.uf}`,     SV, 325.6 + OY, font, 9); // 1.6 Município
  text(p1, data.localizacao.latitude.toFixed(6),                SV, 308.5 + OY, font, 9); // 1.7 Latitude
  text(p1, data.localizacao.longitude.toFixed(6),               SV, 291.4 + OY, font, 9); // 1.8 Longitude
  text(p1, data.cliente.celular || data.cliente.telefone || '', SV, 274.3 + OY, font, 9); // 1.7 Telefone
  text(p1, data.cliente.email || '',                            SV, 257.2 + OY, font, 8.5); // 1.8 E-mail

  // ── Página 2 — Seções 2a (UC existente) e 2b (minigeração) ──
  const p2 = doc.getPage(1);

  // 2a — coluna única (linhas de 2 linhas → baseline da 1ª linha + OY)
  text(p2, 'GED 14945', SV, 673.2 + OY, font, 9);                                                              // 2.1 Padrão
  text(p2, data.unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo', SV, 640.2 + OY, font, 9); // 2.2 Atendimento
  text(p2, faseLabel[data.unidadeConsumidora.tipoConexao] || '', SV, 607.9 + OY, font, 9);                     // 2.3 Fases
  text(p2, '—', SV, 562.9 + OY, font, 9);                                                                       // 2.4 Cabos
  text(p2, 'GED 14945', SV, 529.9 + OY, font, 9);                                                              // 2.5 Caixa
  text(p2, carga, SV, 496.9 + OY, font, 9);                                                                     // 2.6 Carga instalada
  text(p2, data.sistemaFV.disjuntorGeracao || '32 A', SV, 449.0 + OY, font, 9);                                // 2.7 Disjuntor

  // 2b — colunas Atual / Acréscimo / Total Previsto
  // 2.1 Carga instalada
  text(p2, carga, C_ATUAL, 395.3 + OY, font, 9);
  text(p2, '0',   C_ACRESC, 395.3 + OY, font, 9);
  text(p2, carga, C_TOTAL, 395.3 + OY, font, 9);
  // 2.2 Demanda contratada
  text(p2, '0', C_ATUAL, 378.0 + OY, font, 9);
  text(p2, '—', C_ACRESC, 378.0 + OY, font, 9);
  text(p2, '0', C_TOTAL, 378.0 + OY, font, 9);
  // 2.5 Potência instalada de geração (kVA)
  text(p2, '0',                C_ATUAL, 250.5 + OY, font, 9);
  text(p2, `${potInst} kVA`, C_ACRESC, 250.5 + OY, font, 8.5);
  text(p2, `${potInst} kVA`, C_TOTAL, 250.5 + OY, font, 8.5);
  // 2.6 Potência exportada (kW)
  text(p2, '0',               C_ATUAL, 217.5 + OY, font, 9);
  text(p2, `${potInst} kW`, C_ACRESC, 217.5 + OY, font, 8.5);
  text(p2, `${potInst} kW`, C_TOTAL, 217.5 + OY, font, 8.5);
  // 2.7/2.8/2.9 RT, CREA, telefone (coluna única)
  text(p2, data.engenheiro || '', SV, 185.2 + OY, font, 8.5);                          // 2.7 Nome RT
  text(p2, data.crea || '', SV, 169.5 + OY, font, 9);                                  // 2.8 Registro CREA
  text(p2, data.cliente.celular || data.cliente.telefone || '', SV, 119.8 + OY, font, 9); // 2.9 Telefone RT

  // ── Página 3 — Seção 3: Unidades Geradoras Fotovoltaicas ──
  const p3 = doc.getPage(2);

  text(p3, '—', SV, 673.0 + OY, font, 9); // 2.10 Data pretendida (2c)

  const potCA = (data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1)).toFixed(2);
  const area = data.localizacao.areaTelhado ? `${data.localizacao.areaTelhado} m²` : '—';
  // colunas Atual / Acréscimo / Total Previsto
  const row3 = (atual: string, novo: string, yBase: number, size = 9) => {
    text(p3, atual, C_ATUAL, yBase + OY, font, size);
    text(p3, novo,  C_ACRESC, yBase + OY, font, size);
    text(p3, novo,  C_TOTAL, yBase + OY, font, size);
  };
  row3('0', `${data.sistemaFV.quantidadeModulos}`, 429.4);          // 3.1 Qtd módulos
  row3('—', data.sistemaFV.moduloFabricante, 401.7, 8.5);          // 3.2 Fabricante módulos
  row3('—', data.sistemaFV.moduloModelo, 373.9, 8);                // 3.3 Modelo módulos
  row3('—', area, 340.0);                                           // 3.4 Área ocupada
  row3('0', `${data.sistemaFV.quantidadeInversores}`, 307.0);      // 3.5 Qtd inversores
  row3('—', data.sistemaFV.inversorFabricante, 277.8, 8.5);       // 3.6 Fabricante inversores
  row3('—', data.sistemaFV.inversorModelo, 250.0, 8);             // 3.7 Modelo inversores
  row3('0', `${potInst} kWp`, 222.1, 8.5);                         // 3.8 Potência pico módulos
  row3('0', `${potCA} kW`, 172.5, 8.5);                            // 3.9 Potência nominal inversores
  // 3.10 Data pretendida
  text(p3, '—', C_ATUAL, 119.3 + OY, font, 9);
  text(p3, today(), C_ACRESC, 119.3 + OY, font, 8.5);
  text(p3, today(), C_TOTAL, 119.3 + OY, font, 8.5);
}

// ─────────────────────────────────────────────────────────────────────────────
// RGE — DIAGRAMA UNIFILAR (1 página)
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarDiagramaUnifilarRGE(data: ProjetoData): Promise<Uint8Array> {
  const bytes = await loadTemplate('/documentos/rge/diagrama-unifilar.pdf');
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  drawDiagramaUnifilarRGE(doc, font, data);
  return doc.save();
}

export function drawDiagramaUnifilarRGE(doc: PDFDocument, font: PDFFont, data: ProjetoData) {
  const page = doc.getPage(0);

  // Cabeçalho
  text(page, data.cliente.nome, 136, 739, font, 9);
  text(page, `${data.endereco.logradouro}, ${data.endereco.numero} — ${data.endereco.cidade}/${data.endereco.uf}`, 153, 724.5, font, 8.5);
  const respTec = [data.engenheiro, data.crea].filter(Boolean).join(' — CREA: ');
  text(page, respTec, 184, 711, font, 9);

  // Dados técnicos posicionados ao lado de cada bloco do diagrama (raster).
  // Coords PDF (origem bottom-left, A4 = 595×842).
  const potCA = (data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1)).toFixed(2);
  const potPico = data.sistemaFV.potenciaInstalada.toFixed(2);
  const qtdMod = data.sistemaFV.quantidadeModulos || '0';
  const qtdInv = data.sistemaFV.quantidadeInversores || '1';
  const modDesc = [data.sistemaFV.moduloFabricante, data.sistemaFV.moduloModelo].filter(Boolean).join(' ');
  const invDesc = [data.sistemaFV.inversorFabricante, data.sistemaFV.inversorModelo].filter(Boolean).join(' ');
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '';
  const disjuntor = data.sistemaFV.disjuntorGeracao || '32 A';

  // UC + tensão na área "Unidade Consumidora (Acessante)" — abaixo da seta
  text(page, `UC: ${data.unidadeConsumidora.codigo}`, 460, 610, font, 7.5);
  text(page, `${tensao} · ${fases}`, 460, 598, font, 7.5);

  // Disjuntor de entrada (dentro da Caixa de Medição, ao lado do label DISJUNTOR)
  text(page, `${disjuntor}`, 460, 488, font, 8);
  text(page, '(entrada)', 460, 478, font, 6.5);

  // Carga instalada — ao lado do label CARGAS (lado direito do braço)
  if (data.unidadeConsumidora.cargaInstalada) {
    text(page, `Carga: ${data.unidadeConsumidora.cargaInstalada} kW`, 480, 405, font, 7.5);
  }

  // Disjuntor de geração — ao lado do segundo DISJUNTOR
  text(page, `${disjuntor}`, 460, 375, font, 8);
  text(page, '(geração CA)', 460, 365, font, 6.5);

  // DPS CA — ao lado do disjuntor de geração
  text(page, `DPS CA: ${data.sistemaFV.dpsCA || '275 V'}`, 360, 350, font, 6.5);

  // INVERSOR — ao lado direito do bloco INVERSOR (recuado para não cortar)
  text(page, `${qtdInv}× ${invDesc}`, 430, 320, font, 7);
  text(page, `${potCA} kW CA`, 430, 310, font, 7);

  // DPS CC + cabos CC — entre INVERSOR e GERADOR (lado esquerdo)
  text(page, `DPS CC: ${data.sistemaFV.dpsCC || '1000 V'}`, 90, 280, font, 6.5);
  text(page, 'Cabos CC: 6 mm² · 1000 V', 90, 270, font, 6.5);

  // GERADOR — ao lado do círculo G (módulos + potência pico)
  text(page, `${qtdMod}× ${modDesc}`, 360, 235, font, 7.5);
  text(page, `${data.sistemaFV.moduloPotencia} Wp/módulo · ${potPico} kWp total`, 360, 224, font, 7);

  // Strings — abaixo do gerador
  const strings = data.sistemaFV.strings || [];
  if (strings.length) {
    const stringDesc = strings
      .map((s, i) => `S${i + 1}: ${s.modulosEmSerie}×série / ${s.stringsParalelo}p`)
      .join('  ');
    text(page, stringDesc, 360, 213, font, 6.5);
  }

  // Rodapé: Local cx=90, Data cx=210
  text(page, data.endereco.cidade, 90, 60, font, 8, 'center');
  text(page, today(), 210, 60, font, 8, 'center');
}

// ─────────────────────────────────────────────────────────────────────────────
// CEEE — DIAGRAMA DE BLOCOS (1 página)
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarDiagramaBlocosCEEE(data: ProjetoData): Promise<Uint8Array> {
  const bytes = await loadTemplate('/documentos/ceee/diagrama-blocos.pdf');
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  drawDiagramaBlocosCEEE(doc, font, data);
  return doc.save();
}

export function drawDiagramaBlocosCEEE(doc: PDFDocument, font: PDFFont, data: ProjetoData) {
  const page = doc.getPage(0);

  // ── MÁSCARAS — o template traz dados de EXEMPLO embutidos (CLEBER/Rua Formosa/Tiago/UC 70984416)
  //    que precisam ser cobertos. O cabeçalho é redesenhado para evitar sobras do texto antigo.
  mask(page,  28, 704,   550, 42);
  mask(page, 396, 536,   100, 18); // UC: 70984416 (bloco de medição)

  // ── ESCREVE OS DADOS REAIS DO PROJETO (ancorados nos rótulos do template) ──
  text(page, 'Cliente:', 40, 736, font, 7);
  text(page, data.cliente.nome, 82, 736, font, 9);

  const endCompleto = `${data.endereco.logradouro}, ${data.endereco.numero}, ${data.endereco.bairro} - ${data.endereco.cidade}, ${data.endereco.uf}`;
  text(page, 'Localização:', 40, 724.8, font, 7);
  text(page, endCompleto, 100, 724.8, font, 8);

  const respTec = data.engenheiro ? `${data.engenheiro}${data.crea ? ' - ' + data.crea : ''}` : '';
  text(page, 'Responsável técnico:', 40, 713.5, font, 7);
  text(page, respTec, 144, 713.5, font, 9);

  text(page, 'UC:', 399, 548.2, font, 6); // UC no bloco de medição
  text(page, data.unidadeConsumidora.codigo, 418, 548.2, font, 8);

  // Rodapé: linhas de assinatura — Local (label x≈57) / Data (label x≈139)
  text(page, data.endereco.cidade, 75, 58, font, 9, 'center');
  text(page, today(), 160, 58, font, 9, 'center');
}

// ─────────────────────────────────────────────────────────────────────────────
// CEEE — ANEXO I (xlsx)
// ─────────────────────────────────────────────────────────────────────────────
export function downloadAnexoICEEE() {
  const a = document.createElement('a');
  a.href = '/documentos/ceee/anexo-i.xlsx';
  a.download = 'Anexo_I_CEEE_Formulario_Solicitacao.xlsx';
  a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de download
// ─────────────────────────────────────────────────────────────────────────────

/** Baixa o PDF gerado no navegador */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
