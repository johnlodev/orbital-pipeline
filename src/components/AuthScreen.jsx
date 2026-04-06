import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeSimple, Lock, SignIn, UserPlus, X, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';
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
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
    if (!email || !password) return toast.error('請輸入 Email 與密碼');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
          toast.error('抱歉，僅限內部員工網域註冊！');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('註冊成功！請至信箱收取驗證信，驗證後即可登入。');
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
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formVariants = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] px-4 selection:bg-blue-200 selection:text-blue-900 relative overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-brand-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/25 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[300px] h-[300px] rounded-full bg-sky-100/40 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <img src="/mtglogo.png" alt="MetaAge Logo" className="h-16 w-auto mx-auto mb-6 object-contain drop-shadow-sm" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">Pipeline Portal</h1>
          <p className="text-sm text-slate-500 mt-1">MetaAge Pipeline Management System</p>
        </div>

        {/* Form Card — Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-8">
          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-slate-100/80 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-brand-600 shadow-[var(--shadow-soft-sm)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <SignIn size={16} /> 登入
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-brand-600 shadow-[var(--shadow-soft-sm)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus size={16} /> 註冊
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@metaage.com.tw"
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-transparent rounded-xl text-sm text-slate-700 placeholder-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-transparent rounded-xl text-sm text-slate-700 placeholder-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Remember Me (login only) */}
              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600">記住我的 Email</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setShowForgot(true); }}
                    className="text-sm text-slate-400 hover:text-brand-600 transition-colors duration-200 cursor-pointer"
                  >
                    忘記密碼？
                  </button>
                </div>
              )}

              {/* Whitelist hint for signup */}
              {mode === 'signup' && (
                <p className="text-[11px] text-amber-600 bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-2">
                  ⚠️ 僅限 <strong>{ALLOWED_DOMAIN}</strong> 網域信箱註冊。註冊後需至信箱點擊驗證連結。
                </p>
              )}

              {/* Submit — ShimmerButton */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden w-full py-2.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-glow-brand)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
              >
                <span className="absolute inset-0 shimmer pointer-events-none" />
                <span className="relative z-10">{loading ? '處理中...' : mode === 'login' ? '登入系統' : '建立帳號'}</span>
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            © 2026 MetaAge — Pipeline Portal v{version}
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setShowForgot(false)}
            />
            <div className="fixed inset-0 z-[55] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 w-full max-w-[400px] p-6 pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">忘記密碼</h2>
                  <button onClick={() => setShowForgot(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors duration-200 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">請輸入您的 Email，我們將寄送密碼重設連結至您的信箱。</p>
                <div className="relative mb-4">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@metaage.com.tw"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-transparent rounded-xl text-sm text-slate-700 placeholder-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 outline-none transition-colors duration-200"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    if (!forgotEmail) return toast.error('請輸入 Email');
                    setForgotLoading(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
                      if (error) throw error;
                      toast.success('密碼重設信件已寄出，請至信箱查收。');
                      setShowForgot(false);
                    } catch (err) {
                      toast.error('寄送失敗：' + err.message);
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  disabled={forgotLoading}
                  className="relative overflow-hidden w-full py-2.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-glow-brand)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="absolute inset-0 shimmer pointer-events-none" />
                  <span className="relative z-10">{forgotLoading ? '寄送中...' : '發送重設信件'}</span>
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
