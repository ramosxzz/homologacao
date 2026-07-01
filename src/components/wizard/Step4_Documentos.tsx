'use client';

import React, { useState } from 'react';
import { useProjeto } from '@/contexts/ProjetoContext';
import { useAuth } from '@/contexts/AuthContext';
import { shouldUseSupabaseData } from '@/lib/supabase';
import { insertProjeto } from '@/lib/supabaseData';
import { useRouter } from 'next/navigation';
import {
  gerarDiagramaUnifilarRGE,
  gerarDiagramaBlocosCEEE,
  gerarDiagramaUnifilarCEEE,
  downloadPdf,
} from '@/lib/pdfRenderer';
import { fillAnexoE, fillAnexoF, fillMemorial, fillAnexoI } from '@/lib/fillTemplates';
import { downloadBlob } from '@/lib/docFiller';
import { openDocumentForPrint } from '@/lib/docPrint';
import {
  FileText,
  FileSpreadsheet,
  MapPin,
  Zap,
  Download,
  Printer,
  Eye,
  Check,
  Save,
  Loader2,
  TrendingUp,
  Info,
} from 'lucide-react';

type DocId = 'rge_anexo_e' | 'rge_anexo_f' | 'rge_diagrama' | 'ceee_diagrama' | 'ceee_unifilar' | 'ceee_memorial' | 'ceee_anexo_i';
interface DocItem {
  id: DocId;
  title: string;
  desc: string;
  badge: string;
  /** pdf = gerado (diagramas); docx/xlsx = template oficial preenchido */
  tipo: 'pdf' | 'xlsx' | 'docx';
  previewPath: string;
}

