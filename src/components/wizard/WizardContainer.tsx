'use client';

import React, { useState } from 'react';
import { useProjeto } from '@/contexts/ProjetoContext';
import { useAuth } from '@/contexts/AuthContext';
import { shouldUseSupabaseData } from '@/lib/supabase';
import { insertProjeto } from '@/lib/supabaseData';
import StepIndicator from './StepIndicator';
import Step1_DadosCliente from './Step1_DadosCliente';
import Step2_Endereco from './Step2_Endereco';
import Step3_DadosTecnicos from './Step3_DadosTecnicos';
import Step4_Documentos from './Step4_Documentos';
import { ArrowLeft, ArrowRight, Save, AlertCircle, Check, Loader2 } from 'lucide-react';

export default function WizardContainer() {
  const { state, nextStep, prevStep } = useProjeto();
  const { userData } = useAuth();

  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { currentStep, distribuidora, cliente, unidadeConsumidora, endereco, localizacao, sistemaFV, compensacao } = state;

  const renderActiveStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1_DadosCliente />;
      case 1:
        return <Step2_Endereco />;
      case 2:
        return <Step3_DadosTecnicos />;
      case 3:
        return <Step4_Documentos />;
      default:
        return <Step1_DadosCliente />;
    }
  };

  const handleNextClick = () => {
    setErrors([]);
    
    // Run context check
    const stepValidation = state.currentStep === 0
      ? validateStep0()
      : state.currentStep === 1
      ? validateStep1()
      : state.currentStep === 2
      ? validateStep2()
      : { valido: true, erros: [] };

    if (!stepValidation.valido) {
      setErrors(stepValidation.erros);
      return;
    }

    nextStep();
  };

  const validateStep0 = () => {
    const list: string[] = [];
    if (!cliente.nome.trim()) list.push('Nome do Cliente é obrigatório.');
    return { valido: list.length === 0, erros: list };
  };

  const validateStep1 = () => {
    const list: string[] = [];
    if (!endereco.cep.trim()) list.push('CEP é obrigatório.');
    if (!endereco.numero.trim()) list.push('Número da residência é obrigatório.');
    if (!endereco.logradouro.trim()) list.push('Logradouro é obrigatório.');
    if (!endereco.bairro.trim()) list.push('Bairro é obrigatório.');
    if (!endereco.cidade.trim()) list.push('Cidade é obrigatória.');
    return { valido: list.length === 0, erros: list };
  };

  const validateStep2 = () => {
    const list: string[] = [];
    if (!sistemaFV.moduloId) list.push('Selecione um fabricante e modelo de módulo.');
    if (!sistemaFV.quantidadeModulos || parseInt(sistemaFV.quantidadeModulos) <= 0) list.push('Informe a quantidade de módulos.');
    if (!sistemaFV.inversorId) list.push('Selecione um fabricante e modelo de inversor.');
    if (!sistemaFV.quantidadeInversores || parseInt(sistemaFV.quantidadeInversores) <= 0) list.push('Informe a quantidade de inversores.');
    
    let totalStringsModules = 0;
    sistemaFV.strings.forEach(s => {
      const series = parseInt(s.modulosEmSerie) || 0;
      const parallel = parseInt(s.stringsParalelo) || 0;
      totalStringsModules += series * parallel;
    });

    const targetQty = parseInt(sistemaFV.quantidadeModulos) || 0;
    if (targetQty > 0 && totalStringsModules !== targetQty) {
      list.push(`Total de módulos nas strings (${totalStringsModules}) difere da quantidade total de módulos (${targetQty}).`);
    }

    return { valido: list.length === 0, erros: list };
  };

  // Draft Save Handler
  const handleSaveDraft = async () => {
    if (!userData?.empresaId) return;
    setDraftSaving(true);
    setDraftSuccess(false);

    try {
      const draftPayload = {
        empresaId: userData.empresaId,
        usuarioId: userData.id,
        status: 'rascunho' as const,
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
          moduloId: sistemaFV.moduloId,
          moduloFabricante: sistemaFV.moduloFabricante,
          moduloModelo: sistemaFV.moduloModelo,
          moduloPotencia: sistemaFV.moduloPotencia,
          quantidadeModulos: parseInt(sistemaFV.quantidadeModulos) || 0,
          potenciaInstalada: sistemaFV.potenciaInstalada,
          inversorId: sistemaFV.inversorId,
          inversorFabricante: sistemaFV.inversorFabricante,
          inversorModelo: sistemaFV.inversorModelo,
          inversorPotencia: sistemaFV.inversorPotencia,
          quantidadeInversores: parseInt(sistemaFV.quantidadeInversores) || 0,
          strings: sistemaFV.strings.map(s => ({
            modulosEmSerie: parseInt(s.modulosEmSerie) || 0,
            stringsParalelo: parseInt(s.stringsParalelo) || 0,
            mpptIndex: s.mpptIndex
          })),
          disjuntorGeracao: sistemaFV.disjuntorGeracao,
          dpsCC: sistemaFV.dpsCC,
          dpsCA: sistemaFV.dpsCA,
        },
        compensacao: {
          modalidade: compensacao.modalidade,
          beneficiarios: compensacao.beneficiarios.map(b => ({
            ...b,
            percentual: parseFloat(b.percentual) || 0
          }))
        },
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        documentosGerados: []
      };

      if (shouldUseSupabaseData()) {
        await insertProjeto(draftPayload);
      } else {
        // ═════════════════════════════════════════════════════════════════════════
        // LOCAL SIMULATION SAVE DRAFT
        // ═════════════════════════════════════════════════════════════════════════
        const storedStr = localStorage.getItem('solaire_sim_projects');
        const list = storedStr ? JSON.parse(storedStr) : [];
        
        const simPayload = {
          id: 'proj_' + Math.random().toString(36).substr(2, 9),
          ...draftPayload
        };
        
        list.push(simPayload);
        localStorage.setItem('solaire_sim_projects', JSON.stringify(list));
      }

      setDraftSuccess(true);
      setTimeout(() => {
        setDraftSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      alert('Erro ao salvar rascunho. Verifique sua conexão.');
    } finally {
      setDraftSaving(false);
    }
  };

  return (
    <div className="wizard-container">
      {/* Dynamic Stepper */}
      <StepIndicator />

      {/* Warning Box */}
      {errors.length > 0 && (
        <div className="validation-alert validation-alert-danger">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <div>
            <span className="font-bold block mb-1">Por favor, resolva os seguintes problemas antes de prosseguir:</span>
            <ul className="list-disc pl-4 flex flex-col gap-0.5">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Main active tab panel wrapper */}
      <div className="wizard-content">
        {renderActiveStep()}
      </div>

      {/* Wizard Footer Controls */}
      <div className="wizard-footer">
        <div>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < 3 && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-secondary flex items-center gap-2"
              disabled={draftSaving || !userData}
            >
              {draftSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : draftSuccess ? (
                <Check className="text-emerald-400" size={18} />
              ) : (
                <Save size={18} />
              )}
              {draftSuccess ? 'Rascunho Salvo' : 'Salvar Rascunho'}
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextClick}
              className="btn btn-primary flex items-center gap-2"
            >
              Próximo Passo
              <ArrowRight size={18} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
