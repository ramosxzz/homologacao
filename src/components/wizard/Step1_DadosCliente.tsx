'use client';

import React, { useState, useRef } from 'react';
import { useProjeto } from '@/contexts/ProjetoContext';
import { createWorker } from 'tesseract.js';
import { Upload, Sun, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { formatarCPF, formatarCNPJ, formatarTelefone } from '@/lib/validators';
import { parseFaturaText } from '@/lib/faturaParser';
import { extractPdfText } from '@/lib/pdfText';

export default function Step1_DadosCliente() {
  const { state, dispatch } = useProjeto();
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState<boolean | null>(null);
  const [ocrError, setOcrError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cliente, unidadeConsumidora, distribuidora } = state;

  const handleClienteChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_CLIENTE',
      payload: { [field]: value }
    });
  };

  const handleUcChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_UC',
      payload: { [field]: value }
    });
  };

  // Masked Inputs
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 11) {
      handleClienteChange('cpfCnpj', formatarCPF(rawValue));
    } else {
      handleClienteChange('cpfCnpj', formatarCNPJ(rawValue.slice(0, 14)));
    }
  };

  const handlePhoneChange = (field: 'telefone' | 'celular', value: string) => {
    handleClienteChange(field, formatarTelefone(value));
  };

  // Tesseract OCR for images and browser-side PDF parsing for Cloudflare deploys.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Save reference URL
    const fileUrl = URL.createObjectURL(file);
    handleUcChange('faturaUrl', fileUrl);

    setOcrLoading(true);
    setOcrSuccess(null);
    setOcrError('');

    // PDF parsing runs in the browser because Cloudflare Workers cannot execute pdftotext.
    if (file.type === 'application/pdf') {
      try {
        const text = await extractPdfText(file);
        const data = parseFaturaText(text);

        if (!('error' in data)) {
          const d = data;
          
          if (d.distribuidora) {
            dispatch({ type: 'SET_DISTRIBUIDORA', payload: d.distribuidora });
          }
          
          const clientePayload: Record<string, string> = {};
          if (d.nome) clientePayload.nome = d.nome;
          if (d.cpfCnpj && !d.cpfCnpj.includes('*')) {
            clientePayload.cpfCnpj = d.cpfCnpj;
          }
          if (Object.keys(clientePayload).length > 0) {
            dispatch({ type: 'UPDATE_CLIENTE', payload: clientePayload });
          }

          const ucPayload: Record<string, string> = {};
          if (d.codigoUC) ucPayload.codigo = d.codigoUC;
          if (d.contaContrato) ucPayload.contaContrato = d.contaContrato;
          if (d.classe) ucPayload.classe = d.classe;
          if (d.tipoConexao) ucPayload.tipoConexao = d.tipoConexao;
          if (d.tensaoAtendimento) ucPayload.tensaoAtendimento = d.tensaoAtendimento;
          if (d.consumoMedio) ucPayload.consumoMedio = d.consumoMedio;
          if (Object.keys(ucPayload).length > 0) {
            dispatch({ type: 'UPDATE_UC', payload: ucPayload });
          }

          const endPayload: Record<string, string> = {};
          if (d.cep) endPayload.cep = d.cep;
          if (d.logradouro) endPayload.logradouro = d.logradouro;
          if (d.numero) endPayload.numero = d.numero;
          if (d.bairro) endPayload.bairro = d.bairro;
          if (d.cidade) endPayload.cidade = d.cidade;
          if (d.uf) endPayload.uf = d.uf;
          if (Object.keys(endPayload).length > 0) {
            dispatch({ type: 'UPDATE_ENDERECO', payload: endPayload });
          }

          setOcrSuccess(true);
        } else {
          throw new Error(data.error || 'Erro desconhecido');
        }
      } catch (err) {
        console.error('PDF text extraction error:', err);
        setOcrError(err instanceof Error ? err.message : 'Falha ao ler o PDF.');
        setOcrSuccess(false);
      } finally {
        setOcrLoading(false);
      }
    } else if (file.type.startsWith('image/')) {
      try {
        const worker = await createWorker('por');

        const ret = await worker.recognize(file);
        const text = ret.data.text;
        await worker.terminate();

        console.log('OCR Extracted Text:', text);

        // Fill client name
        const nameRegex = /(?:cliente|titular|nome)[\s:]+([A-ZÀ-Ú][A-ZÀ-Ú\s]{5,50})/i;
        const nameMatch = text.match(nameRegex);
        if (nameMatch && nameMatch[1]) {
          handleClienteChange('nome', nameMatch[1].trim());
        }

        setOcrSuccess(true);
      } catch (err) {
        console.error('Tesseract OCR error:', err);
        setOcrError(err instanceof Error ? err.message : 'Falha no OCR da imagem.');
        setOcrSuccess(false);
      } finally {
        setOcrLoading(false);
      }
    } else {
      setOcrSuccess(false);
      setOcrLoading(false);
      alert('Por favor, faça upload de uma imagem ou um arquivo PDF.');
    }
  };

  return (
    <div className="tab-pane page-enter">
      {/* 1. SELEÇÃO DE DISTRIBUIDORA */}
      <div className="wizard-section">
        <h3 className="wizard-section-title">Distribuidora de Energia</h3>
        <p className="wizard-section-description mb-6">
          Selecione a concessionária de energia para a qual o projeto será homologado. Isso aplicará as regras técnicas correspondentes.
        </p>

        <div className="distribuidora-toggle-group">
          {/* CEEE */}
          <button
            type="button"
            className={`distribuidora-option ceee ${distribuidora === 'CEEE' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_DISTRIBUIDORA', payload: 'CEEE' })}
          >
            <div className="distribuidora-logo ceee-logo">
              <Sun size={24} className="text-white" />
            </div>
            <div className="distribuidora-info">
              <span className="distribuidora-name">CEEE Equatorial</span>
              <span className="distribuidora-desc">Norma NT.00020.EQTL</span>
            </div>
            {distribuidora === 'CEEE' && <CheckCircle2 className="active-badge" size={20} />}
          </button>

          {/* RGE */}
          <button
            type="button"
            className={`distribuidora-option rge ${distribuidora === 'RGE' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_DISTRIBUIDORA', payload: 'RGE' })}
          >
            <div className="distribuidora-logo rge-logo">
              <Sun size={24} className="text-white" />
            </div>
            <div className="distribuidora-info">
              <span className="distribuidora-name">RGE Sul (CPFL)</span>
              <span className="distribuidora-desc">Norma GED 15303</span>
            </div>
            {distribuidora === 'RGE' && <CheckCircle2 className="active-badge" size={20} />}
          </button>
        </div>
      </div>

      {/* 2. UPLOAD DA FATURA COM LEITURA AUTOMÁTICA */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title flex items-center gap-2">
          Upload da Fatura de Energia
          <span className="premium-badge-pill">
            <Sparkles size={12} />
            Leitura IA (OCR)
          </span>
        </h3>
        <p className="wizard-section-description">
          Faça upload da conta de luz do cliente para referência. Em caso de imagem, o sistema tentará extrair o nome automaticamente. Os demais dados devem ser preenchidos manualmente.
        </p>

        <div 
          className={`file-upload-dropzone mt-4 ${ocrLoading ? 'scanning' : ''} ${ocrSuccess ? 'success' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {ocrLoading ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-amber-500" size={40} />
              <div className="text-center">
                <span className="file-upload-text block font-semibold text-slate-200">Escanerizando fatura...</span>
                <span className="file-upload-hint text-xs text-slate-400">Extraindo nome, documentos e código UC.</span>
              </div>
            </div>
          ) : ocrSuccess ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="text-emerald-400 animate-bounce" size={40} />
              <div className="text-center">
                <span className="file-upload-text block font-semibold text-emerald-400">Leitura Concluída com Sucesso!</span>
                <span className="file-upload-hint text-xs text-slate-400">Dados principais preenchidos. Revise os campos antes de avançar.</span>
              </div>
            </div>
          ) : ocrSuccess === false ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="upload-icon-wrapper">
                <Upload size={28} className="text-rose-400" />
              </div>
              <div className="text-center">
                <span className="file-upload-text block font-semibold text-rose-400">
                  Não foi possível ler a fatura
                </span>
                <span className="file-upload-hint text-xs text-slate-400">
                  {ocrError || 'Verifique se o PDF é a fatura original (não escaneada).'} Clique para tentar outro arquivo.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="upload-icon-wrapper">
                <Upload size={28} className="text-amber-500" />
              </div>
              <div className="text-center">
                <span className="file-upload-text block font-semibold text-slate-200">
                  Clique ou arraste a conta de energia
                </span>
                <span className="file-upload-hint text-xs text-slate-500">
                  Formatos aceitos: PDF, PNG, JPG (Máx. 10MB)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. DADOS DO TITULAR */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">Dados do Titular da Conta</h3>
        <p className="wizard-section-description mb-6">
          Dados cadastrais do cliente conforme registrado na concessionária.
        </p>

        <div className="form-layout">
          <div className="form-group full-width">
            <label className="form-label required">Nome Completo / Razão Social</label>
            <input
              type="text"
              placeholder="Ex: João da Silva Moura"
              className="form-input"
              value={cliente.nome}
              onChange={(e) => handleClienteChange('nome', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">CPF ou CNPJ</label>
              <input
                type="text"
                placeholder="Ex: 000.000.000-00"
                className="form-input"
                value={cliente.cpfCnpj}
                onChange={handleCpfCnpjChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Identidade / RG</label>
              <input
                type="text"
                placeholder="Nº do documento"
                className="form-input"
                value={cliente.rg}
                onChange={(e) => handleClienteChange('rg', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">E-mail de Contato</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                className="form-input"
                value={cliente.email}
                onChange={(e) => handleClienteChange('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Celular (com WhatsApp)</label>
              <input
                type="text"
                placeholder="(51) 99999-9999"
                className="form-input"
                value={cliente.celular}
                onChange={(e) => handlePhoneChange('celular', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. DADOS DA UNIDADE CONSUMIDORA */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">Dados da Unidade Consumidora (UC)</h3>
        <p className="wizard-section-description mb-6">
          Informações elétricas e contratuais retiradas da fatura de energia.
        </p>

        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Código da UC (Nº Instalação)</label>
              <input
                type="text"
                placeholder="Ex: 10023910"
                className="form-input font-mono"
                value={unidadeConsumidora.codigo}
                onChange={(e) => handleUcChange('codigo', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Nº Conta Contrato</label>
              <input
                type="text"
                placeholder="Ex: 81294819"
                className="form-input font-mono"
                value={unidadeConsumidora.contaContrato}
                onChange={(e) => handleUcChange('contaContrato', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Classe de Consumo</label>
              <select
                className="form-select"
                value={unidadeConsumidora.classe}
                onChange={(e) => handleUcChange('classe', e.target.value)}
              >
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
                <option value="industrial">Industrial</option>
                <option value="rural">Rural</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Conexão (Fases)</label>
              <select
                className="form-select"
                value={unidadeConsumidora.tipoConexao}
                onChange={(e) => handleUcChange('tipoConexao', e.target.value)}
              >
                <option value="monofasica">Monofásica (2 fios)</option>
                <option value="bifasica">Bifásica (3 fios)</option>
                <option value="trifasica">Trifásica (4 fios)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tensão de Atendimento</label>
              <select
                className="form-select"
                value={unidadeConsumidora.tensaoAtendimento}
                onChange={(e) => handleUcChange('tensaoAtendimento', e.target.value)}
              >
                {distribuidora === 'CEEE' ? (
                  <>
                    <option value="127/220V">127/220 V</option>
                    <option value="220/380V">220/380 V</option>
                    <option value="220V">220 V</option>
                  </>
                ) : (
                  <>
                    <option value="220V">220 V</option>
                    <option value="220/380V">220/380 V</option>
                    <option value="127/220V">127/220 V</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Ramal de Entrada</label>
              <select
                className="form-select"
                value={unidadeConsumidora.tipoRamal}
                onChange={(e) => handleUcChange('tipoRamal', e.target.value)}
              >
                <option value="aereo">Aéreo</option>
                <option value="subterraneo">Subterrâneo</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Carga Instalada Disponível (kW)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 15.4"
                className="form-input"
                value={unidadeConsumidora.cargaInstalada}
                onChange={(e) => handleUcChange('cargaInstalada', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consumo Médio Anual (kWh/mês)</label>
              <input
                type="number"
                placeholder="Ex: 650"
                className="form-input"
                value={unidadeConsumidora.consumoMedio}
                onChange={(e) => handleUcChange('consumoMedio', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
