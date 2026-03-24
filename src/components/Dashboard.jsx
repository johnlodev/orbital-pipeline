import { useState, useMemo, useRef, useEffect } from 'react';
import {
  CurrencyDollar,
  Target,
  Stack,
  Calculator,
  ChartPieSlice,
  ChartDonut,
  Funnel,
  Eye,
  Faders,
  TrendUp,
  Buildings,
  Handshake,
  UsersThree,
  UserCircleGear,
  Barcode,
  ArrowsCounterClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { dictData as defaultDictData } from '../utils/mockData';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  ChartDataLabels,
);

// Chart.js global defaults
ChartJS.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
ChartJS.defaults.color = '#605e5c';

// 9 chart definitions for visibility toggle
const CHART_DEFS = [
  { id: 'trend',   label: '預估結單趨勢 (Trend)' },
  { id: 'type',    label: '需求類型佔比 (Type)' },
  { id: 'product', label: '產品線營收佔比 (Cat.)' },
  { id: 'stage',   label: '各階段轉換漏斗 (Stage)' },
  { id: 'eu',      label: '貢獻最高客戶 Top 5 (EU)' },
  { id: 'partner', label: '貢獻最高代理商 (Partner)' },
  { id: 'sales',   label: '業務潛在業績榜 (Sales)' },
  { id: 'pm',      label: 'PM 專案負責總額 (PM)' },
  { id: 'sku',     label: '熱門銷售料號 Top 10 (SKU)' },
];

