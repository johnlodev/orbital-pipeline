import { useState, useRef, useCallback } from 'react';
import {
  X, Gear, PlusCircle, Plus, PencilSimple, Trash,
} from '@phosphor-icons/react';

// Default title mapping for built-in dict keys
const BUILTIN_TITLES = {
  sales: 'Sales',
  pm: 'PM',
  reqType: 'Type',
  product: 'Cat.',
  stage: 'Stage',
};

export default function SettingsModal({ isOpen, onClose, dictionary, setDictionary }) {
  const [currentDict, setCurrentDict] = useState('sales');
  const dragIdxRef = useRef(-1);

  // Derive titles from dictionary keys (built-in + custom)
  const dictTitles = {};
  for (const key of Object.keys(dictionary)) {
    dictTitles[key] = BUILTIN_TITLES[key] || dictionary[key]._title || key;
  }

  const currentItems = dictionary[currentDict] || [];
  const currentTitle = dictTitles[currentDict] || currentDict;

  // --- Handlers ---
  const addItem = useCallback(() => {
    const label = window.prompt(`請輸入新的 [${currentTitle}] 顯示名稱：`);
    if (!label) return;
    const code = window.prompt('請輸入系統代號 (Code，可留空由系統自定)：', label.substring(0, 2).toUpperCase());
    setDictionary(prev => ({
      ...prev,
      [currentDict]: [...(prev[currentDict] || []), { label, code: code || label }],
    }));
  }, [currentDict, currentTitle, setDictionary]);

  const editItem = useCallback((index) => {
    const item = currentItems[index];
    if (!item) return;
    const newLabel = window.prompt('編輯顯示名稱 (Label)：', item.label);
    if (!newLabel) return;
    const newCode = window.prompt('編輯代號 (Code)：', item.code);
    setDictionary(prev => {
      const updated = [...prev[currentDict]];
      updated[index] = { label: newLabel, code: newCode || item.code };
      return { ...prev, [currentDict]: updated };
    });
  }, [currentDict, currentItems, setDictionary]);

  const deleteItem = useCallback((index) => {
    const item = currentItems[index];
    if (!item) return;
    if (!window.confirm(`確定要刪除選項「${item.label}」嗎？`)) return;
    setDictionary(prev => ({
      ...prev,
      [currentDict]: prev[currentDict].filter((_, i) => i !== index),
    }));
  }, [currentDict, currentItems, setDictionary]);

  const addCategory = useCallback(() => {
    const name = window.prompt('請輸入新字典類別名稱 (例如：地區)：');
    if (!name) return;
    const key = 'custom_dict_' + Date.now();
    setDictionary(prev => ({ ...prev, [key]: Object.assign([], { _title: name }) }));
    setCurrentDict(key);
  }, [setDictionary]);

  const deleteCategory = useCallback((key) => {
    if (!window.confirm(`警告：確定要刪除「${dictTitles[key]}」字典類別嗎？`)) return;
    setDictionary(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCurrentDict('sales');
  }, [dictTitles, setDictionary]);

  // --- Drag & Drop reorder ---
  function handleDragStart(index) {
    dragIdxRef.current = index;
  }

  function handleDrop(targetIndex) {
    const fromIndex = dragIdxRef.current;
    if (fromIndex === -1 || fromIndex === targetIndex) return;
    setDictionary(prev => {
      const items = [...prev[currentDict]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, [currentDict]: items };
    });
    dragIdxRef.current = -1;
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
                      <th className="px-4 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
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
          <div className="px-6 py-4 border-t border-gray-200 bg-[#faf9f8] rounded-b flex justify-end shrink-0">
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
