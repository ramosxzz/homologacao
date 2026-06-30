'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { validarCNPJ } from '@/lib/validators';
import { Sun, Mail, Lock, Eye, EyeOff, User, Building2, Shield, Loader2, ArrowRight } from 'lucide-react';

function getAuthCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

export default function RegisterPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [crea, setCrea] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numbers
    const digits = e.target.value.replace(/\D/g, '').substring(0, 14);
    
    // Mask CNPJ
    if (digits.length <= 14) {
      let masked = digits;
      if (digits.length > 2) masked = digits.replace(/^(\d{2})/, '$1.');
      if (digits.length > 5) masked = masked.replace(/^(\d{2})\.(\d{3})/, '$1.$2.');
      if (digits.length > 8) masked = masked.replace(/^(\d{2})\.(\d{3})\.(\d{3})/, '$1.$2.$3/');
      if (digits.length > 12) masked = masked.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})/, '$1.$2.$3/$4-');
      setCnpj(masked);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field check
    if (!nome || !email || !password || !confirmPassword || !nomeEmpresa || !cnpj || !crea) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // CNPJ validation
    const rawCnpj = cnpj.replace(/\D/g, '');
    if (!validarCNPJ(rawCnpj)) {
      setError('Por favor, insira um CNPJ válido.');
      return;
    }

    setLoadingForm(true);
    try {
      await register({
        nome,
        email,
        password,
        nomeEmpresa,
        cnpj: rawCnpj,
        crea
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const code = getAuthCode(err);
      let errMsg = 'Erro ao criar conta. Tente novamente.';
      if (code === 'auth/email-already-in-use' || code === 'user_already_exists') {
        errMsg = 'Este endereço de e-mail já está em uso.';
      } else if (code === 'auth/invalid-email') {
        errMsg = 'E-mail inválido.';
      } else if (code === 'auth/weak-password' || code === 'weak_password') {
        errMsg = 'Senha muito fraca.';
      } else if (code === 'auth/email-not-confirmed') {
        errMsg = 'Cadastro criado. Confirme seu e-mail antes de entrar.';
      }
      setError(errMsg);
      setLoadingForm(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      {/* Left Column: Premium Brand Hero */}
      <div className="auth-hero">
        <div className="auth-hero-glow"></div>
        <div className="auth-hero-content">
          <div className="auth-logo-large">
            <div className="logo-icon-container">
              <Sun size={48} className="text-amber-500 animate-pulse" />
            </div>
            <span className="auth-brand-name">Solaire</span>
          </div>
          <h1 className="auth-hero-title">Sua jornada solar começa aqui</h1>
          <p className="auth-hero-subtitle">
            Crie sua conta para começar a gerenciar e homologar projetos fotovoltaicos. Economize tempo preenchendo formulários automaticamente de acordo com as normas da CEEE e RGE.
          </p>
        </div>
      </div>

      {/* Right Column: Interactive Registration Form */}
      <div className="auth-form-container">
        <div className="auth-form">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Criar sua conta</h2>
            <p className="auth-form-subtitle">Junte-se à maior plataforma de homologação solar.</p>
          </div>

          {error && (
            <div className="error-message-box">
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-layout scrollable-form">
            <div className="form-section-title">Dados de Acesso</div>
            
            <div className="form-group">
              <label htmlFor="nome" className="form-label">Seu Nome Completo</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: João da Silva"
                  className="form-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={loadingForm}
                  required
                />
              </div>
            </div>

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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mín. 6 caracteres"
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
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirmar Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loadingForm}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loadingForm}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-section-title">Dados de Engenheiro & Empresa</div>

            <div className="form-group">
              <label htmlFor="nomeEmpresa" className="form-label">Nome da Empresa Integradora</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Building2 size={18} />
                </span>
                <input
                  id="nomeEmpresa"
                  type="text"
                  placeholder="Nome fantasia da sua integradora"
                  className="form-input"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  disabled={loadingForm}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cnpj" className="form-label">CNPJ da Empresa</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Building2 size={18} />
                  </span>
                  <input
                    id="cnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    className="form-input"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    disabled={loadingForm}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="crea" className="form-label">Registro CREA do Engenheiro</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Shield size={18} />
                  </span>
                  <input
                    id="crea"
                    type="text"
                    placeholder="Ex: CREA-RS 123456"
                    className="form-input"
                    value={crea}
                    onChange={(e) => setCrea(e.target.value)}
                    disabled={loadingForm}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 mt-4"
              disabled={loadingForm}
            >
              {loadingForm ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar minha conta
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-links">
            <p>
              Já possui conta?{' '}
              <Link href="/login" className="auth-link">
                Faça login aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
