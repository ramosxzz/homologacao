'use client';

import React from 'react';
import { ProjetoState } from '@/contexts/ProjetoContext';

interface Props {
  state: ProjetoState;
  engenheiro?: string;
  crea?: string;
  distribuidora: 'CEEE' | 'RGE';
}

export default function DocDiagramaUnifilar({ state, engenheiro = '', crea = '', distribuidora }: Props) {
  const { cliente, unidadeConsumidora, endereco, sistemaFV } = state;
  const hoje = new Date().toLocaleDateString('pt-BR');
  const qtyModulos = parseInt(sistemaFV.quantidadeModulos) || 0;
  const qtyInversores = parseInt(sistemaFV.quantidadeInversores) || 1;
  const potenciaKwp = sistemaFV.potenciaInstalada.toFixed(2);
  const isCEEE = distribuidora === 'CEEE';
  const primaryColor = isCEEE ? '#005bac' : '#e8001c';
  const lightColor = isCEEE ? '#e8f0fb' : '#fff0f0';
  const darkColor = isCEEE ? '#003d7a' : '#6b0000';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000', background: '#fff', padding: '20mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>

      {/* CABEÇALHO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '65%', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: primaryColor }}>
                {isCEEE ? 'CEEE EQUATORIAL ENERGIA' : 'RGE SUL — CPFL ENERGIA'}
              </div>
              <div style={{ fontSize: '8pt', color: '#555' }}>Diagrama Unifilar do Sistema Fotovoltaico</div>
            </td>
            <td style={{ width: '35%', textAlign: 'right', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '7pt', color: '#777' }}>Norma: {isCEEE ? 'NT.00020.EQTL' : 'GED 15303'}</div>
              <div style={{ fontSize: '7pt', color: '#777' }}>Data: {hoje}</div>
              <div style={{ fontSize: '7pt', color: '#777' }}>ABNT NBR 16274 / NBR 5410</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', backgroundColor: primaryColor, color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '10pt', marginBottom: '12px' }}>
        DIAGRAMA UNIFILAR ELÉTRICO — SISTEMA FOTOVOLTAICO CONECTADO À REDE
      </div>

      {/* IDENTIFICAÇÃO DO PROJETO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '9pt' }}>
        <tbody>
          {[
            ['Titular / Cliente', cliente.nome, 'CPF / CNPJ', cliente.cpfCnpj],
            ['Endereço', `${endereco.logradouro}, ${endereco.numero} — ${endereco.cidade}/${endereco.uf}`, 'UC / Contrato', `${unidadeConsumidora.codigo} / ${unidadeConsumidora.contaContrato}`],
            ['Potência Instalada (kWp)', `${potenciaKwp} kWp`, 'Tensão de Conexão', unidadeConsumidora.tensaoAtendimento],
          ].map((row, ri) => (
            <tr key={ri}>
              {[0, 1, 2, 3].map(ci => (
                <td key={ci} style={{
                  border: '1px solid #ccc', padding: '3px 8px', fontSize: '9pt',
                  backgroundColor: ci % 2 === 0 ? lightColor : '#fff',
                  fontWeight: ci % 2 === 0 ? 'bold' : 'normal',
                  color: ci % 2 === 0 ? darkColor : '#000',
                  width: '25%',
                }}>{row[ci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* DIAGRAMA SVG */}
      <div style={{ border: `2px solid ${primaryColor}`, borderRadius: '4px', padding: '12px', backgroundColor: '#fafafa', marginBottom: '12px' }}>
        <div style={{ textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', color: primaryColor, marginBottom: '8px' }}>
          ESQUEMA UNIFILAR SIMPLIFICADO
        </div>
        <svg viewBox="0 0 600 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Módulos FV */}
          <rect x="10" y="20" width="100" height="50" rx="4" fill={lightColor} stroke={primaryColor} strokeWidth="1.5" />
          <text x="60" y="38" textAnchor="middle" fontSize="8" fontWeight="bold" fill={darkColor}>MÓDULOS FV</text>
          <text x="60" y="52" textAnchor="middle" fontSize="7" fill="#444">{qtyModulos} × {sistemaFV.moduloPotencia}Wp</text>
          <text x="60" y="64" textAnchor="middle" fontSize="7" fill="#444">{sistemaFV.moduloModelo}</text>

          {/* Linha CC */}
          <line x1="110" y1="45" x2="165" y2="45" stroke="#333" strokeWidth="1.5" />
          <text x="137" y="40" textAnchor="middle" fontSize="7" fill="#555">Cabo CC</text>

          {/* DPS CC */}
          <rect x="165" y="28" width="55" height="34" rx="4" fill="#fff8e1" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="192" y="43" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#92400e">DPS CC</text>
          <text x="192" y="55" textAnchor="middle" fontSize="7" fill="#92400e">{sistemaFV.dpsCC}</text>

          {/* Linha CC 2 */}
          <line x1="220" y1="45" x2="255" y2="45" stroke="#333" strokeWidth="1.5" />

          {/* INVERSOR */}
          <rect x="255" y="10" width="110" height="70" rx="6" fill={lightColor} stroke={primaryColor} strokeWidth="2" />
          <text x="310" y="30" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill={darkColor}>INVERSOR</text>
          <text x="310" y="44" textAnchor="middle" fontSize="7" fill="#444">{sistemaFV.inversorFabricante}</text>
          <text x="310" y="56" textAnchor="middle" fontSize="7" fill="#444">{sistemaFV.inversorModelo}</text>
          <text x="310" y="68" textAnchor="middle" fontSize="7" fill="#444">{qtyInversores} × {sistemaFV.inversorPotencia} kW</text>

          {/* Linha CA */}
          <line x1="365" y1="45" x2="400" y2="45" stroke="#333" strokeWidth="1.5" />
          <text x="382" y="40" textAnchor="middle" fontSize="7" fill="#555">Cabo CA</text>

          {/* DPS CA */}
          <rect x="400" y="28" width="55" height="34" rx="4" fill="#fff8e1" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="427" y="43" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#92400e">DPS CA</text>
          <text x="427" y="55" textAnchor="middle" fontSize="7" fill="#92400e">{sistemaFV.dpsCA}</text>

          {/* Linha para Disjuntor */}
          <line x1="455" y1="45" x2="490" y2="45" stroke="#333" strokeWidth="1.5" />

          {/* Disjuntor de geração */}
          <rect x="490" y="25" width="60" height="40" rx="4" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
          <text x="520" y="41" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#166534">DISJ.</text>
          <text x="520" y="53" textAnchor="middle" fontSize="7" fill="#166534">{sistemaFV.disjuntorGeracao}</text>

          {/* Linha para Medidor */}
          <line x1="520" y1="65" x2="520" y2="130" stroke="#333" strokeWidth="1.5" />

          {/* Medidor Bidirecional */}
          <rect x="460" y="130" width="120" height="55" rx="6" fill="#f3f4f6" stroke="#374151" strokeWidth="2" />
          <text x="520" y="152" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#111">MEDIDOR</text>
          <text x="520" y="165" textAnchor="middle" fontSize="7.5" fill="#374151">BIDIRECIONAL</text>
          <text x="520" y="177" textAnchor="middle" fontSize="7" fill="#6b7280">Padrão {isCEEE ? 'CEEE' : 'RGE'}</text>

          {/* Linha para Rede */}
          <line x1="520" y1="185" x2="520" y2="230" stroke="#333" strokeWidth="2" />

          {/* Rede da Distribuidora */}
          <rect x="440" y="230" width="160" height="50" rx="6" fill={lightColor} stroke={primaryColor} strokeWidth="2" />
          <text x="520" y="254" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill={darkColor}>REDE {distribuidora}</text>
          <text x="520" y="268" textAnchor="middle" fontSize="7.5" fill={darkColor}>{unidadeConsumidora.tensaoAtendimento}</text>

          {/* Carga do Cliente */}
          <line x1="460" y1="157" x2="380" y2="157" stroke="#333" strokeWidth="1.5" />
          <rect x="290" y="130" width="90" height="55" rx="4" fill="#fefce8" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="335" y="152" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#713f12">CARGAS</text>
          <text x="335" y="165" textAnchor="middle" fontSize="7.5" fill="#713f12">INSTALADAS</text>
          <text x="335" y="177" textAnchor="middle" fontSize="7" fill="#92400e">{unidadeConsumidora.cargaInstalada || '—'} kW</text>

          {/* Legenda setas */}
          <text x="20" y="200" fontSize="8" fill="#666" fontStyle="italic">↑ = Injeção na rede (créditos)</text>
          <text x="20" y="215" fontSize="8" fill="#666" fontStyle="italic">↓ = Consumo da rede</text>
          <text x="20" y="230" fontSize="8" fill="#666" fontStyle="italic">→ = Geração FV para cargas</text>
        </svg>
      </div>

      {/* LEGENDA DE PROTEÇÕES */}
      <div style={{ backgroundColor: lightColor, borderLeft: `4px solid ${primaryColor}`, padding: '4px 8px', fontWeight: 'bold', fontSize: '9pt', marginBottom: '6px', color: darkColor }}>
        QUADRO DE PROTEÇÕES E EQUIPAMENTOS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
            <th style={{ border: '1px solid #aaa', padding: '3px 8px', textAlign: 'left' }}>Dispositivo</th>
            <th style={{ border: '1px solid #aaa', padding: '3px 8px', textAlign: 'left' }}>Especificação</th>
            <th style={{ border: '1px solid #aaa', padding: '3px 8px', textAlign: 'left' }}>Norma de Referência</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['DPS Corrente Contínua (CC)', sistemaFV.dpsCC, 'ABNT NBR 5419 / IEC 61643-31'],
            ['DPS Corrente Alternada (CA)', sistemaFV.dpsCA, 'ABNT NBR 5419-4 / IEC 61643-11'],
            ['Disjuntor de Geração (CA)', sistemaFV.disjuntorGeracao, 'ABNT NBR 5361 / IEC 60947-2'],
            ['Inversores (Anti-ilhamento)', `${qtyInversores}× ${sistemaFV.inversorModelo}`, 'ABNT NBR 16150 / IEC 62116'],
            ['Medição Bidirecional', `Padrão ${distribuidora}`, isCEEE ? 'NT.00020.EQTL' : 'GED 15303'],
          ].map(([dev, spec, norm], i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8f9fa' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontWeight: 'bold', color: darkColor }}>{dev}</td>
              <td style={{ border: '1px solid #ccc', padding: '3px 8px' }}>{spec}</td>
              <td style={{ border: '1px solid #ccc', padding: '3px 8px', fontSize: '8pt', color: '#555' }}>{norm}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ASSINATURAS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '24px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{cliente.nome || '________________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Acessante / Titular</div>
              </div>
            </td>
            <td style={{ width: '10%' }} />
            <td style={{ width: '45%', textAlign: 'center', padding: '0 10px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '24px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{engenheiro || '________________________________'}</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>Responsável Técnico — Eng. Eletricista</div>
                <div style={{ fontSize: '8pt', color: '#555' }}>CREA: {crea || '_________________'}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'right', fontSize: '7.5pt', color: '#888', marginTop: '14px' }}>
        Gerado pelo Sistema Solaire Solar — {hoje}
      </div>
    </div>
  );
}
