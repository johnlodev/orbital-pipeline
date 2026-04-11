import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Gear, PlusCircle, Plus, PencilSimple, Trash, SpinnerGap, DotsSixVertical,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabaseClient';
import { getBadgeStyle } from './Badges';

// Default title mapping for built-in dict keys
const BUILTIN_TITLES = {
  sales: 'Sales',
  pm: 'PM',
  reqType: 'Type',
  product: 'Cat.',
  stage: 'Stage',
  segment: 'Segment',
  salesStage: 'Sales Stage',
};

// DB category key mapping (reqType <-> reqtype)
const toCategoryDb = (key) => {
  if (key === 'reqType') return 'reqtype';
  if (key === 'salesStage') return 'salesStage';
  return key;
};
const fromCategoryDb = (cat) => cat === 'reqtype' ? 'reqType' : cat;

export default function SettingsModal({ isOpen, onClose, dictionary, setDictionary, onDictionaryChanged, onDataChanged, showConfirm }) {
  const [currentDict, setCurrentDict] = useState('sales');
  const [saving, setSaving] = useState(false);
  const dragIdxRef = useRef(-1);

  // ── Custom Prompt Modal state ──
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptFields, setPromptFields] = useState([]);   // [{ key, label, defaultValue, placeholder }]
  const [promptValues, setPromptValues] = useState({});
  const [promptTitle, setPromptTitle] = useState('');
  const promptResolveRef = useRef(null);

  /** Opens a custom prompt modal. Returns a Promise that resolves to form values or null (cancelled). */
  function openPrompt(title, fields) {
    return new Promise(resolve => {
      const defaults = {};
      fields.forEach(f => { defaults[f.key] = f.defaultValue || ''; });
      setPromptTitle(title);
      setPromptFields(fields);
      setPromptValues(defaults);
      setPromptOpen(true);
      promptResolveRef.current = resolve;
    });
  }
  function handlePromptConfirm() {
    setPromptOpen(false);
    promptResolveRef.current?.(promptValues);
    promptResolveRef.current = null;
  }
  function handlePromptCancel() {
    setPromptOpen(false);
    promptResolveRef.current?.(null);
    promptResolveRef.current = null;
  }

  // Derive titles from dictionary keys (built-in + custom)
  const dictTitles = {};
  for (const key of Object.keys(dictionary)) {
    dictTitles[key] = BUILTIN_TITLES[key] || dictionary[key]._title || key;
  }

  const currentItems = dictionary[currentDict] || [];
  const currentTitle = dictTitles[currentDict] || currentDict;

  // --- Handlers (Supabase-backed) ---
  const hasEmailField = currentDict === 'sales' || currentDict === 'pm';

  const addItem = useCallback(async () => {
    const fields = [
      { key: 'label', label: '顯示名稱', placeholder: '例如：王小明' },
      { key: 'code', label: '系統代號 (Code)', placeholder: '可留空由系統自定' },
    ];
    if (currentDict === 'sales' || currentDict === 'pm') {
      fields.push({ key: 'email', label: '登入信箱 (Email)', placeholder: 'user@metaage.com.tw' });
    }
    const result = await openPrompt(`新增 [${currentTitle}] 選項`, fields);
    if (!result || !result.label?.trim()) return;
    const newItem = { label: result.label.trim(), code: (result.code?.trim() || result.label.trim()), email: result.email?.trim() || '' };
    setSaving(true);
    try {
      const maxOrder = currentItems.length;
      const { error } = await supabase.from('dictionaries').insert({
        category: toCategoryDb(currentDict),
        code: newItem.code,
        label: newItem.label,
        email: newItem.email,
        sort_order: maxOrder,
      });
      if (error) throw error;
      await onDictionaryChanged?.();
      toast.success('選項已新增');
    } catch (err) {
      console.error('Add item error:', err.message);
      toast.error('新增失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }, [currentDict, currentTitle, currentItems, onDictionaryChanged]);

  const editItem = useCallback(async (index) => {
    const item = currentItems[index];
    if (!item) return;
    const fields = [
      { key: 'label', label: '顯示名稱 (Label)', defaultValue: item.label },
      { key: 'code', label: '代號 (Code)', defaultValue: item.code },
    ];
    if (currentDict === 'sales' || currentDict === 'pm') {
      fields.push({ key: 'email', label: '登入信箱 (Email)', defaultValue: item.email || '' });
    }
    const result = await openPrompt(`編輯 [${currentTitle}] 選項`, fields);
    if (!result || !result.label?.trim()) return;
    const updated = { label: result.label.trim(), code: result.code?.trim() || item.code };
    if (result.email !== undefined) updated.email = result.email.trim();
    if (!item._dbId) {
      // Legacy local-only item, update state only
      setDictionary(prev => {
        const arr = [...prev[currentDict]];
        arr[index] = { ...arr[index], ...updated };
        return { ...prev, [currentDict]: arr };
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('dictionaries').update({
        label: updated.label,
        code: updated.code,
        ...(updated.email !== undefined ? { email: updated.email } : {}),
      }).eq('id', item._dbId);
      if (error) throw error;

      // ── Code 變更 → 同步更新 pipeline 資料表 ──
      const oldCode = item.code;
      const finalCode = updated.code;
      if (oldCode !== finalCode) {
        // 將 pipeline 表中該欄位的舊 code 全部替換為新 code
        const dbField = currentDict === 'reqType' ? 'reqtype' : currentDict;
        const { error: pipeErr } = await supabase
          .from('pipeline')
          .update({ [dbField]: finalCode })
          .eq(dbField, oldCode);
        if (pipeErr) {
          console.error('Pipeline sync error:', pipeErr.message);
          toast.warning('字典已更新，但同步更新商機資料失敗：' + pipeErr.message);
        }
        // 重新拉取 pipeline 資料
        await onDataChanged?.();
      }

      await onDictionaryChanged?.();
      toast.success('選項已更新');
    } catch (err) {
      console.error('Edit item error:', err.message);
      toast.error('更新失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }, [currentDict, currentItems, setDictionary, onDictionaryChanged, onDataChanged]);

  const deleteItem = useCallback(async (index) => {
    const item = currentItems[index];
    if (!item) return;
    showConfirm?.(`確定要刪除選項「${item.label}」嗎？`, async () => {
      if (!item._dbId) {
        setDictionary(prev => ({
          ...prev,
          [currentDict]: prev[currentDict].filter((_, i) => i !== index),
        }));
        return;
      }
      setSaving(true);
      try {
        const { error } = await supabase.from('dictionaries').delete().eq('id', item._dbId);
        if (error) throw error;
        await onDictionaryChanged?.();
        toast.success('選項已刪除');
      } catch (err) {
        console.error('Delete item error:', err.message);
        toast.error('刪除失敗：' + err.message);
      } finally {
        setSaving(false);
      }
    });
  }, [currentDict, currentItems, setDictionary, onDictionaryChanged, showConfirm]);

  const addCategory = useCallback(async () => {
    const result = await openPrompt('新增項目類別', [
      { key: 'key', label: '類別英文代碼 (系統 key)', placeholder: '例如：industry' },
      { key: 'title', label: '類別中文名稱', placeholder: '例如：產業別' },
    ]);
    if (!result || !result.key?.trim()) return;
    const key = result.key.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      toast.error('代碼格式不正確！請使用小寫英文開頭，僅可含小寫英文、數字與底線。');
      return;
    }
    if (BUILTIN_TITLES[key] || dictionary[key]) {
      toast.error('此代碼已存在，請使用其他名稱。');
      return;
    }
    const title = result.title?.trim();
    if (!title) return;

    setSaving(true);
    try {
      // 寫入一筆 __meta__ row 來記錄自訂類別的顯示名稱
      const { error } = await supabase.from('dictionaries').insert({
        category: key,
        code: '__meta__',
        label: title,
        sort_order: -1,
      });
      if (error) throw error;
      await onDictionaryChanged?.();
      setCurrentDict(key);
      toast.success(`已新增項目類別「${title}」`);
    } catch (err) {
      console.error('Add category error:', err.message);
      toast.error('新增類別失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }, [dictionary, onDictionaryChanged]);

  const deleteCategory = useCallback(async (key) => {
    showConfirm?.(`警告：確定要刪除「${dictTitles[key]}」字典類別嗎？`, async () => {
      setSaving(true);
      try {
        const { error } = await supabase.from('dictionaries').delete().eq('category', toCategoryDb(key));
        if (error) throw error;
        await onDictionaryChanged?.();
      } catch (err) {
        console.error('Delete category error:', err.message);
        setDictionary(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } finally {
        setSaving(false);
      }
      setCurrentDict('sales');
    });
  }, [dictTitles, setDictionary, onDictionaryChanged, showConfirm]);

  // --- Drag & Drop reorder (persists to DB) ---
  function handleDragStart(index) {
    dragIdxRef.current = index;
  }

  async function handleDrop(targetIndex) {
    const fromIndex = dragIdxRef.current;
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    // Optimistic UI
    setDictionary(prev => {
      const items = [...prev[currentDict]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, [currentDict]: items };
    });
    dragIdxRef.current = -1;

    // Persist new sort_order to DB
    try {
      const reordered = [...currentItems];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      const updates = reordered
        .filter(item => item._dbId)
        .map((item, i) => supabase.from('dictionaries').update({ sort_order: i }).eq('id', item._dbId));
      await Promise.all(updates);
    } catch (err) {
      console.error('Reorder error:', err.message);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative bg-slate-50 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[95%] md:max-w-4xl flex flex-col overflow-hidden max-h-[85vh] pointer-events-auto border border-slate-200/80"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center glass shrink-0 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Gear size={20} weight="fill" className="text-brand-500" />
              管理：{currentTitle}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors duration-200 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:min-h-[450px]">
            {/* Left Sidebar — Dict Tabs (horizontal scroll on mobile, vertical on desktop) */}
            <div className="md:w-64 bg-slate-100/50 md:border-r border-b md:border-b-0 border-slate-200/60 flex md:flex-col shrink-0">
              <div className="p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:flex-1 whitespace-nowrap md:whitespace-normal">
                {Object.keys(dictTitles).map(key => {
                  const isActive = key === currentDict;
                  const isCustom = !BUILTIN_TITLES[key];
                  return (
                    <div key={key} className="flex items-center group relative w-full">
                      <button
                        onClick={() => setCurrentDict(key)}
                        className={`flex-1 text-left px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 truncate pr-8 cursor-pointer border ${
                          isActive
                            ? 'bg-white text-brand-600 shadow-[var(--shadow-soft-sm)] border-slate-200/60'
                            : 'text-slate-600 hover:bg-slate-100 border-transparent'
                        }`}
                        title={dictTitles[key]}
                      >
                        {dictTitles[key]}
                      </button>
                      {isCustom && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCategory(key); }}
                          className="absolute right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/70 cursor-pointer"
                          title="刪除此字典與關聯欄位"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-2 md:p-3 border-t md:border-t border-slate-100 shrink-0">
                <button
                  onClick={addCategory}
                  className="w-full bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-600 hover:text-brand-600 px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-[var(--shadow-soft-xs)] cursor-pointer"
                >
                  <PlusCircle size={16} /> 新增項目類別
                </button>
              </div>
            </div>

            {/* Right Content — Dict List */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-slate-500">
                  此設定將即時同步到表單下拉選單、篩選器與總表文字。<br />
                  💡 提示：拖曳左側把手即可排序選項。
                </p>
                <button
                  onClick={addItem}
                  className="bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors duration-200 flex items-center gap-1.5 shadow-[var(--shadow-soft-xs)] shrink-0 cursor-pointer"
                >
                  <Plus size={14} /> 新增選項
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {currentItems.length === 0 ? (
                  <div className="px-4 py-12 text-center text-slate-400 text-sm rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    目前沒有任何選項，請點擊上方新增。
                  </div>
                ) : (
                  currentItems.map((item, index) => {
                    const shouldColorize = ['reqType', 'product', 'stage'].includes(currentDict);
                    const badgeCls = shouldColorize ? getBadgeStyle(item.code) : '';
                    const textColor = shouldColorize ? (badgeCls.split(' ').find(c => c.startsWith('text-')) || 'text-slate-700') : 'text-slate-700';
                    const bgColor = shouldColorize ? (badgeCls.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-200') : 'bg-slate-200';
                    return (
                    <div
                      key={`${item.code}-${index}`}
                      className="bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between group hover:shadow-[var(--shadow-soft-sm)] hover:border-slate-200 transition-[color,background-color,border-color,box-shadow] duration-200"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-brand-200', 'border-brand-200'); }}
                      onDragLeave={e => { e.currentTarget.classList.remove('ring-2', 'ring-brand-200', 'border-brand-200'); }}
                      onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-brand-200', 'border-brand-200'); handleDrop(index); }}
                      onDragEnd={() => { dragIdxRef.current = -1; }}
                    >
                      {/* Drag Handle + Index */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors shrink-0">
                          <DotsSixVertical size={18} weight="bold" />
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 w-5 text-center shrink-0">{index + 1}</span>
                        {shouldColorize && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${bgColor} ring-1 ring-inset ring-current/20`} />}
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium truncate ${textColor}`} title={item.label}>{item.label}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[11px] font-mono truncate ${shouldColorize ? `opacity-70 ${textColor}` : 'text-slate-400'}`} title={item.code}>{item.code}</span>
                            {hasEmailField && (
                              item.email
                                ? <span className="text-[11px] text-slate-400 truncate" title={item.email}>· {item.email}</span>
                                : <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-medium border border-amber-200/60">未設定信箱</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 ml-3">
                        <button
                          onClick={() => editItem(index)}
                          className="text-slate-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-brand-50 transition-colors duration-200 cursor-pointer"
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          onClick={() => deleteItem(index)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-slate-100 glass rounded-b-2xl flex items-center justify-between shrink-0">
            {saving && (
              <span className="flex items-center gap-1.5 text-xs text-brand-600">
                <SpinnerGap size={14} className="animate-spin" /> 儲存中...
              </span>
            )}
            {!saving && <span />}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="relative overflow-hidden px-6 py-2 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-glow-brand)] transition-shadow duration-300 cursor-pointer"
            >
              <span className="absolute inset-0 shimmer pointer-events-none" />
              <span className="relative z-10">完成設定</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── Custom Prompt Modal (replaces window.prompt) ── */}
      <AnimatePresence>
        {promptOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm"
              onClick={handlePromptCancel}
            />
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 12 }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{promptTitle}</h3>
                <div className="flex flex-col gap-3">
                  {promptFields.map((f, i) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                      <input
                        autoFocus={i === 0}
                        className="w-full bg-slate-50/80 border border-transparent rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 outline-none transition-colors duration-200"
                        placeholder={f.placeholder || ''}
                        value={promptValues[f.key] || ''}
                        onChange={e => setPromptValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handlePromptConfirm(); }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3 mt-5">
                  <button
                    onClick={handlePromptCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePromptConfirm}
                    className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors duration-200 shadow-sm"
                  >
                    確定
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
