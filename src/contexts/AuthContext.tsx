'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchUsuarioEmpresa } from '@/lib/supabaseData';
import { Usuario, Empresa } from '@/types/usuario';

interface RegisterData {
  nome: string;
  email: string;
  password: string;
  nomeEmpresa: string;
  cnpj: string;
  crea: string;
}

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  userData: Usuario | null;
  empresaData: Empresa | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: Usuario = {
  id: 'mock-user-uid',
  empresaId: 'mock-empresa-id',
  nome: 'Engenheiro Solaire',
  email: 'admin@solaire.com.br',
  role: 'admin',
  criadoEm: new Date().toISOString(),
};

const MOCK_EMPRESA: Empresa = {
  id: 'mock-empresa-id',
  nomeFantasia: 'Solaire Energia Solar S/A',
  razaoSocial: 'Solaire Soluções Fotovoltaicas LTDA',
  cnpj: '31.284.918/0001-92',
  email: 'contato@solaire.com.br',
  telefone: '(51) 3290-4820',
  endereco: {
    cep: '90010-000',
    logradouro: 'Avenida Borges de Medeiros',
    numero: '1500',
    bairro: 'Centro Histórico',
    cidade: 'Porto Alegre',
    uf: 'RS',
  },
  responsavelTecnico: {
    nome: 'Engenheiro Solaire',
    crea: 'CREA-RS 284918',
    cpf: '812.492.019-32',
  },
  logo: '',
  criadoEm: new Date().toISOString(),
};

const DEMO_EMAIL = 'teste@solaire.app';
const DEMO_PASSWORD = 'Solaire@2026';

function toAppUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AppUser {
  return {
    uid: user.id,
    email: user.email || null,
    displayName: typeof user.user_metadata?.nome === 'string' ? user.user_metadata.nome : null,
  };
}

function localAppUser(usuario: Usuario): AppUser {
  return {
    uid: usuario.id,
    email: usuario.email,
    displayName: usuario.nome,
  };
}

function readLocalAuthSnapshot(): {
  user: AppUser | null;
  userData: Usuario | null;
  empresaData: Empresa | null;
  loading: boolean;
} {
  if (isSupabaseConfigured || typeof window === 'undefined') {
    return { user: null, userData: null, empresaData: null, loading: true };
  }

  const storedUser = localStorage.getItem('solaire_sim_user');
  const storedEmpresa = localStorage.getItem('solaire_sim_empresa');
  const loggedIn = localStorage.getItem('solaire_sim_logged_in');

  if (loggedIn !== 'true') {
    return { user: null, userData: null, empresaData: null, loading: false };
  }

  const usuario = storedUser ? (JSON.parse(storedUser) as Usuario) : MOCK_USER;
  const empresa = storedEmpresa ? (JSON.parse(storedEmpresa) as Empresa) : MOCK_EMPRESA;

  localStorage.setItem('solaire_sim_user', JSON.stringify(usuario));
  localStorage.setItem('solaire_sim_empresa', JSON.stringify(empresa));

  return {
    user: localAppUser(usuario),
    userData: usuario,
    empresaData: empresa,
    loading: false,
  };
}

