'use client';

import React from 'react';
import { ProjetoProvider } from '@/contexts/ProjetoContext';
import WizardContainer from '@/components/wizard/WizardContainer';

export default function NovoProjetoPage() {
  return (
    <ProjetoProvider>
      <div className="novo-projeto-container page-enter">
        <div className="novo-projeto-header">
          <h1 className="page-title">Novo Projeto</h1>
          <p className="page-subtitle">Complete as etapas para gerar a homologação e os documentos oficiais.</p>
        </div>

        {/* Wizard multi-aba */}
        <WizardContainer />
      </div>
    </ProjetoProvider>
  );
}
