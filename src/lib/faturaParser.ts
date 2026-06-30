export type ParsedFatura = {
  distribuidora: 'CEEE' | 'RGE';
  nome?: string;
  cpfCnpj?: string;
  codigoUC?: string;
  contaContrato?: string;
  classe?: string;
  tipoConexao?: string;
  tensaoAtendimento?: string;
  consumoMedio?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  error?: string;
};

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseAddressLine(line: string): { logradouro?: string; numero?: string } {
  const cleaned = normalizeSpaces(line.replace(/,/g, ' '));
  const match = cleaned.match(/^(.+?)\s+(\d+[A-Z]?)$/i);
  if (!match) return { logradouro: cleaned };
  return {
    logradouro: match[1].trim(),
    numero: match[2].trim(),
  };
}

function parseHistoryAverage(text: string): string | undefined {
  const values: number[] = [];
  const historyRegex = /\b(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+\d{2}\b[\s\S]{0,260}?\b(\d{1,4})\s+(\d{1,2})\b/g;
  let match: RegExpExecArray | null;

  while ((match = historyRegex.exec(text)) && values.length < 12) {
    const consumption = Number(match[1]);
    const days = Number(match[2]);
    if (consumption >= 20 && consumption <= 5000 && days >= 20 && days <= 35) {
      values.push(consumption);
    }
  }

  if (!values.length) return undefined;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(avg).toString();
}

/** Histórico CEEE: "DEZ 29 193,0 6,66" (mês, dias, kWh c/vírgula, média diária) */
function parseCEEEHistoryAverage(text: string): string | undefined {
  const values: number[] = [];
  const re = /\b(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(\d{2})\s+(\d{1,4}),\d+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && values.length < 13) {
    const days = Number(m[1]);
    const consumption = Number(m[2]);
    if (consumption >= 20 && consumption <= 5000 && days >= 20 && days <= 35) {
      values.push(consumption);
    }
  }
  if (!values.length) return undefined;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.round(avg).toString();
}

export function parseCEEE(text: string): ParsedFatura {
  const result: ParsedFatura = { distribuidora: 'CEEE' };

  // Bloco "Pagador" (parte inferior) — fonte canônica de nome + CPF real + endereço completo.
  // Formato: "Pagador\nNOME CPF: xxx.xxx.xxx-xx\nLOGRADOURO, N - - BAIRRO\nCEP NNNNN-NNN - CIDADE - UF"
  const pagadorBlock = text.match(
    /Pagador\s*\n+([^\n]+?)\s+(?:CPF|CNPJ):\s*([\d./-]+)\s*\n+([^\n]+)\n+CEP\s*(\d{5}-?\d{3})\s*-\s*([^-\n]+?)\s*-\s*([A-Z]{2})/i
  );

  if (pagadorBlock) {
    result.nome = normalizeSpaces(pagadorBlock[1]);
    result.cpfCnpj = pagadorBlock[2].trim();
    const addressLine = pagadorBlock[3].trim();
    result.cep = pagadorBlock[4].trim();
    result.cidade = normalizeSpaces(pagadorBlock[5]);
    result.uf = pagadorBlock[6].trim().toUpperCase();

    // "LOGRADOURO, 938 - - BAIRRO" — vírgula separa rua de número, "- -" separa endereço de bairro
    const addrMatch = addressLine.match(/^(.+?),\s*(\d+[A-Z]?)\s*-\s*-?\s*(.+)$/);
    if (addrMatch) {
      result.logradouro = normalizeSpaces(addrMatch[1]);
      result.numero = addrMatch[2].trim();
      result.bairro = normalizeSpaces(addrMatch[3]);
    } else {
      const parts = addressLine.split(',');
      result.logradouro = normalizeSpaces(parts[0] || '');
      if (parts[1]) {
        const numMatch = parts[1].match(/^\s*(\d+[A-Z]?)/);
        if (numMatch) result.numero = numMatch[1];
        const bairroMatch = parts[1].match(/-\s*-?\s*(.+)$/);
        if (bairroMatch) result.bairro = normalizeSpaces(bairroMatch[1]);
      }
    }
  }

  // Cabeçalho — UC (8 dígitos) e Parceiro de Negócio (10 dígitos) ficam como linhas próprias
  // perto do nome do titular. Procura entre o início e o "Pagador".
  const headerEnd = text.search(/Pagador\b/i);
  const header = headerEnd > 0 ? text.slice(0, headerEnd) : text;

  // Parceiro de Negócio = 10 dígitos isolados
  const parceiroMatch = header.match(/(?:^|\n)\s*(\d{10})\s*(?:\n|$)/m);
  if (parceiroMatch) result.contaContrato = parceiroMatch[1];

  // Número da UC = 8 dígitos isolados (mais antigo) ou 10 dígitos novo padrão ANEEL
  const ucMatch = header.match(/(?:^|\n)\s*(\d{8})\s*(?:\n|$)/m);
  if (ucMatch) result.codigoUC = ucMatch[1];

  // Tipo de fornecimento (BIFASICO/TRIFASICO/MONOFASICO) — sem acento na fatura CEEE
  if (/BIF[AÁ]SICO/i.test(text)) result.tipoConexao = 'bifasica';
  else if (/TRIF[AÁ]SICO/i.test(text)) result.tipoConexao = 'trifasica';
  else if (/MONOF[AÁ]SICO/i.test(text)) result.tipoConexao = 'monofasica';

  // Classificação
  if (/RESIDENCIAL/i.test(text)) result.classe = 'residencial';
  else if (/COMERCIAL/i.test(text)) result.classe = 'comercial';
  else if (/INDUSTRIAL/i.test(text)) result.classe = 'industrial';
  else if (/RURAL/i.test(text)) result.classe = 'rural';

  // Tensão Nominal "127-127" / "220-220" / "127-220" / "220-380"
  const tensaoMatch = text.match(/(?:Tens[ãa]o\s+Nominal\s+Disp\.?:?\s*)?(\d{3})-(\d{3})\b/i);
  if (tensaoMatch) {
    const a = tensaoMatch[1];
    const b = tensaoMatch[2];
    // Normaliza pros valores aceitos no wizard CEEE: 127/220V, 220/380V, 220V
    if (a === '127' && b === '127') result.tensaoAtendimento = '127/220V';
    else if (a === '220' && b === '220') result.tensaoAtendimento = '220V';
    else if (a === '220' && b === '380') result.tensaoAtendimento = '220/380V';
    else if (a === '127' && b === '220') result.tensaoAtendimento = '127/220V';
    else result.tensaoAtendimento = `${a}/${b}V`;
  }

  result.consumoMedio = parseCEEEHistoryAverage(text) || parseHistoryAverage(text);

  return result;
}

export function parseRGE(text: string): ParsedFatura {
  const result: ParsedFatura = { distribuidora: 'RGE' };

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const companyLineIndex = lines.findIndex((line) => /RGE\s+SUL\s+DISTRIBUIDORA/i.test(line));
  const customerBlock = companyLineIndex >= 0 ? lines.slice(companyLineIndex + 1, companyLineIndex + 12) : lines;
  const cepLineIndex = customerBlock.findIndex((line) => /\b\d{5}-\d{3}\b/.test(line) && !/CEP:/i.test(line));

  if (cepLineIndex >= 3) {
    result.nome = normalizeSpaces(customerBlock[cepLineIndex - 3]);
    const address = parseAddressLine(customerBlock[cepLineIndex - 2]);
    result.logradouro = address.logradouro;
    result.numero = address.numero;
    result.bairro = normalizeSpaces(customerBlock[cepLineIndex - 1]);

    const cepCityMatch = customerBlock[cepLineIndex].match(/(\d{5}-\d{3})\s+(.+?)\s+([A-Z]{2})$/i);
    if (cepCityMatch) {
      result.cep = cepCityMatch[1];
      result.cidade = normalizeSpaces(cepCityMatch[2]);
      result.uf = cepCityMatch[3].toUpperCase();
    }
  }

  if (!result.nome) {
    const fallbackMatch = text.match(/\n\s*([A-ZÀ-Ú][A-ZÀ-Ú\s]{5,80})\n\s*([A-ZÀ-Ú0-9\s.,]+?)\n\s*([A-ZÀ-Ú\s]+)\n\s*(\d{5}-\d{3})\s+([A-ZÀ-Ú\s]+?)\s+([A-Z]{2})/);
    if (fallbackMatch) {
      result.nome = normalizeSpaces(fallbackMatch[1]);
      const address = parseAddressLine(fallbackMatch[2]);
      result.logradouro = address.logradouro;
      result.numero = address.numero;
      result.bairro = normalizeSpaces(fallbackMatch[3]);
      result.cep = fallbackMatch[4];
      result.cidade = normalizeSpaces(fallbackMatch[5]);
      result.uf = fallbackMatch[6].toUpperCase();
    }
  }

  const headerUcMatch = text.match(/\b[A-Z]{3,}\d{3,}-\d{6,}\s+(\d{6,10})\s+\d+\/\d+\s+\d{2}\/\d{2}\/\d{4}/i);
  if (headerUcMatch) result.codigoUC = headerUcMatch[1];

  if (result.nome) {
    const accountMatch = text.match(new RegExp(`${escapeRegex(result.nome)}[\\s\\S]{0,260}?\\b(\\d{10})\\b[\\s\\S]{0,80}?Pr[oó]xima\\s+leitura`, 'i'));
    if (accountMatch) result.contaContrato = accountMatch[1];
  }

  if (!result.contaContrato) {
    const accountMatch = text.match(/\b(\d{10})\b[^\n]{0,160}Pr[oó]xima\s+leitura/i);
    if (accountMatch) result.contaContrato = accountMatch[1];
  }

  if (!result.codigoUC) {
    const meterLine = text.match(/\n\s*(\d{6,10})\s+Energia\s+Ativa-kWh/i);
    if (meterLine) result.codigoUC = meterLine[1];
  }

  const cpfMatch = text.match(/CPF:\s*([\d.*-]+)/i);
  if (cpfMatch) result.cpfCnpj = cpfMatch[1].trim();

  if (/Bif[aá]sico/i.test(text)) {
    result.tipoConexao = 'bifasica';
  } else if (/Trif[aá]sico/i.test(text)) {
    result.tipoConexao = 'trifasica';
  } else if (/Monof[aá]sico/i.test(text)) {
    result.tipoConexao = 'monofasica';
  }

  if (/B1\s+Residencial|Residencial/i.test(text)) {
    result.classe = 'residencial';
  } else if (/Comercial/i.test(text)) {
    result.classe = 'comercial';
  } else if (/Industrial/i.test(text)) {
    result.classe = 'industrial';
  } else if (/Rural/i.test(text)) {
    result.classe = 'rural';
  }

  const voltageMatch = text.match(/TENS[ÃA]O\s+NOMINAL[\s\S]{0,120}?Disp\.:\s*(\d{2,3})/i);
  if (voltageMatch) result.tensaoAtendimento = `${voltageMatch[1]}V`;

  result.consumoMedio = parseHistoryAverage(text);

  return result;
}

export function parseFaturaText(text: string): ParsedFatura | { error: string } {
  if (/CEEE|COMPANHIA ESTADUAL|EQUATORIAL/i.test(text)) return parseCEEE(text);
  if (/RGE|CPFL/i.test(text)) return parseRGE(text);
  return { error: 'Distribuidora não identificada no PDF.' };
}
