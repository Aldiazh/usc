import React, { useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import api from '../lib/api';
import UploadModal from '../components/UploadModal';
import CreateQuestionModal from '../components/CreateQuestionModal';

const selectClass = "bg-[#131314] hover:bg-[#1f1f20] border border-[#353436] text-gray-200 rounded-md px-4 py-2.5 text-xs font-bold tracking-wider focus:outline-none focus:border-[#7a33ff] focus:ring-1 focus:ring-[#7a33ff] shrink-0 cursor-pointer transition-all shadow-sm appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat uppercase";

const difficultyColors = {
  easy: { bg: 'bg-green-900/30', border: 'border-green-700/50', text: 'text-green-400' },
  medium: { bg: 'bg-yellow-900/30', border: 'border-yellow-700/50', text: 'text-yellow-400' },
  hard: { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400' },
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ topic: '', difficulty: '', type: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      if (filters.topic) params.topic = filters.topic;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.type) params.type = filters.type;

      const res = await api.get('/admin/questions', { params });
      setQuestions(res.data.data || []);
      setPagination({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6 font-body-md animate-in fade-in duration-500 min-h-full">
      <Toaster position="top-center" theme="dark" richColors />
      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onSuccess={fetchQuestions} />
      <CreateQuestionModal 
        isOpen={showCreate || !!editingQuestion} 
        onClose={() => { setShowCreate(false); setEditingQuestion(null); }} 
        onSuccess={fetchQuestions} 
        editingQuestion={editingQuestion} 
      />
      
      {/* Top Header / Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0a0a0a] -mx-4 md:-mx-8 -mt-4 md:-mt-8 px-4 md:px-8 py-6 border-b border-[#1f2937] sticky top-0 z-30 gap-4">
        <h1 className="text-2xl md:text-3xl font-black font-display-lg tracking-wide">QUESTION BANK</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-[#1f1f20] border border-[#353436] rounded text-white pl-12 pr-4 py-3 w-full md:w-[250px] lg:w-[350px] focus:outline-none focus:border-[#7a33ff] transition-colors shadow-inner"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowUpload(true)}
              className="w-1/2 sm:w-auto bg-[#1a1a1c] hover:bg-[#2a2a2b] border border-[#353436] hover:border-[#4a4456] text-white px-4 py-3 rounded font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shadow-sm group"
            >
              <span className="material-symbols-outlined font-bold text-[#ffc703] group-hover:-translate-y-0.5 transition-transform">upload_file</span>
              <span className="text-sm">IMPORT</span>
            </button>
            <button 
              onClick={() => setShowCreate(true)}
              className="w-1/2 sm:w-auto bg-[#7a33ff] hover:bg-[#6a1ceb] text-white px-6 py-3 rounded font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shadow-[0_4px_14px_0_rgba(122,51,255,0.39)]"
            >
              <span className="material-symbols-outlined font-bold">add</span>
              <span className="text-sm">CREATE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-[#2a2a2b] bg-[#1a1a1c] p-4 rounded flex flex-col lg:flex-row lg:items-center justify-between mt-4 gap-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full">
          <span className="text-sm font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            FILTER:
          </span>
          <select value={filters.topic} onChange={(e) => { setFilters({...filters, topic: e.target.value}); setPage(1); }} className={selectClass}>
            <option value="">All Topics</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Data Structures">Data Structures</option>
            <option value="OOP">OOP</option>
            <option value="Logic">Logic</option>
          </select>
          <select value={filters.difficulty} onChange={(e) => { setFilters({...filters, difficulty: e.target.value}); setPage(1); }} className={selectClass}>
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={filters.type} onChange={(e) => { setFilters({...filters, type: e.target.value}); setPage(1); }} className={selectClass}>
            <option value="">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
            <option value="code_snippet">Code Snippet</option>
          </select>
        </div>
        <div className="text-sm font-bold text-gray-500 tracking-wider shrink-0">
          {pagination ? `${pagination.total} QUESTIONS` : '...'}
        </div>
      </div>

      {/* Questions Table */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#1a1a1c] rounded border border-[#2a2a2b] animate-pulse" />
          ))
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <span className="material-symbols-outlined text-[48px] mb-4 block">quiz</span>
            <p className="font-bold text-lg">No questions found</p>
            <p className="text-sm mt-2">Create or import questions to get started</p>
          </div>
        ) : (
          questions.map((q, i) => {
            const dc = difficultyColors[q.difficulty] || difficultyColors.medium;
            return (
              <div key={q.id} className="border border-[#2a2a2b] bg-[#1a1a1c] rounded p-4 hover:border-[#4a4456] transition-colors group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded bg-[#2a2a2b] flex items-center justify-center text-sm font-bold text-gray-400 border border-[#353436]">
                      {(page - 1) * 15 + i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium mb-2 leading-relaxed">{q.question_text}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${dc.bg} ${dc.border} ${dc.text}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-[#4a4456] bg-[#2a2a2b] text-gray-300">
                          {q.topic}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-[#4a4456] bg-[#2a2a2b] text-[#a5b4fc]">
                          {q.type?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest px-3 py-1 rounded-full border border-[#4a4456] bg-[#2a2a2b] text-[#ffc703]">
                          {q.points} PTS • {q.time_limit_seconds}s
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingQuestion(q)} className="p-2 hover:bg-[#2a2a2b] rounded transition-colors text-gray-400 hover:text-white">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => deleteQuestion(q.id)} className="p-2 hover:bg-[#450a0a] rounded transition-colors text-gray-400 hover:text-red-400">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page <= 1}
            className="px-4 py-2 bg-[#1a1a1c] border border-[#2a2a2b] rounded text-sm font-bold disabled:opacity-30 hover:bg-[#2a2a2b] transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm font-bold text-gray-400 px-4">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} 
            disabled={page >= pagination.last_page}
            className="px-4 py-2 bg-[#1a1a1c] border border-[#2a2a2b] rounded text-sm font-bold disabled:opacity-30 hover:bg-[#2a2a2b] transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
