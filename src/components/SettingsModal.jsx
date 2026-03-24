import { useState, useRef, useCallback } from 'react';
import {
  X, Gear, PlusCircle, Plus, PencilSimple, Trash, SpinnerGap,
} from '@phosphor-icons/react';
import { supabase } from '../utils/supabaseClient';

// Default title mapping for built-in dict keys
const BUILTIN_TITLES = {
  sales: 'Sales',
  pm: 'PM',
  reqType: 'Type',
  product: 'Cat.',
  stage: 'Stage',
};

// DB category key mapping (reqType <-> reqtype)
const toCategoryDb = (key) => key === 'reqType' ? 'reqtype' : key;
const fromCategoryDb = (cat) => cat === 'reqtype' ? 'reqType' : cat;

export default function SettingsModal({ isOpen, onClose, dictionary, setDictionary, onDictionaryChanged }) {
  const [currentDict, setCurrentDict] = useState('sales');
  const [saving, setSaving] = useState(false);
  const dragIdxRef = useRef(-1);

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
    const label = window.prompt(`請輸入新的 [${currentTitle}] 顯示名稱：`);
    if (!label) return;
    const code = window.prompt('請輸入系統代號 (Code，可留空由系統自定)：', label.substring(0, 2).toUpperCase());
    const newItem = { label, code: code || label, email: '' };
    if (currentDict === 'sales' || currentDict === 'pm') {
      const email = window.prompt('請輸入此人員的登入信箱 (Email)：', '');
      newItem.email = email || '';
    }
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
      alert('✅ 選項已新增');
    } catch (err) {
      console.error('Add item error:', err.message);
      alert('⚠️ 新增失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }, [currentDict, currentTitle, currentItems, onDictionaryChanged]);

  const editItem = useCallback(async (index) => {
    const item = currentItems[index];
    if (!item) return;
    const newLabel = window.prompt('編輯顯示名稱 (Label)：', item.label);
    if (!newLabel) return;
    const newCode = window.prompt('編輯代號 (Code)：', item.code);
    const updated = { label: newLabel, code: newCode || item.code };
    if (currentDict === 'sales' || currentDict === 'pm') {
      const newEmail = window.prompt('編輯登入信箱 (Email)：', item.email || '');
      updated.email = newEmail || '';
    }
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
      await onDictionaryChanged?.();
      alert('✅ 選項已更新');
    } catch (err) {
      console.error('Edit item error:', err.message);
      alert('⚠️ 更新失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }, [currentDict, currentItems, setDictionary, onDictionaryChanged]);

  const deleteItem = useCallback(async (index) => {
    const item = currentItems[index];
    if (!item) return;
    if (!window.confirm(`確定要刪除選項「${item.label}」嗎？`)) return;

    if (!item._dbId) {
      // Legacy local-only item
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
      alert('✅ 選項已刪除');
    } catch (err) {
      console.error('Delete item error:', err.message);
      alert('⚠️ 刪除失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }, [currentDict, currentItems, setDictionary, onDictionaryChanged]);

  const addCategory = useCallback(() => {
    const name = window.prompt('請輸入新字典類別名稱 (例如：地區)：');
    if (!name) return;
    const key = 'custom_dict_' + Date.now();
    setDictionary(prev => ({ ...prev, [key]: Object.assign([], { _title: name }) }));
    setCurrentDict(key);
  }, [setDictionary]);

  const deleteCategory = useCallback(async (key) => {
    if (!window.confirm(`警告：確定要刪除「${dictTitles[key]}」字典類別嗎？`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('dictionaries').delete().eq('category', toCategoryDb(key));
      if (error) throw error;
      await onDictionaryChanged?.();
    } catch (err) {
      console.error('Delete category error:', err.message);
      // Fallback: still remove locally
      setDictionary(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setSaving(false);
    }
    setCurrentDict('sales');
  }, [dictTitles, setDictionary, onDictionaryChanged]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="relative bg-white rounded-md shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[85vh] pointer-events-auto animate-in"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-[#111827] text-white shrink-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gear size={20} weight="fill" className="text-gray-300" />
              管理：{currentTitle}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 overflow-hidden min-h-[450px]">
            {/* Left Sidebar — Dict Tabs */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
              <div className="p-3 flex flex-col gap-0.5 overflow-y-auto flex-1">
                {Object.keys(dictTitles).map(key => {
                  const isActive = key === currentDict;
                  const isCustom = key.startsWith('custom_dict_');
                  return (
                    <div key={key} className="flex items-center group relative w-full">
                      <button
                        onClick={() => setCurrentDict(key)}
                        className={`flex-1 text-left px-3 py-2 text-sm font-medium rounded transition-colors truncate pr-8 cursor-pointer ${
                          isActive
                            ? 'bg-brand-100 text-brand-700'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {dictTitles[key]}
                      </button>
                      {isCustom && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCategory(key); }}
                          className="absolute right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/50"
                          title="刪除此字典與關聯欄位"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-100/50">
                <button
                  onClick={addCategory}
                  className="w-full bg-white border border-brand-300 hover:bg-brand-50 text-brand-700 px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PlusCircle size={16} /> 新增字典類別
                </button>
              </div>
            </div>

            {/* Right Content — Dict Table */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-gray-500">
                  此設定將即時同步到表單下拉選單、篩選器與總表文字。<br />
                  💡 提示：按住左側的數字即可拖曳排序選項。
                </p>
                <button
                  onClick={addItem}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Plus size={14} /> 新增選項
                </button>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf9f8] border-b border-gray-200 text-xs text-gray-500 uppercase select-none">
                    <tr>
                      <th className="px-4 py-2 w-12 text-center">順序</th>
                      <th className="px-4 py-2">顯示名稱 (Label)</th>
                      <th className="px-4 py-2">系統代碼 (Code)</th>
                      {hasEmailField && <th className="px-4 py-2">登入信箱 (Email)</th>}
                      <th className="px-4 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={hasEmailField ? 5 : 4} className="px-4 py-8 text-center text-gray-400 text-sm">
                          目前沒有任何選項，請點擊上方新增。
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item, index) => (
                        <tr
                          key={`${item.code}-${index}`}
                          className="hover:bg-gray-50 transition-colors cursor-grab"
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-gray-100'); }}
                          onDragLeave={e => e.currentTarget.classList.remove('bg-gray-100')}
                          onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-gray-100'); handleDrop(index); }}
                          onDragEnd={() => { dragIdxRef.current = -1; }}
                        >
                          <td className="px-4 py-2 text-center text-gray-400 w-12 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-800">{item.label}</td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.code}</td>
                          {hasEmailField && <td className="px-4 py-2 text-xs text-gray-500">{item.email || <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold border border-yellow-300">⚠️ 未設定</span>}</td>}
                          <td className="px-4 py-2 text-right w-24">
                            <button
                              onClick={() => editItem(index)}
                              className="text-gray-400 hover:text-brand-600 p-1 transition-colors"
                            >
                              <PencilSimple size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem(index)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-200 bg-[#faf9f8] rounded-b flex items-center justify-between shrink-0">
            {saving && (
              <span className="flex items-center gap-1.5 text-xs text-brand-600">
                <SpinnerGap size={14} className="animate-spin" /> 儲存中...
              </span>
            )}
            {!saving && <span />}
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              完成設定
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
