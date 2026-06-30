/**
 * Geradores de PDF declarativos via @react-pdf/renderer.
 * Cada doc é um componente React; output é PDF real com texto selecionável.
 * Mantém mesma interface dos antigos geradores (Uint8Array async).
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image, pdf, Svg, Line, Circle, Rect, Path } from '@react-pdf/renderer';
import type { ProjetoData } from './pdfGenerator';

// ─── Tokens visuais ───────────────────────────────────────────────────────────
const COLOR = {
  ink: '#0f172a',
  muted: '#475569',
  border: '#1e293b',
  brand: '#dc2626',     // RGE vermelho
  brandSoft: '#fef2f2',
  ceee: '#0f4f9e',      // CEEE azul
  ceeeSoft: '#eef4fb',
  white: '#ffffff',
  pageBg: '#ffffff',
  cellBg: '#f8fafc',
};

const FONT = {
  // react-pdf inclui Helvetica nativa, sem fetch de fonte
  sans: 'Helvetica',
  sansBold: 'Helvetica-Bold',
  mono: 'Courier',
};

const today = () => new Date().toLocaleDateString('pt-BR');
const faseLabel: Record<string, string> = { monofasica: 'Monofásica', bifasica: 'Bifásica', trifasica: 'Trifásica' };

function fmtPower(kw: number) {
  return Number.isFinite(kw) ? kw.toFixed(2) : '—';
}

// ─── Estilos comuns ───────────────────────────────────────────────────────────
const base = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 32,
    backgroundColor: COLOR.pageBg,
    fontFamily: FONT.sans,
    fontSize: 9,
    color: COLOR.ink,
    lineHeight: 1.35,
  },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.brand,
  },
  brandText: {
    fontSize: 12,
    fontFamily: FONT.sansBold,
    color: COLOR.brand,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 8,
    color: COLOR.muted,
    marginTop: 2,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: FONT.sansBold,
    color: COLOR.ink,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  section: {
    marginTop: 10,
    borderWidth: 0.6,
    borderColor: COLOR.border,
    borderRadius: 2,
  },
  sectionTitle: {
    backgroundColor: '#0f172a',
    color: COLOR.white,
    fontFamily: FONT.sansBold,
    fontSize: 9.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: COLOR.border,
  },
  rowLast: {
    flexDirection: 'row',
  },
  labelCell: {
    flexBasis: '40%',
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: COLOR.cellBg,
    borderRightWidth: 0.4,
    borderRightColor: COLOR.border,
    fontSize: 8.5,
    color: COLOR.muted,
  },
  valueCell: {
    flexBasis: '60%',
    padding: 4,
    paddingHorizontal: 8,
    fontFamily: FONT.sansBold,
    fontSize: 9,
    color: COLOR.ink,
  },
  cell3: {
    flex: 1,
    padding: 4,
    paddingHorizontal: 6,
    borderRightWidth: 0.4,
    borderRightColor: COLOR.border,
    fontSize: 9,
  },
  cell3Last: {
    flex: 1,
    padding: 4,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  cellHeader: {
    backgroundColor: '#1e293b',
    color: COLOR.white,
    fontFamily: FONT.sansBold,
    fontSize: 8.5,
    padding: 4,
    paddingHorizontal: 6,
    textAlign: 'center',
    borderRightWidth: 0.4,
    borderRightColor: COLOR.white,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 0.6,
    borderTopColor: COLOR.border,
  },
  sigBox: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  sigLine: {
    width: '100%',
    borderTopWidth: 0.8,
    borderTopColor: COLOR.ink,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 8,
    color: COLOR.muted,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 14,
    right: 32,
    fontSize: 7.5,
    color: COLOR.muted,
  },
});

// ─── Helpers de layout ────────────────────────────────────────────────────────
function Field({ label, value, flex = 1, mono = false }: { label: string; value?: string | number; flex?: number; mono?: boolean }) {
  return (
    <View style={[base.row, { flex }]}>
      <Text style={base.labelCell}>{label}</Text>
      <Text style={mono ? [base.valueCell, { fontFamily: FONT.mono }] : base.valueCell}>{value ?? '—'}</Text>
    </View>
  );
}

function Header({ accent = COLOR.brand, eyebrow, title }: { accent?: string; eyebrow: string; title: string }) {
  return (
    <View style={[base.brandBar, { borderBottomColor: accent }]}>
      <View>
        <Text style={[base.brandText, { color: accent }]}>{eyebrow}</Text>
        <Text style={base.brandSubtitle}>Solaire Solar · Sistema de Homologação · {today()}</Text>
      </View>
      <Text style={[base.brandText, { color: COLOR.ink, fontSize: 14 }]}>{title}</Text>
    </View>
  );
}

function Footer({ cidade }: { cidade: string }) {
  return (
    <View style={base.footerRow}>
      <View style={base.sigBox}>
        <View style={base.sigLine} />
        <Text style={base.sigLabel}>{cidade}, {today()}</Text>
        <Text style={base.sigLabel}>Local e Data</Text>
      </View>
      <View style={base.sigBox}>
        <View style={base.sigLine} />
        <Text style={base.sigLabel}>Responsável Técnico</Text>
      </View>
      <View style={base.sigBox}>
        <View style={base.sigLine} />
        <Text style={base.sigLabel}>Proprietário / Titular UC</Text>
      </View>
    </View>
  );
}

// ─── ANEXO E — RGE ────────────────────────────────────────────────────────────
function AnexoERGEDoc({ data }: { data: ProjetoData }) {
  const carga = data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW` : '—';
  const consumoMedio = data.unidadeConsumidora.consumoMedio ? `${data.unidadeConsumidora.consumoMedio} kWh/mês` : '—';
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '—';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '—';
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const qtdInv = data.sistemaFV.quantidadeInversores || '1';
  const qtdMod = data.sistemaFV.quantidadeModulos || '0';

  return (
    <Document>
      <Page size="A4" style={base.page}>
        <Header eyebrow="RGE Sul · CPFL Energia" title="Anexo E" />
        <Text style={base.docTitle}>
          Formulário de Solicitação de Orçamento de Conexão{'\n'}
          Microgeração e Minigeração Distribuída
        </Text>

        <View style={base.section}>
          <Text style={base.sectionTitle}>1. Identificação da Unidade Consumidora</Text>
          <Field label="1.1 Código da UC (Nº Instalação)" value={data.unidadeConsumidora.codigo} mono />
          <Field label="1.2 Conta Contrato" value={data.unidadeConsumidora.contaContrato} mono />
          <Field label="1.3 Titular" value={data.cliente.nome} />
          <Field label="1.4 CPF / CNPJ" value={data.cliente.cpfCnpj} mono />
          <Field label="1.5 Endereço" value={`${data.endereco.logradouro}, ${data.endereco.numero}${data.endereco.complemento ? ' - ' + data.endereco.complemento : ''} · ${data.endereco.bairro}`} />
          <Field label="1.6 CEP · Município · UF" value={`${data.endereco.cep} · ${data.endereco.cidade}/${data.endereco.uf}`} />
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>2. Dados Técnicos da Microgeração Distribuída</Text>
          <View style={base.row}>
            <Text style={base.labelCell}>2.1 Tipo de fonte primária</Text>
            <Text style={base.valueCell}>☒ Solar fotovoltaica   ☐ Hidráulica   ☐ Eólica   ☐ Biomassa</Text>
          </View>
          <Field label="2.2 Potência instalada total" value={`${potInst} kW`} />
          <View style={base.row}>
            <Text style={base.labelCell}>2.3 Tipo de geração</Text>
            <Text style={base.valueCell}>☒ Empregando conversor eletrônico/inversor</Text>
          </View>
          <Field label="2.4 Fabricante do inversor" value={data.sistemaFV.inversorFabricante} />
          <Field label="     Modelo do inversor" value={data.sistemaFV.inversorModelo} />
          <Field label="     Quantidade instalada" value={qtdInv} />
          <Field label="     Tensão nominal de conexão" value={tensao} />
          <Field label="     Potência nominal por inversor" value={`${data.sistemaFV.inversorPotencia} kW`} />
          <View style={base.row}>
            <Text style={base.labelCell}>2.5 Modalidade de Compensação</Text>
            <Text style={base.valueCell}>☒ Autoconsumo local   ☐ Autoconsumo remoto   ☐ Geração compartilhada</Text>
          </View>
          <View style={base.row}>
            <Text style={base.labelCell}>2.6 Armazenamento</Text>
            <Text style={base.valueCell}>Não se aplica</Text>
          </View>
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>3. Dados Complementares</Text>
          <Field label="Carga instalada da UC" value={carga} />
          <Field label="Consumo médio mensal" value={consumoMedio} />
          <Field label="Quantidade de módulos FV" value={`${qtdMod} × ${data.sistemaFV.moduloPotencia} Wp`} />
          <Field label="Tipo de fornecimento" value={fases} />
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>4. Identificação do Solicitante</Text>
          <Field label="Nome do consumidor / representante" value={data.cliente.nome} />
          <Field label="Contato (telefone)" value={data.cliente.celular || data.cliente.telefone || '—'} />
          <Field label="E-mail" value={data.cliente.email || '—'} />
          <Field label="Responsável Técnico" value={data.engenheiro || '—'} />
          <Field label="Registro CREA" value={data.crea || '—'} mono />
        </View>

        <Footer cidade={`${data.endereco.cidade} - ${data.endereco.uf}`} />
        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Anexo E · página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ─── ANEXO F — RGE ────────────────────────────────────────────────────────────
function AnexoFRGEDoc({ data }: { data: ProjetoData }) {
  const carga = data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW` : '—';
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const potCA = fmtPower(data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1));
  const qtdInv = data.sistemaFV.quantidadeInversores || '1';
  const qtdMod = data.sistemaFV.quantidadeModulos || '0';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '—';
  const area = data.localizacao.areaTelhado ? `${data.localizacao.areaTelhado} m²` : '—';

  // helper local para tabela 3 colunas (Atual / Acréscimo / Total Previsto)
  const Row3 = ({ label, atual, acresc, total }: { label: string; atual: string; acresc: string; total: string }) => (
    <View style={base.row}>
      <Text style={[base.labelCell, { flexBasis: '40%' }]}>{label}</Text>
      <Text style={[base.cell3, { flexBasis: '20%' }]}>{atual}</Text>
      <Text style={[base.cell3, { flexBasis: '20%' }]}>{acresc}</Text>
      <Text style={[base.cell3Last, { flexBasis: '20%' }]}>{total}</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={base.page}>
        <Header eyebrow="RGE Sul · CPFL Energia" title="Anexo F" />
        <Text style={base.docTitle}>
          Dados para Registro de Micro e Minigeradores{'\n'}
          Participantes do Sistema de Compensação de Energia Elétrica
        </Text>

        <View style={base.section}>
          <Text style={base.sectionTitle}>1. Dados da Unidade Consumidora</Text>
          <Field label="1.1 Nome do titular *" value={data.cliente.nome} />
          <Field label="1.2 CNPJ ou CPF (titular) *" value={data.cliente.cpfCnpj} mono />
          <Field label="1.3 Número da UC (se existente) *" value={data.unidadeConsumidora.codigo} mono />
          <Field label="1.4 Endereço do titular" value={`${data.endereco.logradouro}, ${data.endereco.numero} · ${data.endereco.bairro}`} />
          <Field label="1.5 CEP" value={data.endereco.cep} mono />
          <Field label="1.6 Município" value={`${data.endereco.cidade} / ${data.endereco.uf}`} />
          <Field label="1.7 Latitude (SIRGAS 2000)" value={data.localizacao.latitude.toFixed(6)} mono />
          <Field label="1.8 Longitude (SIRGAS 2000)" value={data.localizacao.longitude.toFixed(6)} mono />
          <Field label="1.9 Telefone" value={data.cliente.celular || data.cliente.telefone || '—'} />
          <Field label="1.10 E-mail" value={data.cliente.email || '—'} />
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>2a. Dados Técnicos da UC (Microgeração)</Text>
          <Field label="2.1 Padrão de Entrada (GED 14945)" value="GED 14945" />
          <Field label="2.2 Tipo de Atendimento" value={data.unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo'} />
          <Field label="2.3 Nº de Fases da Instalação" value={fases} />
          <Field label="2.4 Cabos (seção transversal)" value="—" />
          <Field label="2.5 Caixa de Medição (GED 14945)" value="GED 14945" />
          <Field label="2.6 Carga Instalada" value={carga} />
          <Field label="2.7 Disjuntor (A)" value={data.sistemaFV.disjuntorGeracao || '32 A'} />
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>2b. Situação · Atual · Acréscimo · Total Previsto</Text>
          <View style={base.row}>
            <Text style={[base.cellHeader, { flexBasis: '40%' }]}>Item</Text>
            <Text style={[base.cellHeader, { flexBasis: '20%' }]}>Atual</Text>
            <Text style={[base.cellHeader, { flexBasis: '20%' }]}>Acréscimo</Text>
            <Text style={[base.cellHeader, { flexBasis: '20%', borderRightWidth: 0 }]}>Total Previsto</Text>
          </View>
          <Row3 label="2.1 Carga instalada (kW)" atual={carga} acresc="0" total={carga} />
          <Row3 label="2.2 Demanda contratada (kW)" atual="0" acresc="—" total="0" />
          <Row3 label="2.5 Potência instalada de geração (kVA)" atual="0" acresc={`${potInst} kVA`} total={`${potInst} kVA`} />
          <Row3 label="2.6 Potência exportada (kW)" atual="0" acresc={`${potInst} kW`} total={`${potInst} kW`} />
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>2c. Responsável Técnico</Text>
          <Field label="2.7 Nome do responsável técnico *" value={data.engenheiro || '—'} />
          <Field label="2.8 Registro CREA *" value={data.crea || '—'} mono />
          <Field label="2.9 Telefone do responsável técnico" value={data.cliente.celular || data.cliente.telefone || '—'} />
        </View>

        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Anexo F · página ${pageNumber} de ${totalPages}`} fixed />
      </Page>

      <Page size="A4" style={base.page}>
        <Header eyebrow="RGE Sul · CPFL Energia" title="Anexo F" />
        <Text style={base.docTitle}>3. Dados das Unidades Geradoras Fotovoltaicas Solares (UFV)</Text>

        <View style={base.section}>
          <View style={base.row}>
            <Text style={[base.cellHeader, { flexBasis: '40%' }]}>Item</Text>
            <Text style={[base.cellHeader, { flexBasis: '20%' }]}>Atual</Text>
            <Text style={[base.cellHeader, { flexBasis: '20%' }]}>Acréscimo</Text>
            <Text style={[base.cellHeader, { flexBasis: '20%', borderRightWidth: 0 }]}>Total Previsto</Text>
          </View>
          <Row3 label="3.1 Quantidade total de módulos" atual="0" acresc={qtdMod} total={qtdMod} />
          <Row3 label="3.2 Fabricante dos módulos" atual="—" acresc={data.sistemaFV.moduloFabricante} total={data.sistemaFV.moduloFabricante} />
          <Row3 label="3.3 Modelo dos módulos" atual="—" acresc={data.sistemaFV.moduloModelo} total={data.sistemaFV.moduloModelo} />
          <Row3 label="3.4 Área total ocupada (m²)" atual="—" acresc={area} total={area} />
          <Row3 label="3.5 Quantidade total de inversores" atual="0" acresc={qtdInv} total={qtdInv} />
          <Row3 label="3.6 Fabricante dos inversores" atual="—" acresc={data.sistemaFV.inversorFabricante} total={data.sistemaFV.inversorFabricante} />
          <Row3 label="3.7 Modelo dos inversores" atual="—" acresc={data.sistemaFV.inversorModelo} total={data.sistemaFV.inversorModelo} />
          <Row3 label="3.8 Potência pico módulos (kWp)" atual="0" acresc={`${potInst} kWp`} total={`${potInst} kWp`} />
          <Row3 label="3.9 Potência nominal inversores (kW)" atual="0" acresc={`${potCA} kW`} total={`${potCA} kW`} />
          <Row3 label="3.10 Data pretendida operação" atual="—" acresc={today()} total={today()} />
        </View>

        <View style={base.section}>
          <Text style={base.sectionTitle}>Strings (configuração elétrica)</Text>
          {(data.sistemaFV.strings || []).map((s, i) => (
            <Field
              key={i}
              label={`String ${i + 1} (MPPT ${s.mpptIndex + 1})`}
              value={`${s.modulosEmSerie} módulos em série · ${s.stringsParalelo} string(s) em paralelo`}
            />
          ))}
        </View>

        <Footer cidade={`${data.endereco.cidade} - ${data.endereco.uf}`} />
        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Anexo F · página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ─── DIAGRAMA UNIFILAR — RGE ──────────────────────────────────────────────────
function DiagramaUnifilarRGEDoc({ data }: { data: ProjetoData }) {
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const potCA = fmtPower(data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1));
  const qtdInv = data.sistemaFV.quantidadeInversores || '1';
  const qtdMod = data.sistemaFV.quantidadeModulos || '0';
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '—';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '—';
  const disjuntor = data.sistemaFV.disjuntorGeracao || '32 A';

  // Coordenadas SVG do diagrama vertical (página A4: 595 × 842pt)
  const sx = 297; // eixo X central
  // Y descende: rede (topo) → caixa medição → disjuntor → inversor → strings → gerador
  return (
    <Document>
      <Page size="A4" style={base.page}>
        <Header eyebrow="RGE Sul · CPFL Energia" title="Diagrama Unifilar" />
        <Text style={base.docTitle}>Projeto de Microgeração Fotovoltaica</Text>

        <View style={base.section}>
          <Text style={base.sectionTitle}>Identificação</Text>
          <Field label="Cliente" value={data.cliente.nome} />
          <Field label="Endereço" value={`${data.endereco.logradouro}, ${data.endereco.numero} · ${data.endereco.bairro} · ${data.endereco.cidade}/${data.endereco.uf}`} />
          <Field label="UC (Nº Instalação)" value={data.unidadeConsumidora.codigo} mono />
          <Field label="Responsável Técnico" value={`${data.engenheiro || '—'} · CREA ${data.crea || '—'}`} />
        </View>

        <Svg viewBox="0 0 600 470" style={{ marginTop: 12, marginBottom: 4, width: '100%', height: 380 }}>
          {/* Rede secundária no topo */}
          <Line x1={sx} y1={20} x2={sx} y2={50} stroke="#000" strokeWidth={1.2} />
          <Path d={`M ${sx - 6} 26 L ${sx} 20 L ${sx + 6} 26`} stroke="#000" strokeWidth={1.2} fill="none" />
          <Text style={{ fontSize: 8, position: 'absolute', top: 4, left: sx + 18 }}>Rede Secundária BT (Distribuidora)</Text>

          {/* Caixa de Medição (retângulo) */}
          <Rect x={sx - 70} y={60} width={140} height={80} stroke="#000" strokeWidth={1} fill="none" />
          <Text style={{ fontSize: 8, position: 'absolute', top: 78, left: sx + 80 }}>Caixa de Medição</Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 90, left: sx + 80, color: COLOR.muted }}>Medidor Bidirecional</Text>
          <Text style={{ fontSize: 7, position: 'absolute', top: 100, left: sx + 80, color: COLOR.muted }}>UC {data.unidadeConsumidora.codigo}</Text>

          {/* M dentro caixa */}
          <Circle cx={sx} cy={100} r={14} stroke="#000" strokeWidth={1} fill="none" />
          <Text style={{ fontSize: 9, position: 'absolute', top: 95, left: sx - 4 }}>M</Text>

          {/* Disjuntor de entrada (dentro caixa, parte inferior) */}
          <Line x1={sx} y1={140} x2={sx} y2={160} stroke="#000" strokeWidth={1.2} />
          <Line x1={sx - 5} y1={145} x2={sx + 7} y2={155} stroke="#000" strokeWidth={1.2} />
          <Text style={{ fontSize: 8, position: 'absolute', top: 145, left: sx + 16 }}>Disjuntor entrada · {disjuntor}</Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 156, left: sx + 16, color: COLOR.muted }}>{tensao} · {fases}</Text>

          {/* CARGAS branch */}
          <Line x1={sx} y1={170} x2={sx} y2={195} stroke="#000" strokeWidth={1.2} />
          <Line x1={sx} y1={195} x2={sx + 140} y2={195} stroke="#000" strokeWidth={1.2} />
          <Path d={`M ${sx + 134} 191 L ${sx + 142} 195 L ${sx + 134} 199`} stroke="#000" strokeWidth={1.2} fill="none" />
          <Text style={{ fontSize: 8, position: 'absolute', top: 188, left: sx + 150 }}>CARGAS</Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 200, left: sx + 150, color: COLOR.muted }}>
            {data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW instalados` : ''}
          </Text>

          {/* Linha para geração */}
          <Line x1={sx} y1={195} x2={sx} y2={230} stroke="#000" strokeWidth={1.2} />

          {/* Disjuntor + DPS CA (geração) */}
          <Line x1={sx - 5} y1={235} x2={sx + 7} y2={245} stroke="#000" strokeWidth={1.2} />
          <Text style={{ fontSize: 8, position: 'absolute', top: 232, left: sx + 16 }}>Disjuntor geração · {disjuntor}</Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 243, left: sx + 16, color: COLOR.muted }}>DPS CA {data.sistemaFV.dpsCA || '275 V'} · Cabos 10 mm²</Text>

          {/* Linha para inversor */}
          <Line x1={sx} y1={250} x2={sx} y2={280} stroke="#000" strokeWidth={1.2} />

          {/* Inversor (quadrado com diagonal) */}
          <Rect x={sx - 20} y={285} width={40} height={28} stroke="#000" strokeWidth={1} fill="none" />
          <Line x1={sx - 20} y1={285} x2={sx + 20} y2={313} stroke="#000" strokeWidth={1} />
          <Text style={{ fontSize: 8, position: 'absolute', top: 290, left: sx + 30 }}>INVERSOR</Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 301, left: sx + 30, color: COLOR.muted }}>
            {qtdInv}× {data.sistemaFV.inversorFabricante} {data.sistemaFV.inversorModelo}
          </Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 311, left: sx + 30, color: COLOR.muted }}>{potCA} kW CA</Text>

          {/* Linha para gerador */}
          <Line x1={sx} y1={313} x2={sx} y2={350} stroke="#000" strokeWidth={1.2} />

          {/* DPS CC + cabos CC à esquerda */}
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 320, left: sx - 200, color: COLOR.muted }}>DPS CC {data.sistemaFV.dpsCC || '1000 V'}</Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 332, left: sx - 200, color: COLOR.muted }}>Cabos CC 6 mm² · 1000 V</Text>

          {/* Gerador (módulos em retângulo) */}
          <Rect x={sx - 60} y={360} width={120} height={60} stroke="#000" strokeWidth={1} fill="none" />
          <Line x1={sx - 60} y1={375} x2={sx + 60} y2={375} stroke="#000" strokeWidth={0.6} />
          <Line x1={sx - 60} y1={390} x2={sx + 60} y2={390} stroke="#000" strokeWidth={0.6} />
          <Line x1={sx - 60} y1={405} x2={sx + 60} y2={405} stroke="#000" strokeWidth={0.6} />
          <Text style={{ fontSize: 8, fontFamily: FONT.sansBold, position: 'absolute', top: 365, left: sx - 50 }}>
            GERADOR FV
          </Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 380, left: sx - 50, color: COLOR.muted }}>
            {qtdMod}× {data.sistemaFV.moduloFabricante} {data.sistemaFV.moduloModelo}
          </Text>
          <Text style={{ fontSize: 7.5, position: 'absolute', top: 392, left: sx - 50, color: COLOR.muted }}>
            {data.sistemaFV.moduloPotencia} Wp/módulo · {potInst} kWp total
          </Text>
          <Text style={{ fontSize: 7, position: 'absolute', top: 405, left: sx - 50, color: COLOR.muted }}>
            {(data.sistemaFV.strings || []).map((s, i) => `S${i + 1}: ${s.modulosEmSerie}×${s.stringsParalelo}p`).join('  ')}
          </Text>
        </Svg>

        <View style={[base.section, { marginTop: 8 }]}>
          <Text style={base.sectionTitle}>Resumo Técnico</Text>
          <Field label="Tensão de atendimento" value={`${tensao} · ${fases}`} />
          <Field label="Potência instalada (CC)" value={`${potInst} kWp`} />
          <Field label="Potência nominal (CA)" value={`${potCA} kW`} />
          <Field label="Módulos" value={`${qtdMod} × ${data.sistemaFV.moduloFabricante} ${data.sistemaFV.moduloModelo} (${data.sistemaFV.moduloPotencia} Wp)`} />
          <Field label="Inversor(es)" value={`${qtdInv} × ${data.sistemaFV.inversorFabricante} ${data.sistemaFV.inversorModelo}`} />
          <Field label="Proteção CC / CA" value={`DPS CC ${data.sistemaFV.dpsCC || '1000 V'} · DPS CA ${data.sistemaFV.dpsCA || '275 V'} · Disjuntor ${disjuntor}`} />
        </View>

        <Footer cidade={`${data.endereco.cidade} - ${data.endereco.uf}`} />
        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Diagrama Unifilar · página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ─── DIAGRAMA DE BLOCOS — CEEE ────────────────────────────────────────────────
function DiagramaBlocosCEEEDoc({ data }: { data: ProjetoData }) {
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const potCA = fmtPower(data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1));
  const qtdInv = data.sistemaFV.quantidadeInversores || '1';
  const qtdMod = data.sistemaFV.quantidadeModulos || '0';
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '—';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '—';
  const disjuntor = data.sistemaFV.disjuntorGeracao || '40 A';

  // 5 blocos horizontais: GERAÇÃO → PROTEÇÃO CC → INVERSOR → PROTEÇÃO CA → MEDIÇÃO → REDE
  const blocks = [
    { title: 'GERAÇÃO', sub: `String CC · ${qtdMod} módulos`, det: `${potInst} kWp` },
    { title: 'PROTEÇÃO CC', sub: `Fusível + DPS`, det: `${data.sistemaFV.dpsCC || '1000 V'}` },
    { title: 'INVERSOR', sub: `${data.sistemaFV.inversorFabricante} ${data.sistemaFV.inversorModelo}`, det: `${potCA} kW · ${qtdInv}un` },
    { title: 'PROTEÇÃO CA', sub: `Disjuntor + DPS`, det: `${disjuntor} · ${data.sistemaFV.dpsCA || '275 V'}` },
    { title: 'MEDIÇÃO', sub: `Bidirecional`, det: `UC ${data.unidadeConsumidora.codigo}` },
    { title: 'REDE', sub: `Distribuição CEEE`, det: `${tensao} · ${fases}` },
  ];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={base.page}>
        <Header accent={COLOR.ceee} eyebrow="CEEE Equatorial" title="Diagrama de Blocos" />
        <Text style={base.docTitle}>Projeto de Microgeração Fotovoltaica</Text>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>Identificação</Text>
          <Field label="Cliente" value={data.cliente.nome} />
          <Field label="Endereço" value={`${data.endereco.logradouro}, ${data.endereco.numero} · ${data.endereco.bairro} · ${data.endereco.cidade}/${data.endereco.uf}`} />
          <Field label="UC (Número da Instalação)" value={data.unidadeConsumidora.codigo} mono />
          <Field label="Conta Contrato (Parceiro de Negócio)" value={data.unidadeConsumidora.contaContrato} mono />
          <Field label="Responsável Técnico" value={`${data.engenheiro || '—'} · CREA ${data.crea || '—'}`} />
        </View>

        {/* Blocos horizontais */}
        <View style={{ flexDirection: 'row', marginTop: 18, marginBottom: 8 }}>
          {blocks.map((b, i) => (
            <React.Fragment key={i}>
              <View
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLOR.ceee,
                  borderRadius: 4,
                  paddingVertical: 12,
                  paddingHorizontal: 6,
                  alignItems: 'center',
                  backgroundColor: COLOR.ceeeSoft,
                }}
              >
                <Text style={{ fontSize: 9, fontFamily: FONT.sansBold, color: COLOR.ceee, marginBottom: 4 }}>
                  {b.title}
                </Text>
                <Text style={{ fontSize: 7.5, textAlign: 'center', color: COLOR.ink }}>{b.sub}</Text>
                <Text style={{ fontSize: 7, textAlign: 'center', color: COLOR.muted, marginTop: 4 }}>{b.det}</Text>
              </View>
              {i < blocks.length - 1 && (
                <View style={{ width: 18, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: COLOR.ceee }}>→</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={[base.section, { marginTop: 18 }]}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>Resumo Técnico</Text>
          <Field label="Potência instalada (CC)" value={`${potInst} kWp`} />
          <Field label="Potência nominal (CA)" value={`${potCA} kW`} />
          <Field label="Tensão / Fases" value={`${tensao} · ${fases}`} />
          <Field label="Módulos" value={`${qtdMod} × ${data.sistemaFV.moduloFabricante} ${data.sistemaFV.moduloModelo} (${data.sistemaFV.moduloPotencia} Wp)`} />
          <Field label="Inversor(es)" value={`${qtdInv} × ${data.sistemaFV.inversorFabricante} ${data.sistemaFV.inversorModelo}`} />
          <Field label="Proteção CC / CA" value={`DPS CC ${data.sistemaFV.dpsCC || '1000 V'} · DPS CA ${data.sistemaFV.dpsCA || '275 V'} · Disjuntor ${disjuntor}`} />
        </View>

        <Footer cidade={`${data.endereco.cidade} - ${data.endereco.uf}`} />
        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Diagrama de Blocos · página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ─── Memorial Descritivo — CEEE ───────────────────────────────────────────────
function MemorialCEEEDoc({ data }: { data: ProjetoData }) {
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const potCA = fmtPower(data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1));
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '—';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '—';

  return (
    <Document>
      <Page size="A4" style={base.page}>
        <Header accent={COLOR.ceee} eyebrow="CEEE Equatorial" title="Memorial Descritivo" />
        <Text style={base.docTitle}>Sistema de Microgeração Fotovoltaica · NT.00020.EQTL</Text>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>1. Identificação do Empreendimento</Text>
          <Field label="Titular" value={data.cliente.nome} />
          <Field label="CPF / CNPJ" value={data.cliente.cpfCnpj} mono />
          <Field label="UC (Nº Instalação)" value={data.unidadeConsumidora.codigo} mono />
          <Field label="Endereço completo" value={`${data.endereco.logradouro}, ${data.endereco.numero} · ${data.endereco.bairro} · ${data.endereco.cidade}/${data.endereco.uf} · CEP ${data.endereco.cep}`} />
          <Field label="Latitude / Longitude" value={`${data.localizacao.latitude.toFixed(6)} · ${data.localizacao.longitude.toFixed(6)}`} mono />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>2. Características Elétricas da UC</Text>
          <Field label="Tipo de fornecimento" value={fases} />
          <Field label="Tensão nominal de atendimento" value={tensao} />
          <Field label="Classe de consumo" value={data.unidadeConsumidora.classe || '—'} />
          <Field label="Carga instalada" value={data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW` : '—'} />
          <Field label="Consumo médio (12 meses)" value={data.unidadeConsumidora.consumoMedio ? `${data.unidadeConsumidora.consumoMedio} kWh/mês` : '—'} />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>3. Sistema Fotovoltaico — Módulos</Text>
          <Field label="Quantidade" value={data.sistemaFV.quantidadeModulos} />
          <Field label="Fabricante" value={data.sistemaFV.moduloFabricante} />
          <Field label="Modelo" value={data.sistemaFV.moduloModelo} />
          <Field label="Potência unitária" value={`${data.sistemaFV.moduloPotencia} Wp`} />
          <Field label="Potência total (kWp)" value={`${potInst} kWp`} />
          <Field label="Área ocupada estimada" value={data.localizacao.areaTelhado ? `${data.localizacao.areaTelhado} m²` : '—'} />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>4. Sistema Fotovoltaico — Inversor(es)</Text>
          <Field label="Quantidade" value={data.sistemaFV.quantidadeInversores} />
          <Field label="Fabricante" value={data.sistemaFV.inversorFabricante} />
          <Field label="Modelo" value={data.sistemaFV.inversorModelo} />
          <Field label="Potência unitária" value={`${data.sistemaFV.inversorPotencia} kW`} />
          <Field label="Potência CA total" value={`${potCA} kW`} />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>5. Proteções e Cabeamento</Text>
          <Field label="DPS lado CC" value={data.sistemaFV.dpsCC || '1000 V'} />
          <Field label="DPS lado CA" value={data.sistemaFV.dpsCA || '275 V'} />
          <Field label="Disjuntor de geração" value={data.sistemaFV.disjuntorGeracao || '32 A'} />
          <Field label="Cabos CC / CA" value="6 mm² · 10 mm²" />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>6. Responsabilidade Técnica</Text>
          <Field label="Engenheiro responsável" value={data.engenheiro || '—'} />
          <Field label="Registro CREA" value={data.crea || '—'} mono />
        </View>

        <Footer cidade={`${data.endereco.cidade} - ${data.endereco.uf}`} />
        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Memorial Descritivo · página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ─── Wrapper: Document → Uint8Array ───────────────────────────────────────────