function normalizeAuthError(error: unknown): Error & { code?: string } {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error && 'message' in error) {
    const maybe = error as { message?: string; code?: string };
    const normalized = new Error(maybe.message || 'Erro de autenticação.') as Error & { code?: string };
    normalized.code = maybe.code;
    return normalized;
  }
  return new Error('Erro de autenticação.') as Error & { code?: string };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialAuth = readLocalAuthSnapshot();
  const [user, setUser] = useState<AppUser | null>(initialAuth.user);
  const [userData, setUserData] = useState<Usuario | null>(initialAuth.userData);
  const [empresaData, setEmpresaData] = useState<Empresa | null>(initialAuth.empresaData);
  const [loading, setLoading] = useState(initialAuth.loading);

  const loadSupabaseProfile = async (userId: string) => {
    const { usuario, empresa } = await fetchUsuarioEmpresa(userId);
    setUserData(usuario);
    setEmpresaData(empresa);
  };

  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (!mounted) return;
        const sessionUser = data.session?.user;

        if (!sessionUser) {
          setUser(null);
          setUserData(null);
          setEmpresaData(null);
          setLoading(false);
          return;
        }

        setUser(toAppUser(sessionUser));
        try {
          await loadSupabaseProfile(sessionUser.id);
        } catch (error) {
          console.error('Erro ao carregar perfil Supabase:', error);
        } finally {
          if (mounted) setLoading(false);
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        const sessionUser = session?.user;
        if (!sessionUser) {
          setUser(null);
          setUserData(null);
          setEmpresaData(null);
          setLoading(false);
          return;
        }

        setUser(toAppUser(sessionUser));
        loadSupabaseProfile(sessionUser.id).catch((error) => {
          console.error('Erro ao atualizar perfil Supabase:', error);
        });
      });

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    if (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem('solaire_sim_user', JSON.stringify(MOCK_USER));
      localStorage.setItem('solaire_sim_empresa', JSON.stringify(MOCK_EMPRESA));
      localStorage.setItem('solaire_sim_logged_in', 'true');

      setUserData(MOCK_USER);
      setEmpresaData(MOCK_EMPRESA);
      setUser(localAppUser(MOCK_USER));
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        throw normalizeAuthError(error);
      }

      if (data.user) {
        setUser(toAppUser(data.user));
        await loadSupabaseProfile(data.user.id);
      }

      setLoading(false);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const storedAccountsStr = localStorage.getItem('solaire_sim_accounts');
        const accounts: RegisterData[] = storedAccountsStr ? JSON.parse(storedAccountsStr) : [];

        const matchedAccount = accounts.find(
          (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
        );

        const loginUsuario = matchedAccount
          ? {
              id: 'uid_' + matchedAccount.email.replace(/[^a-zA-Z0-9]/g, ''),
              empresaId: 'emp_' + matchedAccount.nomeEmpresa.replace(/[^a-zA-Z0-9]/g, ''),
              nome: matchedAccount.nome,
              email: matchedAccount.email,
              role: 'admin' as const,
              criadoEm: new Date().toISOString(),
            }
          : email.toLowerCase() === 'admin@solaire.com.br' && password === '123456'
            ? MOCK_USER
            : null;

        if (!loginUsuario) {
          setLoading(false);
          reject({ code: 'auth/wrong-password', message: 'E-mail ou senha inválidos' });
          return;
        }

        const loginEmpresa: Empresa = matchedAccount
          ? {
              id: loginUsuario.empresaId,
              nomeFantasia: matchedAccount.nomeEmpresa,
              razaoSocial: matchedAccount.nomeEmpresa + ' LTDA',
              cnpj: matchedAccount.cnpj,
              email: matchedAccount.email,
              telefone: '',
              endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: 'RS' },
              responsavelTecnico: { nome: matchedAccount.nome, crea: matchedAccount.crea, cpf: '' },
              criadoEm: new Date().toISOString(),
            }
          : MOCK_EMPRESA;

        localStorage.setItem('solaire_sim_user', JSON.stringify(loginUsuario));
        localStorage.setItem('solaire_sim_empresa', JSON.stringify(loginEmpresa));
        localStorage.setItem('solaire_sim_logged_in', 'true');

        setUserData(loginUsuario);
        setEmpresaData(loginEmpresa);
        setUser(localAppUser(loginUsuario));
        setLoading(false);
        resolve();
      }, 400);
    });
  };

  const register = async (data: RegisterData) => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            nomeEmpresa: data.nomeEmpresa,
            cnpj: data.cnpj,
            crea: data.crea,
          },
        },
      });

      if (error) {
        setLoading(false);
        throw normalizeAuthError(error);
      }

      if (!signUpData.session || !signUpData.user) {
        setLoading(false);
        const pending = new Error('Cadastro criado. Confirme seu e-mail antes de entrar.') as Error & { code?: string };
        pending.code = 'auth/email-not-confirmed';
        throw pending;
      }

      setUser(toAppUser(signUpData.user));
      await loadSupabaseProfile(signUpData.user.id);
      setLoading(false);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const storedAccountsStr = localStorage.getItem('solaire_sim_accounts');
        const accounts: RegisterData[] = storedAccountsStr ? JSON.parse(storedAccountsStr) : [];

        if (accounts.some((acc) => acc.email.toLowerCase() === data.email.toLowerCase())) {
          setLoading(false);
          reject({ code: 'auth/email-already-in-use', message: 'E-mail já registrado' });
          return;
        }

        accounts.push(data);
        localStorage.setItem('solaire_sim_accounts', JSON.stringify(accounts));

        const userSim: Usuario = {
          id: 'uid_' + data.email.replace(/[^a-zA-Z0-9]/g, ''),
          empresaId: 'emp_' + data.nomeEmpresa.replace(/[^a-zA-Z0-9]/g, ''),
          nome: data.nome,
          email: data.email,
          role: 'admin',
          criadoEm: new Date().toISOString(),
        };

        const empresaSim: Empresa = {
          id: userSim.empresaId,
          nomeFantasia: data.nomeEmpresa,
          razaoSocial: data.nomeEmpresa + ' LTDA',
          cnpj: data.cnpj,
          email: data.email,
          telefone: '',
          endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: 'RS' },
          responsavelTecnico: { nome: data.nome, crea: data.crea, cpf: '' },
          criadoEm: new Date().toISOString(),
        };

        localStorage.setItem('solaire_sim_user', JSON.stringify(userSim));
        localStorage.setItem('solaire_sim_empresa', JSON.stringify(empresaSim));
        localStorage.setItem('solaire_sim_logged_in', 'true');

        setUserData(userSim);
        setEmpresaData(empresaSim);
        setUser(localAppUser(userSim));
        setLoading(false);
        resolve();
      }, 500);
    });
  };

  const logout = async () => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('solaire_sim_user');
      localStorage.removeItem('solaire_sim_empresa');
      localStorage.removeItem('solaire_sim_logged_in');
    }

    setUser(null);
    setUserData(null);
    setEmpresaData(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, userData, empresaData, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
