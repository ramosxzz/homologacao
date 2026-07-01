/**
 * Geradores de PDF declarativos via @react-pdf/renderer.
 * Cada doc é um componente React; output é PDF real com texto selecionável.
 * Mantém mesma interface dos antigos geradores (Uint8Array async).
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image, pdf, Svg, Line, Circle, Rect, Path } from '@react-pdf/renderer';
import type { ProjetoData } from './pdfGenerator';

// SVG Text helper: react-pdf SVGTextProps não expõe fontFamily/fontSize como props diretas
const ST = Text as unknown as React.ComponentType<{
  x: number | string; y: number | string;
  fontFamily?: string; fontSize?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  fill?: string; children: React.ReactNode;
}>;

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

// ─── DIAGRAMA DE BLOCOS — RGE e CEEE (SVG fiel ao referencial) ───────────────
function DiagramaBlocosDoc({ data }: { data: ProjetoData }) {
  const uc = data.unidadeConsumidora.codigo || '—';
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '127/220V';
  const disjuntor = data.sistemaFV.disjuntorGeracao || '40 A';
  const dpsCC = data.sistemaFV.dpsCC || '1.000V';
  const dpsCA = data.sistemaFV.dpsCA || '750V';
  const cidade = data.endereco.cidade || '';
  const endStr = [data.endereco.logradouro, data.endereco.numero, data.endereco.complemento]
    .filter(Boolean).join(', ')
    + (data.endereco.bairro ? ` - ${data.endereco.bairro}` : '')
    + (data.endereco.cidade ? `, ${data.endereco.cidade}/${data.endereco.uf}` : '');
  const rtStr = `${data.engenheiro || '—'} - ${data.crea || '—'}`;

  return (
    <Document>
      <Page size="A4" style={{ padding: 0, backgroundColor: '#fff' }}>
        <Svg viewBox="0 0 210 297" style={{ width: 595, height: 841 }}>
          <Rect x="10" y="10" width="190" height="277" fill="white" stroke="black" strokeWidth="0.35"/>

          <ST x="105" y="24" fontFamily="Helvetica-Bold" fontSize={9} textAnchor="middle" fill="#000">Diagrama de Blocos</ST>
          <ST x="105" y="34" fontFamily="Helvetica-Bold" fontSize={5} textAnchor="middle" fill="#000">Projeto de Microgeração Fotovoltaica</ST>

          <ST x="13" y="50" fontFamily="Helvetica-Bold" fontSize={3.2} fill="#000">{'Cliente: ' + data.cliente.nome}</ST>
          <ST x="13" y="55" fontFamily="Helvetica-Bold" fontSize={3.2} fill="#000">{'Localização: ' + endStr}</ST>
          <ST x="13" y="60" fontFamily="Helvetica-Bold" fontSize={3.2} fill="#000">{'Responsável técnico: ' + rtStr}</ST>

          <Line x1="10" y1="68" x2="200" y2="68" stroke="black" strokeWidth="0.35"/>

          {/* GERAÇÃO */}
          <ST x="13" y="92" fontFamily="Helvetica" fontSize={3.2} fill="#000">GERAÇÃO</ST>
          <Rect x="13" y="94" width="17" height="28" fill="#f8f8f8" stroke="black" strokeWidth="0.35"/>
          <Path d="M 13,94 L 21.5,100 L 30,94" fill="none" stroke="black" strokeWidth="0.35"/>
          <ST x="21.5" y="107" fontFamily="Helvetica" fontSize={3.2} textAnchor="middle" fill="#000">String CC</ST>

          <Line x1="30" y1="108" x2="43" y2="108" stroke="black" strokeWidth="0.35"/>
          <ST x="34" y="101" fontFamily="Helvetica" fontSize={2.5} fill="#000">{'6 mm²'}</ST>
          <ST x="34" y="105" fontFamily="Helvetica" fontSize={2.5} fill="#000">{dpsCC}</ST>

          {/* PROTEÇÃO CC */}
          <ST x="46" y="95" fontFamily="Helvetica" fontSize={3.2} fill="#000">PROTEÇÃO CC</ST>
          <Rect x="46" y="101" width="21" height="18" fill="#f8f8f8" stroke="black" strokeWidth="0.35"/>
          <ST x="56.5" y="115" fontFamily="Helvetica-Bold" fontSize={16} textAnchor="middle" fill="#000">CC</ST>

          <Line x1="67" y1="108" x2="87" y2="108" stroke="black" strokeWidth="0.35"/>
          <ST x="71" y="101" fontFamily="Helvetica" fontSize={2.5} fill="#000">{'6 mm²'}</ST>
          <ST x="71" y="105" fontFamily="Helvetica" fontSize={2.5} fill="#000">{dpsCC}</ST>

          {/* INVERSOR */}
          <ST x="80" y="95" fontFamily="Helvetica" fontSize={3.2} fill="#000">INVERSOR</ST>
          <Rect x="83" y="96" width="18" height="18" fill="#f8f8f8" stroke="#777" strokeWidth="0.35"/>
          <Path d="M 92,101 L 97,106 L 92,111 L 87,106 Z" fill="none" stroke="black" strokeWidth="0.35"/>
          <Line x1="88" y1="113" x2="98" y2="99" stroke="black" strokeWidth="0.35"/>
          <Circle cx="88" cy="108" r="1.2" fill="none" stroke="black" strokeWidth="0.35"/>
          <Circle cx="98" cy="108" r="1.2" fill="none" stroke="black" strokeWidth="0.35"/>

          <Line x1="101" y1="108" x2="121" y2="108" stroke="black" strokeWidth="0.35"/>
          <ST x="107" y="101" fontFamily="Helvetica" fontSize={2.5} fill="#000">{'6 mm²'}</ST>
          <ST x="107" y="105" fontFamily="Helvetica" fontSize={2.5} fill="#000">{dpsCA}</ST>

          {/* PROTEÇÃO CA */}
          <ST x="114" y="95" fontFamily="Helvetica" fontSize={3.2} fill="#000">PROTEÇÃO CA</ST>
          <Rect x="122" y="101" width="22" height="18" fill="#f8f8f8" stroke="black" strokeWidth="0.35"/>
          <ST x="133" y="115" fontFamily="Helvetica-Bold" fontSize={16} textAnchor="middle" fill="#000">CA</ST>
          <ST x="132" y="123" fontFamily="Helvetica" fontSize={2.5} fill="#000">{disjuntor}</ST>

          <Line x1="144" y1="108" x2="168" y2="108" stroke="black" strokeWidth="0.35"/>
          <ST x="149" y="101" fontFamily="Helvetica" fontSize={2.5} fill="#000">{'10.00 mm²'}</ST>
          <ST x="149" y="105" fontFamily="Helvetica" fontSize={2.5} fill="#000">{dpsCA}</ST>

          {/* MEDIÇÃO */}
          <ST x="158" y="95" fontFamily="Helvetica" fontSize={3.2} textAnchor="middle" fill="#000">MEDIÇÃO</ST>
          <Circle cx="166" cy="110" r="9" fill="#f8f8f8" stroke="black" strokeWidth="0.35"/>
          <ST x="166" y="116" fontFamily="Helvetica-Bold" fontSize={16} textAnchor="middle" fill="#000">M</ST>
          <ST x="166" y="124" fontFamily="Helvetica" fontSize={2.2} textAnchor="middle" fill="#000">Unidade consumidora</ST>
          <ST x="166" y="128" fontFamily="Helvetica" fontSize={2.2} textAnchor="middle" fill="#000">{'UC: ' + uc}</ST>

          <Line x1="175" y1="108" x2="197" y2="108" stroke="black" strokeWidth="0.35"/>
          <ST x="179" y="101" fontFamily="Helvetica" fontSize={2.5} fill="#000">{'10.00 mm²'}</ST>
          <ST x="179" y="105" fontFamily="Helvetica" fontSize={2.5} fill="#000">{dpsCA}</ST>

          {/* REDE */}
          <Line x1="185" y1="94" x2="185" y2="124" stroke="black" strokeWidth="0.7"/>
          <ST x="188" y="101" fontFamily="Helvetica" fontSize={3.2} fill="#000">REDE</ST>
          <ST x="188" y="106" fontFamily="Helvetica" fontSize={3.2} fill="#000">DE</ST>
          <ST x="188" y="111" fontFamily="Helvetica" fontSize={3.2} fill="#000">DISTRIBUIÇÃO</ST>
          <ST x="194" y="123" fontFamily="Helvetica" fontSize={2.5} fill="#000">{tensao}</ST>

          {/* Assinaturas */}
          <Line x1="10" y1="254" x2="200" y2="254" stroke="black" strokeWidth="0.35"/>
          <ST x="105" y="266" fontFamily="Helvetica-Bold" fontSize={3} textAnchor="middle" fill="#000">Assinaturas:</ST>

          <Line x1="15" y1="274" x2="34" y2="274" stroke="black" strokeWidth="0.35"/>
          <ST x="24.5" y="279" fontFamily="Helvetica-Bold" fontSize={3} textAnchor="middle" fill="#000">{cidade}</ST>
          <ST x="24.5" y="283" fontFamily="Helvetica" fontSize={2.5} textAnchor="middle" fill="#000">Local</ST>

          <Line x1="45" y1="274" x2="64" y2="274" stroke="black" strokeWidth="0.35"/>
          <ST x="54.5" y="279" fontFamily="Helvetica-Bold" fontSize={3} textAnchor="middle" fill="#000">{today()}</ST>
          <ST x="54.5" y="283" fontFamily="Helvetica" fontSize={2.5} textAnchor="middle" fill="#000">Data</ST>

          <Line x1="80" y1="274" x2="125" y2="274" stroke="black" strokeWidth="0.35"/>
          <ST x="102.5" y="279" fontFamily="Helvetica-Bold" fontSize={3} textAnchor="middle" fill="#000">Responsável Técnico</ST>

          <Line x1="145" y1="274" x2="190" y2="274" stroke="black" strokeWidth="0.35"/>
          <ST x="167.5" y="279" fontFamily="Helvetica-Bold" fontSize={3} textAnchor="middle" fill="#000">Proprietário</ST>
        </Svg>
      </Page>
    </Document>
  );
}

