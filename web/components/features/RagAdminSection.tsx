'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchRagDocuments, 
  ingestDocument, 
  deleteRagDocument, 
  askRAG, 
  RagDocItem,
  AskRagResponse 
} from '@/lib/api';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  Database, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Trash2, 
  AlertCircle,
  Layers,
  FileCheck2,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function RAGAdminPage() {
  const [docs, setDocs] = useState<RagDocItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  
  // Chat state
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<{
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
    retrieved_excerpts?: Array<{ source: string; text: string; score: number }>;
  }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedExcerpts, setExpandedExcerpts] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from backend
  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const data = await fetchRagDocuments();
      setDocs(data);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => setIsDragging(false);
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const processUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatusText(`Parsing & chunking "${file.name}"...`);

    const tempDocId = `temp-${Date.now()}`;
    const pendingDoc: RagDocItem = {
      id: tempDocId,
      name: file.name,
      chunks_count: 0,
      pages_count: 1,
      uploaded_at: 'Vectorizing now...',
      status: 'INGESTING',
      progress: 45
    };
    
    setDocs(prev => [pendingDoc, ...prev]);

    try {
      setUploadStatusText(`Generating embeddings & indexing into Qdrant...`);
      const result = await ingestDocument(file);
      
      toast.success(`Successfully vectorized ${result.filename}! (${result.chunks_processed} chunks across ${result.pages_processed || 1} pages in ${result.time_seconds || 1}s)`);
      
      // Reload actual list from Qdrant
      await loadDocuments();
    } catch (err: any) {
      console.error('Document ingestion error:', err);
      toast.error(`Upload failed: ${err.message || 'Error processing document'}`);
      setDocs(prev => prev.filter(d => d.id !== tempDocId));
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    try {
      await deleteRagDocument(docId);
      toast.success(`Removed ${docName} from knowledge base.`);
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      toast.error(`Failed to delete document: ${err.message}`);
    }
  };

  const handleSendQuery = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim() || isTyping) return;
    
    const userQuery = q;
    setChatLog(prev => [...prev, { role: 'user', content: userQuery }]);
    if (!customQuery) setQuery('');
    setIsTyping(true);
    
    try {
      const response: AskRagResponse = await askRAG(userQuery);
      setChatLog(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer,
        citations: response.citations || [],
        retrieved_excerpts: response.retrieved_excerpts || []
      }]);
    } catch (e: any) {
      toast.error('Failed to query RAG backend.');
      setChatLog(prev => [...prev, { 
        role: 'assistant', 
        content: 'I could not connect to the RAG backend or retrieve relevant guidelines for this query.',
        citations: []
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const sampleQueries = [
    "What is the fluid protocol for severe dehydration and Cholera?",
    "Which antipyretics should be avoided in Dengue fever?",
    "What is the rapid containment radius for Malaria P. falciparum?"
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Qdrant Cloud Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#1D2321] tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-[#C2255C]" />
            National IDSP Guidelines RAG & Vector Engine
          </h1>
          <p className="text-xs text-[#5B6663] mt-0.5">
            Ingest official IDSP/WHO clinical protocols into Qdrant Cloud and query via Meta LLaMA 3.1 8B Instruct.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-mono font-bold text-[#146356]">
            <span className="w-2 h-2 rounded-full bg-[#146356] animate-pulse" />
            <span>Qdrant Cloud Connected</span>
          </div>
          <button 
            onClick={loadDocuments} 
            className="p-1.5 text-[#5B6663] hover:text-[#1D2321] hover:bg-[#F6F5F2] rounded-lg transition-colors"
            title="Refresh Knowledge Base"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDocs ? 'animate-spin text-[#C2255C]' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[640px]">
        
        {/* 1. Document Vector Ingestion Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C2255C]" />
              <h2 className="text-sm font-bold text-[#1D2321] uppercase tracking-wider">Vector Document Ingestion</h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#5B6663] bg-[#F6F5F2] px-2 py-0.5 rounded border border-[#E2E8F0]">
              {docs.length} Documents Indexed
            </span>
          </div>
          
          {/* Drag & Drop Box */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all mb-5 ${
              isDragging 
                ? 'border-[#C2255C] bg-pink-50/50' 
                : 'border-[#E2E8F0] bg-[#F6F5F2]/50 hover:bg-[#F6F5F2]'
            }`}
          >
            <UploadCloud className={`w-10 h-10 mb-2.5 ${isDragging ? 'text-[#C2255C]' : 'text-[#5B6663]'}`} />
            <p className="text-xs font-bold text-[#1D2321]">Drag & drop medical guidelines (PDF, TXT)</p>
            <p className="text-[11px] text-[#5B6663] mt-0.5">
              Pages are parsed with pypdf, split into semantic chunks, and embedded directly into Qdrant.
            </p>

            {isUploading ? (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#C2255C]">
                <div className="w-4 h-4 border-2 border-[#C2255C] border-t-transparent rounded-full animate-spin" />
                <span>{uploadStatusText}</span>
              </div>
            ) : (
              <label className="mt-3.5 px-4 py-1.5 bg-[#C2255C] hover:bg-[#A61E4D] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs">
                Browse Files
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.txt,.md" 
                  onChange={handleFileChange} 
                />
              </label>
            )}
          </div>

          {/* Ingested Knowledge Base List */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#1D2321] uppercase tracking-wider">Active Vector Index</h3>
            <span className="text-[10px] text-[#5B6663]">SentenceTransformers (384-dim)</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[320px]">
            {loadingDocs && docs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5B6663]">Loading Qdrant knowledge base...</div>
            ) : docs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5B6663] border border-dashed border-[#E2E8F0] rounded-lg">
                No documents uploaded yet. Upload an IDSP or WHO PDF guideline above.
              </div>
            ) : (
              docs.map(doc => (
                <div 
                  key={doc.id} 
                  className="p-3 border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3 bg-white hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-[#C2255C] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1D2321] truncate">{doc.name}</p>
                      {doc.status === 'INGESTING' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 bg-[#EAE8E3] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#C2255C] h-full transition-all duration-300 w-3/4 animate-pulse"></div>
                          </div>
                          <span className="text-[10px] font-bold text-[#C2255C]">Vectorizing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-[10px] text-[#5B6663] mt-0.5">
                          <span className="text-[#146356] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Indexed
                          </span>
                          <span>•</span>
                          <span>{doc.chunks_count} chunks</span>
                          {doc.pages_count && (
                            <>
                              <span>•</span>
                              <span>{doc.pages_count} pages</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {doc.status !== 'INGESTING' && !doc.id.startsWith('base-') && (
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete from Qdrant"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. RAG Assistant Playground Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#146356]" />
              <h2 className="text-sm font-bold text-[#1D2321] uppercase tracking-wider">Clinical Protocol QA</h2>
            </div>
            <span className="text-[10px] font-bold text-[#146356] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Meta LLaMA 3.1 8B
            </span>
          </div>

          {/* Quick Query Suggestions */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(sq)}
                className="text-[10px] font-medium text-[#5B6663] bg-[#F6F5F2] hover:bg-[#EAE8E3] hover:text-[#1D2321] px-2.5 py-1 rounded-full border border-[#E2E8F0] transition-colors truncate max-w-xs text-left"
              >
                {sq}
              </button>
            ))}
          </div>
          
          {/* Chat Messages Log */}
          <div className="flex-1 bg-[#F6F5F2]/40 rounded-xl border border-[#E2E8F0] p-4 mb-3 overflow-y-auto flex flex-col gap-3.5 max-h-[360px]">
            {chatLog.length === 0 ? (
              <div className="m-auto text-center text-[#5B6663] max-w-xs py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                <p className="text-xs font-bold text-[#1D2321]">IDSP Medical Knowledge Base Ready</p>
                <p className="text-[11px] text-[#5B6663] mt-1">
                  Ask clinical questions, dosages, isolation protocols, or vector containment directives.
                </p>
              </div>
            ) : (
              chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-xl px-4 py-3 text-xs shadow-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#C2255C] text-white rounded-br-none font-medium' 
                      : 'bg-white border border-[#E2E8F0] text-[#1D2321] rounded-bl-none'
                  }`}>
                    {/* Message Body */}
                    <div className="whitespace-pre-line space-y-1">
                      {msg.content}
                    </div>
                    
                    {/* Grounded Citation Badges */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6663]">
                          Cited Ground Truth:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, j) => (
                            <span 
                              key={j} 
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-mono font-bold rounded border border-blue-200"
                            >
                              <FileCheck2 className="w-3 h-3 text-blue-600" />
                              {cite}
                            </span>
                          ))}
                        </div>

                        {/* Excerpts Toggle */}
                        {msg.retrieved_excerpts && msg.retrieved_excerpts.length > 0 && (
                          <div className="mt-1">
                            <button
                              onClick={() => setExpandedExcerpts(expandedExcerpts === i ? null : i)}
                              className="text-[10px] font-semibold text-[#5B6663] hover:text-[#1D2321] flex items-center gap-1"
                            >
                              {expandedExcerpts === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span>{expandedExcerpts === i ? 'Hide retrieved vector snippets' : 'View retrieved vector snippets'}</span>
                            </button>
                            
                            {expandedExcerpts === i && (
                              <div className="mt-2 space-y-1.5 bg-[#F6F5F2] p-2.5 rounded-lg border border-[#E2E8F0] text-[10px] text-[#5B6663]">
                                {msg.retrieved_excerpts.map((ex, k) => (
                                  <div key={k} className="p-1.5 bg-white rounded border border-[#E2E8F0]">
                                    <div className="font-bold text-[#1D2321] mb-0.5">{ex.source} (Cosine Score: {ex.score})</div>
                                    <p className="italic font-mono text-[9px] text-[#333]">"{ex.text}"</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2E8F0] rounded-xl rounded-bl-none px-4 py-2.5 shadow-xs flex items-center gap-2 text-xs text-[#5B6663]">
                  <div className="w-1.5 h-1.5 bg-[#C2255C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#C2255C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#C2255C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-[10px] font-mono text-[#5B6663] ml-1">Consulting Qdrant & LLaMA 3.1...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat Input Box */}
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              placeholder="Ask clinical guideline questions or containment directives..."
              className="w-full bg-[#F6F5F2] border border-[#E2E8F0] rounded-xl pl-4 pr-12 py-2.5 text-xs outline-none focus:border-[#C2255C] focus:bg-white transition-all text-[#1D2321]"
            />
            <button 
              onClick={() => handleSendQuery()}
              disabled={!query.trim() || isTyping}
              className="absolute right-1.5 top-1.5 p-1.5 bg-[#C2255C] text-white rounded-lg hover:bg-[#A61E4D] disabled:opacity-40 transition-colors"
              aria-label="Send clinical inquiry"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
