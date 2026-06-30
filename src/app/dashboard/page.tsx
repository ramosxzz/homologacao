'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { shouldUseSupabaseData } from '@/lib/supabase';
import { listProjetos } from '@/lib/supabaseData';
import { Projeto } from '@/types/projeto';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  MapPinned,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';

const statusLabels: Record<Projeto['status'], string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Em andamento',
  concluido: 'Concluido',
  enviado: 'Enviado',
};

const statusClassNames: Record<Projeto['status'], string> = {
  rascunho: 'badge badge-gray',
  em_andamento: 'badge badge-gold',
  concluido: 'badge badge-green',
  enviado: 'badge badge-blue',
};

export default function DashboardPage() {
  const { userData, empresaData } = useAuth();
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!userData?.empresaId) return;

      if (shouldUseSupabaseData()) {
        try {
          setProjects(await listProjetos(userData.empresaId));
        } catch (error) {
          console.error('Erro ao carregar projetos do Supabase:', error);
          loadLocalProjectsFallback();
        } finally {
          setLoadingProjects(false);
        }
      } else {
        loadLocalProjectsFallback();
      }
    }

    const loadLocalProjectsFallback = () => {
      const storedProjStr = localStorage.getItem('solaire_sim_projects');
      const projectsList: Projeto[] = storedProjStr ? JSON.parse(storedProjStr) : [];
      const filtered = projectsList
        .filter((p) => p.empresaId === userData?.empresaId)
        .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime());

      setProjects(filtered);
      setLoadingProjects(false);
    };

    fetchProjects();
  }, [userData]);

  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === 'em_andamento' || p.status === 'rascunho').length;
    const completed = projects.filter((p) => p.status === 'concluido' || p.status === 'enviado').length;
    const thisMonth = projects.filter((p) => {
      const createdDate = new Date(p.criadoEm);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length;
    const pipelinePower = projects.reduce((sum, p) => sum + (p.sistemaFV?.potenciaInstalada || 0), 0);
    const ceee = projects.filter((p) => p.distribuidora === 'CEEE').length;
    const rge = projects.filter((p) => p.distribuidora === 'RGE').length;

    return { total, inProgress, completed, thisMonth, pipelinePower, ceee, rge };
  }, [projects]);

  const recentProjects = projects.slice(0, 6);
  const lastUpdatedProject = projects[0];
  const companyName = empresaData?.nomeFantasia || 'Sua integradora';

  const getStatusBadge = (status: Projeto['status']) => (
    <span className={statusClassNames[status] || 'badge badge-gray'}>
      {statusLabels[status] || status}
    </span>
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatPower = (value?: number) => (value ? `${value.toFixed(2)} kWp` : 'N/A');

  return (
    <div className="dashboard-container dashboard-premium page-enter">
      {!shouldUseSupabaseData() && (
        <div className="simulation-banner">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>
              <strong>Modo de simulacao local:</strong> Os projetos deste login de teste ficam apenas neste navegador.
            </span>
          </div>
        </div>
      )}

      <section className="dashboard-hero-panel">
        <div className="dashboard-hero-copy">
          <div className="dashboard-eyebrow">
            <Building2 size={16} />
            {companyName}
          </div>
          <h1 className="page-title dashboard-title">Operacao de homologacoes</h1>
          <p className="page-subtitle dashboard-subtitle">
            Acompanhe projetos, dados tecnicos, mapa e documentos oficiais em um unico painel de trabalho.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <span className={`connection-pill ${shouldUseSupabaseData() ? 'online' : 'local'}`}>
            <Database size={15} />
            {shouldUseSupabaseData() ? 'Supabase conectado' : 'Modo local'}
          </span>
          <Link href="/projeto/novo" className="btn btn-primary flex items-center gap-2">
            <PlusCircle size={19} />
            Novo projeto
          </Link>
        </div>
      </section>

      <section className="ops-strip" aria-label="Resumo da operacao">
        <div className="ops-strip-item">
          <span className="ops-strip-label">Pipeline total</span>
          <strong>{stats.total}</strong>
          <small>{stats.inProgress} em preparo</small>
        </div>
        <div className="ops-strip-item">
          <span className="ops-strip-label">Potencia cadastrada</span>
          <strong>{stats.pipelinePower.toFixed(2)} kWp</strong>
          <small>{stats.thisMonth} novos este mes</small>
        </div>
        <div className="ops-strip-item">
          <span className="ops-strip-label">Distribuidoras</span>
          <strong>{stats.ceee} CEEE / {stats.rge} RGE</strong>
          <small>Modelos separados por concessionaria</small>
        </div>
        <div className="ops-strip-item">
          <span className="ops-strip-label">Ultima atividade</span>
          <strong>{lastUpdatedProject ? formatDate(lastUpdatedProject.atualizadoEm) : 'Sem projetos'}</strong>
          <small>{lastUpdatedProject?.cliente?.nome || 'Crie um projeto para iniciar'}</small>
        </div>
      </section>

      <section className="stats-grid dashboard-stat-grid">
        <div className="stat-card premium-stat-card">
          <div className="stat-card-icon-wrapper gold">
            <FolderOpen size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Projetos totais</span>
            <span className="stat-card-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card premium-stat-card">
          <div className="stat-card-icon-wrapper blue">
            <Clock3 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Em andamento</span>
            <span className="stat-card-value">{stats.inProgress}</span>
          </div>
        </div>

        <div className="stat-card premium-stat-card">
          <div className="stat-card-icon-wrapper green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Concluidos ou enviados</span>
            <span className="stat-card-value">{stats.completed}</span>
          </div>
        </div>

        <div className="stat-card premium-stat-card">
          <div className="stat-card-icon-wrapper gold">
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Criados este mes</span>
            <span className="stat-card-value">{stats.thisMonth}</span>
          </div>
        </div>
      </section>

      <section className="dashboard-workspace">
        <div id="projetos" className="card projects-panel">
          <div className="card-header projects-panel-header">
            <div>
              <h2 className="card-title">Projetos recentes</h2>
              <p className="panel-muted">Continue exatamente de onde a equipe parou.</p>
            </div>
            {stats.total > 0 && (
              <Link href="/projeto/novo" className="btn btn-secondary btn-sm flex items-center gap-1">
                <PlusCircle size={15} />
                Adicionar
              </Link>
            )}
          </div>

          {loadingProjects ? (
            <div className="loading-state">
              <Loader2 className="animate-spin text-amber-500" size={34} />
              <span>Carregando projetos...</span>
            </div>
          ) : stats.total === 0 ? (
            <div className="empty-state empty-state-premium">
              <div className="empty-state-icon-container">
                <FolderOpen size={34} />
              </div>
              <h3 className="empty-state-title">Nenhum projeto cadastrado</h3>
              <p className="empty-state-text">
                Crie o primeiro projeto para gerar anexos, memorial, diagramas e organizar a homologacao.
              </p>
              <Link href="/projeto/novo" className="btn btn-primary flex items-center gap-2">
                Criar primeiro projeto
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="table-container projects-table-container">
              <table className="table projects-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Distribuidora</th>
                    <th>Status</th>
                    <th>Potencia</th>
                    <th>Atualizado</th>
                    <th className="text-right">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div className="project-client-cell">
                          <strong>{project.cliente?.nome || 'Cliente sem nome'}</strong>
                          <span>{project.cliente?.cpfCnpj || 'CPF/CNPJ nao informado'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`distribuidora-tag ${project.distribuidora === 'CEEE' ? 'ceee' : 'rge'}`}>
                          {project.distribuidora}
                        </span>
                      </td>
                      <td>{getStatusBadge(project.status)}</td>
                      <td className="project-power-cell">{formatPower(project.sistemaFV?.potenciaInstalada)}</td>
                      <td>{formatDate(project.atualizadoEm)}</td>
                      <td className="text-right">
                        <Link
                          href={`/projeto/editar/${project.id}`}
                          className="btn btn-sm btn-secondary flex items-center gap-1 project-open-btn"
                          title="Abrir projeto"
                        >
                          <Eye size={14} />
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="dashboard-side-panel" aria-label="Acoes e qualidade">
          <div className="side-panel-section">
            <div className="side-panel-heading">
              <ShieldCheck size={18} />
              <span>Pronto para producao</span>
            </div>
            <ul className="quality-list">
              <li>
                <FileText size={16} />
                <span>Documentos oficiais em PDF</span>
              </li>
              <li>
                <MapPinned size={16} />
                <span>Mapa com coordenadas editaveis</span>
              </li>
              <li>
                <Zap size={16} />
                <span>Calculo automatico de potencia</span>
              </li>
            </ul>
          </div>

          <div className="side-panel-section">
            <div className="side-panel-heading">
              <Clock3 size={18} />
              <span>Proxima acao</span>
            </div>
            <p className="panel-muted">
              {lastUpdatedProject
                ? `Revise ${lastUpdatedProject.cliente?.nome || 'o ultimo projeto'} antes de emitir os documentos.`
                : 'Cadastre o primeiro cliente para liberar o fluxo completo.'}
            </p>
            <Link
              href={lastUpdatedProject ? `/projeto/editar/${lastUpdatedProject.id}` : '/projeto/novo'}
              className="side-panel-link"
            >
              {lastUpdatedProject ? 'Abrir ultimo projeto' : 'Comecar agora'}
              <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
