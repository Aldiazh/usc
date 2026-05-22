import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

const defaultForm = {
  name: '',
  username: '',
  password: '',
  role: 'participant',
  institution: '',
  team_name: '',
  is_active: true,
};

export default function CreateUserModal({ isOpen, onClose, onSuccess, editingUser }) {
  const [form, setForm] = useState({ ...defaultForm });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!editingUser;

  useEffect(() => {
    if (editingUser) {
      setForm({
        name: editingUser.name || '',
        username: editingUser.username || '',
        password: '',
        role: editingUser.role || 'participant',
        institution: editingUser.institution || '',
        team_name: editingUser.team_name || '',
        is_active: editingUser.is_active ?? true,
      });
    } else {
      setForm({ ...defaultForm });
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (!isEditing && !form.password) {
      toast.error('Password wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        username: form.username || null,
        role: form.role,
        institution: form.institution || null,
        team_name: form.team_name || null,
        is_active: form.is_active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (isEditing) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
        toast.success('User berhasil diperbarui');
      } else {
        payload.password = form.password;
        await api.post('/admin/users', payload);
        toast.success('User berhasil dibuat');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan user';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#131314] border border-[#353436] rounded-lg px-4 py-3 text-white font-medium focus:border-[#7a33ff] focus:outline-none focus:ring-1 focus:ring-[#7a33ff] transition-colors placeholder:text-gray-600";
  const selectClass = "w-full bg-[#131314] border border-[#353436] rounded-lg px-4 py-3 text-white font-medium focus:border-[#7a33ff] focus:outline-none focus:ring-1 focus:ring-[#7a33ff] transition-colors cursor-pointer";
  const labelClass = "text-xs font-bold tracking-widest text-gray-500 uppercase mb-1.5 block";

  const roleColors = {
    admin: 'text-red-400',
    host: 'text-yellow-400',
    participant: 'text-blue-400',
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1c] border border-[#2a2a2b] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1c] border-b border-[#2a2a2b] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7a33ff]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#7a33ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isEditing ? 'manage_accounts' : 'person_add'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold font-display-lg tracking-wide">
                {isEditing ? 'EDIT USER' : 'BUAT USER BARU'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditing ? 'Perbarui data user' : 'Tambahkan user peserta baru'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className={labelClass}>NAMA</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">person</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Nama lengkap"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className={labelClass}>USERNAME <span className="text-gray-600 normal-case">(untuk login peserta)</span></label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">alternate_email</span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="username (huruf, angka, _ , -)"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>
              PASSWORD {isEditing && <span className="text-gray-600 normal-case">(kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`${inputClass} pl-10 pr-10`}
                placeholder={isEditing ? '••••••••' : 'Minimal 6 karakter'}
                required={!isEditing}
                minLength={isEditing && form.password ? 6 : undefined}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Role + Active row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ROLE</label>
              <select
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={`${selectClass} ${roleColors[form.role] || ''}`}
                disabled={isLoading}
              >
                <option value="participant">Participant</option>
                <option value="host">Host</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>STATUS</label>
              <select
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                className={`${selectClass} ${form.is_active ? 'text-green-400' : 'text-red-400'}`}
                disabled={isLoading}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className={labelClass}>INSTITUSI / SEKOLAH</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">school</span>
              <input
                type="text"
                value={form.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Nama institusi (opsional)"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Team Name */}
          <div>
            <label className={labelClass}>NAMA TIM</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">groups</span>
              <input
                type="text"
                value={form.team_name}
                onChange={(e) => handleChange('team_name', e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Nama tim (opsional)"
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
                  <span className="material-symbols-outlined text-[18px]">{isEditing ? 'save' : 'person_add'}</span>
                  {isEditing ? 'SIMPAN' : 'BUAT USER'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
