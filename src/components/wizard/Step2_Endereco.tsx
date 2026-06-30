'use client';

import React, { useState } from 'react';
import { useProjeto } from '@/contexts/ProjetoContext';
import dynamic from 'next/dynamic';
import { Navigation, Loader2 } from 'lucide-react';
import { formatarCEP } from '@/lib/validators';

// Dynamically import the leaflet map component (turns off SSR)
const MapComponent = dynamic(() => import('../map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-800/40 rounded-2xl border border-slate-800 flex items-center justify-center flex-col gap-3">
      <Loader2 className="animate-spin text-amber-500" size={32} />
      <span className="text-sm text-slate-400">Carregando mapa interativo...</span>
    </div>
  ),
});

export default function Step2_Endereco() {
  const { state, dispatch } = useProjeto();
  const [cepLoading, setCepLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { endereco, localizacao } = state;

  const handleEnderecoChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_ENDERECO',
      payload: { [field]: value }
    });
  };

  const handleLocalizacaoChange = (field: string, value: string | number) => {
    dispatch({
      type: 'UPDATE_LOCALIZACAO',
      payload: { [field]: value }
    });
  };

  // Masked CEP change
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 8);
    handleEnderecoChange('cep', formatarCEP(raw));
  };

  // Fetch address from ViaCEP
  const handleCepBlur = async () => {
    const rawCep = endereco.cep.replace(/\D/g, '');
    if (rawCep.length !== 8) return;

    setCepLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErrorMsg('CEP não encontrado.');
        setCepLoading(false);
        return;
      }

      dispatch({
        type: 'UPDATE_ENDERECO',
        payload: {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || 'RS',
        }
      });

      // Geocodifica com o número já preenchido (se houver)
      geocodeAddress(data.logradouro, endereco.numero, data.localidade, data.uf);

    } catch (error) {
      console.error('ViaCEP fetch error:', error);
      setErrorMsg('Erro ao buscar CEP. Preencha manualmente.');
    } finally {
      setCepLoading(false);
    }
  };

  // Geocodifica com Nominatim incluindo número para máxima precisão
  const geocodeAddress = async (
    logradouro: string,
    numero: string,
    cidade: string,
    uf: string
  ) => {
    if (!logradouro || !cidade) return;
    setGeoLoading(true);

    // Monta query com número quando disponível (muito mais preciso)
    const baseQuery = numero
      ? `${logradouro}, ${numero}, ${cidade}, ${uf}, Brasil`
      : `${logradouro}, ${cidade}, ${uf}, Brasil`;

    try {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?address=${encodeURIComponent(baseQuery)}&region=br&language=pt-BR&key=${key}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        handleLocalizacaoChange('latitude', lat);
        handleLocalizacaoChange('longitude', lng);
      } else if (data.status && data.status !== 'OK') {
        console.warn('Google Geocoding:', data.status, data.error_message);
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    } finally {
      setGeoLoading(false);
    }
  };

  // Dispara geocode quando o número é preenchido (máxima precisão)
  const handleManualGeocode = () => {
    if (endereco.logradouro && endereco.cidade) {
      geocodeAddress(endereco.logradouro, endereco.numero, endereco.cidade, endereco.uf);
    }
  };

  // Hint de endereço completo para a barra de busca do mapa
  const addressHint = endereco.logradouro || endereco.cidade
    ? [
        endereco.logradouro,
        endereco.numero,
        endereco.cidade,
        endereco.uf,
      ].filter(Boolean).join(', ')
    : '';

  const handleLocationSelect = (lat: number, lng: number) => {
    handleLocalizacaoChange('latitude', lat);
    handleLocalizacaoChange('longitude', lng);
  };

  return (
    <div className="tab-pane page-enter">
      {/* 1. ENDEREÇO DA INSTALAÇÃO */}
      <div className="wizard-section">
        <h3 className="wizard-section-title flex items-center justify-between">
          Endereço do Local de Instalação
          {cepLoading && (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-normal">
              <Loader2 className="animate-spin" size={14} />
              Buscando endereço...
            </span>
          )}
        </h3>
        <p className="wizard-section-description mb-6">
          Preencha o CEP para carregar o endereço automaticamente. Certifique-se de que os dados estão corretos.
        </p>

        {errorMsg && (
          <div className="error-message-box mb-4">
            <span className="error-text text-sm">{errorMsg}</span>
          </div>
        )}

        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">CEP</label>
              <input
                type="text"
                placeholder="Ex: 90000-000"
                className="form-input font-mono"
                value={endereco.cep}
                onChange={handleCepChange}
                onBlur={handleCepBlur}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Número</label>
              <input
                type="text"
                placeholder="Ex: 120"
                className="form-input"
                value={endereco.numero}
                onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                onBlur={handleManualGeocode}
                required
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label className="form-label required">Logradouro / Avenida</label>
            <input
              type="text"
              placeholder="Rua, Avenida, Travessa..."
              className="form-input"
              value={endereco.logradouro}
              onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
              onBlur={handleManualGeocode}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Complemento</label>
              <input
                type="text"
                placeholder="Apto, Bloco, Fundos..."
                className="form-input"
                value={endereco.complemento}
                onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Bairro</label>
              <input
                type="text"
                placeholder="Nome do bairro"
                className="form-input"
                value={endereco.bairro}
                onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Cidade</label>
              <input
                type="text"
                placeholder="Porto Alegre, Caxias..."
                className="form-input"
                value={endereco.cidade}
                onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                onBlur={handleManualGeocode}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Estado (UF)</label>
              <select
                className="form-select"
                value={endereco.uf}
                onChange={(e) => handleEnderecoChange('uf', e.target.value)}
              >
                <option value="RS">Rio Grande do Sul (RS)</option>
                <option value="SC">Santa Catarina (SC)</option>
                <option value="PR">Paraná (PR)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOCALIZAÇÃO DO TELHADO NO MAPA */}
      <div className="wizard-section mt-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="wizard-section-title">Localização no Mapa</h3>
          {geoLoading && (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-normal">
              <Loader2 className="animate-spin" size={12} />
              Geocodificando endereço...
            </span>
          )}
        </div>
        <p className="wizard-section-description mb-4">
          O mapa foi centralizado no endereço preenchido. Clique com precisão no <strong>telhado da unidade consumidora</strong> para posicionar o pin de geolocalização (latitude/longitude do local de instalação).
        </p>

        {/* Dynamic Leaflet Map Component */}
        <div className="w-full h-[480px] rounded-2xl overflow-hidden shadow-2xl relative mb-4">
          <MapComponent
            latitude={localizacao.latitude}
            longitude={localizacao.longitude}
            onLocationSelect={handleLocationSelect}
            addressHint={addressHint}
          />
        </div>

        <div className="form-row mt-4">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              type="text"
              readOnly
              className="form-input font-mono bg-slate-800/40 text-slate-400"
              value={localizacao.latitude.toFixed(6)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              type="text"
              readOnly
              className="form-input font-mono bg-slate-800/40 text-slate-400"
              value={localizacao.longitude.toFixed(6)}
            />
          </div>
        </div>
      </div>

      {/* 3. DADOS DO TELHADO */}
      <div className="wizard-section mt-8">
        <h3 className="wizard-section-title">Características do Telhado</h3>
        <p className="wizard-section-description mb-6">
          Informe as especificações do telhado onde as placas fotovoltaicas serão fixadas. Esses dados calculam o sombreamento e geração.
        </p>

        <div className="form-layout">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Estrutura / Telhado</label>
              <select
                className="form-select"
                value={localizacao.tipoTelhado}
                onChange={(e) => handleLocalizacaoChange('tipoTelhado', e.target.value)}
              >
                <option value="ceramico">Cerâmico (Telha de barro)</option>
                <option value="fibrocimento">Fibrocimento (Eternit/Amianto)</option>
                <option value="metalico">Estrutura Metálica (Zinco/Alumínio)</option>
                <option value="laje">Laje plana de concreto</option>
                <option value="solo">Fixação direta em Solo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Área Disponível para Placas (m²)</label>
              <input
                type="number"
                placeholder="Ex: 45"
                className="form-input"
                value={localizacao.areaTelhado}
                onChange={(e) => handleLocalizacaoChange('areaTelhado', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label flex items-center justify-between">
                Inclinação do Telhado (graus)
                <span className="text-xs text-slate-500 font-normal">Padrão RS: ~20°</span>
              </label>
              <input
                type="number"
                min="0"
                max="90"
                placeholder="Ex: 20"
                className="form-input"
                value={localizacao.inclinacaoTelhado}
                onChange={(e) => handleLocalizacaoChange('inclinacaoTelhado', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center justify-between">
                Orientação Azimutal (graus)
                <span className="text-xs text-slate-500 font-normal">Norte = 0°, Sul = 180°</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Navigation size={16} style={{ transform: `rotate(${localizacao.orientacaoTelhado}deg)` }} className="text-amber-500 transition-transform" />
                </span>
                <input
                  type="number"
                  min="0"
                  max="360"
                  placeholder="Ex: 0 (Norte)"
                  className="form-input pl-10"
                  value={localizacao.orientacaoTelhado}
                  onChange={(e) => handleLocalizacaoChange('orientacaoTelhado', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
