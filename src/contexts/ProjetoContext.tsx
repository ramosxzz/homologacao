'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { Projeto, Distribuidora, ClasseUC, TipoConexao, TipoRamal, TipoTelhado, ModalidadeCompensacao } from '@/types/projeto';
import { validarCPF, validarCNPJ, validarEmail } from '@/lib/validators';

export interface StringConfigState {
  modulosEmSerie: string;
  stringsParalelo: string;
  mpptIndex: number;
}

export interface BeneficiarioState {
  nome: string;
  cpfCnpj: string;
  codigoUC: string;
  percentual: string;
}

export interface ProjetoState {
  currentStep: number; // 0-3
  distribuidora: Distribuidora;
  cliente: {
    nome: string;
    cpfCnpj: string;
    rg: string;
    email: string;
    telefone: string;
    celular: string;
  };
  unidadeConsumidora: {
    codigo: string;
    contaContrato: string;
    classe: string;
    tipoConexao: string;
    tensaoAtendimento: string;
    cargaInstalada: string;
    consumoMedio: string;
    demandaCarga: string;
    tipoRamal: string;
    faturaUrl: string;
  };
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  localizacao: {
    latitude: number;
    longitude: number;
    orientacaoTelhado: number;
    inclinacaoTelhado: number;
    areaTelhado: string;
    tipoTelhado: string;
  };
  sistemaFV: {
    moduloId: string;
    moduloFabricante: string;
    moduloModelo: string;
    moduloPotencia: number;
    quantidadeModulos: string;
    potenciaInstalada: number;
    
    inversorId: string;
    inversorFabricante: string;
    inversorModelo: string;
    inversorPotencia: number;
    quantidadeInversores: string;
    
    strings: StringConfigState[];
    disjuntorGeracao: string;
    dpsCC: string;
    dpsCA: string;
  };
  compensacao: {
    modalidade: string;
    beneficiarios: BeneficiarioState[];
  };
}

const initialState: ProjetoState = {
  currentStep: 0,
  distribuidora: 'CEEE',
  cliente: {
    nome: '',
    cpfCnpj: '',
    rg: '',
    email: '',
    telefone: '',
    celular: '',
  },
  unidadeConsumidora: {
    codigo: '',
    contaContrato: '',
    classe: 'residencial',
    tipoConexao: 'trifasica',
    tensaoAtendimento: '220/380V',
    cargaInstalada: '',
    consumoMedio: '',
    demandaCarga: '',
    tipoRamal: 'aereo',
    faturaUrl: '',
  },
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'RS',
  },
  localizacao: {
    latitude: -30.0346, // Default Porto Alegre lat
    longitude: -51.2177, // Default Porto Alegre lng
    orientacaoTelhado: 0, // Azimuth 0 (North in South hemisphere is usually optimal, but 0 Azimuth = North)
    inclinacaoTelhado: 20, // 20 degrees standard
    areaTelhado: '',
    tipoTelhado: 'ceramico',
  },
  sistemaFV: {
    moduloId: '',
    moduloFabricante: '',
    moduloModelo: '',
    moduloPotencia: 0,
    quantidadeModulos: '',
    potenciaInstalada: 0,
    
    inversorId: '',
    inversorFabricante: '',
    inversorModelo: '',
    inversorPotencia: 0,
    quantidadeInversores: '1',
    
    strings: [
      { modulosEmSerie: '', stringsParalelo: '1', mpptIndex: 0 }
    ],
    disjuntorGeracao: '32A',
    dpsCC: 'Classe II',
    dpsCA: 'Classe II',
  },
  compensacao: {
    modalidade: 'geracao_local',
    beneficiarios: [],
  },
};

type Action =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_DISTRIBUIDORA'; payload: Distribuidora }
  | { type: 'UPDATE_CLIENTE'; payload: Partial<ProjetoState['cliente']> }
  | { type: 'UPDATE_UC'; payload: Partial<ProjetoState['unidadeConsumidora']> }
  | { type: 'UPDATE_ENDERECO'; payload: Partial<ProjetoState['endereco']> }
  | { type: 'UPDATE_LOCALIZACAO'; payload: Partial<ProjetoState['localizacao']> }
  | { type: 'UPDATE_SISTEMA_FV'; payload: Partial<ProjetoState['sistemaFV']> }
  | { type: 'UPDATE_COMPENSACAO'; payload: Partial<ProjetoState['compensacao']> }
  | { type: 'LOAD_PROJETO'; payload: ProjetoState }
  | { type: 'RESET' };

function projetoReducer(state: ProjetoState, action: Action): ProjetoState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_DISTRIBUIDORA':
      return { ...state, distribuidora: action.payload };
    case 'UPDATE_CLIENTE':
      return { ...state, cliente: { ...state.cliente, ...action.payload } };
    case 'UPDATE_UC':
      return { ...state, unidadeConsumidora: { ...state.unidadeConsumidora, ...action.payload } };
    case 'UPDATE_ENDERECO':
      return { ...state, endereco: { ...state.endereco, ...action.payload } };
    case 'UPDATE_LOCALIZACAO':
      return { ...state, localizacao: { ...state.localizacao, ...action.payload } };
    case 'UPDATE_SISTEMA_FV': {
      const updatedFV = { ...state.sistemaFV, ...action.payload };
      // Auto-calculate potenciaInstalada
      if (action.payload.quantidadeModulos !== undefined || action.payload.moduloPotencia !== undefined) {
        const qty = parseFloat(updatedFV.quantidadeModulos) || 0;
        updatedFV.potenciaInstalada = (qty * updatedFV.moduloPotencia) / 1000;
      }
      return { ...state, sistemaFV: updatedFV };
    }
    case 'UPDATE_COMPENSACAO':
      return { ...state, compensacao: { ...state.compensacao, ...action.payload } };
    case 'LOAD_PROJETO':
      return action.payload;
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ProjetoContextType {
  state: ProjetoState;
  dispatch: React.Dispatch<Action>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canAdvance: (step: number) => { valido: boolean; erros: string[] };
}