async function render(docEl: React.ReactElement): Promise<Uint8Array> {
  // react-pdf espera ReactElement<DocumentProps>; cast manual evita o erro de tipos.
  const blob = await pdf(docEl as Parameters<typeof pdf>[0]).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

// ─── API pública (mesma assinatura do pdfGenerator antigo) ────────────────────
export async function gerarAnexoERGE(data: ProjetoData): Promise<Uint8Array> {
  return render(<AnexoERGEDoc data={data} />);
}
export async function gerarAnexoFRGE(data: ProjetoData): Promise<Uint8Array> {
  return render(<AnexoFRGEDoc data={data} />);
}
export async function gerarDiagramaUnifilarRGE(data: ProjetoData): Promise<Uint8Array> {
  return render(<DiagramaUnifilarRGEDoc data={data} />);
}
export async function gerarDiagramaBlocosCEEE(data: ProjetoData): Promise<Uint8Array> {
  return render(<DiagramaBlocosCEEEDoc data={data} />);
}
export async function gerarMemorialCEEE(data: ProjetoData): Promise<Uint8Array> {
  return render(<MemorialCEEEDoc data={data} />);
}

// Reexporta downloads (mantém compatibilidade com Step4)
export { downloadAnexoICEEE, downloadPdf } from './pdfGenerator';
