import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import api from '../lib/api';
import { cachedGet, clearApiCache, SHORT_CACHE_TTL, STATS_CACHE_TTL } from '../lib/apiCache';

const CreateUserModal = React.lazy(() => import('../components/CreateUserModal'));

const roleConfig = {
  admin: { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400', icon: 'shield_person' },
  host: { bg: 'bg-yellow-900/30', border: 'border-yellow-700/50', text: 'text-yellow-400', icon: 'tv_signin' },
  participant: { bg: 'bg-blue-900/30', border: 'border-blue-700/50', text: 'text-blue-400', icon: 'person' },
};

const selectClass = "bg-[#131314] hover:bg-[#1f1f20] border border-[#353436] text-gray-200 rounded-md px-4 py-2.5 text-xs font-bold tracking-wider focus:outline-none focus:border-[#7a33ff] focus:ring-1 focus:ring-[#7a33ff] shrink-0 cursor-pointer transition-all shadow-sm appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat uppercase";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', is_active: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const searchTimerRef = useRef(null);

  // Debounce search input (400ms)
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.role) params.role = filters.role;
      if (filters.is_active !== '') params.is_active = filters.is_active;

      const res = await cachedGet('/admin/users', { params }, SHORT_CACHE_TTL);
      setUsers(res.data.data || []);
      setPagination({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await cachedGet('/admin/users/stats', {}, STATS_CACHE_TTL);
      setStats(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchStats(); }, []);

  const deleteUser = async (id) => {
    if (!confirm('Hapus user ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User dihapus');
      clearApiCache('/admin/users');
      fetchUsers();
      fetchStats();
    } catch { toast.error('Gagal menghapus user'); }
  };

  const toggleActive = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/toggle-active`);
      toast.success(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      clearApiCache('/admin/users');
      fetchUsers();
      fetchStats();
    } catch { toast.error('Gagal mengubah status user'); }
  };

  const handleSuccess = () => {
    clearApiCache('/admin/users');
    fetchUsers();
    fetchStats();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6 font-body-md animate-in fade-in duration-500 min-h-full">
      <Toaster position="top-center" theme="dark" richColors />
      
      <Suspense fallback={null}>
        {(showCreate || !!editingUser) && (
          <CreateUserModal
            isOpen={showCreate || !!editingUser}
            onClose={() => { setShowCreate(false); setEditingUser(null); }}
            onSuccess={handleSuccess}
            editingUser={editingUser}
          />
        )}
      </Suspense>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0a0a0a] -mx-4 md:-mx-8 -mt-4 md:-mt-8 px-4 md:px-8 py-6 border-b border-[#1f2937] sticky top-0 z-30 gap-4">
        <h1 className="text-2xl md:text-3xl font-black font-display-lg tracking-wide">USER MANAGEMENT</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-[#1f1f20] border border-[#353436] rounded text-white pl-12 pr-4 py-3 w-full md:w-[250px] lg:w-[350px] focus:outline-none focus:border-[#7a33ff] transition-colors shadow-inner"
            />
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto bg-[#7a33ff] hover:bg-[#6a1ceb] text-white px-6 py-3 rounded font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shadow-[0_4px_14px_0_rgba(122,51,255,0.39)]"
          >
            <span className="material-symbols-outlined font-bold">person_add</span>
            <span className="text-sm">CREATE USER</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-2">
          <StatCard label="Total Users" value={stats.total} icon="group" color="text-white" />
          <StatCard label="Participants" value={stats.by_role?.participant ?? 0} icon="person" color="text-blue-400" />
          <StatCard label="Active" value={stats.active ?? 0} icon="check_circle" color="text-green-400" />
          <StatCard label="Inactive" value={stats.inactive ?? 0} icon="block" color="text-red-400" />
        </div>
      )}

      {/* Filters */}
      <div className="border border-[#2a2a2b] bg-[#1a1a1c] p-4 rounded flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full">
          <span className="text-sm font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            FILTER:
          </span>
          <select value={filters.role} onChange={(e) => { setFilters({...filters, role: e.target.value}); setPage(1); }} className={selectClass}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="host">Host</option>
            <option value="participant">Participant</option>
          </select>
          <select value={filters.is_active} onChange={(e) => { setFilters({...filters, is_active: e.target.value}); setPage(1); }} className={selectClass}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="text-sm font-bold text-gray-500 tracking-wider shrink-0">
          {pagination ? `${pagination.total} USERS` : '...'}
        </div>
      </div>

      {/* Users Table */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#1a1a1c] rounded border border-[#2a2a2b] animate-pulse" />
          ))
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <span className="material-symbols-outlined text-[48px] mb-4 block">group_off</span>
            <p className="font-bold text-lg">No users found</p>
            <p className="text-sm mt-2">Create users to get started</p>
          </div>
        ) : (
          users.map((user) => {
            const rc = roleConfig[user.role] || roleConfig.participant;
            return (
              <div key={user.id} className={`border bg-[#1a1a1c] rounded p-4 hover:border-[#4a4456] transition-colors group ${
                user.is_active ? 'border-[#2a2a2b]' : 'border-red-900/30 opacity-70'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex gap-4 flex-1 min-w-0 items-center">
                    {/* Avatar */}
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${rc.bg} border ${rc.border}`}>
                      <span className={`material-symbols-outlined text-[18px] ${rc.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{rc.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold truncate">{user.name}</p>
                        {user.username && (
                          <span className="text-[10px] font-mono font-bold text-[#7a33ff] bg-[#7a33ff]/10 px-2 py-0.5 rounded">
                            @{user.username}
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/50 text-red-400">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-full border ${rc.bg} ${rc.border} ${rc.text}`}>
                          {user.role}
                        </span>
                        {user.institution && (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-full border border-[#4a4456] bg-[#2a2a2b] text-gray-300">
                            {user.institution}
                          </span>
                        )}
                        {user.team_name && (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-full border border-[#4a4456] bg-[#2a2a2b] text-[#ffc703]">
                            {user.team_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingUser(user)} 
                      className="p-2 hover:bg-[#2a2a2b] rounded transition-colors text-gray-400 hover:text-white"
                      title="Edit user"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => toggleActive(user)} 
                      className={`p-2 hover:bg-[#2a2a2b] rounded transition-colors ${user.is_active ? 'text-gray-400 hover:text-orange-400' : 'text-gray-400 hover:text-green-400'}`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {user.is_active ? 'person_off' : 'person_check'}
                      </span>
                    </button>
                    <button 
                      onClick={() => deleteUser(user.id)} 
                      className="p-2 hover:bg-[#450a0a] rounded transition-colors text-gray-400 hover:text-red-400"
                      title="Delete user"
                    >
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

function StatCard({ label, value, icon, color }) {
  return (
    <div className="border border-[#2a2a2b] bg-[#1a1a1c] rounded-lg p-4 relative overflow-hidden group hover:border-[#4a4456] transition-colors">
      <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-[32px] md:text-[40px] font-black font-display-lg leading-none ${color}`}>{value}</p>
      <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[50px] text-white opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </div>
  );
}
