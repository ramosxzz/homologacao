/**
 * Mapeamento dos dados do projeto → templates oficiais editáveis.
 * Preenche apenas os campos que o sistema captura hoje; os campos de
 * engenharia (dimensionamento de cabos, HSP, tabelas de cálculo) permanecem
 * como no template original para preenchimento manual pelo responsável técnico.
 */
import type { ProjetoData } from './pdfGenerator';
import { fillDocx, fillXlsx, type XlsxEdits } from './docFiller';

function hoje(): string {
  return new Date().toLocaleDateString('pt-BR');
}
function fmtPot(kw: number): string {
  return (Math.round(kw * 100) / 100).toString().replace('.', ',');
}
function enderecoLinha(d: ProjetoData): string {
  const e = d.endereco;
  const base = [e.logradouro, e.numero, e.complemento].filter(Boolean).join(', ');
  return base + (e.bairro ? ` - ${e.bairro}` : '') + (e.cidade ? `, ${e.cidade}/${e.uf}` : '');
}
const UF_NOMES: Record<string, string> = {
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', PR: 'Paraná', SP: 'São Paulo',
  RJ: 'Rio de Janeiro', MG: 'Minas Gerais', ES: 'Espírito Santo',
};
// ─── ANEXO E — RGE (docx) ─────────────────────────────────────────────────────
// Substitui os valores-exemplo do template pelos dados do projeto.
export function fillAnexoE(d: ProjetoData): Promise<Blob> {
  const pot = `${fmtPot(d.sistemaFV.potenciaInstalada)} kW`;
  const tensao = d.unidadeConsumidora.tensaoAtendimento || '220 V';
  const contato = [d.cliente.celular || d.cliente.telefone, d.cliente.email]
    .filter(Boolean).join(' / ');
  const repl: Record<string, string> = {
    // Dados técnicos
    '3095008465': d.unidadeConsumidora.codigo || '3095008465',
    'GOODWE': (d.sistemaFV.inversorFabricante || 'GOODWE').toUpperCase(),
    'GW5K-DNS-G40': d.sistemaFV.inversorModelo || 'GW5K-DNS-G40',
    'Quantidade instalada: 1': `Quantidade instalada: ${d.sistemaFV.quantidadeInversores || '1'}`,
    'Tensão nominal de conexão à rede: 220 V': `Tensão nominal de conexão à rede: ${tensao}`,
    '5 kW (Valor de potência instalada total de geração, em kW)':
      `${pot} (Valor de potência instalada total de geração, em kW)`,
    'Potência nominal de conexão à rede: 5 kW': `Potência nominal de conexão à rede: ${pot}`,
    // Identificação do solicitante (seção 5) + local/data
    'MANDRIFER USINAGEM DE PECAS LTDA': d.cliente.nome || 'MANDRIFER USINAGEM DE PECAS LTDA',
    '+55 51 99983-8492 / mandrifer@hotmail.com': contato || '+55 51 99983-8492 / mandrifer@hotmail.com',
    'Novo Hamburgo': d.endereco.cidade || 'Novo Hamburgo',
    '25/05/2026': hoje(),
  };
  return fillDocx('/documentos/rge/anexo-e.docx', repl);
}

// ─── MEMORIAL DESCRITIVO — CEEE (docx) ────────────────────────────────────────
export function fillMemorial(d: ProjetoData): Promise<Blob> {
  const agora = new Date();
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO',
    'AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  const cidadeUf = `${(d.endereco.cidade || 'CIDADE').toUpperCase()} – ${d.endereco.uf}`;
  const mesAno = `${meses[agora.getMonth()]} – ${agora.getFullYear()}`;
  const modalidade = 'AUTOCONSUMO LOCAL';

  const repl: Record<string, string> = {
    '[TIPO DE GERAÇÃO]': 'FOTOVOLTAICO',
    '[tipo de geração]': 'fotovoltaico',
    'XX kW': `${fmtPot(d.sistemaFV.potenciaInstalada)} kW`,
    '[TENSÃO NOMINAL DA REDE]': d.unidadeConsumidora.tensaoAtendimento || '220/380 V',
    '[AUTOCONSUMO LOCAL, AUTOCONSUMO REMOTO, GERAÇÃO COMPARTILHADA OU EMUC]': modalidade,
    '[NOME DO CLIENTE]': d.cliente.nome || '[NOME DO CLIENTE]',
    '[XXXXXXXXXX]': d.cliente.rg || d.cliente.cpfCnpj || '[XXXXXXXXXX]',
    '[NOME DO RESPONSÁVEL TÉCNICO]': d.engenheiro || '[NOME DO RESPONSÁVEL TÉCNICO]',
    '[PROFISSÃO]': 'Engenheiro Eletricista',
    'REGISTRO: XXXXXXXXXX': `REGISTRO: ${d.crea || 'XXXXXXXXXX'}`,
    '[NOME DA CONCESSIONÁRIA]': 'CEEE Equatorial',
    '[NOME DO ESTADO]': UF_NOMES[d.endereco.uf] || d.endereco.uf,
    'CIDADE – UF MÊS – ANO': `${cidadeUf} ${mesAno}`,
    // Seção DADOS DA UNIDADE CONSUMIDORA (rótulos com valor em branco)
    'Número da Conta Contrato:': `Número da Conta Contrato: ${d.unidadeConsumidora.contaContrato || ''}`,
    'Nome do Titular da CC:': `Nome do Titular da CC: ${d.cliente.nome || ''}`,
    'Endereço Completo:': `Endereço Completo: ${enderecoLinha(d)}`,
    'Coordenadas georrefenciadas (em UTM ou Graus decimais):':
      `Coordenadas georrefenciadas (em UTM ou Graus decimais): ${d.localizacao.latitude}, ${d.localizacao.longitude}`,
  };
  // "Classe:" é rótulo ambíguo (aparece 2x) — substitui só o parágrafo exato.
  const exact: Record<string, string> = {
    'Classe:': `Classe: ${d.unidadeConsumidora.classe || ''}`,
  };
  return fillDocx('/documentos/ceee/memorial.docx', repl, exact);
}

