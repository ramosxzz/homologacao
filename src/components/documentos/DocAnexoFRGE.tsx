'use client';

import React from 'react';
import { ProjetoState } from '@/contexts/ProjetoContext';

interface Props {
  state: ProjetoState;
  engenheiro?: string;
  crea?: string;
}

export default function DocAnexoFRGE({ state, engenheiro = '', crea = '' }: Props) {
  const { cliente, unidadeConsumidora, endereco, sistemaFV } = state;
  const hoje = new Date().toLocaleDateString('pt-BR');
  const qtyModulos = parseInt(sistemaFV.quantidadeModulos) || 0;
  const qtyInversores = parseInt(sistemaFV.quantidadeInversores) || 1;
  const potenciaKwp = sistemaFV.potenciaInstalada;
  const potenciaCa = (sistemaFV.inversorPotencia * qtyInversores).toFixed(2);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000', background: '#fff', padding: '20mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>

      {/* CABEÇALHO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '65%', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#e8001c' }}>RGE SUL — CPFL ENERGIA</div>
              <div style={{ fontSize: '8pt', color: '#555' }}>Rio Grande Energia S/A — Grupo CPFL</div>
            </td>
            <td style={{ width: '35%', textAlign: 'right', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '7pt', color: '#777' }}>Data de Emissão</div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>{hoje}</div>
              <div style={{ fontSize: '7pt', color: '#777' }}>GED 15303</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', backgroundColor: '#e8001c', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '10pt', marginBottom: '12px' }}>
        ANEXO F — REGISTRO DE CENTRAL GERADORA FOTOVOLTAICA
      </div>

      <p style={{ fontSize: '8.5pt', color: '#555', marginBottom: '10px' }}>
        Este formulário destina-se ao registro técnico da central geradora distribuída perante a RGE Sul / CPFL Energia, em atendimento à Norma Técnica GED 15303 e à REN ANEEL nº 1000/2021.
      </p>

      {/* A - DADOS DO TITULAR */}
      <SectionF title="A — DADOS DO MICRO/MINIGERADOR" />
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <tbody>
          {[
            ['Razão Social / Nome', cliente.nome, 'CPF / CNPJ', cliente.cpfCnpj],
            ['Telefone / Celular', cliente.celular || cliente.telefone || '—', 'E-mail', cliente.email || '—'],
            ['Endereço Instalação', `${endereco.logradouro}, ${endereco.numero}`, 'Bairro', endereco.bairro],
            ['Cidade / Estado', `${endereco.cidade} / ${endereco.uf}`, 'CEP', endereco.cep],
            ['N.º de Instalação (UC)', unidadeConsumidora.codigo, 'N.º Contrato', unidadeConsumidora.contaContrato],
          ].map((row, ri) => (
            <tr key={ri}>
              {[0, 1, 2, 3].map(ci => (
                <td key={ci} style={{
                  border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt',
                  backgroundColor: ci % 2 === 0 ? '#fff0f0' : '#fff',
                  fontWeight: ci % 2 === 0 ? 'bold' : 'normal',
                  color: ci % 2 === 0 ? '#6b0000' : '#000',
                  width: '25%',
                }}>{row[ci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* B - DADOS TÉCNICOS DO SISTEMA */}
      <SectionF title="B — ESPECIFICAÇÕES TÉCNICAS DA CENTRAL GERADORA" />
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e8001c', color: '#fff', fontSize: '8.5pt' }}>
            <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'left', width: '30%' }}>Componente</th>
            <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'left', width: '40%' }}>Descrição</th>
            <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'center', width: '15%' }}>Quantidade</th>
            <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'center', width: '15%' }}>Potência</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#fff' }}>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt', fontWeight: 'bold', color: '#6b0000' }}>Módulo Fotovoltaico</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt' }}>{sistemaFV.moduloFabricante} — {sistemaFV.moduloModelo}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt', textAlign: 'center' }}>{qtyModulos} un.</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt', textAlign: 'center' }}>{sistemaFV.moduloPotencia} Wp</td>
          </tr>
          <tr style={{ backgroundColor: '#fff9f9' }}>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt', fontWeight: 'bold', color: '#6b0000' }}>Inversor Grid-Tie</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt' }}>{sistemaFV.inversorFabricante} — {sistemaFV.inversorModelo}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt', textAlign: 'center' }}>{qtyInversores} un.</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt', textAlign: 'center' }}>{sistemaFV.inversorPotencia} kW</td>
          </tr>
        </tbody>
      </table>

      {/* C - DADOS ELÉTRICOS CONSOLIDADOS */}
      <SectionF title="C — DADOS ELÉTRICOS DA CENTRAL GERADORA" />
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <tbody>
          {[
            ['Potência Total Instalada (CC/kWp)', `${potenciaKwp.toFixed(2)} kWp`, 'Potência Total CA (kW)', `${potenciaCa} kW`],
            ['Tensão de Conexão à Rede', unidadeConsumidora.tensaoAtendimento, 'Tipo de Conexão / Fases', unidadeConsumidora.tipoConexao === 'trifasica' ? 'Trifásica (4F)' : unidadeConsumidora.tipoConexao === 'bifasica' ? 'Bifásica (3F)' : 'Monofásica (2F)'],
            ['Disjuntor de Geração (CA)', sistemaFV.disjuntorGeracao, 'DPS (CC) / DPS (CA)', `${sistemaFV.dpsCC} / ${sistemaFV.dpsCA}`],
            ['Tipo de Ligação à Rede', 'Automática via inversor (anti-ilhamento)', 'Norma de Proteção', 'ABNT NBR 16274'],
          ].map((row, ri) => (
            <tr key={ri}>
              {[0, 1, 2, 3].map(ci => (
                <td key={ci} style={{
                  border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt',
                  backgroundColor: ci % 2 === 0 ? '#fff0f0' : '#fff',
                  fontWeight: ci % 2 === 0 ? 'bold' : 'normal',
                  color: ci % 2 === 0 ? '#6b0000' : '#000',
                  width: '25%',
                }}>{row[ci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* D - CONFIGURAÇÃO STRINGS */}
      <SectionF title="D — CONFIGURAÇÃO DAS STRINGS FOTOVOLTAICAS" />
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '9pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#e8001c', color: '#fff' }}>
            <th style={{ border: '1px solid #999', padding: '3px 8px', textAlign: 'center' }}>String / MPPT</th>
            <th style={{ border: '1px solid #999', padding: '3px 8px', textAlign: 'center' }}>Módulos em Série</th>
            <th style={{ border: '1px solid #999', padding: '3px 8px', textAlign: 'center' }}>Strings em Paralelo</th>
            <th style={{ border: '1px solid #999', padding: '3px 8px', textAlign: 'center' }}>Total de Módulos</th>
          </tr>
        </thead>
        <tbody>
          {sistemaFV.strings.length > 0 ? sistemaFV.strings.map((s, i) => {
            const serie = parseInt(s.modulosEmSerie) || 0;
            const paralelo = parseInt(s.stringsParalelo) || 0;
            return (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fff9f9' }}>
                <td style={{ border: '1px solid #ccc', padding: '3px 8px', textAlign: 'center' }}>String {i + 1} (MPPT {s.mpptIndex + 1})</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 8px', textAlign: 'center' }}>{serie}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 8px', textAlign: 'center' }}>{paralelo}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 8px', textAlign: 'center' }}>{serie * paralelo}</td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={4} style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                Configuração de strings não definida
              </td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#e8001c', color: '#fff', fontWeight: 'bold' }}>
            <td colSpan={3} style={{ border: '1px solid #999', padding: '3px 8px', textAlign: 'right' }}>TOTAL DE MÓDULOS:</td>
            <td style={{ border: '1px solid #999', padding: '3px 8px', textAlign: 'center' }}>{qtyModulos}</td>
          </tr>
        </tbody>
      </table>

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

function SectionF({ title }: { title: string }) {
  return (
    <div style={{ backgroundColor: '#fff0f0', borderLeft: '4px solid #e8001c', padding: '4px 8px', fontWeight: 'bold', fontSize: '9pt', marginTop: '10px', marginBottom: '4px', color: '#a00' }}>
      {title}
    </div>
  );
}