// ─── DIAGRAMA UNIFILAR — CEEE (SVG fiel ao referencial CEEE Equatorial) ────────
function DiagramaUnifilarCEEEDoc({ data }: { data: ProjetoData }) {
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const qtdInv = parseInt(data.sistemaFV.quantidadeInversores) || 1;
  const qtdMod = parseInt(data.sistemaFV.quantidadeModulos) || 0;
  const potCA = fmtPower(data.sistemaFV.inversorPotencia * qtdInv);
  const modDesc = `${data.sistemaFV.moduloFabricante} ${data.sistemaFV.moduloModelo} ${data.sistemaFV.moduloPotencia}W`;
  const invFull = `${data.sistemaFV.inversorFabricante} ${data.sistemaFV.inversorModelo}`;
  const tensaoNum = (data.unidadeConsumidora.tensaoAtendimento || '220V').replace('V', '').split('/')[0];
  const disjuntor = data.sistemaFV.disjuntorGeracao || '40 A';
  const endStr = `${data.endereco.logradouro}, ${data.endereco.numero} - ${data.endereco.bairro}, ${data.endereco.cidade}/${data.endereco.uf}`;
  const rtStr = `${data.engenheiro || '—'} - ${data.crea || '—'}`;

  return (
    <Document>
      <Page size="A4" style={{ padding: 0, backgroundColor: '#fff' }}>
        <Svg viewBox="0 0 800 1100" style={{ width: 595, height: 841 }}>
          <Rect x="0" y="0" width="800" height="1100" fill="#f7f7f7"/>
          <Rect x="39" y="38" width="722" height="1025" fill="none" stroke="#111" strokeWidth="2"/>

          {/* HEADER */}
          <Line x1="39" y1="200" x2="761" y2="200" stroke="#111" strokeWidth="2"/>
          <ST x="400" y="78" fontFamily="Helvetica-Bold" fontSize={26} textAnchor="middle" fill="#111">Diagrama Unifilar</ST>
          <ST x="400" y="107" fontFamily="Helvetica-Bold" fontSize={16} textAnchor="middle" fill="#111">Projeto de Microgeração Fotovoltaica</ST>
          <ST x="64" y="143" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Cliente: ' + data.cliente.nome}</ST>
          <ST x="64" y="163" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Localização: ' + endStr}</ST>
          <ST x="64" y="183" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Responsável técnico: ' + rtStr}</ST>

          {/* ASSINATURAS */}
          <Line x1="39" y1="966" x2="761" y2="966" stroke="#111" strokeWidth="2"/>
          <ST x="400" y="989" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">Assinaturas:</ST>
          <Line x1="70" y1="1030" x2="160" y2="1030" stroke="#111" strokeWidth="1.2"/>
          <ST x="115" y="1022" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">{data.endereco.cidade}</ST>
          <ST x="115" y="1048" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">Local</ST>
          <Line x1="175" y1="1030" x2="260" y2="1030" stroke="#111" strokeWidth="1.2"/>
          <ST x="217" y="1022" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">{today()}</ST>
          <ST x="217" y="1048" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">Data</ST>
          <Line x1="293" y1="1030" x2="464" y2="1030" stroke="#111" strokeWidth="1.2"/>
          <ST x="378" y="1048" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">Responsável Técnico</ST>
          <Line x1="540" y1="1030" x2="708" y2="1030" stroke="#111" strokeWidth="1.2"/>
          <ST x="624" y="1048" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">Proprietário</ST>

          {/* REDE DE BAIXA TENSÃO */}
          <ST x="214" y="224" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">REDE DE BAIXA TENSÃO</ST>
          <Line x1="110" y1="232" x2="318" y2="232" stroke="#111" strokeWidth="2"/>
          <Line x1="215" y1="232" x2="215" y2="886" stroke="#111" strokeWidth="2"/>
          <ST x="228" y="259" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">PONTO DE ENTREGA</ST>
          <Path d="M 225,257 L 231,250 L 234,260" stroke="#111" strokeWidth="1.2" fill="none"/>
          <ST x="393" y="267" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">ACESSADA</ST>
          <ST x="393" y="286" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">ACESSANTE</ST>

          {/* PADRÃO DE ENTRADA */}
          <Rect x="60" y="264" width="370" height="135" fill="none" stroke="#111" strokeWidth="1.5" strokeDasharray="7 6"/>
          <ST x="320" y="300" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">PADRÃO DE ENTRADA</ST>
          <ST x="320" y="316" fontFamily="Helvetica-Bold" fontSize={8.7} textAnchor="middle" fill="#111">(caixa de medição)</ST>
          <ST x="72" y="308" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">Cabo CA 750V</ST>
          <ST x="72" y="330" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'2 x 10,00 mm² + 10,00 mm²'}</ST>
          <Rect x="232" y="327" width="82" height="42" fill="#6388ac" stroke="#111" strokeWidth="1.2"/>
          <ST x="273" y="353" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">MEDIDOR</ST>
          <Rect x="191" y="363" width="41" height="45" fill="#50779d" stroke="#111" strokeWidth="1.1"/>
          <ST x="211" y="391" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D1</ST>
          <ST x="238" y="390" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'2-50 A / ' + tensaoNum + ' Vca'}</ST>
          <Line x1="420" y1="384" x2="445" y2="384" stroke="#111" strokeWidth="1.2"/>
          <Line x1="445" y1="384" x2="445" y2="372" stroke="#111" strokeWidth="1.2"/>
          <Line x1="438" y1="372" x2="452" y2="372" stroke="#111" strokeWidth="1.2"/>
          <Line x1="441" y1="378" x2="449" y2="378" stroke="#111" strokeWidth="1.2"/>

          {/* QUADRO DE DISTRIBUIÇÃO */}
          <Rect x="97" y="410" width="350" height="132" fill="none" stroke="#111" strokeWidth="1.5" strokeDasharray="7 6"/>
          <ST x="316" y="427" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">QUADRO DE DISTRIBUIÇÃO</ST>
          <ST x="316" y="444" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">{'2-50 A / ' + tensaoNum + ' Vca'}</ST>
          <Rect x="190" y="415" width="42" height="43" fill="#50779d" stroke="#111" strokeWidth="1.1"/>
          <ST x="211" y="442" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D2</ST>
          <Line x1="120" y1="477" x2="318" y2="477" stroke="#111" strokeWidth="2"/>
          <Line x1="120" y1="477" x2="120" y2="524" stroke="#111" strokeWidth="2"/>
          <Line x1="172" y1="477" x2="172" y2="524" stroke="#111" strokeWidth="2"/>
          <Line x1="224" y1="477" x2="224" y2="555" stroke="#111" strokeWidth="2"/>
          <Rect x="105" y="490" width="34" height="34" fill="#557da4" stroke="#111" strokeWidth="1.1"/>
          <Rect x="157" y="490" width="34" height="34" fill="#557da4" stroke="#111" strokeWidth="1.1"/>
          <Rect x="209" y="490" width="34" height="34" fill="#557da4" stroke="#111" strokeWidth="1.1"/>
          <ST x="122" y="513" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D</ST>
          <ST x="174" y="513" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D</ST>
          <ST x="226" y="513" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D</ST>
          <ST x="166" y="556" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">CARGAS (kW)</ST>
          <ST x="128" y="465" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">DPS CA</ST>
          <Line x1="98" y1="464" x2="130" y2="464" stroke="#d11" strokeWidth="2.4"/>
          <Line x1="110" y1="455" x2="118" y2="473" stroke="#d11" strokeWidth="2.4"/>
          <Rect x="289" y="490" width="43" height="43" fill="#50779d" stroke="#111" strokeWidth="1.1"/>
          <ST x="310" y="517" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D3</ST>
          <ST x="345" y="477" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">Cabo CA 750V</ST>
          <ST x="345" y="499" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'2 x 6,00 mm²'}</ST>
          <ST x="343" y="522" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'2-' + disjuntor + ' / ' + tensaoNum + ' Vca'}</ST>
          <ST x="343" y="538" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Cabo CA 750V (2 x 6,00 mm²)'}</ST>
          <Line x1="430" y1="520" x2="456" y2="520" stroke="#111" strokeWidth="1.2"/>
          <Line x1="456" y1="520" x2="456" y2="507" stroke="#111" strokeWidth="1.2"/>
          <Line x1="448" y1="507" x2="463" y2="507" stroke="#111" strokeWidth="1.2"/>
          <Line x1="452" y1="513" x2="460" y2="513" stroke="#111" strokeWidth="1.2"/>

          {/* QUADRO DE PROTEÇÃO CA */}
          <Rect x="185" y="552" width="245" height="135" fill="none" stroke="#111" strokeWidth="1.5" strokeDasharray="7 6"/>
          <ST x="332" y="575" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">QUADRO DE</ST>
          <ST x="332" y="592" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">PROTEÇÃO CA</ST>
          <Rect x="289" y="603" width="43" height="44" fill="#50779d" stroke="#111" strokeWidth="1.1"/>
          <ST x="310" y="631" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">D4</ST>
          <ST x="344" y="630" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'2-' + disjuntor + ' / ' + tensaoNum + ' Vca'}</ST>
          <ST x="215" y="606" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">DPS CA</ST>
          <ST x="203" y="624" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">{'175 Vca, In > 20kA'}</ST>
          <ST x="218" y="642" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">Classe II</ST>
          <Line x1="198" y1="615" x2="230" y2="615" stroke="#d11" strokeWidth="2.4"/>
          <Line x1="211" y1="605" x2="217" y2="626" stroke="#d11" strokeWidth="2.4"/>

          {/* INVERSOR */}
          <ST x="62" y="674" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{invFull}</ST>
          <ST x="130" y="696" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{potCA + ' kW'}</ST>
          <ST x="109" y="718" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{tensaoNum + ' Vca'}</ST>
          <ST x="109" y="740" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">550 Vcc</ST>
          <Rect x="279" y="662" width="72" height="60" fill="#6388ac" stroke="#111" strokeWidth="1.2"/>
          <ST x="315" y="650" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">INVERSOR</ST>
          <Path d="M 294,699 Q 304,673 318,699 T 342,699" stroke="#fff" strokeWidth="3" fill="none"/>
          <Line x1="295" y1="683" x2="336" y2="683" stroke="#fff" strokeWidth="3"/>
          <Line x1="294" y1="690" x2="336" y2="690" stroke="#fff" strokeWidth="3"/>
          <ST x="358" y="705" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Cabo CC 6 mm²'}</ST>
          <ST x="386" y="727" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">1.000V</ST>
          <Line x1="351" y1="684" x2="489" y2="684" stroke="#111" strokeWidth="1.2"/>
          <Line x1="351" y1="704" x2="489" y2="704" stroke="#111" strokeWidth="1.2"/>
          <Line x1="351" y1="724" x2="489" y2="724" stroke="#111" strokeWidth="1.2"/>
          <Line x1="351" y1="744" x2="489" y2="744" stroke="#111" strokeWidth="1.2"/>
          <Circle cx="505" cy="676" r="16" fill="#fff" stroke="#111" strokeWidth="1.4"/>
          <ST x="505" y="681" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">25</ST>
          <Circle cx="505" cy="704" r="16" fill="#fff" stroke="#111" strokeWidth="1.4"/>
          <ST x="505" y="709" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">27</ST>
          <Circle cx="505" cy="733" r="16" fill="#fff" stroke="#111" strokeWidth="1.4"/>
          <ST x="505" y="738" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">59</ST>
          <Circle cx="505" cy="762" r="16" fill="#fff" stroke="#111" strokeWidth="1.4"/>
          <ST x="505" y="759" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">81</ST>
          <ST x="505" y="772" fontFamily="Helvetica-Bold" fontSize={7.2} textAnchor="middle" fill="#111">U/O</ST>
          <Rect x="524" y="764" width="98" height="26" fill="#f0f0f0" stroke="#111" strokeWidth="1.4"/>
          <ST x="573" y="781" fontFamily="Helvetica-Bold" fontSize={8.7} textAnchor="middle" fill="#111">ANTI-ILHAMENTO</ST>

          {/* DPS CC */}
          <Rect x="171" y="767" width="270" height="96" fill="none" stroke="#111" strokeWidth="1.5" strokeDasharray="7 6"/>
          <ST x="296" y="785" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">DPS CC</ST>
          <ST x="300" y="805" fontFamily="Helvetica-Bold" fontSize={8.7} textAnchor="middle" fill="#111">{'1000 Vcc, In = 18 kA'}</ST>
          <ST x="300" y="823" fontFamily="Helvetica-Bold" fontSize={8.7} textAnchor="middle" fill="#111">{'Imáx = 40 kA'}</ST>
          <ST x="300" y="841" fontFamily="Helvetica-Bold" fontSize={8.7} textAnchor="middle" fill="#111">Classe II</ST>
          <Line x1="213" y1="836" x2="250" y2="836" stroke="#d11" strokeWidth="2.4"/>
          <Line x1="226" y1="824" x2="234" y2="850" stroke="#d11" strokeWidth="2.4"/>
          <ST x="227" y="864" fontFamily="Helvetica-Bold" fontSize={8.7} textAnchor="middle" fill="#111">DETALHE 1</ST>
          <ST x="348" y="790" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">DESCRIÇÃO DE DPS</ST>
          <ST x="348" y="807" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">ACOPLADO AO INVERSOR</ST>
          <ST x="357" y="848" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Cabo CC 6 mm²'}</ST>
          <ST x="386" y="869" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">1.000V</ST>

          {/* GERADOR */}
          <Rect x="279" y="875" width="71" height="45" fill="#6388ac" stroke="#111" strokeWidth="1.2"/>
          <ST x="315" y="903" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#fff">G</ST>
          <ST x="315" y="926" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">GERADOR</ST>
          <Line x1="279" y1="916" x2="255" y2="916" stroke="#111" strokeWidth="1.2"/>
          <Line x1="255" y1="916" x2="255" y2="929" stroke="#111" strokeWidth="1.2"/>
          <Line x1="247" y1="929" x2="263" y2="929" stroke="#111" strokeWidth="1.2"/>
          <Line x1="250" y1="935" x2="260" y2="935" stroke="#111" strokeWidth="1.2"/>
          <ST x="362" y="896" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Individual: ' + modDesc}</ST>
          <ST x="362" y="917" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Quantidade: ' + qtdMod}</ST>
          <ST x="362" y="938" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">{'Total: ' + potInst + ' kWp'}</ST>

          {/* LEGENDA */}
          <Rect x="478" y="228" width="250" height="330" fill="#fff" stroke="#111" strokeWidth="1.4"/>
          <ST x="493" y="250" fontFamily="Helvetica-Bold" fontSize={10.5} fill="#111">LEGENDA:</ST>
          <ST x="493" y="268" fontFamily="Helvetica" fontSize={8.7} fill="#111">D1: Disjuntor de entrada ou geral da</ST>
          <ST x="493" y="282" fontFamily="Helvetica" fontSize={8.7} fill="#111">unidade consumidora</ST>
          <ST x="493" y="300" fontFamily="Helvetica" fontSize={8.7} fill="#111">D2: Disjuntor geral ou principal do</ST>
          <ST x="493" y="314" fontFamily="Helvetica" fontSize={8.7} fill="#111">quadro geral de distribuição</ST>
          <ST x="493" y="332" fontFamily="Helvetica" fontSize={8.7} fill="#111">D3: Disjuntor da alimentação do</ST>
          <ST x="493" y="346" fontFamily="Helvetica" fontSize={8.7} fill="#111">circuito do inversor</ST>
          <ST x="493" y="364" fontFamily="Helvetica" fontSize={8.7} fill="#111">D4: Disjuntor de proteção do inversor</ST>
          <ST x="493" y="382" fontFamily="Helvetica" fontSize={8.7} fill="#111">D: Disjuntor de proteção da carga</ST>
          <ST x="493" y="400" fontFamily="Helvetica" fontSize={8.7} fill="#111">MEDIDOR: medidor bidirecional</ST>
          <ST x="493" y="418" fontFamily="Helvetica" fontSize={8.7} fill="#111">G: Gerador fotovoltaico</ST>
          <ST x="493" y="436" fontFamily="Helvetica" fontSize={8.7} fill="#111">25: Sincronismo</ST>
          <ST x="493" y="454" fontFamily="Helvetica" fontSize={8.7} fill="#111">27: Subtensão</ST>
          <ST x="493" y="472" fontFamily="Helvetica" fontSize={8.7} fill="#111">59: Sobretensão</ST>
          <ST x="493" y="490" fontFamily="Helvetica" fontSize={8.7} fill="#111">81 U/O: Sub/sobrefrequência</ST>
          <ST x="493" y="508" fontFamily="Helvetica" fontSize={8.7} fill="#111">NP: Número de pólos do disjuntor</ST>
          <ST x="493" y="526" fontFamily="Helvetica" fontSize={8.7} fill="#111">YYY A: Corrente nominal</ST>

          {/* DETALHE 1 */}
          <ST x="653" y="600" fontFamily="Helvetica-Bold" fontSize={10.5} textAnchor="middle" fill="#111">DETALHE 1</ST>
          <Line x1="590" y1="622" x2="697" y2="622" stroke="#23856a" strokeWidth="2"/>
          <Line x1="590" y1="642" x2="697" y2="642" stroke="#d11" strokeWidth="2"/>
          <Line x1="590" y1="662" x2="697" y2="662" stroke="#111" strokeWidth="1.2"/>
          <ST x="705" y="626" fontFamily="Helvetica-Bold" fontSize={7.2} fill="#111">-</ST>
          <ST x="705" y="646" fontFamily="Helvetica-Bold" fontSize={7.2} fill="#111">+</ST>
          <Rect x="620" y="638" width="12" height="42" fill="#d11" stroke="#111" strokeWidth="1"/>
          <Rect x="661" y="638" width="12" height="42" fill="#d11" stroke="#111" strokeWidth="1"/>
          <Line x1="626" y1="622" x2="626" y2="638" stroke="#111" strokeWidth="1.2"/>
          <Line x1="667" y1="622" x2="667" y2="638" stroke="#111" strokeWidth="1.2"/>
          <Line x1="626" y1="680" x2="626" y2="708" stroke="#111" strokeWidth="1.2"/>
          <Line x1="667" y1="680" x2="667" y2="708" stroke="#111" strokeWidth="1.2"/>
          <Line x1="626" y1="708" x2="667" y2="708" stroke="#111" strokeWidth="2"/>
          <Line x1="647" y1="708" x2="647" y2="729" stroke="#111" strokeWidth="1.2"/>
          <Line x1="639" y1="729" x2="655" y2="729" stroke="#111" strokeWidth="1.2"/>
          <Line x1="642" y1="735" x2="652" y2="735" stroke="#111" strokeWidth="1.2"/>
          <ST x="606" y="668" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">1</ST>
          <ST x="690" y="668" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">2</ST>
          <ST x="651" y="696" fontFamily="Helvetica-Bold" fontSize={8.7} fill="#111">3</ST>
        </Svg>
      </Page>
    </Document>
  );
}

