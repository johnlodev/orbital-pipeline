import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Trash, MagnifyingGlass, Funnel, Columns, CaretUp, CaretDown,
  Plus, MicrosoftExcelLogo, PencilSimple, X, Lock,
} from '@phosphor-icons/react';
import { dictData as defaultDictData } from '../utils/mockData';
import { ProductBadge, StageBadge } from './Badges';

// ===== Initial column definition =====
const INITIAL_COLUMNS = [
  { id: 'enduser',  label: 'EU',      align: 'left',  width: 140, isCustom: false },
  { id: 'si',       label: 'Partner',  align: 'left',  width: 140, isCustom: false },
  { id: 'reqType',  label: 'Type',     align: 'left',  width: 80,  isCustom: false },
  { id: 'product',  label: 'Cat.',     align: 'left',  width: 110, isCustom: false },
  { id: 'sku',      label: 'SKU',      align: 'left',  width: 180, isCustom: false },
  { id: 'quantity', label: 'QTY',      align: 'right', width: 80,  isCustom: false },
  { id: 'amount',   label: 'NTM',      align: 'right', width: 120, isCustom: false },
  { id: 'date',     label: 'POD',      align: 'left',  width: 100, isCustom: false },
  { id: 'stage',    label: 'Stage',    align: 'left',  width: 90,  isCustom: false },
  { id: 'notes',    label: 'Notes',    align: 'left',  width: 200, isCustom: false },
  { id: 'sales',    label: 'Sales',    align: 'left',  width: 100, isCustom: false },
  { id: 'pm',       label: 'PM',       align: 'left',  width: 110, isCustom: false },
];

const DEFAULT_VISIBLE = Object.fromEntries(INITIAL_COLUMNS.map(c => [c.id, true]));
const INITIAL_TABS = [
  { id: 'tab_all', name: '全部', removable: false },
  { id: 'tab_new', name: '新購', removable: true },
  { id: 'tab_add', name: '增購', removable: true },
];
const PAGE_SIZE_OPTIONS = [7, 15, 30, 0]; // 0 = 全部
const USD_RATE = 32;

