'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Download, FileSpreadsheet, FileJson, File, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export interface SymptomReport {
  id: string;
  villageId?: string;
  village_name?: string;
  diseaseType?: string;
  disease?: string;
  outcome?: string;
  risk_level?: string;
  symptoms: string[];
  patientAge?: number;
  patient_age?: number;
  patientGender?: string;
  patient_gender?: string;
  timestamp?: string;
  created_at?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const { data } = await supabase.from('case_reports').select('*').order('created_at', { ascending: false }).limit(50);
        if (data && data.length > 0) {
          setReports(data.map((r: any) => ({
            id: r.report_id || r.id || 'REP-001',
            villageId: r.village_name || r.village_id || 'Village',
            diseaseType: r.suspected_disease || r.disease_type || 'Surveillance Intake',
            outcome: r.risk_level || 'ASSESSED',
            symptoms: Array.isArray(r.symptoms) ? r.symptoms : (r.symptoms ? [r.symptoms] : []),
            patientAge: r.patient_age || 30,
            patientGender: r.patient_gender || 'F',
            timestamp: r.created_at || new Date().toISOString(),
          })));
        }
      } catch (err) {
        console.error('Error fetching reports from Supabase:', err);
      }
    }
    loadReports();
  }, []);

  const exportJSON = () => {
    setIsExporting('JSON');
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reports, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `smarthealth_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setIsExporting(null);
      toast.success('JSON export completed successfully.');
    }, 800);
  };

  const exportCSV = () => {
    setIsExporting('CSV');
    setTimeout(() => {
      const worksheet = XLSX.utils.json_to_sheet(reports.map(r => ({
        ID: r.id,
        Village: r.villageId,
        Disease: r.diseaseType,
        Risk: r.outcome,
        Symptoms: r.symptoms.join(', '),
        Age: r.patientAge,
        Gender: r.patientGender,
        Time: r.timestamp
      })));
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `smarthealth_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setIsExporting(null);
      toast.success('CSV export completed successfully.');
    }, 800);
  };

  const exportPDF = () => {
    setIsExporting('PDF');
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header Banner
      doc.setFillColor(194, 37, 92); // #C2255C
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("AROGYA PRAHARI | NATIONAL OUTBREAK SURVEILLANCE", 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Epidemiological Case Registry Bulletin • Generated ${new Date().toLocaleString()}`, 14, 19);

      // Summary Box
      doc.setFillColor(246, 245, 242);
      doc.rect(14, 32, 182, 20, 'F');
      doc.setTextColor(29, 35, 33);
      doc.setFontSize(9);
      doc.text(`Total Records Extracted: ${reports.length}`, 20, 41);
      doc.text(`Authority: Integrated Disease Surveillance Programme (IDSP) Tier-1 Clearance`, 20, 47);

      // Table Header
      doc.setFillColor(20, 99, 86); // #146356 Sentinel Teal
      doc.rect(14, 58, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("Report ID", 16, 63);
      doc.text("Location / PHC", 45, 63);
      doc.text("Syndrome / Disease", 90, 63);
      doc.text("Risk", 140, 63);
      doc.text("Timestamp", 165, 63);

      let yPos = 72;
      doc.setFont('helvetica', 'normal');
      
      reports.slice(0, 18).forEach((r, idx) => {
        doc.setTextColor(29, 35, 33);
        doc.setFontSize(8);
        
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 249);
          doc.rect(14, yPos - 4, 182, 6, 'F');
        }

        doc.text(r.id.substring(0, 10), 16, yPos);
        doc.text(r.villageId?.substring(0, 20) || 'Unknown PHC', 45, yPos);
        doc.text(r.diseaseType?.substring(0, 25) || 'Acute Fever', 90, yPos);
        
        // Color code risk
        if (r.outcome === 'HIGH' || r.outcome === 'CRITICAL') {
          doc.setTextColor(198, 54, 44);
        } else {
          doc.setTextColor(20, 99, 86);
        }
        doc.text(r.outcome || 'ASSESSED', 140, yPos);
        
        doc.setTextColor(91, 102, 99);
        doc.text(r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'Recent', 165, yPos);
        
        yPos += 7;
      });

      // Footer
      doc.setTextColor(91, 102, 99);
      doc.setFontSize(7);
      doc.text("This document is generated by Arogya Prahari Automated Surveillance Engine for official epidemiological use.", 14, 285);

      doc.save(`arogya_prahari_bulletin_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsExporting(null);
      toast.success('Official PDF bulletin generated successfully.');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#1D2321] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C2255C]" />
            Official Reports & Data Exports
          </h2>
          <p className="text-xs text-[#5B6663] mt-1">
            Export structured IDSP compliance records, village symptom registry, and executive epidemiological PDF summaries.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={!!isExporting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#146356] bg-[#146356]/10 hover:bg-[#146356]/20 border border-[#146356]/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting === 'CSV' ? 'Exporting...' : 'Export CSV'}
          </button>
          
          <button
            onClick={exportJSON}
            disabled={!!isExporting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#5B6663] bg-[#EAE8E3] hover:bg-[#D5D2CA] rounded-lg transition-colors disabled:opacity-50"
          >
            <FileJson className="w-4 h-4" />
            {isExporting === 'JSON' ? 'Exporting...' : 'Export JSON'}
          </button>
          
          <button
            onClick={exportPDF}
            disabled={!!isExporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#C2255C] hover:bg-[#A61E4D] shadow-sm rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting === 'PDF' ? 'Generating PDF...' : 'Download Official PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#146356] animate-pulse" />
            <h3 className="text-sm font-bold text-[#1D2321]">Recent Epidemiological Case Intakes</h3>
          </div>
          <span className="text-xs text-[#5B6663] font-mono">{reports.length} Records Loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#5B6663] border-b border-[#E2E8F0] uppercase font-mono tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Village / Target</th>
                <th className="py-3 px-4">Suspected Disease</th>
                <th className="py-3 px-4">Triage Risk</th>
                <th className="py-3 px-4">Reported Symptoms</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-[#1D2321]">{report.id.substring(0, 12)}</td>
                  <td className="py-3 px-4 font-medium text-[#1D2321]">{report.villageId}</td>
                  <td className="py-3 px-4 text-[#5B6663]">{report.diseaseType}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.outcome === 'CRITICAL' || report.outcome === 'HIGH'
                        ? 'bg-[#C6362C]/10 text-[#C6362C] border border-[#C6362C]/20'
                        : 'bg-[#146356]/10 text-[#146356] border border-[#146356]/20'
                    }`}>
                      {report.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5B6663] max-w-xs truncate">
                    {report.symptoms.join(', ')}
                  </td>
                  <td className="py-3 px-4 text-[#5B6663]">
                    {report.patientAge}y, {report.patientGender}
                  </td>
                  <td className="py-3 px-4 text-[#5B6663] font-mono text-[11px]">
                    {report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
