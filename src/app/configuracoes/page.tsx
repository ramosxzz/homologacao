'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shouldUseSupabaseData } from '@/lib/supabase';
import { updateEmpresa } from '@/lib/supabaseData';
import { Empresa, ResponsavelTecnico } from '@/types/usuario';
import { formatarCNPJ, formatarCPF, formatarTelefone, formatarCEP } from '@/lib/validators';
import { Building2, CheckCircle2, Loader2, Save, Settings as SettingsIcon, ShieldCheck, User2 } from 'lucide-react';

const RT_VAZIO: ResponsavelTecnico = { nome: '', crea: '', cpf: '' };

export default function ConfiguracoesPage() {
  const { empresaData, userData, updateEmpresaLocal } = useAuth();
  const [form, setForm] = useState<Empresa | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (empresaData) setForm({ ...empresaData, responsavelTecnico: empresaData.responsavelTecnico || RT_VAZIO });
  }, [empresaData]);

  if (!form) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin text-amber-500" size={34} />
        <span>Carregando dados da empresa...</span>
      </div>
    );
  }

  const setField = <K extends keyof Empresa>(key: K, value: Empresa[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setEnd = (key: keyof Empresa['endereco'], value: string) =>
    setForm((f) => (f ? { ...f, endereco: { ...f.endereco, [key]: value } } : f));

  const setRT = (key: keyof ResponsavelTecnico, value: string) =>
    setForm((f) => (f ? { ...f, responsavelTecnico: { ...f.responsavelTecnico, [key]: value } } : f));

  const handleSave = async () => {
    if (!form || !userData?.empresaId) return;
    setSaving(true);
    setError('');
    try {
      if (shouldUseSupabaseData()) {
        await updateEmpresa(userData.empresaId, form);
      }
      updateEmpresaLocal(form);
      setSavedAt(Date.now());
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const buscarCep = async () => {
    const raw = form.endereco.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const d = await res.json();
      if (d.erro) return;
      setForm((f) =>
        f
          ? {
              ...f,
              endereco: {
                ...f.endereco,
                logradouro: d.logradouro || f.endereco.logradouro,
                bairro: d.bairro || f.endereco.bairro,
                cidade: d.localidade || f.endereco.cidade,
                uf: d.uf || f.endereco.uf,
              },
            }
          : f
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="dashboard-container page-enter">
      <section className="dashboard-hero-panel">
        <div className="dashboard-hero-copy">
          <div className="dashboard-eyebrow">
            <SettingsIcon size={16} />
            Configurações da empresa
          </div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">
            Dados da integradora e do responsável técnico utilizados nos documentos oficiais.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <button type="button" className="btn btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </section>

      {savedAt && Date.now() - savedAt < 4000 && (
        <div className="simulation-banner" style={{ background: 'rgba(34,197,94,.12)', borderColor: 'rgba(34,197,94,.4)', color: '#86efac' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span><strong>Salvo.</strong> Os próximos documentos serão gerados com esses dados.</span>
          </div>
        </div>
      )}
      {error && (
        <div className="error-message-box mb-4">
          <span className="error-text text-sm">{error}</span>
        </div>
      )}

      {/* RESPONSÁVEL TÉCNICO */}
      <div className="wizard-section">
        <h3 className="wizard-section-title flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-500" />
          Responsável Técnico
        </h3>
        <p className="wizard-section-description mb-6">
          Engenheiro com registro ativo no CREA que assina o projeto. Nome e CREA aparecem em todos os anexos.
        </p>
        <div className="form-layout">
          <div className="form-group full-width">
            <label className="form-label required">Nome completo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: João da Silva Eng."
              value={form.responsavelTecnico.nome}
              onChange={(e) => setRT('nome', e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Registro CREA</label>
              <input
                type="text"
                className="form-input"
                placeholder="CREA-RS 123456"
                value={form.responsavelTecnico.crea}
                onChange={(e) => setRT('crea', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CPF</label>
              <input
                type="text"
                className="form-input"
                placeholder="000.000.000-00"
                value={form.responsavelTecnico.cpf}
                onChange={(e) => setRT('cpf', formatarCPF(e.target.value.replace(/\D/g, '')))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* EMPRESA */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title flex items-center gap-2">
          <Building2 size={18} className="text-amber-500" />
          Dados da Empresa
        </h3>
        <p className="wizard-section-description mb-6">Informações da integradora exibidas em cabeçalhos e comunicações.</p>
        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Nome Fantasia</label>
              <input type="text" className="form-input" value={form.nomeFantasia} onChange={(e) => setField('nomeFantasia', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Razão Social</label>
              <input type="text" className="form-input" value={form.razaoSocial} onChange={(e) => setField('razaoSocial', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">CNPJ</label>
              <input
                type="text"
                className="form-input font-mono"
                value={form.cnpj}
                onChange={(e) => setField('cnpj', formatarCNPJ(e.target.value.replace(/\D/g, '')))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="text"
                className="form-input"
                value={form.telefone}
                onChange={(e) => setField('telefone', formatarTelefone(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label className="form-label">E-mail corporativo</label>
            <input type="email" className="form-input" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ENDEREÇO */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title flex items-center gap-2">
          <User2 size={18} className="text-amber-500" />
          Endereço da Sede
        </h3>
        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CEP</label>
              <input
                type="text"
                className="form-input font-mono"
                value={form.endereco.cep}
                onChange={(e) => setEnd('cep', formatarCEP(e.target.value.replace(/\D/g, '').substring(0, 8)))}
                onBlur={buscarCep}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Número</label>
              <input type="text" className="form-input" value={form.endereco.numero} onChange={(e) => setEnd('numero', e.target.value)} />
            </div>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Logradouro</label>
            <input type="text" className="form-input" value={form.endereco.logradouro} onChange={(e) => setEnd('logradouro', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bairro</label>
              <input type="text" className="form-input" value={form.endereco.bairro} onChange={(e) => setEnd('bairro', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input type="text" className="form-input" value={form.endereco.cidade} onChange={(e) => setEnd('cidade', e.target.value)} />
            </div>
            <div className="form-group" style={{ maxWidth: 120 }}>
              <label className="form-label">UF</label>
              <input type="text" className="form-input" maxLength={2} value={form.endereco.uf} onChange={(e) => setEnd('uf', e.target.value.toUpperCase())} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
