/**
 * Calibrador visual de documentos — roda em Node (type-stripping nativo).
 *
 * Usa as MESMAS funções de desenho do navegador (src/lib/pdfGenerator.ts),
 * lendo o template do disco e salvando um PDF preenchido com dados de exemplo.
 *
 * Uso:  node scripts/calibrate.ts <doc>
 *   docs: anexo-e | anexo-f | diagrama-rge | blocos-ceee
 * Depois renderize:  pdftoppm -png -r 150 /tmp/calib/<doc>.pdf /tmp/calib/<doc>
 */

import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import {
  drawAnexoERGE,
  drawAnexoFRGE,
  drawDiagramaUnifilarRGE,
  drawDiagramaBlocosCEEE,
  type ProjetoData,
} from '../src/lib/pdfGenerator.ts';

const SAMPLE: ProjetoData = {
  cliente: {
    nome: 'Maria Oliveira da Silva Santos',
    cpfCnpj: '123.456.789-00',
    rg: '1234567890',
    email: 'maria.oliveira@email.com.br',
    telefone: '(51) 3333-4444',
    celular: '(51) 99876-5432',
  },
  unidadeConsumidora: {
    codigo: '987654321',
    contaContrato: '1122334455',
    classe: 'residencial',
    tipoConexao: 'trifasica',
    tensaoAtendimento: '220/380V',
    cargaInstalada: '15',
    consumoMedio: '850',
    tipoRamal: 'aereo',
  },
  endereco: {
    cep: '91000-000',
    logradouro: 'Rua das Flores',
    numero: '1234',
    complemento: 'Casa 2',
    bairro: 'Jardim Botânico',
    cidade: 'Porto Alegre',
    uf: 'RS',
  },
  localizacao: {
    latitude: -30.034647,
    longitude: -51.217658,
    inclinacaoTelhado: 20,
    orientacaoTelhado: 0,
    tipoTelhado: 'ceramico',
    areaTelhado: '48',
  },
  sistemaFV: {
    moduloFabricante: 'Canadian Solar',
    moduloModelo: 'CS7N-660MS',
    moduloPotencia: 660,
    quantidadeModulos: '18',
    potenciaInstalada: 11.88,
    inversorFabricante: 'Growatt',
    inversorModelo: 'MIN 10000TL-X',
    inversorPotencia: 10,
    quantidadeInversores: '1',
    strings: [{ modulosEmSerie: '18', stringsParalelo: '1', mpptIndex: 0 }],
    disjuntorGeracao: '32A',
    dpsCC: 'Classe II',
    dpsCA: 'Classe II',
  },
  engenheiro: 'Eng. Carlos Eduardo Pereira',
  crea: 'RS-123456',
};

type DocDef = {
  template: string;
  draw: (doc: PDFDocument, font: any, data: ProjetoData) => void;
};

const DOCS: Record<string, DocDef> = {
  'anexo-e': { template: 'public/documentos/rge/anexo-e.pdf', draw: drawAnexoERGE },
  'anexo-f': { template: 'public/documentos/rge/anexo-f.pdf', draw: drawAnexoFRGE },
  'diagrama-rge': { template: 'public/documentos/rge/diagrama-unifilar.pdf', draw: drawDiagramaUnifilarRGE },
  'blocos-ceee': { template: 'public/documentos/ceee/diagrama-blocos.pdf', draw: drawDiagramaBlocosCEEE },
};

const key = process.argv[2];
const def = DOCS[key];
if (!def) {
  console.error('Doc desconhecido. Use:', Object.keys(DOCS).join(' | '));
  process.exit(1);
}

const bytes = fs.readFileSync(def.template);
const doc = await PDFDocument.load(bytes);
const font = await doc.embedFont(StandardFonts.Helvetica);
def.draw(doc, font, SAMPLE);
const out = `/tmp/calib/${key}.pdf`;
fs.writeFileSync(out, await doc.save());
console.log('OK →', out);
