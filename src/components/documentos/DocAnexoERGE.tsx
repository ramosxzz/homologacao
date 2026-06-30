'use client';

import React from 'react';
import { ProjetoState } from '@/contexts/ProjetoContext';

interface Props {
  state: ProjetoState;
  engenheiro?: string;
  crea?: string;
}

export default function DocAnexoERGE({ state, engenheiro = '', crea = '' }: Props) {
  const { cliente, unidadeConsumidora, endereco, localizacao, sistemaFV } = state;
  const hoje = new Date().toLocaleDateString('pt-BR');
  const potenciaKw = sistemaFV.potenciaInstalada.toFixed(2);

  const tipoConexaoLabel: Record<string, string> = {
    monofasica: 'Monofásica (2F)',
    bifasica: 'Bifásica (3F)',
    trifasica: 'Trifásica (4F)',
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000', background: '#fff', padding: '20mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>

      {/* CABEÇALHO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '65%', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#e8001c' }}>RGE SUL — CPFL ENERGIA</div>
              <div style={{ fontSize: '8pt', color: '#555' }}>Rio Grande Energia S/A — Grupo CPFL</div>
              <div style={{ fontSize: '7.5pt', color: '#777' }}>Norma Técnica GED 15303 — Conexão de Microgeração Distribuída</div>
            </td>
            <td style={{ width: '35%', textAlign: 'right', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '7pt', color: '#777' }}>Data de Emissão</div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>{hoje}</div>
              <div style={{ fontSize: '7pt', color: '#777' }}>GED 15303 | REN 1000/2021</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', backgroundColor: '#e8001c', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '10pt', marginBottom: '12px' }}>
        ANEXO E — FORMULÁRIO DE SOLICITAÇÃO DE CONEXÃO (MICROGERAÇÃO)
      </div>

      {/* A - IDENTIFICAÇÃO DO SOLICITANTE */}
      <SectionRGE title="A — IDENTIFICAÇÃO DO SOLICITANTE (MICROGERADOR)" />
      <FieldTable rows={[
        ['Nome / Razão Social', cliente.nome, 'CPF / CNPJ', cliente.cpfCnpj],
        ['RG / Doc. Identidade', cliente.rg || '—', 'Telefone / Celular', cliente.celular || cliente.telefone || '—'],
        ['E-mail para Contato', { value: cliente.email || '—', colSpan: 3 }],
      ]} />

      {/* B - UNIDADE CONSUMIDORA */}
      <SectionRGE title="B — UNIDADE CONSUMIDORA OBJETO DA SOLICITAÇÃO" />
      <FieldTable rows={[
        ['Nº de Instalação (UC)', unidadeConsumidora.codigo, 'Nº Conta / Contrato', unidadeConsumidora.contaContrato],
        ['Endereço Completo', { value: `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ' — ' + endereco.complemento : ''}`, colSpan: 3 }],
        ['Bairro', endereco.bairro, 'CEP', endereco.cep],
        ['Município / UF', `${endereco.cidade} / ${endereco.uf}`, 'Classe de Consumo', unidadeConsumidora.classe.charAt(0).toUpperCase() + unidadeConsumidora.classe.slice(1)],
        ['Tipo de Ligação / Fases', tipoConexaoLabel[unidadeConsumidora.tipoConexao] || unidadeConsumidora.tipoConexao, 'Tensão de Atendimento', unidadeConsumidora.tensaoAtendimento],
        ['Ramal de Entrada', unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo', 'Demanda / Carga Instalada', unidadeConsumidora.cargaInstalada ? `${unidadeConsumidora.cargaInstalada} kW` : '—'],
        ['Consumo Médio Mensal (kWh)', unidadeConsumidora.consumoMedio ? `${unidadeConsumidora.consumoMedio} kWh/mês` : '—', '', ''],
      ]} />

      {/* C - CENTRAL GERADORA */}
      <SectionRGE title="C — DADOS DA CENTRAL GERADORA FOTOVOLTAICA" />
      <FieldTable rows={[
        ['Tipo de Fonte', 'Solar Fotovoltaica', 'Modalidade', 'Microgeração Distribuída (≤ 75 kWp)'],
        ['Potência Instalada (kWp)', `${potenciaKw} kWp`, 'Tipo de Gerador', 'Inversor String Grid-Tie'],
        ['Fabricante / Modelo — Módulos FV', { value: `${sistemaFV.moduloFabricante} — ${sistemaFV.moduloModelo} (${sistemaFV.moduloPotencia} Wp)`, colSpan: 3 }],
        ['Quantidade de Módulos', sistemaFV.quantidadeModulos, 'Potência Total CC', `${potenciaKw} kWp`],
        ['Fabricante / Modelo — Inversor', { value: `${sistemaFV.inversorFabricante} — ${sistemaFV.inversorModelo} (${sistemaFV.inversorPotencia} kW)`, colSpan: 3 }],
        ['Quantidade de Inversores', sistemaFV.quantidadeInversores, 'Potência Total CA', `${(sistemaFV.inversorPotencia * (parseInt(sistemaFV.quantidadeInversores) || 1)).toFixed(2)} kW`],
        ['Disjuntor de Geração (CA)', sistemaFV.disjuntorGeracao, 'DPS CC / CA', `${sistemaFV.dpsCC} / ${sistemaFV.dpsCA}`],
        ['Latitude / Longitude', `${localizacao.latitude.toFixed(6)}, ${localizacao.longitude.toFixed(6)}`, 'Inclinação / Azimute', `${localizacao.inclinacaoTelhado}° / ${localizacao.orientacaoTelhado}°`],
        ['Tipo de Fixação / Telhado', localizacao.tipoTelhado.charAt(0).toUpperCase() + localizacao.tipoTelhado.slice(1), 'Área do Telhado (m²)', localizacao.areaTelhado ? `${localizacao.areaTelhado} m²` : '—'],
      ]} />

      {/* D - DECLARAÇÃO */}
      <SectionRGE title="D — DECLARAÇÃO DO SOLICITANTE" />
      <div style={{ fontSize: '8.5pt', padding: '6px 8px', border: '1px solid #ccc', backgroundColor: '#fff9f9', marginBottom: '6px' }}>
        Declaro que as informações prestadas neste formulário são verídicas e que a instalação da central geradora será executada por profissional habilitado,
        em conformidade com a Norma Técnica GED 15303 da RGE Sul/CPFL, a REN ANEEL nº 1000/2021 e as normas técnicas brasileiras pertinentes (ABNT NBR 16274, NBR 5410).
        Estou ciente de que a conexão da central geradora somente será autorizada após vistoria técnica da distribuidora e que qualquer alteração no sistema deverá ser comunicada e re-homologada.
      </div>

      {/* ASSINATURAS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
        <tbody>
          <tr>
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{cliente.nome || '________________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Solicitante / Titular da UC</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>CPF/CNPJ: {cliente.cpfCnpj || '___.___.___-__'}</div>
              </div>
            </td>
            <td style={{ width: '10%' }} />
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{engenheiro || '________________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Responsável Técnico — Eng. Eletricista</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>CREA: {crea || '_________________'}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'right', fontSize: '7.5pt', color: '#888', marginTop: '16px' }}>
        Gerado pelo Sistema Solaire Solar — {hoje}
      </div>
    </div>
  );
}

function SectionRGE({ title }: { title: string }) {
  return (
    <div style={{ backgroundColor: '#fff0f0', borderLeft: '4px solid #e8001c', padding: '4px 8px', fontWeight: 'bold', fontSize: '9pt', marginTop: '10px', marginBottom: '4px', color: '#a00' }}>
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
                  border: '1px solid #ccc', padding: '3px 6px', fontSize: '9pt', verticalAlign: 'top',
                  backgroundColor: isLabel ? '#fff0f0' : '#fff',
                  fontWeight: isLabel ? 'bold' : 'normal',
                  width: isLabel ? '22%' : '28%',
                  color: isLabel ? '#6b0000' : '#000',
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