// ── helpers ──
function getWeekStart(dateStr) {
  if (!dateStr || dateStr === '-') return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}/${mm}/${dd}`;
}

function getTopN(obj, n = 5) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .reduce((o, [k, v]) => { o[k] = v; return o; }, {});
}

const ntTooltip = { callbacks: { label: (c) => ` NT$ ${c.raw.toLocaleString()}` } };

export default function Dashboard({ data, dictionary, currentUserPermissions }) {
  const dictData = dictionary || defaultDictData;
  // 嚴格執行勾選邏輯：不論角色，一律依照 checkbox 值
  const canViewSalesRank = !!currentUserPermissions?.view_sales_rank;
  const canViewPmDist    = !!currentUserPermissions?.view_pm_dist;

  // ── (1) Filter panel toggle ──
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // ── (2) Chart visibility ──
  const [chartVis, setChartVis] = useState(
    Object.fromEntries(CHART_DEFS.map(c => [c.id, true]))
  );
  const [showChartMenu, setShowChartMenu] = useState(false);
  const chartMenuRef = useRef(null);

  // ── (3) Dashboard-local filter state ──
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterProducts, setFilterProducts] = useState([]);
  const [filterStages, setFilterStages] = useState([]);
  const [filterSales, setFilterSales] = useState([]);
  const [filterPMs, setFilterPMs] = useState([]);

  // Close chart menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (chartMenuRef.current && !chartMenuRef.current.contains(e.target)) {
        setShowChartMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleVis(id) {
    setChartVis(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggle(value, setter) {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  }

  function resetDashFilters() {
    setSearchTerm('');
    setDateStart('');
    setDateEnd('');
    setFilterTypes([]);
    setFilterProducts([]);
    setFilterStages([]);
    setFilterSales([]);
    setFilterPMs([]);
  }

  function getDictLabel(dictKey, code) {
    const entry = dictData[dictKey]?.find(d => d.code === code);
    return entry ? entry.label : code;
  }

  // ═══════ Filtered data ═══════
  const filteredData = useMemo(() => {
    let result = data;

    // keyword search across enduser, si, sku, notes
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        [r.enduser, r.si, r.sku, r.notes].some(f => f && f.toLowerCase().includes(term))
      );
    }

    // date range
    if (dateStart) result = result.filter(r => r.date && r.date >= dateStart);
    if (dateEnd) result = result.filter(r => r.date && r.date <= dateEnd);

    if (filterTypes.length)    result = result.filter(r => filterTypes.includes(r.reqType));
    if (filterProducts.length) result = result.filter(r => filterProducts.includes(r.product));
    if (filterStages.length)   result = result.filter(r => filterStages.includes(r.stage));
    if (filterSales.length)    result = result.filter(r => filterSales.includes(r.sales));
    if (filterPMs.length)      result = result.filter(r => filterPMs.includes(r.pm));
    return result;
  }, [data, searchTerm, dateStart, dateEnd, filterTypes, filterProducts, filterStages, filterSales, filterPMs]);

  // ═══════ KPI & all 9 chart stats ═══════
  const stats = useMemo(() => {
    let totalNTM = 0, totalQty = 0;
    const typeStats = {}, prodStats = {}, stageStats = {};
    const salesStats = {}, pmStats = {};
    const euStats = {}, partnerStats = {}, skuStats = {};
    const trendStats = {};

    filteredData.forEach(row => {
      const amt = row.amount || 0;
      const qty = row.quantity || 0;
      totalNTM += amt;
      totalQty += qty;

      const typeLabel   = getDictLabel('reqType', row.reqType) || '未分類';
      const prodLabel   = getDictLabel('product', row.product) || '未分類';
      const stageLabel  = getDictLabel('stage', row.stage) || '未分類';
      const salesLabel  = getDictLabel('sales', row.sales) || '未指定';
      const pmLabel     = getDictLabel('pm', row.pm) || '未指定';

      typeStats[typeLabel]     = (typeStats[typeLabel]   || 0) + amt;
      prodStats[prodLabel]     = (prodStats[prodLabel]   || 0) + amt;
      stageStats[stageLabel]   = (stageStats[stageLabel] || 0) + amt;
      salesStats[salesLabel]   = (salesStats[salesLabel] || 0) + amt;
      pmStats[pmLabel]         = (pmStats[pmLabel]       || 0) + amt;
      euStats[row.enduser || '未知客戶']     = (euStats[row.enduser || '未知客戶']   || 0) + amt;
      partnerStats[row.si || '未知代理商']     = (partnerStats[row.si || '未知代理商']   || 0) + amt;
      skuStats[row.sku || '未指定 SKU']        = (skuStats[row.sku || '未指定 SKU']      || 0) + amt;

      const wk = getWeekStart(row.date);
      if (wk) trendStats[wk] = (trendStats[wk] || 0) + amt;
    });

    const totalDeals = filteredData.length;
    const avgDeal = totalDeals > 0 ? Math.round(totalNTM / totalDeals) : 0;

    return { totalNTM, totalDeals, totalQty, avgDeal, typeStats, prodStats, stageStats, salesStats, pmStats, euStats, partnerStats, skuStats, trendStats };
  }, [filteredData, dictData]);

  // ── Shared chart option factories ──
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { display: true, position: 'right' },
      tooltip: ntTooltip,
      datalabels: {
        display: true, color: '#fff', font: { weight: 'bold', size: 11 },
        formatter: (value, ctx) => {
          const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          if (sum === 0) return '';
          const pct = ((value * 100) / sum).toFixed(1);
          return pct >= 5 ? pct + '%' : '';
        },
      },
    },
  };

  function hBarOpts(color) {
    return {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: ntTooltip, datalabels: { display: false } },
      scales: {
        x: { grid: { display: true, color: '#f3f2f1' }, beginAtZero: true },
        y: { grid: { display: false } },
      },
    };
  }

  function vBarOpts() {
    return {
      responsive: true, maintainAspectRatio: false, indexAxis: 'x',
      plugins: { legend: { display: false }, tooltip: ntTooltip, datalabels: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { display: true, color: '#f3f2f1' }, beginAtZero: true },
      },
    };
  }

  function makeBarData(labels, values, color) {
    return {
      labels: labels.length ? labels : ['無資料'],
      datasets: [{ label: '預估金額 (NTM)', data: labels.length ? values : [0], backgroundColor: color, borderWidth: 0, borderRadius: 4, barPercentage: 0.6 }],
    };
  }

  // ── Build chart datasets ──
  // 1. Trend (Line)
  const sortedWeeks = Object.keys(stats.trendStats).sort();
  const trendChartData = {
    labels: sortedWeeks.length ? sortedWeeks : ['無資料'],
    datasets: [{
      label: '預估下單金額 (NTM)',
      data: sortedWeeks.length ? sortedWeeks.map(w => stats.trendStats[w]) : [0],
      borderColor: '#0078d4', backgroundColor: 'rgba(0, 120, 212, 0.1)',
      borderWidth: 2, pointBackgroundColor: '#0078d4', fill: true, tension: 0.3,
    }],
  };
  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: ntTooltip, datalabels: { display: false } },
    scales: { y: { grid: { color: '#f3f2f1' }, beginAtZero: true }, x: { grid: { display: false } } },
  };

  // 2. Type (Doughnut)
  const typeLabels = Object.keys(stats.typeStats);
  const typeData = {
    labels: typeLabels.length ? typeLabels : ['無資料'],
    datasets: [{ label: '營收佔比', data: typeLabels.length ? Object.values(stats.typeStats) : [0], backgroundColor: ['#8b5cf6', '#d946ef', '#f43f5e', '#a855f7'], borderWidth: 2, borderColor: '#fff' }],
  };

  // 3. Product (Doughnut)
  const prodLabels = Object.keys(stats.prodStats);
  const prodData = {
    labels: prodLabels.length ? prodLabels : ['無資料'],
    datasets: [{ label: '營收佔比', data: prodLabels.length ? Object.values(stats.prodStats) : [0], backgroundColor: ['#14b8a6', '#0ea5e9', '#f59e0b'], borderWidth: 2, borderColor: '#fff' }],
  };

  // 4. Stage (Horizontal Bar)
  const sortedStages = Object.keys(stats.stageStats).sort();
  const stageData = makeBarData(sortedStages, sortedStages.map(s => stats.stageStats[s]), '#f97316');

  // 5. EU Top 5 (Horizontal Bar)
  const topEU = getTopN(stats.euStats, 5);
  const euData = makeBarData(Object.keys(topEU), Object.values(topEU), '#3b82f6');

  // 6. Partner Top 5 (Horizontal Bar)
  const topPartner = getTopN(stats.partnerStats, 5);
  const partnerData = makeBarData(Object.keys(topPartner), Object.values(topPartner), '#6366f1');

  // 7. Sales (Vertical Bar)
  const sortedSalesKeys = Object.keys(stats.salesStats).sort((a, b) => stats.salesStats[b] - stats.salesStats[a]);
  const salesData = makeBarData(sortedSalesKeys, sortedSalesKeys.map(s => stats.salesStats[s]), '#2563eb');

  // 8. PM (Vertical Bar)
  const sortedPMKeys = Object.keys(stats.pmStats).sort((a, b) => stats.pmStats[b] - stats.pmStats[a]);
  const pmData = makeBarData(sortedPMKeys, sortedPMKeys.map(p => stats.pmStats[p]), '#059669');

  // 9. SKU Top 10 (Horizontal Bar)
  const topSKU = getTopN(stats.skuStats, 10);
  const skuData = makeBarData(Object.keys(topSKU), Object.values(topSKU), '#ec4899');

  const hasActiveFilters = searchTerm || dateStart || dateEnd || filterTypes.length || filterProducts.length || filterStages.length || filterSales.length || filterPMs.length;

  // ═══════ Render ═══════
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {/* ── Dashboard Header ── */}
      <header className="bg-white border-b border-fluent-border px-6 py-4 shrink-0 shadow-sm relative z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase tracking-wider border border-green-200">Analytics</span>
              <span className="text-xs text-gray-500">Microsoft</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Chart visibility dropdown */}
            <div className="relative" ref={chartMenuRef}>
              <button
                onClick={() => setShowChartMenu(p => !p)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Eye size={16} /> 圖表顯示
              </button>
              {showChartMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-[60] p-2 text-sm max-h-96 overflow-y-auto">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">勾選以顯示圖表</div>
                  {CHART_DEFS.filter(chart => {
                    if (chart.id === 'sales' && !canViewSalesRank) return false;
                    if (chart.id === 'pm' && !canViewPmDist) return false;
                    return true;
                  }).map(chart => (
                    <label key={chart.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chartVis[chart.id]}
                        onChange={() => toggleVis(chart.id)}
                        className="text-brand-600 focus:ring-brand-500 rounded-sm w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{chart.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Filter panel toggle */}
            <button
              onClick={() => setIsFilterOpen(p => !p)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Faders size={16} />
              {isFilterOpen ? '隱藏篩選器' : '顯示篩選器'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Dashboard Content (SCROLLABLE) ── */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto dash-scroll text-fluent-text">

        {/* ── Filter Panel ── */}
        {isFilterOpen && (
          <div className="bg-white rounded border border-gray-200 p-5 mb-6 shadow-sm transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* Keyword */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">全域搜尋 (EU / Partner / SKU / 備註)</label>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="輸入關鍵字..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:border-brand-500 outline-none transition-colors text-gray-700" />
                </div>
              </div>
              {/* Date Range */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">POD (預計下單日) 區間</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none text-gray-700" />
                  <span className="text-gray-400 text-xs">至</span>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none text-gray-700" />
                </div>
              </div>
              {/* Type */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Type <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.reqType} checked={filterTypes} onToggle={v => toggle(v, setFilterTypes)} />
              </div>
              {/* Cat. */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Cat. <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.product} checked={filterProducts} onToggle={v => toggle(v, setFilterProducts)} />
              </div>
              {/* Stage */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Stage <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.stage} checked={filterStages} onToggle={v => toggle(v, setFilterStages)} />
              </div>
              {/* Sales */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Sales <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.sales} checked={filterSales} onToggle={v => toggle(v, setFilterSales)} />
              </div>
              {/* PM */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">PM <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.pm} checked={filterPMs} onToggle={v => toggle(v, setFilterPMs)} />
              </div>
              {/* Reset */}
              <div className="flex items-end justify-start lg:justify-end">
                <button onClick={resetDashFilters} className="text-sm text-brand-600 hover:text-brand-800 font-medium px-4 py-2 hover:bg-brand-50 rounded transition-colors flex items-center gap-1.5 w-full lg:w-auto justify-center border border-brand-200 bg-brand-50/50 cursor-pointer">
                  <ArrowsCounterClockwise size={14} weight="bold" /> 重新載入所有資料
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-brand-500 relative overflow-hidden">
            <CurrencyDollar weight="fill" className="text-brand-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">預估總商機 (NTM)</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10 flex items-baseline gap-1">
              NT$ {stats.totalNTM.toLocaleString()}
              <span className="text-xs font-medium text-gray-500 ml-1 font-mono">≈ ${Math.round(stats.totalNTM / 30).toLocaleString()} USD</span>
            </p>
          </div>
          <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-orange-500 relative overflow-hidden">
            <Target weight="fill" className="text-orange-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">符合條件案件數</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10">{stats.totalDeals} <span className="text-sm font-medium text-gray-400">件</span></p>
          </div>
          <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-teal-500 relative overflow-hidden">
            <Stack weight="fill" className="text-teal-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">授權總數量 (QTY)</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10">{stats.totalQty.toLocaleString()} <span className="text-sm font-medium text-gray-400">套</span></p>
          </div>
          <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-400 relative overflow-hidden">
            <Calculator weight="fill" className="text-blue-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">平均案頭金額</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10 flex items-baseline gap-1">
              NT$ {stats.avgDeal.toLocaleString()}
              <span className="text-xs font-medium text-gray-500 ml-1 font-mono">≈ ${Math.round(stats.avgDeal / 30).toLocaleString()} USD</span>
            </p>
          </div>
        </div>

        {/* ── 1. Trend (Full Width Line) ── */}
        {chartVis.trend && (
          <div className="bg-white rounded border border-gray-200 p-5 shadow-sm mb-6 transition-all">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendUp weight="fill" className="text-brand-600 text-lg" /> 預估結單趨勢 (Weekly Pipeline Trend)
            </h3>
            <div className="relative w-full h-[250px]">
              <Line data={trendChartData} options={trendOptions} />
            </div>
          </div>
        )}

        {/* ── 2–9 Charts Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* 2. Type Doughnut */}
          {chartVis.type && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ChartPieSlice weight="fill" className="text-purple-500 text-lg" /> 需求類型佔比 (Type)
              </h3>
              <div className="relative w-full h-[220px]">
                <Doughnut data={typeData} options={doughnutOptions} />
              </div>
            </div>
          )}

          {/* 3. Product Doughnut */}
          {chartVis.product && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ChartDonut weight="fill" className="text-teal-600 text-lg" /> 產品線營收佔比 (Cat.)
              </h3>
              <div className="relative w-full h-[220px]">
                <Doughnut data={prodData} options={doughnutOptions} />
              </div>
            </div>
          )}

          {/* 4. Stage Funnel (Horizontal Bar) */}
          {chartVis.stage && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm md:col-span-2 xl:col-span-1 transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Funnel weight="fill" className="text-orange-500 text-lg" /> 各階段轉換漏斗 (Stage)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={stageData} options={hBarOpts()} />
              </div>
            </div>
          )}

          {/* 5. Top 5 EU (Horizontal Bar) */}
          {chartVis.eu && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Buildings weight="fill" className="text-blue-500 text-lg" /> 貢獻最高客戶 Top 5 (EU)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={euData} options={hBarOpts()} />
              </div>
            </div>
          )}

          {/* 6. Top 5 Partner (Horizontal Bar) */}
          {chartVis.partner && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Handshake weight="fill" className="text-indigo-500 text-lg" /> 貢獻最高代理商 Top 5 (Partner)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={partnerData} options={hBarOpts()} />
              </div>
            </div>
          )}

          {/* 7. Sales (Vertical Bar) */}
          {chartVis.sales && canViewSalesRank && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UsersThree weight="fill" className="text-blue-600 text-lg" /> 業務潛在業績榜 (Sales)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={salesData} options={vBarOpts()} />
              </div>
            </div>
          )}

          {/* 8. PM (Vertical Bar → Full Width) */}
          {chartVis.pm && canViewPmDist && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm md:col-span-2 xl:col-span-3 transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserCircleGear weight="fill" className="text-emerald-600 text-lg" /> PM 專案負責總額分佈
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={pmData} options={vBarOpts()} />
              </div>
            </div>
          )}

          {/* 9. SKU Top 10 (Horizontal Bar → Full Width) */}
          {chartVis.sku && (
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm md:col-span-2 xl:col-span-3 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Barcode weight="fill" className="text-pink-500 text-lg" /> 熱門銷售料號 Top 10 (SKU 貢獻額)
                </h3>
                <span className="text-[10px] text-gray-400 font-normal">💡 提示：使用上方 Cat. 篩選器可快速檢視特定產品線熱銷 SKU</span>
              </div>
              <div className="relative w-full h-[300px]">
                <Bar data={skuData} options={hBarOpts()} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-12 w-full" />
      </div>
    </div>
  );
}

// ═══════ Dashboard Filter Group (inline badge checkboxes) ═══════
function DashFilterGroup({ items, checked, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const isChecked = checked.includes(item.code);
        return (
          <label
            key={item.code}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors border ${
              isChecked
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(item.code)}
              className="sr-only"
            />
            {item.label}
          </label>
        );
      })}
    </div>
  );
}
