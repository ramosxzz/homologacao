'use client';

import React from 'react';
import { ProjetoState } from '@/contexts/ProjetoContext';

interface Props {
  state: ProjetoState;
  engenheiro?: string;
  crea?: string;
}

export default function DocAnexoIICEEE({ state, engenheiro = '', crea = '' }: Props) {
  const { cliente, unidadeConsumidora, endereco, localizacao, sistemaFV } = state;

  const potenciaKw = sistemaFV.potenciaInstalada.toFixed(2);
  const hoje = new Date().toLocaleDateString('pt-BR');

  const tipoConexaoLabel: Record<string, string> = {
    monofasica: 'Monofásica (2 fios)',
    bifasica: 'Bifásica (3 fios)',
    trifasica: 'Trifásica (4 fios)',
  };

  return (
    <div className="doc-page" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000', background: '#fff', padding: '20mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>

      {/* CABEÇALHO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '70%', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#005bac' }}>CEEE EQUATORIAL ENERGIA</div>
              <div style={{ fontSize: '8pt', color: '#555' }}>Companhia Estadual de Distribuição de Energia Elétrica</div>
            </td>
            <td style={{ width: '30%', textAlign: 'right', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '7pt', color: '#777' }}>Norma Técnica</div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>NT.00020.EQTL</div>
              <div style={{ fontSize: '7pt', color: '#777' }}>Microgeração / Minigeração</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', backgroundColor: '#005bac', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '10pt', marginBottom: '12px', letterSpacing: '0.5px' }}>
        ANEXO II — FORMULÁRIO DE SOLICITAÇÃO DE ORÇAMENTO DE CONEXÃO
      </div>

      {/* BLOCO 1 - DADOS DO ACESSANTE */}
      <SectionTitle title="1. DADOS DO ACESSANTE" />
      <FieldTable rows={[
        ['Nome / Razão Social', cliente.nome, 'CPF / CNPJ', cliente.cpfCnpj],
        ['RG / Identidade', cliente.rg || '—', 'Telefone / Celular', cliente.celular || cliente.telefone || '—'],
        ['E-mail', { value: cliente.email || '—', colSpan: 3 }],
      ]} />

      {/* BLOCO 2 - UNIDADE CONSUMIDORA */}
      <SectionTitle title="2. DADOS DA UNIDADE CONSUMIDORA" />
      <FieldTable rows={[
        ['Nº Unidade Consumidora (UC)', unidadeConsumidora.codigo, 'Nº Conta Contrato', unidadeConsumidora.contaContrato],
        ['Endereço de Instalação', { value: `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ' - ' + endereco.complemento : ''}`, colSpan: 3 }],
        ['Bairro', endereco.bairro, 'Cidade / UF', `${endereco.cidade} / ${endereco.uf}`],
        ['CEP', endereco.cep, 'Classe de Consumo', unidadeConsumidora.classe.charAt(0).toUpperCase() + unidadeConsumidora.classe.slice(1)],
        ['Tipo de Conexão (Fases)', tipoConexaoLabel[unidadeConsumidora.tipoConexao] || unidadeConsumidora.tipoConexao, 'Tensão de Atendimento', unidadeConsumidora.tensaoAtendimento],
        ['Carga Instalada Disponível (kW)', unidadeConsumidora.cargaInstalada ? `${unidadeConsumidora.cargaInstalada} kW` : '—', 'Consumo Médio Mensal (kWh/mês)', unidadeConsumidora.consumoMedio ? `${unidadeConsumidora.consumoMedio} kWh/mês` : '—'],
        ['Tipo de Ramal de Entrada', unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo', '', ''],
      ]} />

      {/* BLOCO 3 - SISTEMA FOTOVOLTAICO */}
      <SectionTitle title="3. DADOS DO SISTEMA DE GERAÇÃO FOTOVOLTAICA" />
      <FieldTable rows={[
        ['Potência Instalada (kWp)', `${potenciaKw} kWp`, 'Modalidade de Compensação', 'Microgeração Distribuída'],
        ['Fabricante / Modelo dos Módulos FV', `${sistemaFV.moduloFabricante} — ${sistemaFV.moduloModelo}`, 'Quantidade de Módulos', sistemaFV.quantidadeModulos],
        ['Potência Unitária do Módulo (Wp)', `${sistemaFV.moduloPotencia} Wp`, '', ''],
        ['Fabricante / Modelo do Inversor', `${sistemaFV.inversorFabricante} — ${sistemaFV.inversorModelo}`, 'Quantidade de Inversores', sistemaFV.quantidadeInversores],
        ['Potência do Inversor (kW)', `${sistemaFV.inversorPotencia} kW`, 'Disjuntor de Geração (CA)', sistemaFV.disjuntorGeracao],
        ['DPS Corrente Contínua (CC)', sistemaFV.dpsCC, 'DPS Corrente Alternada (CA)', sistemaFV.dpsCA],
        ['Latitude / Longitude GPS', `${localizacao.latitude.toFixed(6)}, ${localizacao.longitude.toFixed(6)}`, 'Inclinação / Azimute', `${localizacao.inclinacaoTelhado}° / ${localizacao.orientacaoTelhado}°`],
        ['Tipo de Telhado / Fixação', `${localizacao.tipoTelhado.charAt(0).toUpperCase() + localizacao.tipoTelhado.slice(1)}`, 'Área do Telhado (m²)', localizacao.areaTelhado ? `${localizacao.areaTelhado} m²` : '—'],
      ]} />

      {/* DECLARAÇÃO */}
      <div style={{ marginTop: '14px', fontSize: '8pt', border: '1px solid #ccc', padding: '8px', backgroundColor: '#f9f9f9' }}>
        <strong>Declaração:</strong> O(A) acessante declara que os dados acima são verdadeiros e que o sistema de geração distribuída será instalado em conformidade com as normas técnicas vigentes (ABNT NBR 16274, ABNT NBR 5410, NT.00020.EQTL), sendo de responsabilidade técnica do profissional habilitado identificado abaixo.
      </div>

      {/* ASSINATURAS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '28px' }}>
        <tbody>
          <tr>
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{cliente.nome || '_______________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Acessante / Titular — CPF: {cliente.cpfCnpj || '___.___.___-__'}</div>
              </div>
            </td>
            <td style={{ width: '10%' }} />
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{engenheiro || '_______________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Responsável Técnico — CREA: {crea || '________________'}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'right', fontSize: '7.5pt', color: '#888', marginTop: '18px' }}>
        Gerado pelo Sistema Solaire Solar — {hoje}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ backgroundColor: '#e8f0fb', borderLeft: '4px solid #005bac', padding: '4px 8px', fontWeight: 'bold', fontSize: '9pt', marginTop: '10px', marginBottom: '4px', color: '#003d7a' }}>
      {title}
    </div>
  );
}

type CellValue = string | { value: string; colSpan: number };

function FieldTable({ rows }: { rows: CellValue[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
      <tbody>
        {rows.map((row, ri) => {
          const cells: React.ReactNode[] = [];
          let colIndex = 0;
          for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            if (typeof cell === 'object' && 'colSpan' in cell) {
              const span = (cell.colSpan * 2) - 1;
              cells.push(
                <td key={colIndex} colSpan={span} style={{ border: '1px solid #ccc', padding: '3px 6px', fontSize: '9pt', verticalAlign: 'top' }}>
                  {cell.value}
                </td>
              );
              colIndex += cell.colSpan;
            } else {
              const isLabel = colIndex % 2 === 0;
              cells.push(
                <td key={colIndex} style={{
                  border: '1px solid #ccc',
                  padding: '3px 6px',
                  fontSize: '9pt',
                  verticalAlign: 'top',
                  backgroundColor: isLabel ? '#f0f4f8' : '#fff',
                  fontWeight: isLabel ? 'bold' : 'normal',
                  width: isLabel ? '22%' : '28%',
                  color: isLabel ? '#333' : '#000',
                }}>
                  {cell as string}
                </td>
              );
              colIndex++;
            }
          }
          return <tr key={ri}>{cells}</tr>;
        })}
      </tbody>
    </table>
  );
}
