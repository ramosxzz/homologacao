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
  /**
   * Substituições por parágrafo exato: quando o texto do parágrafo (após trim)
   * for exatamente igual à chave, todo o parágrafo vira o valor. Útil para
   * rótulos curtos e ambíguos (ex.: "Classe:") que não podem usar substring.
   */
  exactParas: Record<string, string> = {},
  /**
   * Imagens inline: quando o texto (achatado) do parágrafo contém `token`,
   * o parágrafo passa a conter a imagem (data URL) no tamanho indicado.
   * Usado para a "planta de situação" do Memorial (satélite do telhado).
   */
  images: DocxImage[] = [],
): Promise<Blob> {
  const buf = await fetchTemplate(templatePath);
  const zip = new PizZip(buf);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('document.xml não encontrado no DOCX');
  let xml = docFile.asText();

  // Registra imagens (media + rels + content types) e monta o mapa token→drawing
  const drawings = images.length ? registerDocxImages(zip, images) : [];

  const tokens = Object.keys(replacements);

  xml = xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (para) => {
    const texts = [...para.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]);
    if (texts.length === 0) return para;
    let full = xmlDecode(texts.join(''));

    const pPrMatch = para.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pStart = (para.match(/^<w:p\b[^>]*>/) || ['<w:p>'])[0];

    // Imagem: substitui todo o corpo do parágrafo pelo drawing
    for (const dr of drawings) {
      if (full.includes(dr.token)) {
        return `${pStart}${pPrMatch ? pPrMatch[0] : ''}<w:r>${dr.xml}</w:r></w:p>`;
      }
    }

    let hit = false;
    const exact = exactParas[full.trim()];
    if (exact !== undefined) {
      full = exact;
      hit = true;
    }
    for (const t of tokens) {
      if (full.includes(t)) {
        full = full.split(t).join(replacements[t]);
        hit = true;
      }
    }
    if (!hit) return para;

    const firstRun = para.match(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/);
    const rPr = firstRun ? (firstRun[1].match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0] : '';

    return (
      `${pStart}${pPrMatch ? pPrMatch[0] : ''}` +
      `<w:r>${rPr}<w:t xml:space="preserve">${xmlEncode(full)}</w:t></w:r></w:p>`
    );
  });

  zip.file('word/document.xml', xml);
  const out = zip.generate({ type: 'arraybuffer', compression: 'DEFLATE' });
  return new Blob([out], { type: MIME_DOCX });
}

/** Imagem inline no DOCX: token a localizar + data URL + tamanho em cm. */
export type DocxImage = { token: string; dataUrl: string; widthCm: number; heightCm: number };

const EMU_PER_CM = 360000;

/** Adiciona media/rels/content-types e retorna o XML do drawing por token. */
function registerDocxImages(
  zip: PizZip,
  images: DocxImage[],
): Array<{ token: string; xml: string }> {
  // 1) [Content_Types].xml — garante defaults png/jpeg
  const ctPath = '[Content_Types].xml';
  let ct = zip.file(ctPath)?.asText() || '';
  const ensureDefault = (ext: string, mime: string) => {
    if (!new RegExp(`Extension="${ext}"`).test(ct)) {
      ct = ct.replace('</Types>', `<Default Extension="${ext}" ContentType="${mime}"/></Types>`);
    }
  };
  ensureDefault('png', 'image/png');
  ensureDefault('jpeg', 'image/jpeg');
  ensureDefault('jpg', 'image/jpeg');
  zip.file(ctPath, ct);

  // 2) rels
  const relsPath = 'word/_rels/document.xml.rels';
  let rels = zip.file(relsPath)?.asText() || '';
  const usedIds = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1]));
  let nextId = (usedIds.length ? Math.max(...usedIds) : 0) + 1;

  const out: Array<{ token: string; xml: string }> = [];
  let mediaN = 900;

  for (const img of images) {
    const { buffer, ext } = dataUrlToBuffer(img.dataUrl);
    const fileExt = ext === 'jpeg' ? 'jpeg' : ext;
    const mediaName = `imgGen${mediaN++}.${fileExt}`;
    zip.file(`word/media/${mediaName}`, buffer);

    const rId = `rId${nextId++}`;
    rels = rels.replace(
      '</Relationships>',
      `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaName}"/></Relationships>`,
    );

    const cx = Math.round(img.widthCm * EMU_PER_CM);
    const cy = Math.round(img.heightCm * EMU_PER_CM);
    const docId = nextId + 1000;
    out.push({ token: img.token, xml: drawingXml(rId, docId, cx, cy) });
  }

  zip.file(relsPath, rels);
  return out;
}

function drawingXml(rId: string, id: number, cx: number, cy: number): string {
  return (
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${id}" name="Imagem${id}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${id}" name="Imagem${id}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`
  );
}

/** Edições por aba: { 'NomeAba': { 'C5': valor, ... } } */
export type XlsxEdits = Record<string, Record<string, string | number>>;

/** Imagem a embutir: data URL + aba + âncora (tl/br em coords 0-based). */
export type XlsxImage = {
  sheet: string;
  dataUrl: string;
  tl: { col: number; row: number };
  br: { col: number; row: number };
};

function dataUrlToBuffer(dataUrl: string): { buffer: ArrayBuffer; ext: 'png' | 'jpeg' | 'gif' } {
  const m = dataUrl.match(/^data:image\/(png|jpe?g|gif);base64,(.+)$/);
  if (!m) throw new Error('data URL de imagem inválido');
  const ext = (m[1] === 'jpg' ? 'jpeg' : m[1]) as 'png' | 'jpeg' | 'gif';
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { buffer: bytes.buffer, ext };
}

/**
 * Preenche um template XLSX gravando células por endereço, preservando
 * fórmulas, estilos, imagens e demais abas. Opcionalmente embute imagens.
 */
export async function fillXlsx(
  templatePath: string,
  edits: XlsxEdits,
  images: XlsxImage[] = [],
): Promise<Blob> {
  const buf = await fetchTemplate(templatePath);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  for (const img of images) {
    const ws = wb.getWorksheet(img.sheet);
    if (!ws) continue;
    try {
      const { buffer, ext } = dataUrlToBuffer(img.dataUrl);
      const id = wb.addImage({ buffer, extension: ext });
      ws.addImage(id, { tl: img.tl, br: img.br, editAs: 'oneCell' } as unknown as Parameters<typeof ws.addImage>[1]);
    } catch {
      // imagem inválida — ignora, mantém template
    }
  }

  // Força recálculo ao abrir: abas oficiais puxam do "Input" via fórmula e o
  // ExcelJS mantém o resultado cacheado. Sem isto, o Excel/LibreOffice mostra
  // os valores antigos do template.
  wb.calcProperties.fullCalcOnLoad = true;

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

  // Remove os resultados cacheados das fórmulas para forçar recálculo ao abrir.
  // As abas oficiais puxam do "Input" via fórmula; sem isto, Excel/LibreOffice
  // exibiriam os valores antigos do template (fullCalcOnLoad é ignorado por
  // alguns leitores). Célula sem <v> obriga o app a computar.
  const zip = new PizZip(out);
  for (const name of Object.keys(zip.files)) {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) continue;
    let sx = zip.file(name)!.asText();
    sx = sx
      .replace(/<\/f><v>[\s\S]*?<\/v>/g, '</f>')
      .replace(/(<f\b[^>]*\/>)<v>[\s\S]*?<\/v>/g, '$1');
    zip.file(name, sx);
  }
  const finalBuf = zip.generate({ type: 'arraybuffer', compression: 'DEFLATE' });
  return new Blob([finalBuf], { type: MIME_XLSX });
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