export default function Step4_Documentos() {
  const { state, dispatch } = useProjeto();
  const { userData, empresaData } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState<DocId | null>(null);

  const {
    cliente, unidadeConsumidora, endereco, localizacao,
    sistemaFV, compensacao, distribuidora,
  } = state;

  const engenheiro: string = userData?.nome || empresaData?.responsavelTecnico?.nome || '';
  const crea: string = empresaData?.responsavelTecnico?.crea || '';

  // ──────────────────────────────────────────────────────────────────
  // DOCUMENTOS POR DISTRIBUIDORA
  // ──────────────────────────────────────────────────────────────────
  const docsRGE: DocItem[] = [
    {
      id: 'rge_anexo_e',
      title: 'Formulário de Solicitação de Orçamento de Conexão',
      desc: 'Anexo E — RGE/CPFL · Documento editável (.docx) preenchido com os dados do projeto',
      badge: 'Anexo E',
      tipo: 'docx',
      previewPath: '/documentos/rge/anexo-e.docx',
    },
    {
      id: 'rge_anexo_f',
      title: 'Lista de Materiais / Ordem de Serviço',
      desc: 'Anexo F — RGE/CPFL · Planilha editável (.xlsx) preenchida com os dados do projeto',
      badge: 'Anexo F',
      tipo: 'xlsx',
      previewPath: '/documentos/rge/anexo-f.xlsx',
    },
    {
      id: 'rge_diagrama',
      title: 'Diagrama Unifilar',
      desc: 'RGE/CPFL · Diagrama elétrico unifilar do projeto de microgeração',
      badge: 'Elétrico',
      tipo: 'pdf',
      previewPath: '/documentos/rge/diagrama-unifilar.pdf',
    },
  ];

  const docsCEEE: DocItem[] = [
    {
      id: 'ceee_diagrama',
      title: 'Diagrama de Blocos',
      desc: 'CEEE Equatorial · Diagrama de blocos do sistema fotovoltaico',
      badge: 'Elétrico',
      tipo: 'pdf',
      previewPath: '/documentos/ceee/diagrama-blocos.pdf',
    },
    {
      id: 'ceee_unifilar',
      title: 'Diagrama Unifilar',
      desc: 'CEEE Equatorial · Diagrama elétrico unifilar detalhado do projeto',
      badge: 'Unifilar',
      tipo: 'pdf',
      previewPath: '/documentos/ceee/diagrama-unifilar.pdf',
    },
    {
      id: 'ceee_memorial',
      title: 'Memorial Descritivo',
      desc: 'CEEE Equatorial · NT.00020.EQTL — Documento editável (.docx) preenchido com os dados do projeto',
      badge: 'Memorial',
      tipo: 'docx',
      previewPath: '/documentos/ceee/memorial.docx',
    },
    {
      id: 'ceee_anexo_i',
      title: 'Formulário de Solicitação de Orçamento — Grupo B',
      desc: 'Anexo I — CEEE NT.00020.EQTL · Planilha editável (.xlsx) preenchida com os dados do projeto',
      badge: 'Anexo I',
      tipo: 'xlsx',
      previewPath: '/documentos/ceee/anexo-i.xlsx',
    },
  ];

  const activeDocs = distribuidora === 'CEEE' ? docsCEEE : docsRGE;

  // ──────────────────────────────────────────────────────────────────
  // GERAÇÃO DE DOCUMENTOS
  // Diagramas → PDF gerado. Anexos/Memorial → template oficial preenchido.
  // ──────────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    cliente,
    unidadeConsumidora,
    endereco,
    localizacao,
    sistemaFV,
    engenheiro,
    crea,
  });

  // Só os diagramas são gerados como PDF.
  const generatePdf = async (docId: DocId): Promise<Uint8Array> => {
    const p = buildPayload();
    switch (docId) {
      case 'rge_diagrama':  return gerarDiagramaUnifilarRGE(p);
      case 'ceee_diagrama': return gerarDiagramaBlocosCEEE(p);
      case 'ceee_unifilar': return gerarDiagramaUnifilarCEEE(p);
      default: throw new Error('Documento sem gerador PDF');
    }
  };

  // Anexos e Memorial: preenche o template editável (.docx/.xlsx).
  const fillTemplate = async (docId: DocId): Promise<Blob> => {
    const p = buildPayload();
    switch (docId) {
      case 'rge_anexo_e':   return fillAnexoE(p);
      case 'rge_anexo_f':   return fillAnexoF(p);
      case 'ceee_memorial': return fillMemorial(p);
      case 'ceee_anexo_i':  return fillAnexoI(p);
      default: throw new Error('Documento sem template editável');
    }
  };

  const getFilename = (docId: DocId): string => {
    const nc = cliente.nome.replace(/\s+/g, '_').toUpperCase() || 'CLIENTE';
    switch (docId) {
      case 'rge_anexo_e':   return `Anexo_E_RGE_${nc}.docx`;
      case 'rge_anexo_f':   return `Anexo_F_RGE_${nc}.xlsx`;
      case 'rge_diagrama':  return `Diagrama_Blocos_RGE_${nc}.pdf`;
      case 'ceee_diagrama': return `Diagrama_Blocos_CEEE_${nc}.pdf`;
      case 'ceee_unifilar': return `Diagrama_Unifilar_CEEE_${nc}.pdf`;
      case 'ceee_memorial': return `Memorial_Descritivo_CEEE_${nc}.docx`;
      case 'ceee_anexo_i':  return `Anexo_I_CEEE_${nc}.xlsx`;
      default:              return 'documento.pdf';
    }
  };

  const handlePreview = (doc: DocItem) => {
    window.open(doc.previewPath, '_blank');
  };

  const handleDownload = async (doc: DocItem) => {
    setLoadingDoc(doc.id);
    try {
      if (doc.tipo === 'pdf') {
        const bytes = await generatePdf(doc.id);
        downloadPdf(bytes, getFilename(doc.id));
      } else {
        const blob = await fillTemplate(doc.id);
        downloadBlob(blob, getFilename(doc.id));
      }
    } catch (e: unknown) {
      console.error('Erro ao baixar documento:', e);
      alert(`Erro ao baixar: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setLoadingDoc(null);
    }
  };

  const handlePrint = async (doc: DocItem) => {
    // Só diagramas (PDF) abrem para impressão. Templates editáveis são baixados
    // preenchidos (Word/Excel não imprimem direto do navegador).
    if (doc.tipo !== 'pdf') {
      await handleDownload(doc);
      return;
    }
    setLoadingDoc(doc.id);
    try {
      const bytes = await generatePdf(doc.id);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: unknown) {
      console.error('Erro ao abrir PDF:', e);
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleDownloadAll = async () => {
    for (const doc of activeDocs) {
      setLoadingDoc(doc.id);
      try {
        await handleDownload(doc);
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {
        console.error(`Erro ao baixar ${doc.id}:`, e);
      }
    }
    setLoadingDoc(null);
  };

  // ──────────────────────────────────────────────────────────────────
  // SALVAR PROJETO
  // ──────────────────────────────────────────────────────────────────
  const handleSaveProject = async () => {
    if (!userData?.empresaId) return;
    setSaving(true);
    try {
      const payload = {
        empresaId: userData.empresaId,
        usuarioId: userData.id,
        status: 'concluido' as const,
        distribuidora,
        cliente,
        unidadeConsumidora: {
          ...unidadeConsumidora,
          cargaInstalada: parseFloat(unidadeConsumidora.cargaInstalada) || 0,
          consumoMedio: parseFloat(unidadeConsumidora.consumoMedio) || 0,
        },
        endereco,
        localizacao,
        sistemaFV: {
          ...sistemaFV,
          quantidadeModulos: parseInt(sistemaFV.quantidadeModulos) || 0,
          quantidadeInversores: parseInt(sistemaFV.quantidadeInversores) || 0,
          strings: sistemaFV.strings.map(s => ({
            modulosEmSerie: parseInt(s.modulosEmSerie) || 0,
            stringsParalelo: parseInt(s.stringsParalelo) || 0,
            mpptIndex: s.mpptIndex,
          })),
        },
        compensacao: {
          modalidade: compensacao.modalidade,
          beneficiarios: compensacao.beneficiarios.map(b => ({
            ...b,
            percentual: parseFloat(b.percentual) || 0,
          })),
        },
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      if (shouldUseSupabaseData()) {
        await insertProjeto(payload);
      } else {
        const stored = localStorage.getItem('solaire_sim_projects');
        const list = stored ? JSON.parse(stored) : [];
        list.push({ id: 'proj_' + Math.random().toString(36).substr(2, 9), ...payload });
        localStorage.setItem('solaire_sim_projects', JSON.stringify(list));
      }

      setSaveSuccess(true);
      setTimeout(() => {
        dispatch({ type: 'RESET' });
        router.push('/dashboard');
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar o projeto.');
    } finally {
      setSaving(false);
    }
  };

  const distColor = distribuidora === 'CEEE'
    ? { ring: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-400', icon: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20' }
    : { ring: 'border-red-500/30',  badge: 'bg-red-500/20 text-red-400',   icon: 'text-red-400',  iconBg: 'bg-red-500/10 border-red-500/20' };

  return (
    <div className="tab-pane page-enter">

      {/* ── RESUMO ── */}
      <div className="wizard-section">
        <h3 className="wizard-section-title">Resumo Técnico do Projeto</h3>
        <p className="wizard-section-description mb-6">
          Confirme os dados antes de gerar os documentos oficiais.
        </p>

        <div className="card-flat bg-slate-900/40 border border-slate-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div>
            <h4 className="text-slate-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin size={12} className="text-amber-500" /> Cliente e Conexão
            </h4>
            <div className="flex flex-col gap-2">
              <div><span className="text-slate-400 block">Titular:</span><span className="font-semibold text-slate-200">{cliente.nome || '—'}</span></div>
              <div><span className="text-slate-400 block">CPF/CNPJ:</span><span className="font-semibold text-slate-200">{cliente.cpfCnpj || '—'}</span></div>
              <div><span className="text-slate-400 block">UC:</span><span className="font-semibold text-slate-200 font-mono">{unidadeConsumidora.codigo || '—'}</span></div>
              <div><span className="text-slate-400 block">Endereço:</span><span className="font-semibold text-slate-200">{endereco.logradouro}, {endereco.numero} — {endereco.cidade}/{endereco.uf}</span></div>
            </div>
          </div>

          <div>
            <h4 className="text-slate-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap size={12} className="text-amber-500" /> Sistema FV
            </h4>
            <div className="flex flex-col gap-2">
              <div><span className="text-slate-400 block">Distribuidora:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${distColor.badge}`}>{distribuidora}</span>
              </div>
              <div><span className="text-slate-400 block">Potência:</span><span className="font-bold text-amber-500 text-sm">{sistemaFV.potenciaInstalada.toFixed(2)} kWp</span></div>
              <div><span className="text-slate-400 block">Módulos:</span><span className="font-semibold text-slate-200">{sistemaFV.quantidadeModulos}× {sistemaFV.moduloModelo} ({sistemaFV.moduloPotencia} Wp)</span></div>
              <div><span className="text-slate-400 block">Inversor:</span><span className="font-semibold text-slate-200">{sistemaFV.quantidadeInversores}× {sistemaFV.inversorModelo} ({sistemaFV.inversorPotencia} kW)</span></div>
            </div>
          </div>

          <div>
            <h4 className="text-slate-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-amber-500" /> Localização
            </h4>
            <div className="flex flex-col gap-2">
              <div><span className="text-slate-400 block">GPS:</span><span className="font-semibold text-slate-200 font-mono">{localizacao.latitude.toFixed(5)}, {localizacao.longitude.toFixed(5)}</span></div>
              <div><span className="text-slate-400 block">Telhado:</span><span className="font-semibold text-slate-200 capitalize">{localizacao.tipoTelhado}{localizacao.areaTelhado ? ` · ${localizacao.areaTelhado} m²` : ''}</span></div>
              <div><span className="text-slate-400 block">Inclinação / Azimute:</span><span className="font-semibold text-slate-200">{localizacao.inclinacaoTelhado}° / {localizacao.orientacaoTelhado}°</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DOCUMENTOS ── */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">
          Documentos Oficiais — {distribuidora === 'CEEE' ? 'CEEE Equatorial' : 'RGE Sul / CPFL'}
        </h3>
        <p className="wizard-section-description mb-6">
          Os formulários oficiais são preenchidos automaticamente com os dados do projeto.
          Use <strong className="text-slate-300">👁 Visualizar</strong> para ver o template original,
          <strong className="text-slate-300"> ⬇ Baixar</strong> para obter o PDF preenchido.
        </p>

        <div className="flex flex-col gap-3">
          {activeDocs.map((doc) => {
            const isLoading = loadingDoc === doc.id;
            return (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-4 rounded-xl border bg-slate-900/20 hover:bg-slate-900/40 transition-all ${distColor.ring}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex-shrink-0 w-11 h-11 rounded-lg border flex items-center justify-center ${distColor.iconBg}`}>
                    {doc.tipo === 'xlsx'
                      ? <FileSpreadsheet size={20} className="text-emerald-400" />
                      : <FileText size={20} className={distColor.icon} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-200 leading-snug">{doc.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${distColor.badge}`}>
                    {doc.badge}
                  </span>

                  {/* Visualizar template original */}
                  <button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    className="btn btn-secondary btn-icon-only"
                    title="Ver formulário original"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Imprimir preenchido */}
                  <button
                    type="button"
                    onClick={() => handlePrint(doc)}
                    className="btn btn-secondary btn-icon-only"
                    title="Abrir PDF preenchido em nova aba"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  </button>

                  {/* Baixar preenchido */}
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="btn btn-primary btn-icon-only"
                    title="Baixar PDF preenchido"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nota sobre o Anexo I CEEE */}
        {distribuidora === 'CEEE' && (
          <div className="mt-4 p-3 rounded-xl border border-blue-800/40 bg-blue-900/10 flex items-start gap-2 text-xs text-slate-400">
            <Info size={12} className="mt-0.5 flex-shrink-0 text-blue-400" />
            <span>
              O <strong className="text-slate-300">Anexo I CEEE</strong> é um formulário Excel (.xlsx) que deve ser preenchido manualmente após o download,
              pois a CEEE Equatorial exige o arquivo neste formato para protocolo de solicitação.
              Os demais documentos são gerados como PDF com os dados do projeto já inseridos.
            </span>
          </div>
        )}
      </div>

      {/* ── AÇÕES FINAIS ── */}
      <div className="wizard-section mt-10 border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-400 max-w-sm">
          {distribuidora === 'CEEE'
            ? 'Documentos CEEE Equatorial conforme NT.00020.EQTL-06 — REN ANEEL 1000/2021.'
            : 'Documentos RGE Sul/CPFL conforme GED 15303 — REN ANEEL 1000/2021.'
          }
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-secondary btn-lg flex items-center gap-2"
            onClick={handleDownloadAll}
            disabled={loadingDoc !== null}
          >
            {loadingDoc !== null ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Baixar Todos
          </button>

          <button
            type="button"
            className="btn btn-primary btn-lg flex items-center gap-2"
            onClick={handleSaveProject}
            disabled={saving || saveSuccess}
          >
            {saving ? <><Loader2 className="animate-spin" size={18} /> Salvando...</>
              : saveSuccess ? <><Check size={18} /> Salvo!</>
              : <><Save size={18} /> Salvar e Finalizar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