// ===================================================================
// Main Component
// ===================================================================
export default function PipelineTable({ data, onDelete, onOpenDrawer, onEditRecord, onUpdateRecord, onOpenImport, dictionary, customColumns, setCustomColumns, userRole, currentUserPermissions, currentUserEmail }) {
  const dictData = dictionary || defaultDictData;

  // ── RBAC: 權限過濾 ──
  const isSuperAdmin = currentUserPermissions?.role === 'SuperAdmin';
  const canCreate = isSuperAdmin || !!currentUserPermissions?.can_create;
  const canUpdate = isSuperAdmin || !!currentUserPermissions?.can_update;
  const canDelete = isSuperAdmin || !!currentUserPermissions?.can_delete;
  const canRead   = isSuperAdmin || !!currentUserPermissions?.can_read;
  const isGuest = userRole?.role === 'guest' && !canRead;

  // 判斷是否為該筆紀錄的擁有者（SuperAdmin 不受限）
  function isOwner(row) {
    if (isSuperAdmin) return true;
    return row.created_by_email && currentUserEmail && row.created_by_email.toLowerCase() === currentUserEmail.toLowerCase();
  }

  const rbacData = useMemo(() => {
    if (isGuest) return [];
    if (userRole?.role === 'sales') return data.filter(r => r.sales === userRole.code);
    return data; // PM sees all
  }, [data, userRole, isGuest]);

  function getNameFromDict(dictKey, code) {
    const entry = dictData[dictKey]?.find(d => d.code === code);
    return entry ? entry.label : code;
  }

  // --- (4) Columns state for drag-and-drop reorder (unified: built-in + custom) ---
  const [columns, setColumns] = useState(() => [
    ...INITIAL_COLUMNS,
    ...customColumns.map(c => ({ id: c.id, label: c.name, align: 'left', width: 150, isCustom: true })),
  ]);

  // Sync external customColumns prop into the unified columns state
  useEffect(() => {
    setColumns(prev => {
      const customIds = new Set(customColumns.map(c => c.id));
      const existingIds = new Set(prev.map(c => c.id));
      const kept = prev.filter(c => !c.isCustom || customIds.has(c.id));
      const newCols = customColumns
        .filter(c => !existingIds.has(c.id))
        .map(c => ({ id: c.id, label: c.name, align: 'left', width: 150, isCustom: true }));
      if (newCols.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...newCols];
    });
  }, [customColumns]);

  // --- (5) Column widths state for resizing ---
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(INITIAL_COLUMNS.map(c => [c.id, c.width]))
  );

  // --- Column DnD refs ---
  const dragColRef = useRef(null);

  function handleColDragStart(e, colId) {
    dragColRef.current = colId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    e.currentTarget.classList.add('opacity-50');
  }
  function handleColDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colId !== dragColRef.current) {
      e.currentTarget.classList.add('bg-gray-100');
    }
  }
  function handleColDragLeave(e) {
    e.currentTarget.classList.remove('bg-gray-100');
  }
  function handleColDrop(e, targetId) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');
    const fromId = dragColRef.current;
    if (!fromId || fromId === targetId) return;
    setColumns(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(c => c.id === fromId);
      const toIdx = next.findIndex(c => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }
  function handleColDragEnd(e) {
    e.currentTarget.classList.remove('opacity-50');
    dragColRef.current = null;
  }

  // --- (5) Column resize handler ---
  function handleResizeStart(e, colId) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colId] || 100;

    function onMouseMove(ev) {
      const diff = ev.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColWidths(prev => ({ ...prev, [colId]: newWidth }));
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('cursor-col-resize', 'select-none');
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.classList.add('cursor-col-resize', 'select-none');
  }

  // --- Tabs state & DnD ---
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const dragTabRef = useRef(null);

  function addCustomTab() {
    const name = window.prompt('請輸入新頁籤名稱 (例如: VIP客戶、本週急單)：');
    if (!name?.trim()) return;
    const id = 'tab_' + Date.now();
    setTabs(prev => [...prev, { id, name: name.trim(), removable: true }]);
    setActiveTab(name.trim());
  }

  function handleDeleteTab(e, tabId) {
    e.stopPropagation();
    if (!window.confirm('確定要刪除此自訂頁籤嗎？')) return;
    const deleted = tabs.find(t => t.id === tabId);
    setTabs(prev => prev.filter(t => t.id !== tabId));
    if (deleted && activeTab === deleted.name) setActiveTab('全部');
  }

  function handleTabDragStart(e, tabId) {
    dragTabRef.current = tabId;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  }
  function handleTabDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  function handleTabDrop(e, targetId) {
    e.preventDefault();
    const fromId = dragTabRef.current;
    if (!fromId || fromId === targetId) return;
    setTabs(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(t => t.id === fromId);
      const toIdx = next.findIndex(t => t.id === targetId);
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }
  function handleTabDragEnd(e) { e.currentTarget.style.opacity = '1'; dragTabRef.current = null; }

  // --- Custom columns handlers (unified with columns state) ---
  function addCustomColumn() {
    const name = window.prompt('請輸入新動態欄位名稱 (例如: 競爭對手)：');
    if (!name?.trim()) return;
    const id = 'custom_' + Date.now();
    const newCol = { id, label: name.trim(), align: 'left', width: 150, isCustom: true };
    setColumns(prev => [...prev, newCol]);
    setCustomColumns(prev => [...prev, { id, name: name.trim() }]);
    setVisibleCols(prev => ({ ...prev, [id]: true }));
  }

  function renameCustomColumn(e, colId) {
    e.stopPropagation();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const newName = window.prompt('重新命名欄位：', col.label);
    if (!newName?.trim()) return;
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, label: newName.trim() } : c));
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, name: newName.trim() } : c));
  }

  function deleteCustomColumn(e, colId) {
    e.stopPropagation();
    if (!window.confirm('確定要刪除此自訂欄位嗎？這將會清空該欄位的所有資料。')) return;
    setColumns(prev => prev.filter(c => c.id !== colId));
    setCustomColumns(prev => prev.filter(c => c.id !== colId));
  }

  // --- Core UI state ---
  const [activeTab, setActiveTab] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);
  const [showFilter, setShowFilter] = useState(false);
  const [showColMenu, setShowColMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);

  // Advanced filters
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterProducts, setFilterProducts] = useState([]);
  const [filterStages, setFilterStages] = useState([]);
  const [filterPMs, setFilterPMs] = useState([]);

  // Sorting
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Row selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Refs for click-outside
  const filterRef = useRef(null);
  const colMenuRef = useRef(null);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset page when filters or page size change
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, filterTypes, filterProducts, filterStages, filterPMs, filterDateStart, filterDateEnd, pageSize]);

  // ─── Derived: filtered + sorted data ───
  const filteredData = useMemo(() => {
    let result = rbacData;
    if (activeTab !== '全部') result = result.filter(r => r.reqType === activeTab);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        (r.enduser || '').toLowerCase().includes(term) ||
        (r.si || '').toLowerCase().includes(term) ||
        (r.sales || '').toLowerCase().includes(term) ||
        (r.pm || '').toLowerCase().includes(term) ||
        (r.sku || '').toLowerCase().includes(term) ||
        (r.notes || '').toLowerCase().includes(term)
      );
    }
    if (filterTypes.length > 0) result = result.filter(r => filterTypes.includes(r.reqType));
    if (filterProducts.length > 0) result = result.filter(r => filterProducts.includes(r.product));
    if (filterStages.length > 0) result = result.filter(r => filterStages.includes(r.stage));
    if (filterPMs.length > 0) result = result.filter(r => filterPMs.includes(r.pm));
    if (filterDateStart) result = result.filter(r => r.date >= filterDateStart);
    if (filterDateEnd) result = result.filter(r => r.date <= filterDateEnd);
    if (sortCol) {
      result = [...result].sort((a, b) => {
        let va = a[sortCol] ?? '';
        let vb = b[sortCol] ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rbacData, activeTab, searchTerm, filterTypes, filterProducts, filterStages, filterPMs, filterDateStart, filterDateEnd, sortCol, sortAsc]);

  // Tab badge counts (from full data)
  const tabCounts = useMemo(() => {
    const c = {};
    tabs.forEach(t => {
      c[t.name] = t.name === '全部' ? rbacData.length : rbacData.filter(r => r.reqType === t.name).length;
    });
    return c;
  }, [rbacData, tabs]);

  // KPI
  const totalAmount = useMemo(() => filteredData.reduce((s, r) => s + (r.amount || 0), 0), [filteredData]);

  // Pagination
  const totalItems = filteredData.length;
  const showAll = pageSize === 0;
  const effectivePageSize = showAll ? totalItems : pageSize;
  const totalPages = showAll ? 1 : (Math.ceil(totalItems / effectivePageSize) || 1);
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = showAll ? 0 : (safePage - 1) * effectivePageSize;
  const endIdx = showAll ? totalItems : Math.min(startIdx + effectivePageSize, totalItems);
  const pageData = filteredData.slice(startIdx, endIdx);

  // ─── Handlers ───
  function handleSort(colKey) {
    if (sortCol === colKey) setSortAsc(p => !p);
    else { setSortCol(colKey); setSortAsc(true); }
  }

  function toggleCheckboxFilter(value, setter) {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  }

  function clearAllFilters() {
    setFilterDateStart(''); setFilterDateEnd('');
    setFilterTypes([]); setFilterProducts([]); setFilterStages([]); setFilterPMs([]);
  }

  function toggleColVisibility(key) {
    setVisibleCols(prev => {
      const isCurrentlyVisible = prev[key] !== false;
      return { ...prev, [key]: !isCurrentlyVisible };
    });
  }

  // Row selection
  function toggleRowSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const allPageSelected = pageData.length > 0 && pageData.every(r => selectedIds.has(r.id));
  function toggleAllPageRows() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageData.forEach(r => next.delete(r.id));
      } else {
        pageData.forEach(r => { if (r.id) next.add(r.id); });
      }
      return next;
    });
  }

  const handleBatchDelete = useCallback(() => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`警告：確定要批次刪除這 ${count} 筆商機紀錄嗎？此動作無法復原。`)) return;
    selectedIds.forEach(id => onDelete(id, true));
    setSelectedIds(new Set());
  }, [selectedIds, onDelete]);

  // (1) Cell rendering – reqType uses inline <select> styled as badge
  function renderCell(row, colKey) {
    switch (colKey) {
      case 'reqType': {
        const typeColorMap = {
          '新購': 'bg-teal-50 text-teal-700 border-teal-200',
          '增購': 'bg-rose-50 text-rose-700 border-rose-200',
        };
        const typeCls = typeColorMap[row.reqType] || 'bg-gray-100 text-gray-700 border-gray-300';
        return (
          <div className="group/type relative inline-flex items-center">
            <select
              value={row.reqType || ''}
              onChange={e => onUpdateRecord?.(row.id, 'reqType', e.target.value)}
              className={`appearance-none cursor-pointer px-2 py-0.5 pr-5 rounded text-[11px] font-medium border outline-none hover:ring-1 hover:ring-brand-300 transition-all ${typeCls}`}
              title="點擊切換類型"
            >
              {(dictData.reqType || []).map(opt => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
            <CaretDown size={10} weight="fill" className="absolute right-1 pointer-events-none opacity-0 group-hover/type:opacity-60 transition-opacity" />
          </div>
        );
      }
      case 'product':
        return <ProductBadge text={row[colKey]} />;
      case 'stage':
        return <StageBadge stage={row[colKey]} />;
      case 'quantity':
        return <span className="font-mono text-gray-600">{row.quantity?.toLocaleString?.() ?? row.quantity}</span>;
      case 'amount':
        return <span className="font-mono text-gray-600">{row.amount != null ? `NT$ ${row.amount.toLocaleString()}` : '-'}</span>;
      case 'enduser':
        return <span className="font-medium text-gray-900">{row.enduser}</span>;
      case 'si':
        return <span className="text-gray-600">{row.si}</span>;
      case 'notes':
        return (
          <span
            className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer truncate block max-w-[200px] hover:underline underline-offset-2"
            onClick={() => onEditRecord?.(row)}
            title={row.notes || ''}
          >
            {row.notes || '-'}
          </span>
        );
      case 'sales':
        return getNameFromDict('sales', row.sales);
      case 'pm':
        return getNameFromDict('pm', row.pm);
      case 'date':
        return <span className="text-gray-500">{row.date}</span>;
      case 'sku':
        return <span className="font-medium">{row.sku}</span>;
      default:
        return <span className="text-gray-500">{row[colKey] ?? '-'}</span>;
    }
  }

  const hasActiveFilters = filterTypes.length > 0 || filterProducts.length > 0 || filterStages.length > 0 || filterPMs.length > 0 || filterDateStart || filterDateEnd;
  const visibleColCount = columns.filter(c => visibleCols[c.id] !== false).length;

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">

      {/* ════════════ 1. Header ════════════ */}
      <header className="bg-white border-b border-fluent-border px-6 py-4 shrink-0 shadow-sm relative z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 uppercase tracking-wider border border-brand-200">Global View</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">微軟商機總表</h1>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 lg:justify-end">
            {canCreate && (
            <button onClick={onOpenDrawer} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              <Plus size={16} /> 單筆新增
            </button>
            )}
            {canCreate && (
            <button onClick={onOpenImport} className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              <MicrosoftExcelLogo size={16} /> EXCEL 匯入
            </button>
            )}
            <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block" />
            <div className="text-right hidden lg:block">
              <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase mb-0.5">預估商機總額</p>
              <div className="flex flex-col items-end">
                <p className="text-lg font-bold text-brand-600 leading-none">
                  NT$ {totalAmount.toLocaleString()} <span className="text-xs font-medium text-gray-500 ml-0.5">TWD</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">≈ ${Math.round(totalAmount / USD_RATE).toLocaleString()} USD</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════ Data Grid Container ════════════ */}
      <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col z-10">
        <div className="bg-white rounded border border-fluent-border flex flex-col h-full shadow-sm" style={{ overflow: 'visible' }}>

          {/* ── 2. Tabs (DnD) ── */}
          <div className="flex items-center gap-1 border-b border-fluent-border px-4 pt-2 bg-gray-50/50 overflow-x-auto overflow-y-hidden">
            {tabs.map(tab => {
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.id}
                  draggable
                  onDragStart={e => handleTabDragStart(e, tab.id)}
                  onDragOver={handleTabDragOver}
                  onDrop={e => handleTabDrop(e, tab.id)}
                  onDragEnd={handleTabDragEnd}
                  onClick={() => setActiveTab(tab.name)}
                  className={`cursor-grab px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-1.5 group ${
                    isActive
                      ? 'border-brand-500 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span className={`py-0.5 px-1.5 rounded-full text-[10px] pointer-events-none ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tabCounts[tab.name] ?? 0}
                  </span>
                  {tab.removable && (
                    <span
                      onClick={e => handleDeleteTab(e, tab.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 cursor-pointer"
                      title="刪除頁籤"
                    >
                      <X size={12} />
                    </span>
                  )}
                </button>
              );
            })}
            <div className="h-4 w-px bg-gray-300 mx-1 pointer-events-none" />
            <button
              onClick={addCustomTab}
              className="px-2 py-2 text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-1 text-xs font-medium whitespace-nowrap cursor-pointer"
              title="新增自訂頁籤"
            >
              <Plus size={14} weight="bold" /> 新增視角
            </button>
          </div>

          {/* ── 3. Toolbar ── */}
          <div className="p-3 border-b border-fluent-border flex flex-col sm:flex-row justify-between items-center gap-3 bg-white shrink-0 relative z-40">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜尋 EU、Partner 或 業務..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow placeholder-gray-400"
                />
              </div>

              {/* (3) Filter button with blue dot indicator */}
              <div className="relative z-[100]" ref={filterRef}>
                <button
                  onClick={() => setShowFilter(p => !p)}
                  className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded text-sm font-medium transition-colors shadow-sm cursor-pointer ${
                    hasActiveFilters
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Funnel size={16} /> 條件篩選
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
                  )}
                </button>

                {/* (3) Filter Dropdown – removed 套用篩選 button, kept 重設條件 */}
                {showFilter && (
                  <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-[22rem] bg-white border border-gray-200 rounded shadow-2xl z-[100] p-4 text-sm max-h-[60vh] overflow-y-auto">
                    <div className="font-semibold text-gray-800 mb-3 border-b pb-2 flex justify-between items-center">
                      進階篩選 <span className="text-[10px] text-brand-600 font-normal">即時過濾</span>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-700 mb-1">POD</label>
                      <div className="flex items-center gap-2">
                        <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:border-brand-500 outline-none" />
                        <span className="text-gray-400 text-xs">至</span>
                        <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:border-brand-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FilterCheckboxGroup title="Type" items={dictData.reqType} checked={filterTypes} onToggle={v => toggleCheckboxFilter(v, setFilterTypes)} />
                      <FilterCheckboxGroup title="Cat." items={dictData.product} checked={filterProducts} onToggle={v => toggleCheckboxFilter(v, setFilterProducts)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <FilterCheckboxGroup title="Stage" items={dictData.stage} checked={filterStages} onToggle={v => toggleCheckboxFilter(v, setFilterStages)} />
                      <FilterCheckboxGroup title="PM" items={dictData.pm} checked={filterPMs} onToggle={v => toggleCheckboxFilter(v, setFilterPMs)} />
                    </div>
                    <div className="flex justify-end border-t pt-3">
                      <button onClick={clearAllFilters} className="px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded text-xs transition-colors font-medium cursor-pointer">重設條件</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch delete (PM only) */}
              {canDelete && selectedIds.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-200 rounded text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
                >
                  <Trash size={16} /> 批次刪除 ({selectedIds.size})
                </button>
              )}
            </div>

            {/* Column visibility */}
            <div className="relative w-full sm:w-auto" ref={colMenuRef}>
              <button
                onClick={() => setShowColMenu(p => !p)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer"
              >
                <Columns size={16} /> 顯示/隱藏欄位
              </button>
              {showColMenu && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded shadow-lg z-50 p-2 text-sm max-h-96 overflow-y-auto">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">勾選以顯示欄位</div>
                  {columns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={visibleCols[col.id] !== false} onChange={() => toggleColVisibility(col.id)} className="text-brand-600 focus:ring-brand-500 rounded-sm w-3.5 h-3.5 cursor-pointer" />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Table (scrollable area) ── */}
          <div className="flex-1 overflow-auto grid-scroll relative z-10">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1400px]" style={{ tableLayout: 'fixed' }}>
              <thead className="sticky top-0 bg-white shadow-[0_1px_0_0_#e1dfdd] z-20 text-[11px] uppercase tracking-wider text-fluent-muted font-semibold select-none">
                <tr>
                  {/* Select-all checkbox */}
                  <th className="px-3 py-3 w-10 text-center bg-white" style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleAllPageRows}
                      className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>

                  {/* (4) All columns (built-in + custom) — unified draggable + resizable */}
                  {columns.map(col => {
                    if (visibleCols[col.id] === false) return null;
                    const isSorted = sortCol === col.id;
                    const width = colWidths[col.id] || col.width;
                    return (
                      <th
                        key={col.id}
                        data-col={col.id}
                        draggable
                        onDragStart={e => handleColDragStart(e, col.id)}
                        onDragOver={e => handleColDragOver(e, col.id)}
                        onDragLeave={handleColDragLeave}
                        onDrop={e => handleColDrop(e, col.id)}
                        onDragEnd={handleColDragEnd}
                        className={`px-4 py-3 transition-colors bg-white cursor-grab relative group/th ${col.align === 'right' ? 'text-right' : ''}`}
                        style={{ width }}
                      >
                        {col.isCustom ? (
                          <div className="flex items-center justify-between">
                            <span
                              className="truncate cursor-pointer border-b border-dashed border-transparent hover:border-brand-500 flex items-center gap-1 group/rename flex-1"
                              onDoubleClick={e => renameCustomColumn(e, col.id)}
                              title="雙擊以重新命名"
                            >
                              {col.label}
                              <PencilSimple size={10} className="opacity-0 group-hover/rename:opacity-100 text-brand-500 transition-opacity" />
                            </span>
                            <button
                              onClick={e => deleteCustomColumn(e, col.id)}
                              className="opacity-0 group-hover/th:opacity-100 text-gray-300 hover:text-red-500 transition-opacity ml-1 p-0.5 cursor-pointer"
                              title="刪除此欄位"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center ${col.align === 'right' ? 'justify-end' : 'justify-between'} cursor-pointer group`}
                            onClick={() => handleSort(col.id)}
                          >
                            {col.align === 'right' && (
                              <SortIcon isSorted={isSorted} sortAsc={sortAsc} />
                            )}
                            <span className="truncate">{col.label}</span>
                            {col.align !== 'right' && (
                              <SortIcon isSorted={isSorted} sortAsc={sortAsc} />
                            )}
                          </div>
                        )}
                        {/* (5) Column resizer handle */}
                        <div
                          className="absolute top-0 right-0 w-[6px] h-full cursor-col-resize select-none z-10 hover:bg-brand-500/30 hover:border-r-2 hover:border-brand-500 active:bg-brand-500/30 active:border-r-2 active:border-brand-500"
                          onMouseDown={e => handleResizeStart(e, col.id)}
                        />
                      </th>
                    );
                  })}

                  {/* Add column button */}
                  <th
                    className="px-2 py-3 text-center text-gray-400 cursor-pointer hover:bg-brand-50 hover:text-brand-600 transition-colors bg-white"
                    style={{ width: 60 }}
                    onClick={addCustomColumn}
                    title="新增純文字欄位"
                  >
                    <Plus size={16} weight="bold" className="mx-auto" />
                  </th>

                  {/* Action column header */}
                  <th className="px-2 py-3 text-center bg-white w-[80px]" style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-fluent-border text-fluent-text bg-white">
                {isGuest ? (
                  <tr>
                    <td colSpan={visibleColCount + 3} className="px-4 py-16 text-center text-gray-400">
                      <Lock size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">您目前無權限查看資料</p>
                      <p className="text-xs text-gray-400 mt-1">請聯繫管理員，將您的信箱加入 Sales 或 PM 字典檔。</p>
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColCount + 3} className="px-4 py-12 text-center text-gray-400">
                      <MagnifyingGlass size={28} className="mx-auto mb-2" />
                      <p>找不到符合的結果</p>
                    </td>
                  </tr>
                ) : (
                  pageData.map((row, idx) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                      <tr
                        key={row.id || idx}
                        className={`transition-colors group ${isSelected ? 'bg-blue-50' : 'hover:bg-fluent-hover'}`}
                      >
                        {/* Row checkbox */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelect(row.id)}
                            className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* (4) Render cells from unified columns state */}
                        {columns.map(col => {
                          if (visibleCols[col.id] === false) return null;
                          return (
                            <td
                              key={col.id}
                              data-col={col.id}
                              className={`px-4 py-2 overflow-hidden text-ellipsis ${col.align === 'right' ? 'text-right' : ''} truncate`}
                              style={{ width: colWidths[col.id] || col.width }}
                            >
                              {renderCell(row, col.id)}
                            </td>
                          );
                        })}

                        {/* 固定的操作按鈕欄位 */}
                        <td className="px-2 py-2 text-center text-gray-300 group-hover:text-gray-500 transition-colors" style={{ width: 80 }}>
                          {canUpdate && isOwner(row) && (
                          <button
                            onClick={() => onEditRecord?.(row)}
                            className="p-1 hover:text-brand-600 cursor-pointer inline-flex"
                            title="編輯紀錄"
                          >
                            <PencilSimple size={16} />
                          </button>
                          )}
                          {canDelete && isOwner(row) && (
                            <button
                              onClick={() => onDelete?.(row.id)}
                              className="p-1 hover:text-red-500 cursor-pointer inline-flex"
                              title="刪除"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── 5. Pagination Footer ── */}
          <div className="border-t border-fluent-border px-4 py-2 bg-white flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-500 font-medium">
                顯示 {totalItems === 0 ? '0-0' : `${startIdx + 1}-${endIdx}`} 筆，共 {totalItems} 筆
              </span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded text-xs py-1 px-2 text-gray-700 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size === 0 ? '全部' : `每頁 ${size} 筆`}
                  </option>
                ))}
              </select>
            </div>
            {!showAll && (
              <div className="flex gap-1">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`px-2 py-1 border border-gray-300 rounded text-xs transition-colors cursor-pointer ${safePage <= 1 ? 'text-gray-400 bg-gray-50 opacity-50 !cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >上一頁</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-2.5 py-1 border rounded text-xs transition-colors cursor-pointer ${p === safePage ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                  >{p}</button>
                ))}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`px-2 py-1 border border-gray-300 rounded text-xs transition-colors cursor-pointer ${safePage >= totalPages ? 'text-gray-400 bg-gray-50 opacity-50 !cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >下一頁</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Sub‑components =====
function SortIcon({ isSorted, sortAsc }) {
  return (
    <span className={`transition-opacity ${isSorted ? 'opacity-100 text-brand-600' : 'opacity-0 group-hover:opacity-50 text-gray-400'}`}>
      {isSorted && !sortAsc ? <CaretDown size={12} weight="fill" /> : <CaretUp size={12} weight="fill" />}
    </span>
  );
}

function FilterCheckboxGroup({ title, items, checked, onToggle }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between items-center">
        {title} <span className="text-[9px] text-gray-400 font-normal">未勾選=全選</span>
      </label>
      <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto text-xs text-gray-600">
        {items.map(item => (
          <label key={item.code} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={checked.includes(item.code)}
              onChange={() => onToggle(item.code)}
              className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}
