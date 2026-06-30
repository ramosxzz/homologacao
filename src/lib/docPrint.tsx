'use client';

/**
 * DocPrintOverlay — Sistema de impressão de documentos oficiais
 *
 * Renderiza cada página do PDF como imagem de fundo (200dpi PNG)
 * e sobrepõe os dados do projeto com posicionamento absoluto percentual.
 *
 * Uso:
 *   - Chame openDocumentForPrint(docId, data) para abrir janela de impressão
 *   - A janela renderiza o HTML, chama window.print() e fecha
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ProjetoData } from './pdfGenerator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toLocaleDateString('pt-BR');

/** Estilo base para um campo de texto sobreposto */
function field(
  left: number,   // % da largura da página
  top: number,    // % da altura da página
  opts: {
    width?: number;     // % (padrão 45)
    fontSize?: number;  // pt (padrão 8.5)
    bold?: boolean;
    wrap?: boolean;
    align?: 'left' | 'center' | 'right';
  } = {}
): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${opts.width ?? 45}%`,
    fontSize: `${opts.fontSize ?? 8.5}pt`,
    fontFamily: 'Arial, sans-serif',
    fontWeight: opts.bold ? 'bold' : 'normal',
    color: '#000',
    lineHeight: '1.1',
    whiteSpace: opts.wrap ? 'normal' : 'nowrap',
    textAlign: opts.align ?? 'left',
    overflow: 'hidden',
  };
}

/** Estilo para cobrir textos antigos (máscara branca) */
function mask(
  left: number,
  top: number,
  width: number,
  height: number
): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    backgroundColor: '#fff',
    zIndex: 1,
  };
}

// ─── CSS de impressão A4 ──────────────────────────────────────────────────────

const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { width: 210mm; height: 297mm; }
    .page-break { page-break-before: always; }
    .no-print { display: none !important; }
  }
  body { background: #fff; }
  .page {
    position: relative;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    background: #fff;
  }
  .page img {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: fill;
  }
  .overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 2;
  }
`;

// ─── ANEXO E — RGE — Página 1 (Dados Técnicos) ───────────────────────────────

