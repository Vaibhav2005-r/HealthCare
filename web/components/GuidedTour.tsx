'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  MapPin, 
  TrendingUp, 
  Building2, 
  AlertOctagon, 
  Database,
  CheckCircle2
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

interface TourStep {
  tab: NavTab;
  badge: string;
  title: string;
  description: string;
  highlightIcon: any;
  bulletPoints: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    tab: 'overview',
    badge: 'Step 1 of 5 • Executive Intelligence',
    title: '14-Day LSTM Outbreak Forecasting',
    description: 'The core AI engine predicts epidemic trajectory 7–14 days in advance by correlating ground-truth ASHA field reports with IMD precipitation telemetry.',
    highlightIcon: TrendingUp,
    bulletPoints: [
      'Visual disambiguation: Ground truth (solid red) vs. LSTM projection (dashed amber).',
      'Model confidence metrics: R² = 0.91, MAE = 3.2 cases/day.',
      'Suspected pathogen breakdown with proportional share indicators.'
    ]
  },
  {
    tab: 'heatmap',
    badge: 'Step 2 of 5 • GIS Spatial Surveillance',
    title: 'Centroid Heatmaps & Hotspot Radii',
    description: 'High-contrast Leaflet GIS map with dynamic choropleth polygon fills and pulsating emergency centroids for critical outbreak clusters.',
    highlightIcon: MapPin,
    bulletPoints: [
      'Explicit on-map risk threshold legend (Critical ≥0.75, High, Moderate, Low).',
      'Interactive district cards with rainfall, humidity, and active ASHA density.',
      'Direct rapid containment protocol dispatch actions.'
    ]
  },
  {
    tab: 'districts',
    badge: 'Step 3 of 5 • District Intelligence',
    title: 'Tabular Monitoring & Environmental Telemetry',
    description: 'Sortable, searchable operational matrix across all monitored districts with monospace aligned metrics and exportable CSV/Excel reports.',
    highlightIcon: Building2,
    bulletPoints: [
      'Standardized right-aligned numbers with uniform decimal precision.',
      'Consolidated weather metrics (Rainfall mm & Relative Humidity %).',
      'Direct district inspection modal with historical trend curves.'
    ]
  },
  {
    tab: 'alerts',
    badge: 'Step 4 of 5 • Incident Command & State Machine',
    title: '4-Stage Alert Lifecycle & Immutable Audit Trail',
    description: 'State surveillance dispatch queue tracking field worker SOS alerts and ML-detected spatial spikes with verifiable officer sign-offs.',
    highlightIcon: AlertOctagon,
    bulletPoints: [
      'Visual 4-stage stepper: Detected → Acknowledged → Response/Buffer → Resolved.',
      'Live simulation of mobile app ASHA emergency SOS broadcast.',
      'Immutable audit history recording officer credentials and resolution notes.'
    ]
  },
  {
    tab: 'rag',
    badge: 'Step 5 of 5 • Clinical AI Assistant',
    title: 'Qdrant Vector RAG & LLaMA 3.1 Guidance',
    description: 'Surveillance officers and ASHA workers query official IDSP circulars and clinical SOPs with direct verifiable source citations.',
    highlightIcon: Database,
    bulletPoints: [
      'PDF guideline ingestion and semantic vector indexing in Qdrant Cloud.',
      'Instant clinical directives for acute conditions (Cholera, Dengue, Malaria).',
      'Full source transparency with document metadata and confidence scores.'
    ]
  }
];

export function GuidedTour({ isOpen, onClose, onNavigateTab }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.highlightIcon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      onNavigateTab(TOUR_STEPS[nextIdx].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      onNavigateTab(TOUR_STEPS[prevIdx].tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#F6F5F2] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2255C] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C2255C]">
                {step.badge}
              </span>
              <h3 className="text-sm font-extrabold text-[#1D2321]">
                Arogya Prahari Presentation Walkthrough
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5B6663] hover:text-[#1D2321] hover:bg-[#EAE8E3] rounded-lg transition-colors"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#F6F5F2] border border-[#E2E8F0] text-[#C2255C] mt-0.5">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1D2321]">
                {step.title}
              </h4>
              <p className="text-xs text-[#5B6663] mt-1 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Key Feature Bullets */}
          <div className="p-3.5 bg-[#F6F5F2]/80 border border-[#E2E8F0] rounded-xl space-y-2 text-xs">
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#1D2321] block">
              Key Capabilities Demonstrated:
            </span>
            {step.bulletPoints.map((bullet, i) => (
              <div key={i} className="flex items-start gap-2 text-[#1D2321]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#146356] shrink-0 mt-0.5" />
                <span className="leading-tight">{bullet}</span>
              </div>
            ))}
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  onNavigateTab(s.tab);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-[#C2255C]' : 'w-2 bg-[#E2E8F0] hover:bg-[#CBD5E1]'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-[#F6F5F2] border-t border-[#E2E8F0] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#5B6663] hover:text-[#1D2321] disabled:opacity-40 disabled:hover:text-[#5B6663] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Feature'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
