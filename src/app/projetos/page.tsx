'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { shouldUseSupabaseData } from '@/lib/supabase';
import { listProjetos } from '@/lib/supabaseData';
import { Projeto } from '@/types/projeto';
import { Eye, FolderOpen, Loader2, PlusCircle, Search } from 'lucide-react';

const statusLabels: Record<Projeto['status'], string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  enviado: 'Enviado',
};
const statusClassNames: Record<Projeto['status'], string> = {
  rascunho: 'badge badge-gray',
  em_andamento: 'badge badge-gold',
  concluido: 'badge badge-green',
  enviado: 'badge badge-blue',
};

export default function ProjetosPage() {
  const { userData } = useAuth();
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [distFilter, setDistFilter] = useState<'todos' | 'CEEE' | 'RGE'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | Projeto['status']>('todos');

  useEffect(() => {
    async function load() {
      if (!userData?.empresaId) return;
      try {
        if (shouldUseSupabaseData()) {
          setProjects(await listProjetos(userData.empresaId));
        } else {
          const stored = localStorage.getItem('solaire_sim_projects');
          const list: Projeto[] = stored ? JSON.parse(stored) : [];
          setProjects(
            list
              .filter((p) => p.empresaId === userData.empresaId)
              .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime())
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userData]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (distFilter !== 'todos' && p.distribuidora !== distFilter) return false;
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(p.cliente?.nome || '').toLowerCase().includes(q) &&
          !(p.cliente?.cpfCnpj || '').toLowerCase().includes(q) &&
          !(p.unidadeConsumidora?.codigo || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [projects, distFilter, statusFilter, search]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('pt-BR');
    } catch {
      return d;
    }
  };
  const formatPower = (v?: number) => (v ? `${v.toFixed(2)} kWp` : '—');

  return (
    <div className="dashboard-container page-enter">
      <section className="dashboard-hero-panel">
        <div className="dashboard-hero-copy">
          <div className="dashboard-eyebrow">
            <FolderOpen size={16} />
            Carteira de projetos
          </div>
          <h1 className="page-title">Meus Projetos</h1>
          <p className="page-subtitle">
            Pesquise, filtre e abra qualquer projeto homologado pela sua equipe.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/projeto/novo" className="btn btn-primary flex items-center gap-2">
            <PlusCircle size={19} />
            Novo projeto
          </Link>
        </div>
      </section>

      <section className="card projects-panel">
        <div className="card-header projects-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: 220 }}>
            <span className="input-icon"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Buscar por cliente, CPF/CNPJ ou UC..."
              className="form-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={distFilter}
            onChange={(e) => setDistFilter(e.target.value as typeof distFilter)}
            style={{ maxWidth: 180 }}
          >
            <option value="todos">Todas distribuidoras</option>
            <option value="RGE">RGE Sul (CPFL)</option>
            <option value="CEEE">CEEE Equatorial</option>
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{ maxWidth: 180 }}
          >
            <option value="todos">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluido">Concluído</option>
            <option value="enviado">Enviado</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin text-amber-500" size={34} />
            <span>Carregando projetos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state empty-state-premium">
            <div className="empty-state-icon-container">
              <FolderOpen size={34} />
            </div>
            <h3 className="empty-state-title">Nenhum projeto encontrado</h3>
            <p className="empty-state-text">
              Ajuste os filtros ou crie um novo projeto para iniciar a homologação.
            </p>
            <Link href="/projeto/novo" className="btn btn-primary flex items-center gap-2">
              <PlusCircle size={16} />
              Criar projeto
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
                  <th>Potência</th>
                  <th>Atualizado</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="project-client-cell">
                        <strong>{p.cliente?.nome || 'Cliente sem nome'}</strong>
                        <span>{p.cliente?.cpfCnpj || 'CPF/CNPJ não informado'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`distribuidora-tag ${p.distribuidora === 'CEEE' ? 'ceee' : 'rge'}`}>
                        {p.distribuidora}
                      </span>
                    </td>
                    <td>
                      <span className={statusClassNames[p.status] || 'badge badge-gray'}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="project-power-cell">{formatPower(p.sistemaFV?.potenciaInstalada)}</td>
                    <td>{formatDate(p.atualizadoEm)}</td>
                    <td className="text-right">
                      <Link
                        href={`/projeto/editar/${p.id}`}
                        className="btn btn-sm btn-secondary flex items-center gap-1 project-open-btn"
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
      </section>
    </div>
  );
}
