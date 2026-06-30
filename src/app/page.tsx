'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Sun } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white flex-col gap-6">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
          <Sun size={48} className="text-amber-500" />
        </div>
        <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
          Solaire
        </span>
      </div>
      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        <Loader2 className="animate-spin text-amber-500" size={20} />
        Direcionando para o portal...
      </div>
    </div>
  );
}
