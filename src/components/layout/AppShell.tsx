'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { Loader2 } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white flex-col gap-4">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <span className="text-sm font-medium tracking-wider text-slate-400">Carregando painel...</span>
      </div>
    );
  }

  const userName = userData?.nome || user.displayName || 'Engenheiro';
  const userEmail = user.email || '';

  return (
    <div className="app-layout">
      <Sidebar userName={userName} userEmail={userEmail} onLogout={handleLogout} />
      <main className="app-main">{children}</main>
    </div>
  );
}