function AnexoEPage1({ data }: { data: ProjetoData }) {
  const invFabricanteModelo = `${data.sistemaFV.inversorFabricante} — ${data.sistemaFV.inversorModelo}`;
  return (
    <div className="page">
      <img src="/documentos/rge/pages/anexo-e-1.png" alt="Anexo E pág 1" />
      <div className="overlay">
        {/* 2.2 Potência (kW) */}
        <span style={field(57.1, 53.7, { width: 20 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)}</span>

        {/* 2.4 Dados do inversor */}
        <span style={field(65.5, 67.1, { width: 30 })}>{invFabricanteModelo}</span>
        <span style={field(73.9, 70.1, { width: 10 })}>{data.sistemaFV.quantidadeInversores}</span>
        <span style={field(83.1, 73.0, { width: 15 })}>{data.unidadeConsumidora.tensaoAtendimento}</span>
        <span style={field(83.1, 76.0, { width: 15 })}>{data.sistemaFV.inversorPotencia} kW</span>
      </div>
    </div>
  );
}

// ─── ANEXO E — RGE — Página 2 (Identificação do Solicitante) ─────────────────

function AnexoEPage2({ data }: { data: ProjetoData }) {
  const contato = [data.cliente.celular || data.cliente.telefone, data.cliente.email].filter(Boolean).join(' | ');
  return (
    <div className="page">
      <img src="/documentos/rge/pages/anexo-e-2.png" alt="Anexo E pág 2" />
      <div className="overlay">
        {/* 5.1 Nome do consumidor */}
        <span style={field(18.5, 77.7, { width: 70 })}>{data.cliente.nome}</span>
        {/* 5.2 Contato */}
        <span style={field(18.5, 80.6, { width: 70 })}>{contato}</span>
        {/* Local */}
        <span style={field(18.5, 83.6, { width: 30 })}>{data.endereco.cidade}/{data.endereco.uf}</span>
        {/* Data */}
        <span style={field(52.1, 83.6, { width: 20 })}>{today()}</span>
      </div>
    </div>
  );
}

// ─── ANEXO F — RGE — Página 1 (Dados da Unidade Consumidora) ─────────────────

function AnexoFPage1({ data }: { data: ProjetoData }) {
  const endCompleto = [
    data.endereco.logradouro,
    data.endereco.numero,
    data.endereco.complemento,
    data.endereco.bairro,
  ].filter(Boolean).join(', ');

  return (
    <div className="page">
      <img src="/documentos/rge/pages/anexo-f-1.png" alt="Anexo F pág 1" />
      <div className="overlay">
        {/* 1.1 Nome do titular */}
        <span style={field(46.0, 47.5, { width: 45 })}>{data.cliente.nome}</span>
        {/* 1.2 CNPJ ou CPF */}
        <span style={field(46.0, 50.4, { width: 45 })}>{data.cliente.cpfCnpj}</span>
        {/* 1.3 Número da UC */}
        <span style={field(46.0, 53.2, { width: 45 })}>{data.unidadeConsumidora.codigo}</span>
        {/* 1.4 Endereço */}
        <span style={field(46.0, 56.1, { width: 45, wrap: true })}>{endCompleto}</span>
        {/* 1.5 CEP */}
        <span style={field(46.0, 58.9, { width: 45 })}>{data.endereco.cep}</span>
        {/* 1.6 Município */}
        <span style={field(46.0, 61.8, { width: 45 })}>{data.endereco.cidade} / {data.endereco.uf}</span>
        {/* 1.7 Latitude */}
        <span style={field(46.0, 63.4, { width: 45 })}>{data.localizacao.latitude.toFixed(6)}</span>
        {/* 1.8 Longitude */}
        <span style={field(46.0, 65.1, { width: 45 })}>{data.localizacao.longitude.toFixed(6)}</span>
        {/* 1.7 (bis) Telefone */}
        <span style={field(46.0, 67.0, { width: 45 })}>{data.cliente.celular || data.cliente.telefone}</span>
        {/* 1.8 (bis) E-mail */}
        <span style={field(46.0, 68.7, { width: 45 })}>{data.cliente.email}</span>
      </div>
    </div>
  );
}

// ─── ANEXO F — RGE — Página 2 (Dados Técnicos Existente + Minigeração) ───────────

function AnexoFPage2({ data }: { data: ProjetoData }) {
  const fases: Record<string, string> = {
    monofasica: 'Monofásica', bifasica: 'Bifásica', trifasica: 'Trifásica',
  };
  const cInstLabel = data.unidadeConsumidora.cargaInstalada ? `${data.unidadeConsumidora.cargaInstalada} kW` : '';
  const potCA = (data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1)).toFixed(2);

  return (
    <div className="page">
      <img src="/documentos/rge/pages/anexo-f-2.png" alt="Anexo F pág 2" />
      <div className="overlay">
        {/* 2a - UC Existente */}
        {/* 2.1 Padrão de Entrada */}
        <span style={field(46.0, 20.3)}>GED 14945</span>
        {/* 2.2 Tipo de Atendimento */}
        <span style={field(46.0, 24.5)}>{data.unidadeConsumidora.tipoRamal === 'aereo' ? 'Aéreo' : 'Subterrâneo'}</span>
        {/* 2.3 Número de Fases */}
        <span style={field(46.0, 29.2)}>{fases[data.unidadeConsumidora.tipoConexao] || data.unidadeConsumidora.tipoConexao}</span>
        {/* 2.4 Cabos */}
        <span style={field(46.0, 32.8)}>—</span>
        {/* 2.5 Caixa de Medição */}
        <span style={field(46.0, 38.2)}>GED 14945</span>
        {/* 2.6 Carga Instalada */}
        <span style={field(46.0, 42.9)}>{cInstLabel}</span>
        {/* 2.7 Disjuntor */}
        <span style={field(46.0, 46.5)}>{data.sistemaFV.disjuntorGeracao || '32 A'}</span>

        {/* 2b - Minigeração */}
        {/* 2.1 Carga instalada */}
        <span style={field(46.0, 51.9, { width: 12 })}>{cInstLabel}</span>
        <span style={field(60.0, 51.9, { width: 12 })}>0</span>
        <span style={field(73.0, 51.9, { width: 12 })}>{cInstLabel}</span>

        {/* 2.2 Demanda */}
        <span style={field(46.0, 54.9, { width: 12 })}>0</span>
        <span style={field(60.0, 54.9, { width: 12 })}>—</span>
        <span style={field(73.0, 54.9, { width: 12 })}>0</span>

        {/* 2.5 Potência instalada de geração (kVA) */}
        <span style={field(46.0, 69.1, { width: 12 })}>0</span>
        <span style={field(60.0, 69.1, { width: 12 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)} kVA</span>
        <span style={field(73.0, 69.1, { width: 12 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)} kVA</span>

        {/* 2.6 Potência exportada (kW) */}
        <span style={field(46.0, 73.3, { width: 12 })}>0</span>
        <span style={field(60.0, 73.3, { width: 12 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)} kW</span>
        <span style={field(73.0, 73.3, { width: 12 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)} kW</span>

        {/* RT e CREA */}
        <span style={field(46.0, 76.8, { width: 45 })}>{data.engenheiro || ''}</span>
        <span style={field(46.0, 80.4, { width: 45 })}>{data.crea || ''}</span>
        <span style={field(46.0, 85.2, { width: 45 })}>{data.cliente.celular || data.cliente.telefone || ''}</span>
      </div>
    </div>
  );
}

// ─── ANEXO F — RGE — Página 3 (Dados dos geradores UFV) ───────────────────────

function AnexoFPage3({ data }: { data: ProjetoData }) {
  const area = data.localizacao.areaTelhado ? `${data.localizacao.areaTelhado} m²` : '—';
  const potCA = (data.sistemaFV.inversorPotencia * (parseInt(data.sistemaFV.quantidadeInversores) || 1)).toFixed(2);

  return (
    <div className="page">
      <img src="/documentos/rge/pages/anexo-f-3.png" alt="Anexo F pág 3" />
      <div className="overlay">
        {/* 2.10 Data pretendida */}
        <span style={field(46.0, 21.0, { width: 12 })}>—</span>

        {/* 3.1 Qtd módulos */}
        <span style={field(46.0, 48.7, { width: 12 })}>0</span>
        <span style={field(60.0, 48.7, { width: 12 })}>{data.sistemaFV.quantidadeModulos}</span>
        <span style={field(73.0, 48.7, { width: 12 })}>{data.sistemaFV.quantidadeModulos}</span>

        {/* 3.2 Fabricante módulos */}
        <span style={field(46.0, 51.7, { width: 12 })}>—</span>
        <span style={field(60.0, 51.7, { width: 12 })}>{data.sistemaFV.moduloFabricante}</span>
        <span style={field(73.0, 51.7, { width: 12 })}>{data.sistemaFV.moduloFabricante}</span>

        {/* 3.3 Modelo módulos */}
        <span style={field(46.0, 55.7, { width: 12, fontSize: 7.5 })}>{'—'}</span>
        <span style={field(60.0, 55.7, { width: 12, fontSize: 7.5 })}>{data.sistemaFV.moduloModelo}</span>
        <span style={field(73.0, 55.7, { width: 12, fontSize: 7.5 })}>{data.sistemaFV.moduloModelo}</span>

        {/* 3.4 Área ocupada */}
        <span style={field(46.0, 59.9, { width: 12 })}>—</span>
        <span style={field(60.0, 59.9, { width: 12 })}>{area}</span>
        <span style={field(73.0, 59.9, { width: 12 })}>{area}</span>

        {/* 3.5 Qtd inversores */}
        <span style={field(46.0, 62.8, { width: 12 })}>0</span>
        <span style={field(60.0, 62.8, { width: 12 })}>{data.sistemaFV.quantidadeInversores}</span>
        <span style={field(73.0, 62.8, { width: 12 })}>{data.sistemaFV.quantidadeInversores}</span>

        {/* 3.6 Fabricante inversores */}
        <span style={field(46.0, 65.8, { width: 12 })}>—</span>
        <span style={field(60.0, 65.8, { width: 12 })}>{data.sistemaFV.inversorFabricante}</span>
        <span style={field(73.0, 65.8, { width: 12 })}>{data.sistemaFV.inversorFabricante}</span>

        {/* 3.7 Modelo inversores */}
        <span style={field(46.0, 70.1, { width: 12, fontSize: 7.5 })}>{'—'}</span>
        <span style={field(60.0, 70.1, { width: 12, fontSize: 7.5 })}>{data.sistemaFV.inversorModelo}</span>
        <span style={field(73.0, 70.1, { width: 12, fontSize: 7.5 })}>{data.sistemaFV.inversorModelo}</span>

        {/* 3.8 Potência de pico */}
        <span style={field(46.0, 74.2, { width: 12 })} font-size="8.5pt">0</span>
        <span style={field(60.0, 74.2, { width: 12 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)} kWp</span>
        <span style={field(73.0, 74.2, { width: 12 })}>{data.sistemaFV.potenciaInstalada.toFixed(2)} kWp</span>

        {/* 3.9 Potência nominal inversores */}
        <span style={field(46.0, 80.1, { width: 12 })}>0</span>
        <span style={field(60.0, 80.1, { width: 12 })}>{potCA} kW</span>
        <span style={field(73.0, 80.1, { width: 12 })}>{potCA} kW</span>

        {/* 3.10 Data pretendida */}
        <span style={field(46.0, 85.5, { width: 12 })}>—</span>
        <span style={field(60.0, 85.5, { width: 12 })}>{today()}</span>
        <span style={field(73.0, 85.5, { width: 12 })}>{today()}</span>
      </div>
    </div>
  );
}

// ─── DIAGRAMA UNIFILAR — RGE ──────────────────────────────────────────────────

function DiagramaUnifilarRGE({ data }: { data: ProjetoData }) {
  const loc = `${data.endereco.logradouro}, ${data.endereco.numero} — ${data.endereco.cidade}/${data.endereco.uf}`;
  const resp = data.engenheiro ? `${data.engenheiro}${data.crea ? ' — CREA: ' + data.crea : ''}` : '';
  return (
    <div className="page">
      <img src="/documentos/rge/pages/diagrama-unifilar-1.png" alt="Diagrama Unifilar" />
      <div className="overlay">
        <span style={field(16.0, 13.3, { width: 80 })}>{data.cliente.nome}</span>
        <span style={field(19.3, 15.0, { width: 80 })}>{loc}</span>
        <span style={field(26.9, 16.7, { width: 70 })}>{resp}</span>
        {/* Rodapé */}
        <span style={field(16.8, 95.8, { width: 25 })}>{data.endereco.cidade}</span>
        <span style={field(45.3, 95.8, { width: 20 })}>{today()}</span>
      </div>
    </div>
  );
}

// ─── DIAGRAMA DE BLOCOS — CEEE ────────────────────────────────────────────────

function DiagramaBlocosCEEE({ data }: { data: ProjetoData }) {
  const loc = `${data.endereco.logradouro}, ${data.endereco.numero}, ${data.endereco.bairro} - ${data.endereco.cidade}, ${data.endereco.uf}`;
  const resp = data.engenheiro ? `${data.engenheiro}${data.crea ? ' - ' + data.crea : ''}` : '';
  return (
    <div className="page">
      {/* ── MÁSCARAS BRANCAS PARA COBRIR TEXTO ANTIGO DO TEMPLATE ── */}
      <div style={mask(15.0, 10.8, 75.0, 2.0)} />
      <div style={mask(19.0, 12.8, 71.0, 2.0)} />
      <div style={mask(26.0, 14.5, 64.0, 2.0)} />
      <div style={mask(15.0, 94.0, 15.0, 2.2)} />
      <div style={mask(31.0, 94.0, 15.0, 2.2)} />

      <img src="/documentos/ceee/pages/diagrama-blocos-1.png" alt="Diagrama de Blocos" />
      
      <div className="overlay">
        <span style={field(16.0, 11.6, { width: 80 })}>{data.cliente.nome}</span>
        <span style={field(19.3, 13.3, { width: 80 })}>{loc}</span>
        <span style={field(26.9, 15.0, { width: 70 })}>{resp}</span>
        {/* Rodapé */}
        <span style={field(16.8, 95.8, { width: 25 })}>{data.endereco.cidade}</span>
        <span style={field(45.3, 95.8, { width: 20 })}>{today()}</span>
      </div>
    </div>
  );
}

// ─── Páginas de passagem (sem dados para preencher) ───────────────────────────

function PassThrough({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="page">
      <img src={src} alt={alt} />
    </div>
  );
}

// ─── Documentos completos ─────────────────────────────────────────────────────

type DocId = 'rge_anexo_e' | 'rge_anexo_f' | 'rge_diagrama' | 'ceee_diagrama';

function DocumentPages({ docId, data }: { docId: DocId; data: ProjetoData }) {
  switch (docId) {
    case 'rge_anexo_e':
      return (
        <>
          <AnexoEPage1 data={data} />
          <div className="page-break" />
          <AnexoEPage2 data={data} />
          <div className="page-break" />
          <PassThrough src="/documentos/rge/pages/anexo-e-3.png" alt="Anexo E pág 3" />
        </>
      );

    case 'rge_anexo_f':
      return (
        <>
          <AnexoFPage1 data={data} />
          <div className="page-break" />
          <AnexoFPage2 data={data} />
          <div className="page-break" />
          <AnexoFPage3 data={data} />
          <div className="page-break" />
          <PassThrough src="/documentos/rge/pages/anexo-f-4.png" alt="Anexo F pág 4" />
          <div className="page-break" />
          <PassThrough src="/documentos/rge/pages/anexo-f-5.png" alt="Anexo F pág 5" />
          <div className="page-break" />
          <PassThrough src="/documentos/rge/pages/anexo-f-6.png" alt="Anexo F pág 6" />
          <div className="page-break" />
          <PassThrough src="/documentos/rge/pages/anexo-f-7.png" alt="Anexo F pág 7" />
        </>
      );

    case 'rge_diagrama':
      return <DiagramaUnifilarRGE data={data} />;

    case 'ceee_diagrama':
      return <DiagramaBlocosCEEE data={data} />;

    default:
      return null;
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Abre uma janela de impressão com o documento preenchido */
export function openDocumentForPrint(docId: DocId, data: ProjetoData) {
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) { alert('Permita pop-ups para imprimir.'); return; }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Documento Solaire</title>
      <style>${PRINT_CSS}</style>
    </head>
    <body>
      <div id="root"></div>
    </body>
    </html>
  `);
  win.document.close();

  // Aguarda o DOM estar pronto e renderiza o React
  const render = () => {
    const root = createRoot(win.document.getElementById('root')!);
    root.render(
      React.createElement(DocumentPages, { docId, data })
    );
    // Espera imagens carregarem antes de imprimir
    setTimeout(() => {
      win.focus();
      win.print();
    }, 1200);
  };

  if (win.document.readyState === 'complete') {
    render();
  } else {
    win.addEventListener('load', render);
  }
}
