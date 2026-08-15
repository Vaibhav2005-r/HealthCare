'use client';

import { useState } from 'react';
import { askAssistant } from '@smarthealth/api-client';
import { UploadCloud, FileText, CheckCircle, Database, MessageSquare, Send, Sparkles } from 'lucide-react';
import { webPalette } from '@smarthealth/design-tokens';
import { toast } from 'sonner';

interface IngestedDoc {
  id: string;
  name: string;
  status: 'INGESTING' | 'SUCCESS';
  progress: number;
}

export default function RAGAdminPage() {
  const [docs, setDocs] = useState<IngestedDoc[]>([
    { id: 'doc-1', name: 'WHO_Cholera_Guidelines_2024.pdf', status: 'SUCCESS', progress: 100 },
    { id: 'doc-2', name: 'IDSP_Outbreak_Protocol.pdf', status: 'SUCCESS', progress: 100 },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Chat state
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<{role: 'user' | 'assistant', content: string, citations?: string[]}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => setIsDragging(false);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const newDoc: IngestedDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        status: 'INGESTING',
        progress: 0,
      };
      
      setDocs(prev => [newDoc, ...prev]);
      
      // Mock progress
      let p = 0;
      const interval = setInterval(() => {
        p += 20;
        setDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, progress: p } : d));
        if (p >= 100) {
          clearInterval(interval);
          setDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'SUCCESS' } : d));
          toast.success(`${file.name} successfully vectorized and added to the knowledge base.`);
        }
      }, 500);
    }
  };

  const handleSendQuery = async () => {
    if (!query.trim()) return;
    
    const userQuery = query;
    setChatLog(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setIsTyping(true);
    
    try {
      const response = await askAssistant(userQuery);
      setChatLog(prev => [...prev, { 
        role: 'assistant', 
        content: response,
        citations: ['WHO_Cholera_Guidelines_2024.pdf (Pg 12)', 'IDSP_Outbreak_Protocol.pdf (Pg 4)']
      }]);
    } catch (e) {
      toast.error('Failed to query RAG backend.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">RAG Medical Base Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Manage document vectors and test the AI Medical Assistant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Document Vector Ingestion */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">Document Ingestion</h2>
          </div>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors mb-6 ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
            <p className="text-sm font-semibold text-slate-700">Drag & drop medical PDFs here</p>
            <p className="text-xs text-slate-500 mt-1">Files are vectorized and stored in Qdrant.</p>
            <label className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition-colors">
              Browse Files
              <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                // Mock same as drop
                if (e.target.files && e.target.files.length > 0) {
                  handleDrop({ dataTransfer: { files: e.target.files }, preventDefault: () => {} } as any);
                }
              }} />
            </label>
          </div>

          <h3 className="text-sm font-bold text-slate-700 mb-3">Ingested Knowledge Base</h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="p-3 border border-slate-200 rounded-lg flex items-center gap-3 bg-white">
                <FileText className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                  {doc.status === 'INGESTING' ? (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${doc.progress}%` }}></div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Vectorized & Indexed
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RAG Playground */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800">AI Assistant Playground</h2>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4 overflow-y-auto flex flex-col gap-4">
            {chatLog.length === 0 ? (
              <div className="m-auto text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask a question to query the knowledge base.</p>
              </div>
            ) : (
              chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    
                    {msg.citations && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, j) => (
                          <span key={j} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                            <FileText className="w-3 h-3" />
                            {cite}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              placeholder="Ask about outbreak protocols or risk factors..."
              className="w-full bg-slate-50 border border-slate-300 rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <button 
              onClick={handleSendQuery}
              disabled={!query.trim() || isTyping}
              className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
