import { useState, useEffect } from 'react';
import { EnvelopeSimple, Lock, SignIn, UserPlus } from '@phosphor-icons/react';
import { supabase } from '../utils/supabaseClient';
import { version } from '../../package.json';

const ALLOWED_DOMAIN = '@metaage.com.tw';
const LS_KEY = 'rememberedEmail';

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 載入時檢查 localStorage 是否有記住的 Email
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return alert('請輸入 Email 與密碼');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
          alert('抱歉，僅限內部員工網域註冊！');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('註冊成功！請至信箱收取驗證信，驗證後即可登入。');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // 登入成功：記住 / 清除 Email
        if (rememberMe) {
          localStorage.setItem(LS_KEY, email);
        } else {
          localStorage.removeItem(LS_KEY);
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4 selection:bg-blue-200 selection:text-blue-900">
      <div className="w-full max-w-[420px]">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <img src="/mtglogo.png" alt="MetaAge Logo" className="h-16 w-auto mx-auto mb-6 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide">Pipeline Portal</h1>
          <p className="text-sm text-gray-500 mt-1">MetaAge Pipeline Management System</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#0078d4] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SignIn size={16} /> 登入
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#0078d4] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus size={16} /> 註冊
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@metaage.com.tw"
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#0078d4] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#0078d4] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Remember Me (login only) */}
            {mode === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0078d4] focus:ring-blue-200 cursor-pointer"
                />
                <span className="text-sm text-gray-600">記住我的 Email</span>
              </label>
            )}

            {/* Whitelist hint for signup */}
            {mode === 'signup' && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                ⚠️ 僅限 <strong>{ALLOWED_DOMAIN}</strong> 網域信箱註冊。註冊後需至信箱點擊驗證連結。
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {loading ? '處理中...' : mode === 'login' ? '登入系統' : '建立帳號'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 MetaAge — Pipeline Portal v{version}
          </p>
        </div>
      </div>
    </div>
  );
}
