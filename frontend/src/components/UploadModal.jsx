import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/admin/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success(res.data.message || `${res.data.count} questions imported!`);
      setFile(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a1c] border-2 border-[#2a2a2b] rounded-xl w-full max-w-md p-6 md:p-8 animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display-lg">Import Questions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive ? 'border-[#7a33ff] bg-[#7a33ff]/10' : 
            file ? 'border-green-600 bg-green-600/5' : 
            'border-[#4a4456] hover:border-[#7a33ff]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".json,.csv,.txt"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
          
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[40px] text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
              <p className="text-white font-bold">{file.name}</p>
              <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-[#7a33ff]">upload_file</span>
              <p className="text-white font-bold">Drop your file here</p>
              <p className="text-gray-500 text-sm">JSON or CSV • Max 5MB</p>
            </div>
          )}
        </div>

        {/* Format hints */}
        <div className="mt-4 p-3 bg-[#131314] rounded-lg border border-[#2a2a2b]">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Accepted Formats</p>
          <p className="text-xs text-gray-400">
            <strong>JSON:</strong> <code className="text-[#a5b4fc]">{`{"questions": [...]}`}</code> or <code className="text-[#a5b4fc]">[...]</code>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <strong>CSV:</strong> question_text, type, difficulty, topic, options, correct_answer
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#2a2a2b] hover:bg-[#353436] text-white py-3 rounded-lg font-bold tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex-1 bg-[#7a33ff] hover:bg-[#6a1ceb] disabled:bg-[#4a2090] disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
