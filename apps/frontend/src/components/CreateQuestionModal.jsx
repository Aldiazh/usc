import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

const defaultOption = () => ({ id: '', text: '', isCorrect: false });

const defaultForm = {
  question_text: '',
  type: 'multiple_choice',
  difficulty: 'medium',
  topic: '',
  options: [
    { id: 'A', text: '', isCorrect: false },
    { id: 'B', text: '', isCorrect: false },
    { id: 'C', text: '', isCorrect: false },
    { id: 'D', text: '', isCorrect: false },
  ],
  correct_answer: '',
  time_limit_seconds: 30,
  points: 1000,
};

export default function CreateQuestionModal({ isOpen, onClose, onSuccess, editingQuestion }) {
  const [form, setForm] = useState({ ...defaultForm });
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!editingQuestion;

  useEffect(() => {
    if (editingQuestion) {
      setForm({
        question_text: editingQuestion.question_text || '',
        type: editingQuestion.type || 'multiple_choice',
        difficulty: editingQuestion.difficulty || 'medium',
        topic: editingQuestion.topic || '',
        options: editingQuestion.options?.length > 0 
          ? editingQuestion.options.map(o => ({ id: o.id, text: o.text, isCorrect: !!o.isCorrect }))
          : [...defaultForm.options],
        correct_answer: editingQuestion.correct_answer || '',
        time_limit_seconds: editingQuestion.time_limit_seconds || 30,
        points: editingQuestion.points || 1000,
      });
    } else {
      setForm({ ...defaultForm, options: defaultForm.options.map(o => ({ ...o })) });
    }
  }, [editingQuestion, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    setForm(prev => {
      const newOptions = [...prev.options];
      if (field === 'isCorrect') {
        // Only one correct answer at a time
        newOptions.forEach((o, i) => {
          o.isCorrect = i === index;
        });
      } else {
        newOptions[index] = { ...newOptions[index], [field]: value };
      }
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    const nextId = String.fromCharCode(65 + form.options.length);
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { id: nextId, text: '', isCorrect: false }],
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index).map((o, i) => ({ ...o, id: String.fromCharCode(65 + i) })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.question_text.trim()) {
      toast.error('Pertanyaan wajib diisi');
      return;
    }

    if (form.type === 'multiple_choice') {
      const hasCorrect = form.options.some(o => o.isCorrect);
      const allFilled = form.options.every(o => o.text.trim());
      if (!hasCorrect) {
        toast.error('Pilih satu jawaban yang benar');
        return;
      }
      if (!allFilled) {
        toast.error('Semua opsi harus diisi');
        return;
      }
    }

    if (form.type === 'short_answer' && !form.correct_answer.trim()) {
      toast.error('Jawaban benar wajib diisi untuk tipe short answer');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        question_text: form.question_text,
        type: form.type,
        difficulty: form.difficulty,
        topic: form.topic || 'General',
        time_limit_seconds: parseInt(form.time_limit_seconds) || 30,
        points: parseInt(form.points) || 1000,
      };

      if (form.type === 'multiple_choice') {
        payload.options = form.options;
        payload.correct_answer = form.options.find(o => o.isCorrect)?.id || '';
      } else {
        payload.correct_answer = form.correct_answer;
      }

      if (isEditing) {
        await api.put(`/admin/questions/${editingQuestion.id}`, payload);
        toast.success('Soal berhasil diperbarui');
      } else {
        await api.post('/admin/questions', payload);
        toast.success('Soal berhasil dibuat');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan soal';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#131314] border border-[#353436] rounded-lg px-4 py-3 text-white font-medium focus:border-[#7a33ff] focus:outline-none focus:ring-1 focus:ring-[#7a33ff] transition-colors placeholder:text-gray-600";
  const selectClass = "w-full bg-[#131314] border border-[#353436] rounded-lg px-4 py-3 text-white font-medium focus:border-[#7a33ff] focus:outline-none focus:ring-1 focus:ring-[#7a33ff] transition-colors cursor-pointer appearance-none";
  const labelClass = "text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1c] border border-[#2a2a2b] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1c] border-b border-[#2a2a2b] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7a33ff]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#7a33ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isEditing ? 'edit_note' : 'add_circle'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold font-display-lg tracking-wide">
                {isEditing ? 'EDIT SOAL' : 'BUAT SOAL BARU'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditing ? 'Perbarui detail soal' : 'Tambahkan soal ke question bank'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Question Text */}
          <div>
            <label className={labelClass}>PERTANYAAN</label>
            <textarea
              value={form.question_text}
              onChange={(e) => handleChange('question_text', e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Tulis pertanyaan di sini..."
              required
              disabled={isLoading}
            />
          </div>

          {/* Type + Difficulty + Topic row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>TIPE</label>
              <select 
                value={form.type} 
                onChange={(e) => handleChange('type', e.target.value)} 
                className={selectClass}
                disabled={isLoading}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="short_answer">Short Answer</option>
                <option value="code_snippet">Code Snippet</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>KESULITAN</label>
              <select 
                value={form.difficulty} 
                onChange={(e) => handleChange('difficulty', e.target.value)} 
                className={selectClass}
                disabled={isLoading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>TOPIK</label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                className={inputClass}
                placeholder="e.g. Algorithms"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Options (for multiple_choice) */}
          {form.type === 'multiple_choice' && (
            <div>
              <label className={labelClass}>OPSI JAWABAN</label>
              <div className="flex flex-col gap-3">
                {form.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOptionChange(index, 'isCorrect', true)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        option.isCorrect 
                          ? 'bg-green-600/20 border-green-500 text-green-400' 
                          : 'bg-[#131314] border-[#353436] text-gray-600 hover:border-gray-400'
                      }`}
                      title="Tandai sebagai jawaban benar"
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: option.isCorrect ? "'FILL' 1" : "'FILL' 0" }}>
                        {option.isCorrect ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>
                    <div className="w-8 h-10 rounded bg-[#2a2a2b] flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                      {option.id}
                    </div>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      className={`${inputClass} flex-1`}
                      placeholder={`Opsi ${option.id}...`}
                      disabled={isLoading}
                    />
                    {form.options.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => removeOption(index)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                      </button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="w-full border border-dashed border-[#353436] rounded-lg py-2.5 text-gray-500 hover:text-white hover:border-[#7a33ff] transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tambah Opsi
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-600 mt-2 tracking-wide">
                Klik ikon lingkaran untuk menandai jawaban yang benar
              </p>
            </div>
          )}

          {/* Correct Answer (for short_answer) */}
          {(form.type === 'short_answer' || form.type === 'code_snippet') && (
            <div>
              <label className={labelClass}>JAWABAN BENAR</label>
              <input
                type="text"
                value={form.correct_answer}
                onChange={(e) => handleChange('correct_answer', e.target.value)}
                className={inputClass}
                placeholder="Masukkan jawaban yang benar..."
                disabled={isLoading}
              />
              {form.type === 'short_answer' && (
                <p className="text-[10px] text-gray-400 mt-2 tracking-wide leading-relaxed">
                  <span className="font-bold text-[#7a33ff]">TIPS:</span> Gunakan <code className="bg-[#131314] px-1 py-0.5 rounded border border-[#353436]">___</code> (3 underscore) di teks pertanyaan untuk membuat isian <i>fill-in-the-blank</i> (contoh: Ibukota RI adalah ___). Jika tidak ada, kotak input akan muncul di bawah teks.
                </p>
              )}
            </div>
          )}

          {/* Time Limit + Points row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>BATAS WAKTU (DETIK)</label>
              <input
                type="number"
                value={form.time_limit_seconds}
                onChange={(e) => handleChange('time_limit_seconds', e.target.value)}
                className={inputClass}
                min={5}
                max={300}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className={labelClass}>POIN</label>
              <input
                type="number"
                value={form.points}
                onChange={(e) => handleChange('points', e.target.value)}
                className={inputClass}
                min={100}
                max={10000}
                step={100}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2a2a2b] hover:bg-[#353436] text-white py-3.5 rounded-lg font-bold tracking-wider transition-colors border border-[#353436]"
              disabled={isLoading}
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] text-white py-3.5 rounded-lg font-bold tracking-wider transition-colors flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(122,51,255,0.39)]"
            >
              {isLoading ? (
                <span className="animate-pulse">{isEditing ? 'MENYIMPAN...' : 'MEMBUAT...'}</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">{isEditing ? 'save' : 'add_circle'}</span>
                  {isEditing ? 'SIMPAN' : 'BUAT SOAL'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
