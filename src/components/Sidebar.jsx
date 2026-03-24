import { useState } from 'react';
import {
  List,
  Table,
  ChartPieSlice,
  Gear,
  SignOut,
  ShieldCheck,
  LockKey,
  X,
  Lock,
} from '@phosphor-icons/react';
import { supabase } from '../utils/supabaseClient';

const navItems = [
  { key: 'table', label: '商機總表', icon: Table },
  { key: 'dashboard', label: 'Dashboard', icon: ChartPieSlice },
];

export default function Sidebar({ currentView, setCurrentView, onOpenSettings, session, isSuperAdmin }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPw: '', newPw: '', confirmPw: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const userEmail = session?.user?.email || '';
  const displayName = userEmail.split('@')[0] || 'User';

  async function handleChangePassword() {
    const { oldPw, newPw, confirmPw } = pwForm;
    if (!oldPw || !newPw || !confirmPw) return alert('請填寫所有欄位');
    if (newPw !== confirmPw) return alert('新密碼與確認新密碼不一致');
    if (newPw.length < 6) return alert('新密碼長度至少 6 個字元');

    setPwLoading(true);
    try {
      // 驗證原密碼
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: userEmail, password: oldPw });
      if (signInErr) throw new Error('原密碼驗證失敗');

      // 更新密碼
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      alert('✅ 密碼修改成功！');
      setPwForm({ oldPw: '', newPw: '', confirmPw: '' });
      setShowChangePw(false);
    } catch (err) {
      alert('⚠️ ' + err.message);
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <aside
      className={`bg-white border-r border-slate-200 text-slate-600 flex-shrink-0 flex-col z-40 hidden md:flex relative transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 transition-all">
        {!collapsed && (
          <div className="flex items-center overflow-hidden">
            <img src="/mtglogo.png" alt="MetaAge Logo" className="w-8 h-8 object-contain min-w-[24px]" />
            <span className="ml-3 font-bold text-slate-900 text-lg tracking-wide whitespace-nowrap">
              Pipeline Portal
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-slate-400 hover:text-slate-700 focus:outline-none p-1.5 rounded hover:bg-slate-100 transition-colors flex items-center justify-center"
        >
          <List size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              className={`flex items-center p-2.5 rounded-lg transition-colors group relative w-full ${
                isActive
                  ? 'bg-blue-50 text-[#0078d4]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} className="min-w-[24px]" />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer to push settings to bottom */}
        <div className="mt-auto" />

        {/* Admin - SuperAdmin only */}
        {isSuperAdmin && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center p-2.5 rounded-lg transition-colors group relative w-full ${
              currentView === 'admin'
                ? 'bg-red-50 text-red-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            } ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <ShieldCheck size={20} weight={currentView === 'admin' ? 'fill' : 'regular'} className="min-w-[24px]" />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap">
                權限管理
              </span>
            )}
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors group relative w-full mt-2 border-t border-slate-200 pt-3 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Gear size={20} className="min-w-[24px]" />
          {!collapsed && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">
              系統設定
            </span>
          )}
        </button>
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t border-slate-200 flex items-center transition-all ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="relative min-w-[32px]">
          <div className="w-8 h-8 rounded-lg bg-[#0078d4] flex items-center justify-center text-white text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full pointer-events-none" />
        </div>
        {!collapsed && (
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm text-slate-800 font-medium truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setShowChangePw(true)}
            title="修改密碼"
            className="ml-1 p-1.5 rounded text-slate-400 hover:text-[#0078d4] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LockKey size={16} />
          </button>
        )}
        {!collapsed && (
          <button
            onClick={() => supabase.auth.signOut()}
            title="登出"
            className="ml-1 p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <SignOut size={16} />
          </button>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setShowChangePw(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">修改密碼</h2>
              <button onClick={() => setShowChangePw(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { key: 'oldPw', label: '原密碼', placeholder: '請輸入原密碼' },
                { key: 'newPw', label: '新密碼', placeholder: '請輸入新密碼（至少 6 字元）' },
                { key: 'confirmPw', label: '確認新密碼', placeholder: '再次輸入新密碼' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={pwForm[f.key]}
                      onChange={e => setPwForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#0078d4] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>
              ))}
            </div>
            {pwForm.newPw && pwForm.confirmPw && pwForm.newPw !== pwForm.confirmPw && (
              <p className="text-xs text-red-500 mt-2">⚠️ 新密碼與確認新密碼不一致</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="w-full mt-4 py-2.5 bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pwLoading ? '處理中...' : '確認修改'}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