const ProjetoContext = createContext<ProjetoContextType | undefined>(undefined);

export function ProjetoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projetoReducer, initialState);

  const nextStep = () => {
    const { valido } = canAdvance(state.currentStep);
    if (valido && state.currentStep < 3) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    // Basic guard: can only jump backwards or to the next step if current is valid
    if (step < state.currentStep) {
      dispatch({ type: 'SET_STEP', payload: step });
    } else if (step === state.currentStep + 1) {
      nextStep();
    }
  };

  const canAdvance = (step: number): { valido: boolean; erros: string[] } => {
    const erros: string[] = [];

    if (step === 0) {
      // Step 1: Client details validation
      if (!state.cliente.nome.trim()) erros.push('Nome do cliente é obrigatório.');
      
      const rawCpfCnpj = state.cliente.cpfCnpj.replace(/\D/g, '');
      if (!rawCpfCnpj) {
        erros.push('CPF ou CNPJ é obrigatório.');
      } else if (rawCpfCnpj.length === 11) {
        if (!validarCPF(rawCpfCnpj)) erros.push('CPF inválido.');
      } else if (rawCpfCnpj.length === 14) {
        if (!validarCNPJ(rawCpfCnpj)) erros.push('CNPJ inválido.');
      } else {
        erros.push('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.');
      }

      if (state.cliente.email.trim() && !validarEmail(state.cliente.email)) {
        erros.push('E-mail do cliente inválido.');
      }

      if (!state.unidadeConsumidora.codigo.trim()) erros.push('Código da Unidade Consumidora é obrigatório.');
      if (!state.unidadeConsumidora.contaContrato.trim()) erros.push('Conta Contrato é obrigatória.');
    }

    if (step === 1) {
      // Step 2: Address validation
      if (!state.endereco.cep.trim()) erros.push('CEP é obrigatório.');
      if (!state.endereco.logradouro.trim()) erros.push('Logradouro é obrigatório.');
      if (!state.endereco.numero.trim()) erros.push('Número é obrigatório.');
      if (!state.endereco.bairro.trim()) erros.push('Bairro é obrigatório.');
      if (!state.endereco.cidade.trim()) erros.push('Cidade é obrigatória.');
      if (!state.localizacao.latitude || !state.localizacao.longitude) {
        erros.push('Por favor, marque a localização no mapa.');
      }
    }

    if (step === 2) {
      // Step 3: Technical Details validation
      if (!state.sistemaFV.moduloId) erros.push('Selecione um módulo fotovoltaico.');
      if (!state.sistemaFV.quantidadeModulos || parseInt(state.sistemaFV.quantidadeModulos) <= 0) {
        erros.push('Informe uma quantidade válida de módulos.');
      }
      
      if (!state.sistemaFV.inversorId) erros.push('Selecione um inversor.');
      if (!state.sistemaFV.quantidadeInversores || parseInt(state.sistemaFV.quantidadeInversores) <= 0) {
        erros.push('Informe uma quantidade válida de inversores.');
      }

      // Check string validation
      let totalModulesInStrings = 0;
      state.sistemaFV.strings.forEach((str, i) => {
        const series = parseInt(str.modulosEmSerie) || 0;
        const parallel = parseInt(str.stringsParalelo) || 0;
        totalModulesInStrings += series * parallel;
        
        if (series <= 0) {
          erros.push(`String ${i + 1}: Módulos em série deve ser maior que 0.`);
        }
        if (parallel <= 0) {
          erros.push(`String ${i + 1}: Strings em paralelo deve ser maior que 0.`);
        }
      });

      const totalTarget = parseInt(state.sistemaFV.quantidadeModulos) || 0;
      if (totalTarget > 0 && totalModulesInStrings !== totalTarget) {
        erros.push(
          `Configuração de strings incorreta: total de módulos nas strings (${totalModulesInStrings}) ` +
          `não bate com a quantidade total de módulos selecionada (${totalTarget}).`
        );
      }

      // If remote compensation, validate beneficiaries percentage
      if (state.compensacao.modalidade === 'autoconsumo_remoto' || state.compensacao.modalidade === 'geracao_compartilhada') {
        if (state.compensacao.beneficiarios.length === 0) {
          erros.push('Adicione pelo menos um beneficiário para esta modalidade.');
        } else {
          let sum = 0;
          state.compensacao.beneficiarios.forEach((b, i) => {
            const perc = parseFloat(b.percentual) || 0;
            sum += perc;
            if (!b.nome.trim()) erros.push(`Beneficiário ${i + 1}: Nome é obrigatório.`);
            if (!b.codigoUC.trim()) erros.push(`Beneficiário ${i + 1}: Código da UC é obrigatório.`);
            if (perc <= 0) erros.push(`Beneficiário ${i + 1}: Percentual deve ser maior que 0%.`);
          });
          if (Math.abs(sum - 100) > 0.01) {
            erros.push(`A soma das porcentagens dos beneficiários deve ser exatamente 100% (atual: ${sum}%).`);
          }
        }
      }
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  };

  return (
    <ProjetoContext.Provider value={{ state, dispatch, nextStep, prevStep, goToStep, canAdvance }}>
      {children}
    </ProjetoContext.Provider>
  );
}

export function useProjeto() {
  const context = useContext(ProjetoContext);
  if (context === undefined) {
    throw new Error('useProjeto deve ser usado dentro de um ProjetoProvider');
  }
  return context;
}
