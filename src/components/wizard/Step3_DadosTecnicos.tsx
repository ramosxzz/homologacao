'use client';

import React, { useState, useEffect } from 'react';
import { useProjeto } from '@/contexts/ProjetoContext';
import { modulos } from '@/data/modulos';
import { inversores } from '@/data/inversores';
import { validarConfiguracao, formatarCNPJ, formatarCPF } from '@/lib/validators';
import { 
  Zap, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Award, 
  ShieldCheck, 
  PlusCircle, 
  Percent 
} from 'lucide-react';

export default function Step3_DadosTecnicos() {
  const { state, dispatch } = useProjeto();
  const { sistemaFV, compensacao } = state;

  const [moduloFabricantes, setModuloFabricantes] = useState<string[]>([]);
  const [inversorFabricantes, setInversorFabricantes] = useState<string[]>([]);

  // Unique manufacturers lists
  useEffect(() => {
    const modFabs = Array.from(new Set(modulos.map(m => m.fabricante)));
    const invFabs = Array.from(new Set(inversores.map(i => i.fabricante)));
    setModuloFabricantes(modFabs);
    setInversorFabricantes(invFabs);
  }, []);

  // Filtered equipment models
  const filteredModulos = modulos.filter(m => m.fabricante === sistemaFV.moduloFabricante);
  const filteredInversores = inversores.filter(i => i.fabricante === sistemaFV.inversorFabricante);

  const selectedModulo = modulos.find(m => m.id === sistemaFV.moduloId);
  const selectedInversor = inversores.find(i => i.id === sistemaFV.inversorId);

  // Validation state
  const [valResult, setValResult] = useState<{ valido: boolean; erros: string[] }>({ valido: true, erros: [] });

  useEffect(() => {
    if (selectedInversor && selectedModulo && sistemaFV.strings.length > 0) {
      // Map StringConfigState to StringConfig expected by validator
      const mappedStrings = sistemaFV.strings.map(s => ({
        modulosEmSerie: parseInt(s.modulosEmSerie) || 0,
        stringsParalelo: parseInt(s.stringsParalelo) || 0,
        mpptIndex: s.mpptIndex
      }));
      
      const res = validarConfiguracao(mappedStrings, selectedInversor, selectedModulo);
      setValResult(res);
    } else {
      setValResult({ valido: true, erros: [] });
    }
  }, [sistemaFV.strings, sistemaFV.moduloId, sistemaFV.inversorId, selectedInversor, selectedModulo]);

  // Handlers for modules
  const handleModuloFabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fab = e.target.value;
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: { moduloFabricante: fab, moduloId: '', moduloModelo: '', moduloPotencia: 0 }
    });
  };

  const handleModuloModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mId = e.target.value;
    const mod = modulos.find(m => m.id === mId);
    if (mod) {
      dispatch({
        type: 'UPDATE_SISTEMA_FV',
        payload: { moduloId: mId, moduloModelo: mod.modelo, moduloPotencia: mod.potencia }
      });
    }
  };

  const handleModuloQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: { quantidadeModulos: e.target.value }
    });
  };

  // Handlers for inverters
  const handleInversorFabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fab = e.target.value;
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: { inversorFabricante: fab, inversorId: '', inversorModelo: '', inversorPotencia: 0 }
    });
  };

  const handleInversorModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iId = e.target.value;
    const inv = inversores.find(i => i.id === iId);
    if (inv) {
      dispatch({
        type: 'UPDATE_SISTEMA_FV',
        payload: { inversorId: iId, inversorModelo: inv.modelo, inversorPotencia: inv.potenciaNominal }
      });
    }
  };

  const handleInversorQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: { quantidadeInversores: e.target.value }
    });
  };

  // String Setup Handlers
  const handleAddString = () => {
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: {
        strings: [...sistemaFV.strings, { modulosEmSerie: '', stringsParalelo: '1', mpptIndex: 0 }]
      }
    });
  };

  const handleRemoveString = (index: number) => {
    const nextStrings = [...sistemaFV.strings];
    nextStrings.splice(index, 1);
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: { strings: nextStrings }
    });
  };

  const handleStringChange = (index: number, field: string, value: any) => {
    const nextStrings = [...sistemaFV.strings];
    nextStrings[index] = { ...nextStrings[index], [field]: value };
    dispatch({
      type: 'UPDATE_SISTEMA_FV',
      payload: { strings: nextStrings }
    });
  };

  // Beneficiaries Handlers
  const handleAddBeneficiario = () => {
    dispatch({
      type: 'UPDATE_COMPENSACAO',
      payload: {
        beneficiarios: [...compensacao.beneficiarios, { nome: '', cpfCnpj: '', codigoUC: '', percentual: '' }]
      }
    });
  };

  const handleRemoveBeneficiario = (index: number) => {
    const nextBen = [...compensacao.beneficiarios];
    nextBen.splice(index, 1);
    dispatch({
      type: 'UPDATE_COMPENSACAO',
      payload: { beneficiarios: nextBen }
    });
  };

  const handleBeneficiarioChange = (index: number, field: string, value: string) => {
    const nextBen = [...compensacao.beneficiarios];
    
    // Mask CPF/CNPJ
    let formattedVal = value;
    if (field === 'cpfCnpj') {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 11) {
        formattedVal = formatarCPF(digits);
      } else {
        formattedVal = formatarCNPJ(digits.slice(0, 14));
      }
    }

    nextBen[index] = { ...nextBen[index], [field]: formattedVal };
    dispatch({
      type: 'UPDATE_COMPENSACAO',
      payload: { beneficiarios: nextBen }
    });
  };

  // Sum of percentages checks
  const sumPercentage = compensacao.beneficiarios.reduce((acc, b) => acc + (parseFloat(b.percentual) || 0), 0);

  return (
    <div className="tab-pane page-enter">
      {/* 1. MÓDULOS FOTOVOLTAICOS */}
      <div className="wizard-section">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <h3 className="wizard-section-title">1. Módulos Fotovoltaicos</h3>
          {sistemaFV.potenciaInstalada > 0 && (
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase block font-semibold">Potência Total</span>
              <span className="text-xl font-bold text-amber-500">{sistemaFV.potenciaInstalada.toFixed(2)} kWp</span>
            </div>
          )}
        </div>

        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Fabricante do Módulo</label>
              <select
                className="form-select"
                value={sistemaFV.moduloFabricante}
                onChange={handleModuloFabChange}
              >
                <option value="">Selecione...</option>
                {moduloFabricantes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Modelo do Módulo</label>
              <select
                className="form-select"
                value={sistemaFV.moduloId}
                onChange={handleModuloModelChange}
                disabled={!sistemaFV.moduloFabricante}
              >
                <option value="">Selecione...</option>
                {filteredModulos.map(m => <option key={m.id} value={m.id}>{m.modelo} ({m.potencia}Wp)</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Quantidade de Módulos</label>
              <input
                type="number"
                placeholder="Ex: 26"
                className="form-input"
                value={sistemaFV.quantidadeModulos}
                onChange={handleModuloQtyChange}
              />
            </div>
          </div>
        </div>

        {/* Selected Module Specs Card */}
        {selectedModulo && (
          <div className="equipment-specs-card mt-6">
            <div className="specs-card-header flex items-center justify-between mb-4">
              <div className="specs-card-title flex items-center gap-2">
                <div className="specs-card-icon-container">
                  <Zap size={16} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{selectedModulo.modelo}</h4>
                  <span className="text-xs text-slate-400">{selectedModulo.fabricante}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={selectedModulo.datasheetUrl || `https://www.google.com/search?q=${encodeURIComponent(selectedModulo.fabricante + ' ' + selectedModulo.modelo + ' datasheet filetype:pdf')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs flex items-center gap-1"
                >
                  <FileText size={12} />
                  Datasheet
                </a>
                <a
                  href={selectedModulo.certificadoUrl || `https://www.google.com/search?q=${encodeURIComponent(selectedModulo.fabricante + ' ' + selectedModulo.modelo + ' certificado inmetro')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs flex items-center gap-1"
                >
                  <Award size={12} />
                  INMETRO
                </a>
              </div>
            </div>

            <div className="specs-card-grid grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="spec-item">
                <span className="spec-label">Potência Nominal (Pmax)</span>
                <span className="spec-value">{selectedModulo.potencia} Wp</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Tensão Circ. Aberto (Voc)</span>
                <span className="spec-value">{selectedModulo.voc} V</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Tensão Máx. Pot. (Vmp)</span>
                <span className="spec-value">{selectedModulo.vmp} V</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Corrente Curto-Circ. (Isc)</span>
                <span className="spec-value">{selectedModulo.isc} A</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Corrente Máx. Pot. (Imp)</span>
                <span className="spec-value">{selectedModulo.imp} A</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Eficiência Módulo</span>
                <span className="spec-value">{selectedModulo.eficiencia} %</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Tecnologia</span>
                <span className="spec-value">{selectedModulo.tecnologia}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Dimensões (CxLxA)</span>
                <span className="spec-value">
                  {selectedModulo.dimensoes.comprimento}x{selectedModulo.dimensoes.largura}x{selectedModulo.dimensoes.altura} mm
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. INVERSORES */}
      <div className="wizard-section mt-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <h3 className="wizard-section-title">2. Inversor Fotovoltaico</h3>
        </div>

        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Fabricante do Inversor</label>
              <select
                className="form-select"
                value={sistemaFV.inversorFabricante}
                onChange={handleInversorFabChange}
              >
                <option value="">Selecione...</option>
                {inversorFabricantes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Modelo do Inversor</label>
              <select
                className="form-select"
                value={sistemaFV.inversorId}
                onChange={handleInversorModelChange}
                disabled={!sistemaFV.inversorFabricante}
              >
                <option value="">Selecione...</option>
                {filteredInversores.map(i => <option key={i.id} value={i.id}>{i.modelo} ({i.potenciaNominal} kW)</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Quantidade de Inversores</label>
              <input
                type="number"
                placeholder="Ex: 1"
                className="form-input"
                value={sistemaFV.quantidadeInversores}
                onChange={handleInversorQtyChange}
              />
            </div>
          </div>
        </div>

        {/* Selected Inverter Specs Card */}
        {selectedInversor && (
          <div className="equipment-specs-card mt-6">
            <div className="specs-card-header flex items-center justify-between mb-4">
              <div className="specs-card-title flex items-center gap-2">
                <div className="specs-card-icon-container">
                  <Zap size={16} className="text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{selectedInversor.modelo}</h4>
                  <span className="text-xs text-slate-400">{selectedInversor.fabricante}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={selectedInversor.datasheetUrl || `https://www.google.com/search?q=${encodeURIComponent(selectedInversor.fabricante + ' ' + selectedInversor.modelo + ' datasheet filetype:pdf')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs flex items-center gap-1"
                >
                  <FileText size={12} />
                  Datasheet
                </a>
                <a
                  href={selectedInversor.certificadoUrl || `https://www.google.com/search?q=${encodeURIComponent(selectedInversor.fabricante + ' ' + selectedInversor.modelo + ' certificado inmetro registro')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs flex items-center gap-1"
                >
                  <Award size={12} />
                  Certificado
                </a>
              </div>
            </div>

            <div className="specs-card-grid grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="spec-item">
                <span className="spec-label">Potência Nominal CA</span>
                <span className="spec-value">{selectedInversor.potenciaNominal} kW</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Máx. Potência CC Entrada</span>
                <span className="spec-value">{selectedInversor.potenciaMaxCC} kW</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Tensão Máx. Entrada CC</span>
                <span className="spec-value">{selectedInversor.tensaoMaxEntrada} V</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Nº de MPPTs</span>
                <span className="spec-value">{selectedInversor.numMPPTs} MPPT(s)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Faixa Operação MPPT</span>
                <span className="spec-value">{selectedInversor.faixaTensaoMPPT.min}V - {selectedInversor.faixaTensaoMPPT.max}V</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Entradas por MPPT</span>
                <span className="spec-value">{selectedInversor.entradasPorMPPT}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Tensão de Saída CA</span>
                <span className="spec-value">{selectedInversor.tensaoSaida} V</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Grau de Proteção</span>
                <span className="spec-value">{selectedInversor.grauProtecao}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CONFIGURAÇÃO DE STRINGS */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">3. Arranjo de Módulos (Configuração de Strings)</h3>
        <p className="wizard-section-description mb-6">
          Distribua as placas solares selecionadas nos MPPTs do inversor.
        </p>

        <div className="strings-list flex flex-col gap-4">
          {sistemaFV.strings.map((str, index) => (
            <div key={index} className="string-item-row flex flex-wrap md:flex-nowrap items-end gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/20">
              <div className="form-group flex-1">
                <label className="form-label text-xs">Tracker MPPT</label>
                <select
                  className="form-select text-xs"
                  value={str.mpptIndex}
                  onChange={(e) => handleStringChange(index, 'mpptIndex', parseInt(e.target.value) || 0)}
                >
                  {selectedInversor ? (
                    Array.from({ length: selectedInversor.numMPPTs }).map((_, i) => (
                      <option key={i} value={i}>MPPT {i + 1}</option>
                    ))
                  ) : (
                    <option value={0}>MPPT 1</option>
                  )}
                </select>
              </div>

              <div className="form-group flex-1">
                <label className="form-label text-xs">Módulos em Série (por String)</label>
                <input
                  type="number"
                  placeholder="Ex: 13"
                  className="form-input text-xs"
                  value={str.modulosEmSerie}
                  onChange={(e) => handleStringChange(index, 'modulosEmSerie', e.target.value)}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label text-xs">Strings em Paralelo</label>
                <input
                  type="number"
                  placeholder="Ex: 1"
                  className="form-input text-xs"
                  value={str.stringsParalelo}
                  onChange={(e) => handleStringChange(index, 'stringsParalelo', e.target.value)}
                />
              </div>

              {/* Remove button */}
              {sistemaFV.strings.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveString(index)}
                  className="btn btn-secondary border border-red-500/20 text-red-400 hover:bg-red-500/10 p-3 flex items-center justify-center rounded-xl"
                  title="Remover String"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddString}
            className="btn btn-secondary text-xs flex items-center gap-1 self-start"
            disabled={!selectedInversor}
          >
            <Plus size={14} />
            Adicionar String
          </button>
        </div>

        {/* Live Validation Alert Container */}
        {selectedInversor && selectedModulo && (
          <div className={`mt-6 p-4 rounded-xl border flex gap-3 ${valResult.valido ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="validation-icon-wrapper mt-0.5">
              {valResult.valido ? (
                <CheckCircle2 className="text-emerald-400" size={20} />
              ) : (
                <AlertTriangle className="text-red-400" size={20} />
              )}
            </div>
            <div>
              <h4 className={`text-sm font-bold ${valResult.valido ? 'text-emerald-400' : 'text-red-400'}`}>
                {valResult.valido ? 'Configuração Elétrica Válida' : 'Conflito de Dimensionamento Elétrico'}
              </h4>
              
              {valResult.valido ? (
                <p className="text-xs text-slate-400 mt-1">
                  A quantidade, tensão e corrente estão perfeitamente dimensionadas para os limites operacionais do inversor.
                </p>
              ) : (
                <ul className="list-disc pl-4 text-xs text-red-300 mt-2 flex flex-col gap-1">
                  {valResult.erros.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. PROTEÇÃO */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">4. Elementos de Proteção e Disjuntores</h3>
        <p className="wizard-section-description mb-6">
          Disjuntores e DPS para o quadro elétrico de geração fotovoltaica.
        </p>

        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Disjuntor de Saída CA</label>
              <select
                className="form-select"
                value={sistemaFV.disjuntorGeracao}
                onChange={(e) => dispatch({ type: 'UPDATE_SISTEMA_FV', payload: { disjuntorGeracao: e.target.value } })}
              >
                <option value="16A">16 A</option>
                <option value="20A">20 A</option>
                <option value="25A">25 A</option>
                <option value="32A">32 A</option>
                <option value="40A">40 A</option>
                <option value="50A">50 A</option>
                <option value="63A">63 A</option>
                <option value="80A">80 A</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">DPS de Corrente Contínua (CC)</label>
              <input
                type="text"
                className="form-input"
                value={sistemaFV.dpsCC}
                onChange={(e) => dispatch({ type: 'UPDATE_SISTEMA_FV', payload: { dpsCC: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">DPS de Corrente Alternada (CA)</label>
              <input
                type="text"
                className="form-input"
                value={sistemaFV.dpsCA}
                onChange={(e) => dispatch({ type: 'UPDATE_SISTEMA_FV', payload: { dpsCA: e.target.value } })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODALIDADE DE COMPENSAÇÃO */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">5. Modalidade de Compensação de Créditos</h3>
        <p className="wizard-section-description mb-6">
          Como os créditos excedentes gerados pelo sistema serão utilizados.
        </p>

        <div className="distribuidora-toggle-group">
          <button
            type="button"
            className={`distribuidora-option flex-1 ceee ${compensacao.modalidade === 'geracao_local' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_COMPENSACAO', payload: { modalidade: 'geracao_local', beneficiarios: [] } })}
          >
            <div className="distribuidora-info text-center w-full">
              <span className="distribuidora-name block text-sm font-bold">Autoconsumo Local</span>
              <span className="distribuidora-desc block text-xs">Créditos consumidos na própria UC</span>
            </div>
          </button>

          <button
            type="button"
            className={`distribuidora-option flex-1 rge ${compensacao.modalidade === 'autoconsumo_remoto' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_COMPENSACAO', payload: { modalidade: 'autoconsumo_remoto' } })}
          >
            <div className="distribuidora-info text-center w-full">
              <span className="distribuidora-name block text-sm font-bold">Autoconsumo Remoto</span>
              <span className="distribuidora-desc block text-xs">Créditos divididos com outras UCs do mesmo CPF/CNPJ</span>
            </div>
          </button>

          <button
            type="button"
            className={`distribuidora-option flex-1 rge ${compensacao.modalidade === 'geracao_compartilhada' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_COMPENSACAO', payload: { modalidade: 'geracao_compartilhada' } })}
          >
            <div className="distribuidora-info text-center w-full">
              <span className="distribuidora-name block text-sm font-bold">Geração Compartilhada</span>
              <span className="distribuidora-desc block text-xs">Cooperativa ou Consórcio de múltiplos titulares</span>
            </div>
          </button>
        </div>

        {/* Beneficiaries Section for Remote Compensation */}
        {(compensacao.modalidade === 'autoconsumo_remoto' || compensacao.modalidade === 'geracao_compartilhada') && (
          <div className="beneficiaries-container mt-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-200">Distribuição de Créditos (Beneficiários)</h4>
              <div className="text-right">
                <span className="text-xs text-slate-500 block font-semibold">Total Dividido</span>
                <span className={`text-sm font-bold ${Math.abs(sumPercentage - 100) < 0.01 ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {sumPercentage.toFixed(1)}% / 100%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {compensacao.beneficiarios.map((ben, idx) => (
                <div key={idx} className="beneficiary-row flex flex-wrap md:flex-nowrap items-end gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/20">
                  <div className="form-group flex-[2]">
                    <label className="form-label text-[11px] text-slate-400">Nome do Beneficiário</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      className="form-input text-xs"
                      value={ben.nome}
                      onChange={(e) => handleBeneficiarioChange(idx, 'nome', e.target.value)}
                    />
                  </div>

                  <div className="form-group flex-[1.5]">
                    <label className="form-label text-[11px] text-slate-400">CPF ou CNPJ</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      className="form-input text-xs font-mono"
                      value={ben.cpfCnpj}
                      onChange={(e) => handleBeneficiarioChange(idx, 'cpfCnpj', e.target.value)}
                    />
                  </div>

                  <div className="form-group flex-[1.5]">
                    <label className="form-label text-[11px] text-slate-400">Código UC do Beneficiário</label>
                    <input
                      type="text"
                      placeholder="Ex: 10023812"
                      className="form-input text-xs font-mono"
                      value={ben.codigoUC}
                      onChange={(e) => handleBeneficiarioChange(idx, 'codigoUC', e.target.value)}
                    />
                  </div>

                  <div className="form-group flex-[1]">
                    <label className="form-label text-[11px] text-slate-400 flex items-center justify-between">
                      Percentual
                      <Percent size={10} className="text-amber-500" />
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 25.5"
                      className="form-input text-xs text-right font-semibold text-amber-500"
                      value={ben.percentual}
                      onChange={(e) => handleBeneficiarioChange(idx, 'percentual', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBeneficiario(idx)}
                    className="btn btn-secondary border border-red-500/20 text-red-400 hover:bg-red-500/10 p-2.5 flex items-center justify-center rounded-xl"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddBeneficiario}
                className="btn btn-secondary text-xs flex items-center gap-1 self-start mt-2"
              >
                <PlusCircle size={14} />
                Adicionar UC Beneficiária
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