// ─── ANEXO F — RGE (xlsx, aba "Input") ────────────────────────────────────────
export function fillAnexoF(d: ProjetoData): Promise<Blob> {
  const e = d.endereco;
  const edits: XlsxEdits = {
    Input: {
      C3: hoje(),
      C4: d.unidadeConsumidora.codigo,
      C5: d.cliente.nome,
      C7: d.cliente.cpfCnpj,
      C8: d.cliente.email,
      C9: d.cliente.telefone || d.cliente.celular,
      C10: d.cliente.celular || d.cliente.telefone,
      // Endereço requerente
      C20: e.logradouro, C21: e.numero, C22: e.bairro, C23: e.cidade, C24: e.cep,
      // Endereço da obra
      C27: e.logradouro, C28: e.numero, C29: e.bairro, C30: e.cidade, C31: e.cep,
      C32: d.localizacao.latitude, C33: d.localizacao.longitude,
      // Módulos
      C36: d.sistemaFV.quantidadeModulos,
      C37: d.sistemaFV.moduloFabricante,
      C38: d.sistemaFV.moduloModelo,
      C41: d.sistemaFV.moduloPotencia,
      // Inversor
      F29: d.sistemaFV.quantidadeInversores,
      F30: d.sistemaFV.inversorFabricante,
      F31: d.sistemaFV.inversorModelo,
      // Tensão / carga
      F21: d.unidadeConsumidora.tensaoAtendimento,
      F24: d.unidadeConsumidora.cargaInstalada,
      F26: d.unidadeConsumidora.cargaInstalada,
    },
  };
  return fillXlsx('/documentos/rge/anexo-f.xlsx', edits);
}

// ─── ANEXO I — CEEE (xlsx, abas "1" e "0") ────────────────────────────────────
export function fillAnexoI(d: ProjetoData): Promise<Blob> {
  const invAC = d.sistemaFV.inversorPotencia * (parseInt(d.sistemaFV.quantidadeInversores) || 1);
  const potStr = fmtPot(invAC || d.sistemaFV.potenciaInstalada);
  const edits: XlsxEdits = {
    // GUIA 1 — formulário principal
    '1': {
      C10: d.cliente.nome,
      R10: d.cliente.cpfCnpj,
      C13: enderecoLinha(d),
      T13: d.cliente.celular || d.cliente.telefone,
      D15: d.endereco.cep,
      I15: d.endereco.cidade,
      Q15: d.endereco.uf,
      V15: d.cliente.email,
      Z17: d.unidadeConsumidora.contaContrato,
      AC29: (d.unidadeConsumidora.tensaoAtendimento || '').replace(/V/gi, '').split('/')[0].trim(),
      F31: d.unidadeConsumidora.cargaInstalada,
      C38: d.cliente.nome,
      R38: d.cliente.celular || d.cliente.telefone,
      Y38: d.cliente.email,
      C43: d.engenheiro || '',
      Y43: d.crea || '',
      AC55: potStr,
      AC57: potStr,
    },
    // GUIA 0 — módulos e inversores
    '0': {
      D7: d.sistemaFV.moduloPotencia,
      H7: d.sistemaFV.quantidadeModulos,
      T7: d.sistemaFV.moduloFabricante,
      AA7: d.sistemaFV.moduloModelo,
      D22: d.sistemaFV.inversorFabricante,
      H22: d.sistemaFV.inversorModelo,
      L22: d.sistemaFV.inversorPotencia,
      P22: (d.unidadeConsumidora.tensaoAtendimento || '').replace(/V/gi, '').split('/')[0].trim(),
    },
  };
  return fillXlsx('/documentos/ceee/anexo-i.xlsx', edits);
}
