import { useState, useRef, useEffect, useMemo, useCallback, Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  Trash, MagnifyingGlass, Funnel, Columns, CaretUp, CaretDown, CaretRight,
  Plus, MicrosoftExcelLogo, PencilSimple, X, Lock, ArrowsOutCardinal, DownloadSimple,
} from '@phosphor-icons/react';
import { dictData as defaultDictData } from '../utils/mockData';
import { ProductBadge, StageBadge, DynamicBadge } from './Badges';
import { USD_EXCHANGE_RATE } from '../utils/constants';
import * as XLSX from 'xlsx';

// ── ShimmerButton (CTA with sweep light + spring press) ──
function ShimmerButton({ children, onClick, className = '' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-shadow duration-300 flex items-center justify-center gap-2 shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-glow-brand)] cursor-pointer ${className}`}
    >
      {/* Shimmer overlay */}
      <span className="absolute inset-0 shimmer pointer-events-none" />
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}

// ===== Initial column definition =====
const SHARED_COLUMNS = [
  { id: 'enduser',  label: 'EU',      align: 'left',  width: 180, isCustom: false },
  { id: 'si',       label: 'Partner',  align: 'left',  width: 180, isCustom: false },
  { id: 'reqType',  label: 'Type',     align: 'left',  width: 100, isCustom: false },
  { id: 'product',  label: 'Cat.',     align: 'left',  width: 130, isCustom: false },
  { id: 'sku',      label: 'SKU',      align: 'left',  width: 260, isCustom: false },
  { id: 'quantity', label: 'QTY',      align: 'right', width: 110,  isCustom: false },
  { id: 'unitPrice',label: 'U/P',      align: 'right', width: 130, isCustom: false },
  { id: 'amount',   label: 'NTM',      align: 'right', width: 170, isCustom: false },
  { id: 'date',     label: 'POD',      align: 'left',  width: 120, isCustom: false },
  { id: 'stage',    label: 'Stage',    align: 'left',  width: 90,  isCustom: false },
  { id: 'notes',    label: 'Notes',    align: 'left',  width: 200, isCustom: false },
  { id: 'lud',      label: 'LUD',      align: 'left',  width: 120, isCustom: false },
  { id: 'sales',    label: 'Sales',    align: 'left',  width: 100, isCustom: false },
  { id: 'pm',       label: 'PM',       align: 'left',  width: 110, isCustom: false },
];

// CAIP-only extended columns
const CAIP_EXTRA_COLUMNS = [
  { id: 'segment',        label: 'Segment',     align: 'left',  width: 110, isCustom: false },
  { id: 'disti_name',     label: 'Disti',        align: 'left',  width: 110, isCustom: false },
  { id: 'sales_stage',    label: 'Sales Stage',  align: 'left',  width: 100, isCustom: false },
  { id: 'referral_id',    label: 'Referral ID',  align: 'left',  width: 120, isCustom: false },
  { id: 'acr_start_month',label: 'ACR Start',    align: 'left',  width: 100, isCustom: false },
  { id: 'acr_mom',        label: 'ACR/Month',    align: 'right', width: 110, isCustom: false },
  { id: 'jul',   label: 'Jul',  align: 'right', width: 90, isCustom: false },
  { id: 'aug',   label: 'Aug',  align: 'right', width: 90, isCustom: false },
  { id: 'sep',   label: 'Sep',  align: 'right', width: 90, isCustom: false },
  { id: 'oct',   label: 'Oct',  align: 'right', width: 90, isCustom: false },
  { id: 'nov',   label: 'Nov',  align: 'right', width: 90, isCustom: false },
  { id: 'dec',   label: 'Dec',  align: 'right', width: 90, isCustom: false },
  { id: 'jan',   label: 'Jan',  align: 'right', width: 90, isCustom: false },
  { id: 'feb',   label: 'Feb',  align: 'right', width: 90, isCustom: false },
  { id: 'mar',   label: 'Mar',  align: 'right', width: 90, isCustom: false },
  { id: 'apr',   label: 'Apr',  align: 'right', width: 90, isCustom: false },
  { id: 'may',   label: 'May',  align: 'right', width: 90, isCustom: false },
  { id: 'jun',   label: 'Jun',  align: 'right', width: 90, isCustom: false },
  { id: 'q1',    label: 'Q1',   align: 'right', width: 100, isCustom: false },
  { id: 'q2',    label: 'Q2',   align: 'right', width: 100, isCustom: false },
  { id: 'q3',    label: 'Q3',   align: 'right', width: 100, isCustom: false },
  { id: 'q4',    label: 'Q4',   align: 'right', width: 100, isCustom: false },
];

const CAIP_NUM_IDS = new Set(['acr_mom','jul','aug','sep','oct','nov','dec','jan','feb','mar','apr','may','jun','q1','q2','q3','q4']);

// AIBS Renew-only extra columns
const RENEW_EXTRA_COLUMNS = [
  { id: 'expDate',       label: 'EXP',          align: 'left',  width: 130, isCustom: false },
  { id: 'segment',       label: 'Segment',      align: 'left',  width: 130, isCustom: false },
  { id: 'sales_stage',   label: 'Sales Stage',  align: 'left',  width: 130, isCustom: false },
  { id: 'referral_id',   label: 'Referral ID',  align: 'left',  width: 140, isCustom: false },
];

const INITIAL_COLUMNS = SHARED_COLUMNS;

const DEFAULT_VISIBLE = Object.fromEntries(SHARED_COLUMNS.map(c => [c.id, true]));
const INITIAL_TABS = [
  { id: 'tab_all', name: '全部', removable: false },
  { id: 'tab_new', name: '新購', removable: true },
  { id: 'tab_add', name: '增購', removable: true },
];
const PAGE_SIZE_OPTIONS = [7, 15, 30, 0]; // 0 = 全部

// ===================================================================
// Main Component
// ===================================================================
export default function PipelineTable({ data, onDelete, onBatchDelete, onOpenDrawer, onEditRecord, onUpdateRecord, onOpenImport, dictionary, customColumns, setCustomColumns, userRole, currentUserPermissions, currentUserEmail, viewMode = 'AIBS', showConfirm }) {
  const isCAIP = viewMode === 'CAIP';
  const isRenew = viewMode === 'AIBS_RENEW';
  const dictData = dictionary || defaultDictData;

  // ── Inline prompt state (replaces window.prompt) ──
  const [inlinePrompt, setInlinePrompt] = useState({ open: false, title: '', defaultValue: '', resolve: null });
  const inlinePromptRef = useRef(null);
  function openInlinePrompt(title, defaultValue = '') {
    return new Promise(resolve => {
      setInlinePrompt({ open: true, title, defaultValue, resolve });
    });
  }
  function handleInlinePromptOk() {
    const val = inlinePromptRef.current?.value?.trim();
    inlinePrompt.resolve?.(val || null);
    setInlinePrompt({ open: false, title: '', defaultValue: '', resolve: null });
  }
  function handleInlinePromptCancel() {
    inlinePrompt.resolve?.(null);
    setInlinePrompt({ open: false, title: '', defaultValue: '', resolve: null });
  }

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
    let result = data;
    // ── ViewMode filter: AIBS = 非 Azure, CAIP = 僅 Azure, AIBS_RENEW = 非 Azure + 續約 ──
    if (isCAIP) {
      result = result.filter(r => r.product === 'Azure');
    } else if (isRenew) {
      const RENEW_TYPES = ['原案續約', '續約增購', '降級購買', '未續約'];
      result = result.filter(r => {
        const code = (r.product || '').toLowerCase();
        const type = r.reqType || '';
        return code === 'mw-r' || RENEW_TYPES.some(t => type.includes(t));
      });
    } else {
      const RENEW_TYPES = ['原案續約', '續約增購', '降級購買', '未續約'];
      result = result.filter(r => {
        const code = (r.product || '').toLowerCase();
        const type = r.reqType || '';
        return code !== 'azure' && code !== 'mw-r' && !RENEW_TYPES.some(t => type.includes(t));
      });
    }
    if (isGuest) return [];
    if (userRole?.role === 'sales') return result.filter(r => r.sales === userRole.code);
    return result;
  }, [data, userRole, isGuest, isCAIP, isRenew]);

  function getNameFromDict(dictKey, code) {
    const entry = dictData[dictKey]?.find(d => d.code === code);
    return entry ? entry.label : code;
  }

  // --- Base columns depend on viewMode ---
  const BASE_COLUMNS = useMemo(() => {
    if (isCAIP) return [...SHARED_COLUMNS, ...CAIP_EXTRA_COLUMNS];
    if (isRenew) {
      // Insert EXP after POD (date)
      const cols = [...SHARED_COLUMNS];
      const podIdx = cols.findIndex(c => c.id === 'date');
      cols.splice(podIdx + 1, 0, ...RENEW_EXTRA_COLUMNS);
      return cols;
    }
    return SHARED_COLUMNS;
  }, [isCAIP, isRenew]);

  // --- (4) Columns state for drag-and-drop reorder (unified: built-in + custom) ---
  const [columns, setColumns] = useState(() => [
    ...BASE_COLUMNS,
    ...customColumns.map(c => ({ id: c.id, label: c.name, align: 'left', width: 150, isCustom: true })),
  ]);

  // Sync columns when viewMode changes
  useEffect(() => {
    setColumns(prev => {
      const customCols = prev.filter(c => c.isCustom);
      return [...BASE_COLUMNS, ...customCols];
    });
  }, [BASE_COLUMNS]);

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
    Object.fromEntries([...SHARED_COLUMNS, ...CAIP_EXTRA_COLUMNS].map(c => [c.id, c.width]))
  );

  // --- Column DnD refs ---
  const dragColRef = useRef(null);
  const tableRef = useRef(null);

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

  // --- (5b) Double-click auto-fit column width ---
  function handleAutoFitColumn(colId) {
    const table = tableRef.current;
    if (!table) return;
    const cells = table.querySelectorAll(`td[data-col="${colId}"]`);
    const headerCell = table.querySelector(`th[data-col="${colId}"]`);
    let maxWidth = 60; // minimum
    // Measure header text
    if (headerCell) {
      const span = headerCell.querySelector('span');
      if (span) maxWidth = Math.max(maxWidth, span.scrollWidth + 32);
    }
    // Measure all body cells
    cells.forEach(td => {
      // Create an off-screen measurer to get natural width
      const measurer = document.createElement('span');
      measurer.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;font:inherit;';
      measurer.textContent = td.textContent || '';
      document.body.appendChild(measurer);
      maxWidth = Math.max(maxWidth, measurer.offsetWidth + 32); // 32px for padding
      document.body.removeChild(measurer);
    });
    // Cap at reasonable max
    maxWidth = Math.min(maxWidth, 500);
    setColWidths(prev => ({ ...prev, [colId]: maxWidth }));
  }

  // --- Tabs state & DnD (persisted per viewMode) ---
  const tabsStorageKey = `pipeline_tabs_${viewMode}`;
  const [tabs, setTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(tabsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TABS;
  });
  // Sync tabs from localStorage when viewMode changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(tabsStorageKey);
      if (saved) { setTabs(JSON.parse(saved)); }
      else { setTabs(INITIAL_TABS); }
    } catch { setTabs(INITIAL_TABS); }
  }, [tabsStorageKey]);
  // Persist tabs to localStorage on change
  useEffect(() => {
    try { localStorage.setItem(tabsStorageKey, JSON.stringify(tabs)); } catch {}
  }, [tabs, tabsStorageKey]);
  const dragTabRef = useRef(null);

  async function addCustomTab() {
    const name = await openInlinePrompt('請輸入新頁籤名稱 (例如: VIP客戶、本週急單)');
    if (!name) return;
    const id = 'tab_' + Date.now();
    setTabs(prev => [...prev, { id, name, removable: true }]);
    setActiveTab(name);
  }

  function handleDeleteTab(e, tabId) {
    e.stopPropagation();
    showConfirm?.('確定要刪除此自訂頁籤嗎？', () => {
      const deleted = tabs.find(t => t.id === tabId);
      setTabs(prev => prev.filter(t => t.id !== tabId));
      if (deleted && activeTab === deleted.name) setActiveTab('全部');
    });
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
  async function addCustomColumn() {
    const name = await openInlinePrompt('請輸入新動態欄位名稱 (例如: 競爭對手)');
    if (!name) return;
    const id = 'custom_' + Date.now();
    const newCol = { id, label: name, align: 'left', width: 150, isCustom: true };
    setColumns(prev => [...prev, newCol]);
    setCustomColumns(prev => [...prev, { id, name }]);
    setVisibleCols(prev => ({ ...prev, [id]: true }));
  }

  async function renameCustomColumn(e, colId) {
    e.stopPropagation();
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const newName = await openInlinePrompt('重新命名欄位', col.label);
    if (!newName) return;
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, label: newName } : c));
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, name: newName } : c));
  }

  function deleteCustomColumn(e, colId) {
    e.stopPropagation();
    showConfirm?.('確定要刪除此自訂欄位嗎？這將會清空該欄位的所有資料。', () => {
      setColumns(prev => prev.filter(c => c.id !== colId));
      setCustomColumns(prev => prev.filter(c => c.id !== colId));
    });
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
  const [filterAcrPositive, setFilterAcrPositive] = useState([]);
  const [filterSegments, setFilterSegments] = useState([]);
  const [filterExpStart, setFilterExpStart] = useState('');
  const [filterExpEnd, setFilterExpEnd] = useState('');
  const [filterSalesStages, setFilterSalesStages] = useState([]);

  // Sorting
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Row selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Group expand/collapse
  const [expandedGroups, setExpandedGroups] = useState(new Set());

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
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, filterTypes, filterProducts, filterStages, filterPMs, filterSegments, filterDateStart, filterDateEnd, filterExpStart, filterExpEnd, filterSalesStages, filterAcrPositive, pageSize]);

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
    if (filterSegments.length > 0) result = result.filter(r => filterSegments.includes(r.segment));
    if (filterDateStart) result = result.filter(r => r.date >= filterDateStart);
    if (filterDateEnd) result = result.filter(r => r.date <= filterDateEnd);
    // Renew: EXP date range filter
    if (filterExpStart) result = result.filter(r => (r.expDate || '') >= filterExpStart);
    if (filterExpEnd) result = result.filter(r => (r.expDate || '') <= filterExpEnd);
    // Renew: Sales Stage filter
    if (filterSalesStages.length > 0) result = result.filter(r => filterSalesStages.includes(r.sales_stage));
    // CAIP: filter rows where selected month/quarter columns > 0
    if (filterAcrPositive.length > 0) {
      result = result.filter(r => filterAcrPositive.every(k => Number(r[k]) > 0));
    }
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
  }, [rbacData, activeTab, searchTerm, filterTypes, filterProducts, filterStages, filterPMs, filterSegments, filterDateStart, filterDateEnd, filterExpStart, filterExpEnd, filterSalesStages, filterAcrPositive, sortCol, sortAsc]);

  // Tab badge counts (from full data)
  const tabCounts = useMemo(() => {
    const c = {};
    tabs.forEach(t => {
      c[t.name] = t.name === '全部' ? rbacData.length : rbacData.filter(r => r.reqType === t.name).length;
    });
    return c;
  }, [rbacData, tabs]);

  // KPI — dynamic: if rows are checked, sum only checked rows
  const totalAmount = useMemo(() => {
    const checkedRows = filteredData.filter(r => selectedIds.has(r.id));
    const rows = checkedRows.length > 0 ? checkedRows : filteredData;
    return rows.reduce((s, r) => s + (r.amount || 0), 0);
  }, [filteredData, selectedIds]);
  const selectedCount = useMemo(() => {
    return filteredData.filter(r => selectedIds.has(r.id)).length;
  }, [filteredData, selectedIds]);

  // ─── Group by EU + Partner ───
  const groupedData = useMemo(() => {
    const groups = new Map();
    for (const row of filteredData) {
      const key = `${row.enduser || ''}|||${row.si || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          enduser: row.enduser || '',
          si: row.si || '',
          children: [],
          totalAmount: 0,
          sales: row.sales,
          pm: row.pm,
        });
      }
      const g = groups.get(key);
      g.children.push(row);
      g.totalAmount += (row.amount || 0);
    }
    return Array.from(groups.values());
  }, [filteredData]);

  // Pagination (by groups)
  const totalGroups = groupedData.length;
  const totalRecords = filteredData.length;
  const showAll = pageSize === 0;
  const effectivePageSize = showAll ? totalGroups : pageSize;
  const totalPages = showAll ? 1 : (Math.ceil(totalGroups / effectivePageSize) || 1);
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = showAll ? 0 : (safePage - 1) * effectivePageSize;
  const endIdx = showAll ? totalGroups : Math.min(startIdx + effectivePageSize, totalGroups);
  const pageGroups = groupedData.slice(startIdx, endIdx);

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
    setFilterAcrPositive([]); setFilterSegments([]);
    setFilterExpStart(''); setFilterExpEnd(''); setFilterSalesStages([]);
  }

  // ── WYSIWYG Excel Export ──
  function handleExportExcel() {
    // 1. Determine visible export columns (exclude action/selection columns)
    const SKIP_IDS = new Set(['selection', 'expander', 'actions']);
    const exportCols = columns.filter(c => visibleCols[c.id] !== false && !SKIP_IDS.has(c.id));

    if (exportCols.length === 0) {
      toast.error('沒有可匯出的欄位，請至少顯示一個欄位。');
      return;
    }

    // 2. Flatten all filtered data (across all pages, expand groups)
    const rows = filteredData;

    if (rows.length === 0) {
      toast.error('目前篩選結果為 0 筆，無法匯出。');
      return;
    }

    // 3. Build export data — split renewal fields for clean pivot-ready output
    const exportData = rows.map(row => {
      const obj = {};
      for (const col of exportCols) {
        const key = col.id;
        const header = col.label;
        let val = row[key];

        // Resolve dict labels for export readability
        if (key === 'sales' || key === 'pm' || key === 'stage' || key === 'reqType' || key === 'product') {
          val = getNameFromDict(key === 'reqType' ? 'reqType' : key, val) || val;
        }

        // Format specific fields
        if (key === 'amount') {
          val = val != null ? Number(val) : 0;
        } else if (key === 'quantity') {
          val = val != null ? Number(val) : 0;
        } else if (key === 'unitPrice') {
          val = val != null ? Number(val) : 0;
        } else if (CAIP_NUM_IDS.has(key)) {
          val = val != null ? Number(val) : 0;
        } else if (key === 'date') {
          val = val || '';
        } else if (key === 'expDate') {
          val = val || '';
        } else {
          val = val ?? '';
        }

        obj[header] = val;
      }

      // Renew view: split renewal fields into dedicated columns for pivot analysis
      // LUD (Last Updated Date)
      obj['上次更新日期 (LUD)'] = row.lud || '';

      if (isRenew) {
        const RENEW_KW = ['續約', '降級購買', '未續約'];
        const hasRenewData = RENEW_KW.some(kw => row.reqType?.includes(kw));
        obj['原到期日(EXP)'] = hasRenewData ? (row.expDate || '') : '';
        obj['原 SKU'] = hasRenewData ? (row.originalSku || '') : '';
        obj['原 QTY'] = hasRenewData ? (Number(row.originalQty) || 0) : 0;
        obj['原 U/P'] = hasRenewData ? (Number(row.originalUnitPrice) || 0) : 0;
        obj['原 NTM'] = hasRenewData ? (Number(row.originalNtm) || 0) : 0;
        obj['新 QTY'] = Number(row.quantity) || 0;
        obj['新 NTM'] = Number(row.amount) || 0;
        obj['QTY 差異'] = obj['新 QTY'] - obj['原 QTY'];
        obj['NTM 差異'] = obj['新 NTM'] - obj['原 NTM'];
      }

      return obj;
    });

    // 4. Create workbook and download
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit column widths
    const allHeaders = Object.keys(exportData[0] || {});
    const colWidths = allHeaders.map(header => {
      let maxLen = header.length;
      for (const row of exportData) {
        const cellVal = String(row[header] ?? '');
        maxLen = Math.max(maxLen, cellVal.length);
      }
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetName = isCAIP ? 'CAIP' : isRenew ? 'AIBS_Renew' : 'AIBS';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `${sheetName}_Pipeline_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`已匯出 ${rows.length} 筆資料至 ${fileName}`);
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

  const allPageRecords = pageGroups.flatMap(g => g.children);
  const allPageSelected = allPageRecords.length > 0 && allPageRecords.every(r => selectedIds.has(r.id));
  function toggleAllPageRows() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        allPageRecords.forEach(r => next.delete(r.id));
      } else {
        allPageRecords.forEach(r => { if (r.id) next.add(r.id); });
      }
      return next;
    });
  }

  function toggleGroupSelect(group) {
    const allSelected = group.children.every(r => selectedIds.has(r.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      group.children.forEach(r => {
        if (allSelected) next.delete(r.id);
        else if (r.id) next.add(r.id);
      });
      return next;
    });
  }

  const handleBatchDelete = useCallback(() => {
    const count = selectedIds.size;
    if (count === 0) return;
    showConfirm?.(`警告：確定要批次刪除這 ${count} 筆商機紀錄嗎？此動作無法復原。`, () => {
      onBatchDelete([...selectedIds]);
      setSelectedIds(new Set());
    });
  }, [selectedIds, onBatchDelete, showConfirm]);

  // (1) Cell rendering – reqType uses inline <select> styled as badge
  function renderCell(row, colKey) {
    switch (colKey) {
      case 'reqType': {
        const typeColorMap = {
          '新購': 'bg-teal-50 text-teal-700 border-teal-200',
          '增購': 'bg-rose-50 text-rose-700 border-rose-200',
          '移轉': 'bg-amber-50 text-amber-700 border-amber-200',
          '轉移': 'bg-amber-50 text-amber-700 border-amber-200',
          'transfer': 'bg-amber-50 text-amber-700 border-amber-200',
          '原案續約': 'bg-indigo-50 text-indigo-700 border-indigo-200',
          '續約增購': 'bg-violet-50 text-violet-700 border-violet-200',
          '降級購買': 'bg-orange-50 text-orange-700 border-orange-200',
          '未續約': 'bg-red-50 text-red-700 border-red-200',
        };
        // Deterministic hash fallback for unknown types
        const TYPE_PALETTE = [
          'bg-sky-50 text-sky-700 border-sky-200',
          'bg-cyan-50 text-cyan-700 border-cyan-200',
          'bg-emerald-50 text-emerald-700 border-emerald-200',
          'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
          'bg-pink-50 text-pink-700 border-pink-200',
        ];
        function typeHash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); }
        const reqLabel = getNameFromDict('reqType', row.reqType);
        const typeCls = typeColorMap[reqLabel] || typeColorMap[row.reqType] || TYPE_PALETTE[typeHash(reqLabel || row.reqType || '') % TYPE_PALETTE.length];
        return (
          <div className="group/type relative inline-flex items-center">
            <select
              value={row.reqType || ''}
              onChange={e => onUpdateRecord?.(row.id, 'reqType', e.target.value)}
              className={`appearance-none cursor-pointer px-2.5 py-1 pr-6 rounded-md text-[11px] font-medium ring-1 ring-inset outline-none bg-transparent hover:bg-slate-50 focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-colors duration-200 ${typeCls}`}
              title="點擊切換類型"
            >
              {(dictData.reqType || [])
                .filter(opt => {
                  const label = opt.label || opt.code || '';
                  if (isRenew) {
                    const RENEW_KW = ['續約', '降級購買', '未續約'];
                    return RENEW_KW.some(kw => label.includes(kw));
                  }
                  const RENEW_KW_EXCL = ['續約', '降級購買', '未續約'];
                  return !RENEW_KW_EXCL.some(kw => label.includes(kw));
                })
                .map(opt => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
            <CaretDown size={10} weight="fill" className="absolute right-1 pointer-events-none opacity-0 group-hover/type:opacity-60 transition-opacity" />
          </div>
        );
      }
      case 'product':
        return <ProductBadge code={row[colKey]} label={getNameFromDict('product', row[colKey])} />;
      case 'stage':
        return <StageBadge stage={row[colKey]} label={getNameFromDict('stage', row[colKey])} />;
      case 'unitPrice':
        return <span className="w-full text-right text-sm font-medium text-slate-500 tabular-nums font-mono">{row.unitPrice != null && row.unitPrice !== 0 ? `NT$ ${Number(row.unitPrice).toLocaleString()}` : '-'}</span>;
      case 'quantity': {
        if (isRenew && row.originalQty != null) {
          const oldVal = Number(row.originalQty) || 0;
          const newVal = Number(row.quantity) || 0;
          const diff = newVal - oldVal;
          return (
            <div className="w-full flex items-center justify-end gap-1.5 text-sm font-mono tabular-nums">
              <span className="text-slate-400 line-through">{oldVal.toLocaleString()}</span>
              <span className="text-slate-300 font-bold">➔</span>
              <span className={`font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-slate-700'}`}>{newVal.toLocaleString()}</span>
            </div>
          );
        }
        return <span className="w-full text-right text-sm font-medium text-slate-500 tabular-nums font-mono">{row.quantity?.toLocaleString?.() ?? row.quantity}</span>;
      }
      case 'amount': {
        if (isRenew && row.originalNtm != null) {
          const oldVal = Number(row.originalNtm) || 0;
          const newVal = Number(row.amount) || 0;
          const diff = newVal - oldVal;
          return (
            <div className="w-full flex items-center justify-end gap-1.5 text-sm font-mono tabular-nums">
              <span className="text-slate-400 line-through">NT$ {oldVal.toLocaleString()}</span>
              <span className="text-slate-300 font-bold">➔</span>
              <span className={`font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-slate-700'}`}>NT$ {newVal.toLocaleString()}</span>
            </div>
          );
        }
        return <span className="w-full text-right text-sm font-medium text-slate-500 tabular-nums font-mono">{row.amount != null ? `NT$ ${row.amount.toLocaleString()}` : '-'}</span>;
      }
      case 'enduser':
        return (
          <div className="w-full block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-800" title={row.enduser || ''}>
            {row.enduser}
          </div>
        );
      case 'si':
        return (
          <div className="w-full block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-800" title={row.si || ''}>
            {row.si}
          </div>
        );
      case 'notes':
        return (
          <div
            className="w-full block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400 font-normal cursor-pointer hover:text-brand-600 hover:underline underline-offset-2 transition-colors"
            onClick={() => onEditRecord?.(row)}
            title={row.notes || ''}
          >
            {row.notes || '-'}
          </div>
        );
      case 'sales':
        return <span className="text-sm font-medium text-slate-800">{getNameFromDict('sales', row.sales)}</span>;
      case 'pm':
        return <span className="text-sm font-medium text-slate-800">{getNameFromDict('pm', row.pm)}</span>;
      case 'date':
        return <span className="text-slate-500 tabular-nums">{row.date}</span>;
      case 'expDate':
        return <span className="text-slate-500 tabular-nums">{row.expDate || '-'}</span>;
      case 'sku': {
        if (isRenew && row.originalSku && row.originalSku !== row.sku) {
          return (
            <div className="w-full overflow-hidden">
              <div className="w-full block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-slate-600" title={row.sku}>{row.sku}</div>
              <div className="w-full block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400" title={row.originalSku}>[原] {row.originalSku}</div>
            </div>
          );
        }
        return (
          <div className="w-full block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-slate-600" title={row.sku || ''}>
            {row.sku}
          </div>
        );
      }
      case 'sales_stage':
        return row.sales_stage ? <DynamicBadge code={row.sales_stage} /> : <span className="text-slate-400">-</span>;
      case 'segment':
        return row.segment ? <DynamicBadge code={row.segment} /> : <span className="text-slate-400">-</span>;
      case 'lud':
        return <span className="text-slate-500 tabular-nums text-xs">{row.lud || '-'}</span>;
      default:
        // CAIP numeric fields: formatted numbers
        if (CAIP_NUM_IDS.has(colKey)) {
          const val = row[colKey];
          return <span className="w-full text-right font-mono text-slate-600 tabular-nums">{val != null && val !== 0 ? Number(val).toLocaleString() : '-'}</span>;
        }
        return <span className="text-slate-500">{row[colKey] ?? '-'}</span>;
    }
  }

  // ── Parent row cell rendering (group-level summary) ──
  function renderParentCell(group, colKey, isExpanded) {
    switch (colKey) {
      case 'enduser':
        return (
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            {isExpanded
              ? <CaretDown size={14} weight="fill" className="text-brand-500 shrink-0" />
              : <CaretRight size={14} weight="fill" className="text-slate-400 shrink-0" />}
            <span className="truncate">{group.enduser || '(未填寫)'}</span>
            <span className="text-xs text-slate-400 font-normal ml-0.5">({group.children.length})</span>
          </div>
        );
      case 'si':
        return (
          <div className="w-full block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-800" title={group.si || ''}>
            {group.si}
          </div>
        );
      case 'sales':
        return <span className="text-sm font-medium text-slate-800">{getNameFromDict('sales', group.sales)}</span>;
      case 'pm':
        return <span className="text-sm font-medium text-slate-800">{getNameFromDict('pm', group.pm)}</span>;
      case 'amount':
        return <span className="w-full text-right text-sm font-bold text-slate-900 tabular-nums font-mono">NT$ {group.totalAmount.toLocaleString()}</span>;
      case 'quantity':
        return <span className="w-full text-right text-sm font-semibold text-slate-800 tabular-nums font-mono">{group.children.reduce((s, r) => s + (r.quantity || 0), 0).toLocaleString()}</span>;
      default:
        return null;
    }
  }

  // ── Child row cell rendering (record-level detail) ──
  function renderChildCell(row, colKey) {
    switch (colKey) {
      case 'enduser':
        return <span className="text-gray-300 pl-5 select-none">└</span>;
      case 'si':
        return null;
      default:
        return renderCell(row, colKey);
    }
  }

  const hasActiveFilters = filterTypes.length > 0 || filterProducts.length > 0 || filterStages.length > 0 || filterPMs.length > 0 || filterSegments.length > 0 || filterDateStart || filterDateEnd || filterAcrPositive.length > 0;
  const visibleColCount = columns.filter(c => visibleCols[c.id] !== false).length;

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">

      {/* ════════════ 1. Header ════════════ */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shrink-0 shadow-sm relative z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 tracking-wider border border-brand-200">MetaAge | Microsoft</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{isCAIP ? 'CAIP List' : isRenew ? 'AIBS Renew List' : 'AIBS List'}</h1>
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
            <button onClick={handleExportExcel} className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              <DownloadSimple size={16} /> EXCEL 匯出
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block" />
            <div className="text-right hidden lg:block">
              <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase mb-0.5">預估商機總額{selectedCount > 0 && <span className="text-brand-600 normal-case tracking-normal ml-1">(已選 {selectedCount} 筆)</span>}</p>
              <div className="flex flex-col items-end">
                <p className="text-lg font-bold text-brand-600 leading-none">
                  NT$ {totalAmount.toLocaleString()} <span className="text-xs font-medium text-gray-500 ml-0.5">TWD</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">≈ ${Math.round(totalAmount / USD_EXCHANGE_RATE).toLocaleString()} USD</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════ Data Grid Container ════════════ */}
      <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col z-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col h-full shadow-sm overflow-hidden">

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
          <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white shrink-0 relative z-40">
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜尋 EU、Partner 或 業務..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 focus:bg-white outline-none transition-colors duration-200 placeholder-slate-400 shadow-[var(--shadow-soft-xs)]"
                />
              </div>

              {/* (3) Filter button with blue dot indicator */}
              <div className="relative z-[100]" ref={filterRef}>
                <button
                  onClick={() => setShowFilter(p => !p)}
                  className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2 border rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    hasActiveFilters
                      ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-[var(--shadow-soft-xs)]'
                      : 'border-slate-200/80 text-slate-600 hover:bg-slate-50 bg-white shadow-[var(--shadow-soft-xs)] hover:shadow-[var(--shadow-soft-sm)]'
                  }`}
                >
                  <Funnel size={16} /> 條件篩選
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* (3) Filter Dropdown – removed 套用篩選 button, kept 重設條件 */}
                {showFilter && (
                  <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-[22rem] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[var(--shadow-soft-lg)] z-[100] p-5 text-sm max-h-[60vh] overflow-y-auto">
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
                      <FilterCheckboxGroup title="Type" items={(() => {
                        if (isRenew) {
                          const RENEW_TYPES = ['原案續約', '續約增購', '降級購買', '未續約'];
                          return (dictData.reqType || []).filter(d => RENEW_TYPES.some(t => (d.label || d.code || '').includes(t)));
                        }
                        const RENEW_EXCL = ['續約', '降級購買', '未續約'];
                        return (dictData.reqType || []).filter(d => !RENEW_EXCL.some(kw => (d.label || d.code || '').includes(kw)));
                      })()} checked={filterTypes} onToggle={v => toggleCheckboxFilter(v, setFilterTypes)} />
                      <FilterCheckboxGroup title="Cat." items={(dictData.product || []).filter(d => {
                        const code = d.code.toLowerCase();
                        if (isCAIP) return code === 'azure';
                        if (isRenew) return code === 'mw-r';
                        return code !== 'azure' && code !== 'mw-r';
                      })} checked={filterProducts} onToggle={v => toggleCheckboxFilter(v, setFilterProducts)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <FilterCheckboxGroup title="Stage" items={dictData.stage} checked={filterStages} onToggle={v => toggleCheckboxFilter(v, setFilterStages)} />
                      <FilterCheckboxGroup title="PM" items={dictData.pm} checked={filterPMs} onToggle={v => toggleCheckboxFilter(v, setFilterPMs)} />
                    </div>
                    {/* RENEW: EXP date range + Segment + Sales Stage */}
                    {isRenew && (
                      <>
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-gray-700 mb-1">EXP (原到期日)</label>
                          <div className="flex items-center gap-2">
                            <input type="date" value={filterExpStart} onChange={e => setFilterExpStart(e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:border-brand-500 outline-none" />
                            <span className="text-gray-400 text-xs">至</span>
                            <input type="date" value={filterExpEnd} onChange={e => setFilterExpEnd(e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:border-brand-500 outline-none" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {(() => {
                            const segOpts = [...new Set(rbacData.map(r => r.segment).filter(Boolean))].sort().map(s => ({ code: s, label: s }));
                            return segOpts.length > 0 ? <FilterCheckboxGroup title="Segment" items={segOpts} checked={filterSegments} onToggle={v => toggleCheckboxFilter(v, setFilterSegments)} /> : null;
                          })()}
                          {(() => {
                            const salesStageDict = dictData?.salesStage || dictData?.['Sales Stage'] || dictData?.sales_stage || [];
                            const stageOpts = salesStageDict.length > 0
                              ? salesStageDict
                              : [...new Set(rbacData.map(r => r.sales_stage).filter(Boolean))].sort().map(s => ({ code: s, label: s }));
                            return stageOpts.length > 0 ? <FilterCheckboxGroup title="Sales Stage" items={stageOpts} checked={filterSalesStages} onToggle={v => toggleCheckboxFilter(v, setFilterSalesStages)} /> : null;
                          })()}
                        </div>
                      </>
                    )}
                    {/* SEGMENT filter (CAIP only, dynamic from data) */}
                    {isCAIP && (() => {
                      const segmentOptions = [...new Set(rbacData.map(r => r.segment).filter(Boolean))].sort().map(s => ({ code: s, label: s }));
                      return segmentOptions.length > 0 ? (
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Segment</label>
                          <div className="max-h-40 overflow-y-auto pr-2 flex flex-col gap-0.5 text-xs text-gray-600">
                            {segmentOptions.map(item => (
                              <label key={item.code} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                                <input type="checkbox" checked={filterSegments.includes(item.code)} onChange={() => toggleCheckboxFilter(item.code, setFilterSegments)} className="text-brand-600 focus:ring-brand-500 rounded-sm w-3.5 h-3.5 cursor-pointer" />
                                <span>{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex justify-end border-t pt-3">
                      <button onClick={clearAllFilters} className="px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded text-xs transition-colors font-medium cursor-pointer">重設條件</button>
                    </div>

                    {/* CAIP: Month & Quarter positive-value filter */}
                    {isCAIP && (
                      <div className="mt-4 border-t pt-3">
                        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">CAIP 預估營收篩選 (大於 0)</div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {['q1','q2','q3','q4'].map(k => (
                            <label key={k} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                              <input type="checkbox" checked={filterAcrPositive.includes(k)} onChange={() => toggleCheckboxFilter(k, setFilterAcrPositive)} className="text-brand-600 focus:ring-brand-500 rounded-sm w-3.5 h-3.5 cursor-pointer" />
                              <span className="text-xs text-gray-600 font-medium">{k.toUpperCase()}</span>
                            </label>
                          ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {['jul','aug','sep','oct','nov','dec','jan','feb','mar','apr','may','jun'].map(k => (
                            <label key={k} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                              <input type="checkbox" checked={filterAcrPositive.includes(k)} onChange={() => toggleCheckboxFilter(k, setFilterAcrPositive)} className="text-brand-600 focus:ring-brand-500 rounded-sm w-3.5 h-3.5 cursor-pointer" />
                              <span className="text-xs text-gray-600">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Batch delete (PM only) */}
              {canDelete && selectedIds.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200 shadow-[var(--shadow-soft-xs)] cursor-pointer"
                >
                  <Trash size={16} /> 批次刪除 ({selectedIds.size})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Batch expand/collapse */}
              <button
                onClick={() => {
                  // Smart expand: if any groups are selected, only toggle those
                  const selectedGroupKeys = pageGroups
                    .filter(g => g.children.some(r => selectedIds.has(r.id)))
                    .map(g => g.key);

                  if (selectedGroupKeys.length > 0) {
                    // Scenario A: toggle only selected groups
                    const allSelectedExpanded = selectedGroupKeys.every(k => expandedGroups.has(k));
                    setExpandedGroups(prev => {
                      const next = new Set(prev);
                      if (allSelectedExpanded) {
                        selectedGroupKeys.forEach(k => next.delete(k));
                      } else {
                        selectedGroupKeys.forEach(k => next.add(k));
                      }
                      return next;
                    });
                  } else {
                    // Scenario B: toggle all groups on page
                    const allExpanded = pageGroups.length > 0 && pageGroups.every(g => expandedGroups.has(g.key));
                    setExpandedGroups(prev => {
                      const next = new Set(prev);
                      if (allExpanded) {
                        pageGroups.forEach(g => next.delete(g.key));
                      } else {
                        pageGroups.forEach(g => next.add(g.key));
                      }
                      return next;
                    });
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors duration-200 bg-white cursor-pointer"
                title={(() => {
                  const hasSelected = pageGroups.some(g => g.children.some(r => selectedIds.has(r.id)));
                  return hasSelected ? '展開/收合選取' : '展開/收合全部';
                })()}
              >
                <ArrowsOutCardinal size={16} />
                {(() => {
                  const selectedGroupKeys = pageGroups
                    .filter(g => g.children.some(r => selectedIds.has(r.id)))
                    .map(g => g.key);
                  if (selectedGroupKeys.length > 0) {
                    const allSelectedExpanded = selectedGroupKeys.every(k => expandedGroups.has(k));
                    return allSelectedExpanded ? '收合選取' : '展開選取';
                  }
                  const allExpanded = pageGroups.length > 0 && pageGroups.every(g => expandedGroups.has(g.key));
                  return allExpanded ? '收合全部' : '展開全部';
                })()}
              </button>

              {/* Column visibility */}
              <div className="relative w-full sm:w-auto" ref={colMenuRef}>
              <button
                onClick={() => setShowColMenu(p => !p)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors duration-200 bg-white shadow-[var(--shadow-soft-xs)] hover:shadow-[var(--shadow-soft-sm)] cursor-pointer"
              >
                <Columns size={16} /> 顯示/隱藏欄位
              </button>
              {showColMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[var(--shadow-soft-lg)] z-50 p-2.5 text-sm max-h-96 overflow-y-auto">
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
          </div>

          {/* ── 4. Table (scrollable area) ── */}
          <div className="flex-1 overflow-auto grid-scroll relative z-10">
            <table ref={tableRef} className="w-full text-left border-collapse whitespace-nowrap" style={{ tableLayout: 'fixed', minWidth: columns.filter(c => visibleCols[c.id] !== false).reduce((sum, c) => sum + (c.width || 100), 0) + 200 }}>
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.04)] z-20 text-xs uppercase tracking-wider text-slate-400 font-semibold select-none">
                <tr>
                  {/* Select-all checkbox — sticky */}
                  <th className="px-3 py-3 w-10 text-center bg-slate-50 sticky left-0 z-30" style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleAllPageRows}
                      className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>

                  {/* (4) All columns (built-in + custom) — unified draggable + resizable */}
                  {columns.map((col, colIdx) => {
                    if (visibleCols[col.id] === false) return null;
                    const isSorted = sortCol === col.id;
                    const width = colWidths[col.id] || col.width;
                    const isFirstVisible = col.id === columns.find(c => visibleCols[c.id] !== false)?.id;
                    const stickyClass = isFirstVisible ? 'sticky left-[44px] z-30 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]' : '';
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
                        className={`px-4 py-3 transition-colors bg-slate-50 cursor-grab relative group/th ${col.align === 'right' ? 'text-right' : ''} ${stickyClass}`}
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
                          className="absolute top-0 right-0 w-4 h-full cursor-col-resize select-none z-10 flex items-center justify-center group/resizer"
                          onMouseDown={e => handleResizeStart(e, col.id)}
                          onDoubleClick={() => handleAutoFitColumn(col.id)}
                        >
                          <div className="w-[3px] h-1/2 rounded-full bg-slate-200/80 group-hover/resizer:bg-brand-400 active:bg-brand-500 transition-colors duration-200" />
                        </div>
                      </th>
                    );
                  })}

                  {/* Add column button */}
                  <th
                    className="px-2 py-3 text-center text-slate-400 cursor-pointer hover:bg-brand-50 hover:text-brand-600 transition-colors bg-slate-50"
                    style={{ width: 60 }}
                    onClick={addCustomColumn}
                    title="新增純文字欄位"
                  >
                    <Plus size={16} weight="bold" className="mx-auto" />
                  </th>

                  {/* Action column header */}
                  <th className="px-2 py-3 text-center bg-slate-50 w-[80px]" style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody className="text-[13px] text-fluent-text bg-white">
                {isGuest ? (
                  <tr>
                    <td colSpan={visibleColCount + 3} className="px-4 py-16 text-center text-gray-400">
                      <Lock size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">您目前無權限查看資料</p>
                      <p className="text-xs text-gray-400 mt-1">請聯繫管理員，將您的信箱加入 Sales 或 PM 字典檔。</p>
                    </td>
                  </tr>
                ) : pageGroups.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColCount + 3} className="px-4 py-12 text-center text-gray-400">
                      <MagnifyingGlass size={28} className="mx-auto mb-2" />
                      <p>找不到符合的結果</p>
                    </td>
                  </tr>
                ) : (
                  pageGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.key);
                    const allChildrenSelected = group.children.every(r => selectedIds.has(r.id));
                    const someChildrenSelected = !allChildrenSelected && group.children.some(r => selectedIds.has(r.id));
                    return (
                      <Fragment key={group.key}>
                        {/* ── Parent Row (Group Header) ── */}
                        <tr
                          className={`border-b border-slate-200/60 cursor-pointer transition-colors duration-200 select-none ${isExpanded ? 'bg-brand-50/40' : 'bg-slate-50/60 hover:bg-slate-100/70'}`}
                          onClick={() => {
                            setExpandedGroups(prev => {
                              const next = new Set(prev);
                              if (next.has(group.key)) next.delete(group.key); else next.add(group.key);
                              return next;
                            });
                          }}
                        >
                          <td className={`px-3 py-2.5 text-center sticky left-0 z-10 ${isExpanded ? '!bg-blue-50' : '!bg-white'}`} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={allChildrenSelected}
                              ref={el => { if (el) el.indeterminate = someChildrenSelected; }}
                              onChange={() => toggleGroupSelect(group)}
                              className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>
                          {columns.map(col => {
                            if (visibleCols[col.id] === false) return null;
                            const isFirstVisible = col.id === columns.find(c => visibleCols[c.id] !== false)?.id;
                            const stickyTd = isFirstVisible ? `sticky left-[44px] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)] ${isExpanded ? '!bg-blue-50' : '!bg-white'}` : '';
                            const tdW = colWidths[col.id] || col.width;
                            return (
                              <td
                                key={col.id}
                                data-col={col.id}
                                className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : ''} ${stickyTd}`}
                                style={{ width: tdW, minWidth: tdW, maxWidth: tdW }}
                              >
                                {renderParentCell(group, col.id, isExpanded)}
                              </td>
                            );
                          })}
                          <td style={{ width: 60 }} />
                          <td className="px-2 py-2.5 text-center" style={{ width: 80 }}>
                            <span className="text-xs text-slate-400 font-normal font-mono">{group.children.length} 筆</span>
                          </td>
                        </tr>

                        {/* ── Child Rows (expanded records) ── */}
                        {isExpanded && group.children.map((row, childIdx) => {
                          const isSelected = selectedIds.has(row.id);
                          return (
                            <tr
                              key={row.id || childIdx}
                              className={`transition-colors duration-200 group border-b border-slate-100/60 cursor-pointer ${isSelected ? 'bg-blue-50/70' : 'bg-slate-50/50 hover:bg-slate-100/60'}`}
                              onDoubleClick={() => { if (canUpdate && isOwner(row)) onEditRecord?.(row); }}
                            >
                              <td className={`px-3 py-2 text-center sticky left-0 z-10 ${isSelected ? '!bg-blue-50' : '!bg-slate-50'}`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRowSelect(row.id)}
                                  className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                                />
                              </td>
                              {columns.map(col => {
                                if (visibleCols[col.id] === false) return null;
                                const isFirstVisible = col.id === columns.find(c => visibleCols[c.id] !== false)?.id;
                                const stickyTd = isFirstVisible ? `sticky left-[44px] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)] ${isSelected ? '!bg-blue-50' : '!bg-slate-50'}` : '';
                                const tdW = colWidths[col.id] || col.width;
                                return (
                                  <td
                                    key={col.id}
                                    data-col={col.id}
                                    className={`px-4 py-2 overflow-hidden text-ellipsis ${col.align === 'right' ? 'text-right' : ''} truncate ${stickyTd}`}
                                    style={{ width: tdW, minWidth: tdW, maxWidth: tdW }}
                                  >
                                    {renderChildCell(row, col.id)}
                                  </td>
                                );
                              })}
                              <td style={{ width: 60 }} />
                              <td className="px-2 py-2 text-center text-slate-300 group-hover:text-slate-500 transition-colors duration-200" style={{ width: 80 }}>
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
                        })}
                      </Fragment>
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
                顯示 {totalGroups === 0 ? '0' : `${startIdx + 1}-${endIdx}`} 組，共 {totalGroups} 組 ({totalRecords} 筆)
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

      {/* ── Inline Prompt Modal (replaces window.prompt) ── */}
      {inlinePrompt.open && (
        <>
          <div className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm" onClick={handleInlinePromptCancel} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 pointer-events-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Pipeline Portal 系統提示</h3>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{inlinePrompt.title}</label>
              <input
                ref={inlinePromptRef}
                autoFocus
                defaultValue={inlinePrompt.defaultValue}
                className="w-full bg-slate-50/80 border border-transparent rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 outline-none transition-colors duration-200"
                onKeyDown={e => { if (e.key === 'Enter') handleInlinePromptOk(); }}
              />
              <div className="flex items-center justify-end gap-3 mt-5">
                <button onClick={handleInlinePromptCancel} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors duration-200">取消</button>
                <button onClick={handleInlinePromptOk} className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors duration-200 shadow-sm">確定</button>
              </div>
            </div>
          </div>
        </>
      )}
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
