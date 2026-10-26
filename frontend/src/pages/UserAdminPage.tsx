import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Lock, 
  Key,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const UserAdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'Analyst' as UserRole,
  });

  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getUsers();
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Access denied or failed to retrieve accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.admin.createUser(newUser);
      setSuccessMsg(`User ${newUser.username} registered with role ${newUser.role}.`);
      setIsCreateModalOpen(false);
      setNewUser({ username: '', email: '', password: '', full_name: '', role: 'Analyst' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.admin.updateUser(userId, { role: newRole });
      setSuccessMsg(`Role updated to ${newRole}.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Role modification failed.');
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id && targetUser.is_active) {
      setError('Self-deactivation is prohibited to prevent administrator lockout.');
      return;
    }
    try {
      await api.admin.updateUser(targetUser.id, { is_active: !targetUser.is_active });
      setSuccessMsg(`Account for ${targetUser.username} ${!targetUser.is_active ? 'activated' : 'deactivated'}.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Status update failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
              USER & ROLE ADMINISTRATION
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700/60 font-mono font-bold">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Server-enforced role-based access control, account provisioning, and privilege management.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-1.5 rounded bg-[#ff9933] text-xs font-bold text-[#0a0f0d] hover:bg-[#ffa94d] transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision New Officer</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 font-bold">×</button>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#f8fafc]">
            Authorized Operational Accounts ({users.length})
          </h2>
          <span className="text-[11px] text-[#64748b]">Least-privilege server enforcement</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#94a3b8]">Retrieving account records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">User ID</th>
                  <th className="px-4 py-2.5">Officer Name</th>
                  <th className="px-4 py-2.5">Username & Email</th>
                  <th className="px-4 py-2.5">Operational Role</th>
                  <th className="px-4 py-2.5">Account State</th>
                  <th className="px-4 py-2.5">Last Login (UTC)</th>
                  <th className="px-4 py-2.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#0f172a]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#ff9933]">#{u.id}</td>
                      <td className="px-4 py-3 font-semibold text-[#f8fafc]">
                        {u.full_name}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-[#ff9933]/20 text-[#ff9933] border border-[#ff9933]/30">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#94a3b8]">
                        <div>{u.username}</div>
                        <div className="text-[10px] text-[#64748b]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 rounded bg-[#070c18] border border-[#1e293b] font-mono text-xs text-[#38bdf8]"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Analyst">Analyst</option>
                          <option value="Reviewer">Reviewer</option>
                          <option value="Read-only Observer">Read-only Observer</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-red-400">
                            <XCircle className="w-3 h-3" /> INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#64748b]">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isCurrent && u.is_active}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                            u.is_active
                              ? 'bg-red-950/40 text-red-300 border-red-800/40 hover:bg-red-900/50'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/50'
                          } disabled:opacity-40`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Officer Account"
        subtitle="Registers credentials hashed with PBKDF2-HMAC-SHA256 (600k iterations)"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[#94a3b8] block mb-1">Full Name & Rank</label>
            <input
              type="text"
              placeholder="e.g. Maj. S. K. Verma"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              required
              className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#94a3b8] block mb-1">Username</label>
              <input
                type="text"
                placeholder="officer.handle"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              />
            </div>
            <div>
              <label className="text-[#94a3b8] block mb-1">Official Email</label>
              <input
                type="email"
                placeholder="name@sentinel.defence.local"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#94a3b8] block mb-1">Initial Secure Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              />
            </div>
            <div>
              <label className="text-[#94a3b8] block mb-1">Operational Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              >
                <option value="Administrator">Administrator</option>
                <option value="Analyst">Analyst</option>
                <option value="Reviewer">Reviewer</option>
                <option value="Read-only Observer">Read-only Observer</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#ff9933] text-[#0a0f0d] font-bold"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
