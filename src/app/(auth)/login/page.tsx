'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Loader2,
  Lock,
  Mail,
  MapPinned,
  ShieldCheck,
  Sun,
} from 'lucide-react';

function getAuthCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoadingForm(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const code = getAuthCode(err);
      let errMsg = 'Erro ao realizar login. Tente novamente.';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'invalid_credentials'
      ) {
        errMsg = 'E-mail ou senha incorretos.';
      } else if (code === 'auth/invalid-email') {
        errMsg = 'Formato de e-mail inválido.';
      }
      setError(errMsg);
      setLoadingForm(false);
    }
  };

  return (
    <div className="auth-page auth-page-premium page-enter">
      <section className="auth-hero auth-hero-premium" aria-label="Solaire">
        <div className="auth-hero-content auth-hero-content-premium">
          <div className="auth-logo-large auth-logo-premium">
            <div className="logo-icon-container auth-logo-mark">
              <Sun size={22} aria-hidden="true" />
            </div>
            <span className="auth-brand-name">Solaire</span>
          </div>

          <div className="auth-command-panel">
            <div className="auth-command-topbar">
              <span>Operação de Homologação</span>
              <span className="auth-live-pill">
                <CheckCircle2 size={14} />
                Online
              </span>
            </div>

            <div className="auth-command-main">
              <div>
                <span className="auth-kicker">Pipeline regulatório</span>
                <h1 className="auth-hero-title">Solaire</h1>
                <p className="auth-hero-subtitle">
                  Controle projetos, documentos oficiais, mapa e dados técnicos em uma rotina feita para integradores solares.
                </p>
              </div>

              <div className="auth-workflow">
                <div className="auth-workflow-item active">
                  <FileCheck2 size={18} />
                  <span>Documentos validados</span>
                </div>
                <div className="auth-workflow-item">
                  <MapPinned size={18} />
                  <span>Localização do sistema</span>
                </div>
                <div className="auth-workflow-item">
                  <ShieldCheck size={18} />
                  <span>Dados protegidos</span>
                </div>
              </div>
            </div>

            <div className="auth-command-footer">
              <div>
                <span className="auth-metric-value">CEEE</span>
                <span className="auth-metric-label">Modelos prontos</span>
              </div>
              <div>
                <span className="auth-metric-value">RGE</span>
                <span className="auth-metric-label">Anexos oficiais</span>
              </div>
              <div>
                <span className="auth-metric-value">PDF</span>
                <span className="auth-metric-label">Geração direta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="auth-form-container auth-form-container-premium">
        <div className="auth-form auth-login-card">
          <div className="auth-form-header">
            <div className="auth-form-eyebrow">
              <Building2 size={16} />
              Área interna
            </div>
            <h2 className="auth-form-title">Entrar no painel</h2>
            <p className="auth-form-subtitle">Acesse a operação da sua integradora.</p>
          </div>

          {error && (
            <div className="error-message-box">
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-group">
              <label htmlFor="email" className="form-label">E-mail corporativo</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loadingForm}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Sua senha</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loadingForm}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loadingForm}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
              disabled={loadingForm}
            >
              {loadingForm ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-links">
            <p>
              Ainda não tem conta?{' '}
              <Link href="/register" className="auth-link">
                Crie sua conta gratuitamente
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
