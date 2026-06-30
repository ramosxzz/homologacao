'use client';

import React from 'react';
import { ProjetoState } from '@/contexts/ProjetoContext';

interface Props {
  state: ProjetoState;
  engenheiro?: string;
  crea?: string;
}

export default function DocMemorialCEEE({ state, engenheiro = '', crea = '' }: Props) {
  const { cliente, unidadeConsumidora, endereco, localizacao, sistemaFV } = state;

  const potenciaKwp = sistemaFV.potenciaInstalada;
  const potenciaKw = potenciaKwp.toFixed(2);
  const qtyModulos = parseInt(sistemaFV.quantidadeModulos) || 0;
  const qtyInversores = parseInt(sistemaFV.quantidadeInversores) || 1;
  const consumoMedioKwh = parseFloat(unidadeConsumidora.consumoMedio) || 0;
  const geracaoEstimada = (potenciaKwp * 4.5 * 30).toFixed(0); // 4.5h sun/day
  const hoje = new Date().toLocaleDateString('pt-BR');

  const tipoConexaoLabel: Record<string, string> = {
    monofasica: 'Monofásica (2 fios / 127V)',
    bifasica: 'Bifásica (3 fios / 220V)',
    trifasica: 'Trifásica (4 fios / 220-380V)',
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000', background: '#fff', padding: '20mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>

      {/* CABEÇALHO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '70%', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#005bac' }}>CEEE EQUATORIAL ENERGIA</div>
              <div style={{ fontSize: '8pt', color: '#555' }}>Memorial Técnico Descritivo — Microgeração Distribuída</div>
            </td>
            <td style={{ width: '30%', textAlign: 'right', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '7pt', color: '#777' }}>Norma Técnica NT.00020.EQTL</div>
              <div style={{ fontSize: '8pt', fontWeight: 'bold' }}>ABNT NBR 16274</div>
              <div style={{ fontSize: '7pt', color: '#777' }}>Data: {hoje}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', backgroundColor: '#005bac', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '10pt', marginBottom: '12px' }}>
        ANEXO III — MEMORIAL TÉCNICO DESCRITIVO DO SISTEMA FOTOVOLTAICO
      </div>

      {/* 1. DADOS DO TITULAR */}
      <Section title="1. IDENTIFICAÇÃO DO TITULAR E DA UNIDADE CONSUMIDORA" />
      <p style={{ margin: '4px 0 8px', fontSize: '9pt' }}>
        O presente memorial refere-se à instalação de sistema de microgeração distribuída fotovoltaica de titularidade de <strong>{cliente.nome}</strong>,
        inscrito(a) no CPF/CNPJ de nº <strong>{cliente.cpfCnpj}</strong>, residente/estabelecido à <strong>{endereco.logradouro}, {endereco.numero}{endereco.complemento ? ' — ' + endereco.complemento : ''}</strong>,
        bairro <strong>{endereco.bairro}</strong>, cidade de <strong>{endereco.cidade}/{endereco.uf}</strong>, CEP <strong>{endereco.cep}</strong>.
        A Unidade Consumidora (UC) é identificada pelo número <strong>{unidadeConsumidora.codigo}</strong>, Conta Contrato nº <strong>{unidadeConsumidora.contaContrato}</strong>,
        atendida em tensão de <strong>{unidadeConsumidora.tensaoAtendimento}</strong> ({tipoConexaoLabel[unidadeConsumidora.tipoConexao] || unidadeConsumidora.tipoConexao}).
      </p>

      {/* 2. DESCRIÇÃO DO SISTEMA */}
      <Section title="2. DESCRIÇÃO TÉCNICA DO SISTEMA FOTOVOLTAICO" />
      <p style={{ margin: '4px 0 8px', fontSize: '9pt' }}>
        O sistema fotovoltaico projetado possui potência instalada de <strong>{potenciaKw} kWp</strong>, composto por <strong>{qtyModulos} módulo(s) fotovoltaico(s)</strong> do
        fabricante <strong>{sistemaFV.moduloFabricante}</strong>, modelo <strong>{sistemaFV.moduloModelo}</strong>, com potência unitária de <strong>{sistemaFV.moduloPotencia} Wp</strong>, e
        <strong> {qtyInversores} inversor(es) string</strong> do fabricante <strong>{sistemaFV.inversorFabricante}</strong>, modelo <strong>{sistemaFV.inversorModelo}</strong>, com
        potência nominal de <strong>{sistemaFV.inversorPotencia} kW</strong>.
        A geração estimada mensal é de aproximadamente <strong>{geracaoEstimada} kWh/mês</strong>{consumoMedioKwh > 0 ? `, representando ${Math.min(100, Math.round((parseFloat(geracaoEstimada) / consumoMedioKwh) * 100))
        }% do consumo médio de ${consumoMedioKwh} kWh/mês da unidade` : ''}.
      </p>

      {/* 3. TABELA TÉCNICA */}
      <Section title="3. QUADRO RESUMO — PARÂMETROS TÉCNICOS" />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#005bac', color: '#fff' }}>
            <th style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'left' }}>Parâmetro</th>
            <th style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'left' }}>Módulos FV</th>
            <th style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'left' }}>Inversores</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Fabricante', sistemaFV.moduloFabricante, sistemaFV.inversorFabricante],
            ['Modelo', sistemaFV.moduloModelo, sistemaFV.inversorModelo],
            ['Quantidade', `${qtyModulos} un.`, `${qtyInversores} un.`],
            ['Potência Unitária', `${sistemaFV.moduloPotencia} Wp`, `${sistemaFV.inversorPotencia} kW`],
            ['Potência Total', `${potenciaKw} kWp`, `${(sistemaFV.inversorPotencia * qtyInversores).toFixed(2)} kW`],
          ].map(([param, mod, inv], i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f8fc' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontWeight: 'bold', color: '#003d7a' }}>{param}</td>
              <td style={{ border: '1px solid #ccc', padding: '3px 8px' }}>{mod}</td>
              <td style={{ border: '1px solid #ccc', padding: '3px 8px' }}>{inv}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PROTEÇÕES */}
      <Section title="4. DISPOSITIVOS DE PROTEÇÃO E SECCIONAMENTO" />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '8px' }}>
        <tbody>
          {[
            ['Disjuntor de Geração (CA)', sistemaFV.disjuntorGeracao, 'DPS Corrente Contínua (CC)', sistemaFV.dpsCC],
            ['DPS Corrente Alternada (CA)', sistemaFV.dpsCA, 'Tipo de Ramal de Entrada', unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo'],
          ].map((row, ri) => (
            <tr key={ri}>
              {[0, 1, 2, 3].map(ci => (
                <td key={ci} style={{
                  border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt',
                  backgroundColor: ci % 2 === 0 ? '#f0f4f8' : '#fff',
                  fontWeight: ci % 2 === 0 ? 'bold' : 'normal',
                  width: ci % 2 === 0 ? '26%' : '24%',
                }}>{row[ci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* LOCALIZAÇÃO */}
      <Section title="5. LOCALIZAÇÃO E CARACTERÍSTICAS DO TELHADO" />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '8px' }}>
        <tbody>
          {[
            ['Coordenadas GPS (Lat/Lng)', `${localizacao.latitude.toFixed(6)}, ${localizacao.longitude.toFixed(6)}`, 'Tipo de Telhado', localizacao.tipoTelhado.charAt(0).toUpperCase() + localizacao.tipoTelhado.slice(1)],
            ['Inclinação do Telhado', `${localizacao.inclinacaoTelhado}°`, 'Azimute / Orientação', `${localizacao.orientacaoTelhado}°`],
            ['Área Estimada do Telhado', localizacao.areaTelhado ? `${localizacao.areaTelhado} m²` : '—', '', ''],
          ].map((row, ri) => (
            <tr key={ri}>
              {[0, 1, 2, 3].map(ci => (
                <td key={ci} style={{
                  border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt',
                  backgroundColor: ci % 2 === 0 ? '#f0f4f8' : '#fff',
                  fontWeight: ci % 2 === 0 ? 'bold' : 'normal',
                  width: '25%',
                }}>{row[ci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* NORMAS */}
      <Section title="6. NORMAS E PADRÕES APLICÁVEIS" />
      <p style={{ fontSize: '8.5pt', margin: '4px 0 6px', lineHeight: '1.6' }}>
        ✔ ABNT NBR 16274 — Instalações de microgeração e minigeração distribuída<br />
        ✔ ABNT NBR 5410 — Instalações elétricas de baixa tensão<br />
        ✔ ABNT NBR 16150 — Sistemas fotovoltaicos — Requisitos de conexão à rede<br />
        ✔ NT.00020.EQTL — Norma Técnica da CEEE Equatorial Energia<br />
        ✔ REN ANEEL 1000/2021 — Regulamentação nacional de micro e minigeração
      </p>

      {/* ASSINATURAS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
        <tbody>
          <tr>
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{cliente.nome || '________________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Acessante / Titular</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>CPF/CNPJ: {cliente.cpfCnpj || '___.___.___-__'}</div>
              </div>
            </td>
            <td style={{ width: '10%' }} />
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{engenheiro || '________________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Responsável Técnico — Engenheiro Eletricista</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>CREA: {crea || '_________________'}</div>
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

function Section({ title }: { title: string }) {
  return (
    <div style={{ backgroundColor: '#e8f0fb', borderLeft: '4px solid #005bac', padding: '4px 8px', fontWeight: 'bold', fontSize: '9pt', marginTop: '10px', marginBottom: '4px', color: '#003d7a' }}>
      {title}
    </div>
  );
}
