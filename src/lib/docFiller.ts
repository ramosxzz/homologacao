/**
 * Preenchimento de templates editáveis (.docx / .xlsx) com dados do projeto.
 * Só diagramas são gerados como PDF — o restante usa os templates oficiais
 * enviados pela distribuidora, preenchidos in-place preservando formatação,
 * fórmulas e imagens embutidas.
 *
 * - DOCX: PizZip + substituição por parágrafo (achata runs fragmentados,
 *   preservando a formatação de parágrafo). Resolve tokens quebrados em
 *   múltiplos <w:r>, ex.: "[NOME DO CLIENTE]".
 * - XLSX: ExcelJS carrega o template, grava células por endereço (mantém
 *   fórmulas, estilos, imagens e demais abas) e reserializa.
 */
import PizZip from 'pizzip';
import ExcelJS from 'exceljs';

const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function fetchTemplate(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar template: ${path} (${res.status})`);
  return res.arrayBuffer();
}

function xmlEncode(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function xmlDecode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Preenche um template DOCX substituindo tokens no texto visível.
 * A substituição é feita por parágrafo: concatena o texto de todos os runs,
 * aplica as trocas e, se houve alteração, reescreve o parágrafo num único run
 * (mantendo o rPr do primeiro run e o pPr do parágrafo). Isso resolve tokens
 * fragmentados entre runs sem afetar a formatação dos demais parágrafos.
 */
export async function fillDocx(
  templatePath: string,
  replacements: Record<string, string>,
): Promise<Blob> {
  const buf = await fetchTemplate(templatePath);
  const zip = new PizZip(buf);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('document.xml não encontrado no DOCX');
  let xml = docFile.asText();

  const tokens = Object.keys(replacements);

  xml = xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (para) => {
    const texts = [...para.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]);
    if (texts.length === 0) return para;
    let full = xmlDecode(texts.join(''));

    let hit = false;
    for (const t of tokens) {
      if (full.includes(t)) {
        full = full.split(t).join(replacements[t]);
        hit = true;
      }
    }
    if (!hit) return para;

    const pPrMatch = para.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const firstRun = para.match(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/);
    const rPr = firstRun ? (firstRun[1].match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0] : '';
    const pStart = (para.match(/^<w:p\b[^>]*>/) || ['<w:p>'])[0];

    return (
      `${pStart}${pPrMatch ? pPrMatch[0] : ''}` +
      `<w:r>${rPr}<w:t xml:space="preserve">${xmlEncode(full)}</w:t></w:r></w:p>`
    );
  });

  zip.file('word/document.xml', xml);
  const out = zip.generate({ type: 'arraybuffer', compression: 'DEFLATE' });
  return new Blob([out], { type: MIME_DOCX });
}

/** Edições por aba: { 'NomeAba': { 'C5': valor, ... } } */
export type XlsxEdits = Record<string, Record<string, string | number>>;

/**
 * Preenche um template XLSX gravando células por endereço, preservando
 * fórmulas, estilos, imagens e demais abas.
 */
export async function fillXlsx(templatePath: string, edits: XlsxEdits): Promise<Blob> {
  const buf = await fetchTemplate(templatePath);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  for (const [sheetName, cells] of Object.entries(edits)) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) continue;
    for (const [addr, value] of Object.entries(cells)) {
      if (value === undefined || value === null || value === '') continue;
      const cell = ws.getCell(addr);
      // não sobrescreve células de fórmula
      if (cell.formula) continue;
      cell.value = value as string | number;
    }
  }

  const out = await wb.xlsx.writeBuffer();
  return new Blob([out], { type: MIME_XLSX });
}

/** Dispara o download de um Blob no navegador. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
