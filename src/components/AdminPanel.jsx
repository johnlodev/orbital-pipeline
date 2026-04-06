import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, FloppyDisk, Plus, Trash, ArrowsCounterClockwise, SpinnerGap,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabaseClient';

const ROLE_OPTIONS = ['SuperAdmin', 'PM', 'Sales', 'Guest'];
const PERM_FIELDS = ['can_create', 'can_read', 'can_update', 'can_delete'];
const VIEW_FIELDS = [
  { key: 'view_sales_rank', label: '業務排行' },
  { key: 'view_pm_dist',    label: 'PM 績效' },
];

export default function AdminPanel({ onPermissionsChanged, showConfirm }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [newEmail, setNewEmail] = useState('');

  // ── Fetch all permission rows ──
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('email');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('載入權限清單失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Update a single user row ──
  async function handleSave(user) {
    setSaving(user.email);
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({
          role: user.role,
          can_create: user.can_create,
          can_read: user.can_read,
          can_update: user.can_update,
          can_delete: user.can_delete,
          view_sales_rank: user.view_sales_rank,
          view_pm_dist: user.view_pm_dist,
        })
        .eq('email', user.email);
      if (error) throw error;
      toast.success('權限更新成功！');
      onPermissionsChanged?.();
    } catch (err) {
      toast.error('儲存失敗：' + err.message);
    } finally {
      setSaving(null);
    }
  }

  // ── Add a new user ──
  async function handleAdd() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (users.some(u => u.email === email)) {
      toast.error('此信箱已存在清單中。');
      return;
    }
    try {
      const row = { email, role: 'Guest', can_create: false, can_read: true, can_update: false, can_delete: false, view_sales_rank: false, view_pm_dist: false };
      const { error } = await supabase.from('user_permissions').insert(row);
      if (error) throw error;
      setNewEmail('');
      await fetchUsers();
      toast.success('使用者已成功新增！');
    } catch (err) {
      toast.error('新增失敗：' + err.message);
    }
  }

  // ── Delete a user ──
  async function handleDelete(email) {
    showConfirm?.(`確定要移除「${email}」的權限設定嗎？`, async () => {
      try {
        const { error } = await supabase.from('user_permissions').delete().eq('email', email);
        if (error) throw error;
        await fetchUsers();
        toast.success('已成功移除該使用者權限。');
      } catch (err) {
        toast.error('刪除失敗：' + err.message);
      }
    });
  }

  // ── Optimistic local state mutation ──
  function updateLocal(email, field, value) {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, [field]: value } : u));
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-fluent-border px-6 py-4 shrink-0 shadow-sm relative z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 uppercase tracking-wider border border-red-200">Admin</span>
              <span className="text-xs text-gray-500">SuperAdmin 專屬</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">🛡️ 使用者權限管理</h1>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors shadow-sm cursor-pointer"
          >
            <ArrowsCounterClockwise size={16} /> 重新載入
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto dash-scroll">
        {/* Add new user */}
        <div className="bg-white rounded border border-gray-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">新增使用者 Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="name@metaage.com.tw"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-100 outline-none"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> 新增使用者
          </button>
        </div>

        {/* Permission Table */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">載入中...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShieldCheck size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">目前沒有任何權限設定紀錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#faf9f8] border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 w-36">角色 (Role)</th>
                    {PERM_FIELDS.map(f => (
                      <th key={f} className="px-3 py-3 text-center w-24">
                        {f.replace('can_', '').toUpperCase()}
                      </th>
                    ))}
                    {VIEW_FIELDS.map(f => (
                      <th key={f.key} className="px-3 py-3 text-center w-24">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center w-24">儲存</th>
                    <th className="px-3 py-3 text-center w-16">移除</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role || 'Guest'}
                          onChange={e => updateLocal(user.email, 'role', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full bg-white focus:border-brand-500 outline-none cursor-pointer"
                        >
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      {PERM_FIELDS.map(f => (
                        <td key={f} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!user[f]}
                            onChange={e => updateLocal(user.email, f, e.target.checked)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
                          />
                        </td>
                      ))}
                      {VIEW_FIELDS.map(f => (
                        <td key={f.key} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!user[f.key]}
                            onChange={e => updateLocal(user.email, f.key, e.target.checked)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleSave(user)}
                          disabled={saving === user.email}
                          className="p-1.5 rounded text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="儲存變更"
                        >
                          {saving === user.email
                            ? <SpinnerGap size={18} className="animate-spin" />
                            : <FloppyDisk size={18} />}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleDelete(user.email)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="移除使用者"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200 text-xs text-gray-500">
          <p className="font-semibold text-gray-600 mb-2">📋 權限說明</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><strong>CREATE</strong> — 新增商機紀錄、匯入資料</div>
            <div><strong>READ</strong> — 查看總表 & Dashboard</div>
            <div><strong>UPDATE</strong> — 內聯編輯、Drawer 修改</div>
            <div><strong>DELETE</strong> — 刪除單筆 & 批次刪除</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <div><strong>業務排行</strong> — 顯示業務潛在業績榜圖表</div>
            <div><strong>PM 績效</strong> — 顯示 PM 專案負責總額圖表</div>
          </div>
          <p className="mt-2 text-gray-400">角色 SuperAdmin 自動擁有所有權限，不受勾選影響。</p>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
