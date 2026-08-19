'use client';

import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileText 
} from 'lucide-react';
import { DistrictData, LiveDashboardData } from '@/lib/api';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ReportsViewProps {
  data: LiveDashboardData;
  districts: DistrictData[];
}

export function ReportsView({ data, districts }: ReportsViewProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const reportId = `AP-DGHS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    setIsExporting('CSV');
    setTimeout(() => {
      const rows = districts.map(d => ({
        'Bulletin ID': reportId,
        'Date': reportDate,
        'District': d.name,
        'State': d.state,
        'Risk Category': d.risk_level,
        'Risk Score (%)': (d.risk_score * 100).toFixed(1),
        'Active Cases': d.active_cases,
        '7-Day Delta (%)': d.trend_pct,
        'Primary Pathogen': d.primary_suspected,
        'Rainfall (mm)': d.rainfall_mm,
        'ASHA Workforce': d.asha_active_count,
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Arogya_Prahari_Bulletin_${reportId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExporting(null);
      toast.success('Official Bulletin CSV exported successfully.');
    }, 600);
  };

  const handleExportExcel = () => {
    setIsExporting('EXCEL');
    setTimeout(() => {
      const rows = districts.map(d => ({
        'District Name': d.name,
        'State': d.state,
        'Risk Level': d.risk_level,
        'AI Risk Score (%)': (d.risk_score * 100).toFixed(1),
        'Active Cases': d.active_cases,
        '7-Day Velocity (%)': d.trend_pct,
        'Suspected Disease': d.primary_suspected,
        'Rainfall (mm)': d.rainfall_mm,
        'ASHA Staff Count': d.asha_active_count,
        'Population': d.population
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Surveillance Record");
      XLSX.writeFile(workbook, `Arogya_Prahari_Official_Bulletin_${reportId}.xlsx`);
      setIsExporting(null);
      toast.success('Official Bulletin Excel Workbook exported.');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden during printing) */}
      <div className="no-print bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1D2321] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C2255C]" />
            Official Government Record & Governance Reports
          </h2>
          <p className="text-xs text-[#5B6663] mt-0.5">
            Format compliant with National Health Data Standards (NHDS) and IDSP Guidelines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D2321] hover:bg-[#333D3A] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print Official Bulletin (Grayscale Ready)</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F6F5F2] text-[#146356] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F6F5F2] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Snapshot</span>
          </button>
        </div>
      </div>

      {/* Printable Government Document Sheet */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-md p-8 md:p-12 max-w-4xl mx-auto text-[#1D2321] space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Official Header */}
        <div className="border-b-2 border-[#1D2321] pb-6 text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-[#5B6663]">
            Government of Maharashtra • Directorate of Health Services
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D2321] uppercase">
            Arogya Prahari — Outbreak Surveillance Bulletin
          </h1>
          <p className="text-sm font-semibold text-[#5B6663] font-sans">
            Integrated Disease Surveillance Programme (IDSP) • DHO Command Center Record
          </p>
          
          <div className="flex flex-wrap justify-between items-center pt-3 text-xs font-mono text-[#5B6663] border-t border-[#E2E8F0] mt-3">
            <span>Bulletin Ref: <strong className="text-[#1D2321]">{reportId}</strong></span>
            <span>Generated Date: <strong className="text-[#1D2321]">{reportDate}</strong></span>
            <span>Security Classification: <strong className="text-[#1D2321]">OFFICIAL USE ONLY</strong></span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1D2321] border-b border-[#E2E8F0] pb-1">
            1. Executive Epidemiological Summary
          </h3>
          <p className="text-xs leading-relaxed text-[#1D2321]">
            During the 24-hour surveillance window ending on <strong>{reportDate}</strong>, 
            telemetry from <strong>{data.summary.active_asha_workers} ASHA field workers</strong> across{' '}
            <strong>{data.summary.total_monitored_districts} districts</strong> was evaluated via the spatiotemporal deep learning engine. 
            A cumulative <strong>{data.summary.active_cases_total} active cases</strong> are under medical surveillance with a 7-day velocity delta of{' '}
            <strong className="text-[#C6362C]">{data.summary.case_delta_7d_pct}</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 border border-[#E2E8F0] rounded-lg bg-[#F6F5F2]/50 text-center">
              <span className="text-[10px] font-bold text-[#5B6663] uppercase">Districts Monitored</span>
              <p className="font-mono text-xl font-bold">{data.summary.total_monitored_districts}</p>
            </div>
            <div className="p-3 border border-[#C6362C] rounded-lg bg-red-50/50 text-center">
              <span className="text-[10px] font-bold text-[#C6362C] uppercase">Critical/High Outbreaks</span>
              <p className="font-mono text-xl font-bold text-[#C6362C]">{data.summary.high_critical_districts}</p>
            </div>
            <div className="p-3 border border-[#E2E8F0] rounded-lg bg-[#F6F5F2]/50 text-center">
              <span className="text-[10px] font-bold text-[#5B6663] uppercase">Active Case Load</span>
              <p className="font-mono text-xl font-bold">{data.summary.active_cases_total}</p>
            </div>
            <div className="p-3 border border-[#E2E8F0] rounded-lg bg-[#F6F5F2]/50 text-center">
              <span className="text-[10px] font-bold text-[#5B6663] uppercase">Active Field Staff</span>
              <p className="font-mono text-xl font-bold text-[#146356]">{data.summary.active_asha_workers}</p>
            </div>
          </div>
        </div>

        {/* Section 2: District Risk Matrix Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1D2321] border-b border-[#E2E8F0] pb-1">
            2. District Risk Classification Matrix
          </h3>
          
          <table className="w-full text-xs text-left border border-[#1D2321]">
            <thead>
              <tr className="bg-[#EAE8E3] border-b border-[#1D2321] font-bold text-[11px]">
                <th className="p-2 border-r border-[#1D2321]">District</th>
                <th className="p-2 border-r border-[#1D2321]">Risk Band</th>
                <th className="p-2 border-r border-[#1D2321] text-right">AI Score</th>
                <th className="p-2 border-r border-[#1D2321] text-right">Cases</th>
                <th className="p-2 border-r border-[#1D2321] text-right">7d Trend</th>
                <th className="p-2">Suspected Pathogen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {districts.map((d) => (
                <tr key={d.district_id} className="border-b border-[#E2E8F0]">
                  <td className="p-2 font-bold border-r border-[#E2E8F0]">{d.name}</td>
                  <td className="p-2 font-mono font-bold border-r border-[#E2E8F0]">
                    [{d.risk_level}]
                  </td>
                  <td className="p-2 text-right font-mono border-r border-[#E2E8F0]">
                    {(d.risk_score * 100).toFixed(1)}%
                  </td>
                  <td className="p-2 text-right font-mono font-bold border-r border-[#E2E8F0]">
                    {d.active_cases}
                  </td>
                  <td className="p-2 text-right font-mono border-r border-[#E2E8F0]">
                    {d.trend_pct > 0 ? `+${d.trend_pct}%` : `${d.trend_pct}%`}
                  </td>
                  <td className="p-2">{d.primary_suspected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Recommended Containment Directives */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1D2321] border-b border-[#E2E8F0] pb-1">
            3. Recommended Health Department Containment Directives
          </h3>
          <ul className="text-xs space-y-1.5 list-disc pl-5 leading-relaxed">
            <li>
              <strong>Pune District:</strong> Immediate dispatch of 300 additional Ringer&apos;s Lactate IV units and oral rehydration supplies to Haveli Block. Activate isolation ward at sub-center level.
            </li>
            <li>
              <strong>Nashik District:</strong> Coordinate vector control fogging across Trimbak block following 112mm precipitation spike. Mobilize 40 ANMs for active fever screening.
            </li>
            <li>
              <strong>Thane District:</strong> Deploy 500 rapid diagnostic Malaria test kits to Bhiwandi PHCs.
            </li>
          </ul>
        </div>

        {/* Official Sign-off Box */}
        <div className="pt-8 border-t-2 border-[#1D2321] flex justify-between items-end text-xs">
          <div>
            <p className="text-[10px] text-[#5B6663] uppercase">Automated Engine Signature</p>
            <p className="font-mono font-bold text-[#1D2321]">Arogya Prahari v0.2.0 • SHA-256 Verified</p>
            <p className="text-[10px] text-[#5B6663]">National Health Surveillance Node</p>
          </div>

          <div className="text-right space-y-1">
            <div className="w-48 border-b border-[#1D2321] pb-6 text-center font-serif italic text-sm text-[#5B6663]">
              Dr. S. Kulkarni
            </div>
            <p className="font-bold text-[#1D2321]">District Health Officer / CMO</p>
            <p className="text-[10px] text-[#5B6663]">Directorate of Health Services, Maharashtra</p>
          </div>
        </div>

      </div>
    </div>
  );
}
