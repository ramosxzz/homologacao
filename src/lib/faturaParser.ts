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

export function parseCEEE(text: string): ParsedFatura {
  const result: ParsedFatura = { distribuidora: 'CEEE' };

  const pagadorRegex = /Pagador\s*\n+([^\n]+)\n+([^\n]+)\n+CEP\s*([\d-]+)\s*-\s*([^-]+)-\s*([A-Z]{2})\n+(?:CPF|CNPJ):\s*([\d./-]+)/i;
  const match = text.match(pagadorRegex);

  if (match) {
    result.nome = match[1].trim();
    const addressLine = match[2].trim();
    result.cep = match[3].trim();
    result.cidade = match[4].trim();
    result.uf = match[5].trim();
    result.cpfCnpj = match[6].trim();

    const addrParts = addressLine.split(',');
    if (addrParts.length >= 2) {
      result.logradouro = addrParts[0].trim();
      const rest = addrParts.slice(1).join(',').trim();
      const numMatch = rest.match(/^(\d+)/);
      if (numMatch) result.numero = numMatch[1];

      const neighborhoodMatch = rest.match(/-\s*-\s*(.+)$/);
      if (neighborhoodMatch) {
        result.bairro = neighborhoodMatch[1].trim();
      } else {
        const parts = rest.split('-');
        if (parts.length >= 2) result.bairro = parts[parts.length - 1].trim();
      }
    }
  }

  if (result.nome) {
    const ucRegex = new RegExp(`${escapeRegex(result.nome)}\\s*\\n+(\\d+)`, 'i');
    const ucMatch = text.match(ucRegex);
    if (ucMatch) result.codigoUC = ucMatch[1].trim();
  }

  if (!result.codigoUC) {
    const ucMatches = text.match(/\b\d{8,10}\b/g);
    const cepDigits = result.cep?.replace('-', '');
    if (ucMatches) result.codigoUC = ucMatches.find((value) => value !== cepDigits);
  }

  if (/BIF[AÁ]SICO/i.test(text)) {
    result.tipoConexao = 'bifasica';
  } else if (/TRIF[AÁ]SICO/i.test(text)) {
    result.tipoConexao = 'trifasica';
  } else if (/MONOF[AÁ]SICO/i.test(text)) {
    result.tipoConexao = 'monofasica';
  }

  result.consumoMedio = parseHistoryAverage(text);

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
