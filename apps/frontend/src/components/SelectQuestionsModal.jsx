import React, { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { cachedGet, SHORT_CACHE_TTL } from '../lib/apiCache';

const difficultyColors = {
  easy: { bg: 'bg-green-900/30', border: 'border-green-700/50', text: 'text-green-400' },
  medium: { bg: 'bg-yellow-900/30', border: 'border-yellow-700/50', text: 'text-yellow-400' },
  hard: { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400' },
};

export default function SelectQuestionsModal({ isOpen, onClose, eventId, onSuccess }) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch questions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchQuestions(1);
      setSelectedIds(new Set()); // Reset selection on open
    }
  }, [isOpen]);

  const fetchQuestions = useCallback(async (nextPage = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = { page: nextPage, per_page: 30 };
      if (search) params.search = search;

      const res = await cachedGet('/admin/questions', { params }, SHORT_CACHE_TTL);
      const nextQuestions = res.data.data || [];
      setQuestions((current) => append ? [...current, ...nextQuestions] : nextQuestions);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
      setPage(nextPage);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [search]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchQuestions(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchQuestions, isOpen, search]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/admin/events/${eventId}/questions`, {
        question_ids: Array.from(selectedIds),
        phase: 1, // Default phase
      });
      toast.success('Questions attached successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to attach questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131314] border border-[#2a2a2b] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-[#2a2a2b] flex justify-between items-center bg-[#1a1a1c] rounded-t-lg">
          <div>
            <h2 className="text-2xl font-black font-display-lg tracking-wide text-white">SELECT QUESTIONS</h2>
            <p className="text-gray-400 text-sm mt-1">Choose questions from the bank to attach to this event.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-[#2a2a2b] rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-[#2a2a2b] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#18181a]">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search questions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#2a2a2b] border border-[#353436] rounded text-white pl-9 pr-3 py-2 w-full text-sm focus:outline-none focus:border-[#7a33ff] transition-colors"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="text-sm font-bold text-[#ffc703]">
              {selectedIds.size} SELECTED
              {pagination?.total ? ` / ${pagination.total}` : ''}
            </span>
            <button 
              onClick={handleSelectAll}
              className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors border border-[#353436] hover:border-gray-500 rounded px-3 py-1.5"
            >
              {selectedIds.size === questions.length && questions.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#7a33ff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-[48px] mb-3 block">quiz</span>
              <p className="font-bold">No questions found</p>
            </div>
          ) : (
            <>
              {questions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                const dc = difficultyColors[q.difficulty] || difficultyColors.medium;
                
                return (
                  <div 
                    key={q.id} 
                    onClick={() => toggleSelection(q.id)}
                    className={`border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#7a33ff] bg-[#7a33ff]/10' 
                        : 'border-[#2a2a2b] bg-[#1a1a1c] hover:border-[#4a4456]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded flex shrink-0 items-center justify-center border transition-colors ${
                      isSelected ? 'bg-[#7a33ff] border-[#7a33ff]' : 'border-[#4a4456] bg-[#2a2a2b]'
                    }`}>
                      {isSelected && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm mb-2">{q.question_text}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${dc.bg} ${dc.border} ${dc.text}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-[#4a4456] bg-[#2a2a2b] text-gray-300">
                          {q.topic}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border border-[#4a4456] bg-[#2a2a2b] text-[#ffc703]">
                          {q.points} PTS
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pagination && pagination.current_page < pagination.last_page && (
                <button
                  type="button"
                  onClick={() => fetchQuestions(page + 1, true)}
                  disabled={isLoadingMore}
                  className="mt-2 border border-[#353436] hover:border-[#7a33ff] bg-[#1a1a1c] hover:bg-[#2a2a2b] disabled:opacity-50 text-gray-300 hover:text-white rounded px-4 py-3 text-sm font-bold tracking-wider transition-colors"
                >
                  {isLoadingMore ? 'LOADING...' : 'LOAD MORE QUESTIONS'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2b] bg-[#1a1a1c] rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded font-bold tracking-wider text-gray-300 hover:text-white hover:bg-[#2a2a2b] transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.size === 0}
            className="bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] disabled:text-gray-400 text-white px-8 py-2.5 rounded font-bold tracking-wider flex items-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined">add_link</span>
            )}
            ATTACH ({selectedIds.size})
          </button>
        </div>

      </div>
    </div>
  );
}