// Legacy wrapper — mesmo nome, agora gera Diagrama de Blocos SVG
function DiagramaUnifilarRGEDoc({ data }: { data: ProjetoData }) {
  return <DiagramaBlocosDoc data={data} />;
}

// Legacy wrapper — CEEE Diagrama de Blocos
function DiagramaBlocosCEEEDoc({ data }: { data: ProjetoData }) {
  return <DiagramaBlocosDoc data={data} />;
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

// ─── ANEXO I — CEEE ───────────────────────────────────────────────────────────
function AnexoICEEEDoc({ data }: { data: ProjetoData }) {
  const potInst = fmtPower(data.sistemaFV.potenciaInstalada);
  const potCA = fmtPower(data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1));
  const qtdInv = data.sistemaFV.quantidadeInversores || '1';
  const qtdMod = data.sistemaFV.quantidadeModulos || '0';
  const tensao = data.unidadeConsumidora.tensaoAtendimento || '—';
  const fases = faseLabel[data.unidadeConsumidora.tipoConexao] || '—';
  const carga = data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW` : '—';
  const consumo = data.unidadeConsumidora.consumoMedio ? `${data.unidadeConsumidora.consumoMedio} kWh/mês` : '—';

  return (
    <Document>
      <Page size="A4" style={base.page}>
        <Header accent={COLOR.ceee} eyebrow="CEEE Equatorial" title="Anexo I" />
        <Text style={base.docTitle}>
          Formulário de Solicitação de Orçamento de Conexão · Grupo B{'\n'}
          Microgeração e Minigeração Distribuída — NT.00020.EQTL
        </Text>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>1. Identificação do Solicitante</Text>
          <Field label="Nome / Razão Social do Titular" value={data.cliente.nome} />
          <Field label="CPF / CNPJ" value={data.cliente.cpfCnpj} mono />
          <Field label="RG / Identidade" value={data.cliente.rg || '—'} mono />
          <Field label="Telefone / Celular" value={data.cliente.celular || data.cliente.telefone || '—'} />
          <Field label="E-mail" value={data.cliente.email || '—'} />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>2. Identificação da Unidade Consumidora</Text>
          <Field label="Número da UC (Nº Instalação)" value={data.unidadeConsumidora.codigo} mono />
          <Field label="Parceiro de Negócio (Conta Contrato)" value={data.unidadeConsumidora.contaContrato} mono />
          <Field label="Classe de Consumo" value={data.unidadeConsumidora.classe || '—'} />
          <Field label="Tensão Nominal" value={tensao} />
          <Field label="Tipo de Fornecimento" value={fases} />
          <Field label="Tipo de Ramal de Entrada" value={data.unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo'} />
          <Field label="Carga Instalada" value={carga} />
          <Field label="Consumo Médio Mensal (12 meses)" value={consumo} />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>3. Endereço de Instalação</Text>
          <Field label="Logradouro / Nº / Complemento" value={`${data.endereco.logradouro}, ${data.endereco.numero}${data.endereco.complemento ? ' - ' + data.endereco.complemento : ''}`} />
          <Field label="Bairro" value={data.endereco.bairro} />
          <Field label="CEP · Cidade · UF" value={`${data.endereco.cep} · ${data.endereco.cidade}/${data.endereco.uf}`} />
          <Field label="Latitude · Longitude (SIRGAS 2000)" value={`${data.localizacao.latitude.toFixed(6)} · ${data.localizacao.longitude.toFixed(6)}`} mono />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>4. Dados Técnicos da Microgeração</Text>
          <View style={base.row}>
            <Text style={base.labelCell}>Tipo de fonte primária</Text>
            <Text style={base.valueCell}>☒ Solar fotovoltaica</Text>
          </View>
          <View style={base.row}>
            <Text style={base.labelCell}>Tipo de geração</Text>
            <Text style={base.valueCell}>☒ Empregando inversor estático</Text>
          </View>
          <Field label="Potência instalada (CC)" value={`${potInst} kWp`} />
          <Field label="Potência nominal (CA)" value={`${potCA} kW`} />
          <View style={base.row}>
            <Text style={base.labelCell}>Modalidade de Compensação</Text>
            <Text style={base.valueCell}>☒ Autoconsumo local   ☐ Autoconsumo remoto   ☐ Geração compartilhada</Text>
          </View>
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>5. Equipamentos</Text>
          <Field label="Módulos (qtd × fabricante × modelo)" value={`${qtdMod} × ${data.sistemaFV.moduloFabricante} ${data.sistemaFV.moduloModelo}`} />
          <Field label="Potência unitária dos módulos" value={`${data.sistemaFV.moduloPotencia} Wp`} />
          <Field label="Inversor(es) (qtd × fabricante × modelo)" value={`${qtdInv} × ${data.sistemaFV.inversorFabricante} ${data.sistemaFV.inversorModelo}`} />
          <Field label="Potência unitária dos inversores" value={`${data.sistemaFV.inversorPotencia} kW`} />
          <Field label="Disjuntor de geração" value={data.sistemaFV.disjuntorGeracao || '40 A'} />
          <Field label="DPS CC · DPS CA" value={`${data.sistemaFV.dpsCC || '1000 V'} · ${data.sistemaFV.dpsCA || '275 V'}`} />
        </View>

        <View style={base.section}>
          <Text style={[base.sectionTitle, { backgroundColor: COLOR.ceee }]}>6. Responsabilidade Técnica</Text>
          <Field label="Nome do Responsável Técnico" value={data.engenheiro || '—'} />
          <Field label="Registro CREA" value={data.crea || '—'} mono />
        </View>

        <Footer cidade={`${data.endereco.cidade} - ${data.endereco.uf}`} />
        <Text style={base.pageNumber} render={({ pageNumber, totalPages }) => `Anexo I CEEE · página ${pageNumber} de ${totalPages}`} fixed />
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
export async function gerarDiagramaUnifilarCEEE(data: ProjetoData): Promise<Uint8Array> {
  return render(<DiagramaUnifilarCEEEDoc data={data} />);
}
export async function gerarMemorialCEEE(data: ProjetoData): Promise<Uint8Array> {
  return render(<MemorialCEEEDoc data={data} />);
}
export async function gerarAnexoICEEE(data: ProjetoData): Promise<Uint8Array> {
  return render(<AnexoICEEEDoc data={data} />);
}

// Reexporta downloads (mantém compatibilidade com Step4)
export { downloadAnexoICEEE, downloadPdf } from './pdfGenerator';
