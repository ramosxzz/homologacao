/**
 * Sistema de geração de documentos via HTML overlay sobre imagem do PDF.
 *
 * Estratégia:
 * 1. O PDF oficial fica em /documentos/{distribuidora}/
 * 2. Uma imagem PNG de cada página é gerada no build e salva em /documentos/{distribuidora}/pages/
 * 3. O componente de impressão renderiza a imagem como fundo e sobrepõe os dados como HTML
 * 4. window.print() gera o PDF final perfeito
 *
 * Para gerar as imagens das páginas, rode: npm run gen-pdf-pages
 */

import type { ProjetoData } from './pdfGenerator';

export type { ProjetoData };

/** Converte coordenadas percentuais (0-100) em estilo CSS absoluto */
export function pos(left: number, top: number, width = 40, fontSize = 9): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    fontSize: `${fontSize}pt`,
    fontFamily: 'Arial, sans-serif',
    color: '#000',
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
  };
}

/** Formata data atual em pt-BR */
export function hoje(): string {
  return new Date().toLocaleDateString('pt-BR');
}
