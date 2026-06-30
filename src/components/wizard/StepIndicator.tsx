'use client';

import React from 'react';
import { useProjeto } from '@/contexts/ProjetoContext';
import { FileText, MapPin, Zap, FileOutput } from 'lucide-react';

export default function StepIndicator() {
  const { state, goToStep } = useProjeto();
  const currentStep = state.currentStep;

  const steps = [
    {
      index: 0,
      label: 'Dados do Cliente',
      icon: FileText,
      description: 'Titular e Consumo',
    },
    {
      index: 1,
      label: 'Endereço e Telhado',
      icon: MapPin,
      description: 'Localização e Mapa',
    },
    {
      index: 2,
      label: 'Dados Técnicos',
      icon: Zap,
      description: 'Equipamentos e Strings',
    },
    {
      index: 3,
      label: 'Documentos',
      icon: FileOutput,
      description: 'Geração e Impressão',
    },
  ];

  return (
    <div className="stepper-container mb-8">
      <div className="stepper">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.index < currentStep;
          const isActive = step.index === currentStep;
          
          return (
            <React.Fragment key={step.index}>
              {/* Stepper Step */}
              <div 
                className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => goToStep(step.index)}
              >
                <div className="stepper-circle">
                  {isCompleted ? (
                    <span className="stepper-check font-bold">✓</span>
                  ) : (
                    <Icon size={18} className="stepper-icon" />
                  )}
                </div>
                <div className="stepper-info">
                  <span className="stepper-label">{step.label}</span>
                  <span className="stepper-desc">{step.description}</span>
                </div>
              </div>
              
              {/* Connector line between steps */}
              {step.index < 3 && (
                <div className={`stepper-line ${step.index < currentStep ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
