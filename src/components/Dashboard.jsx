import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { USD_EXCHANGE_RATE } from '../utils/constants';
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

// ── Number Ticker (animated counter) ──
function NumberTicker({ value, duration = 1.2 }) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, v => Math.round(v).toLocaleString());
  const [text, setText] = useState('0');

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on('change', v => setText(v));
    return unsub;
  }, [display]);

  return <span>{text}</span>;
}

// ── MetricCard sub-component ──
function MetricCard({ icon: Icon, iconColor, accentColor, title, prefix, value, suffix, subValue }) {
  return (
    <div
      className={`group relative bg-white rounded-2xl border border-slate-100/80 p-5 shadow-[var(--shadow-soft-xs)] hover:shadow-[var(--shadow-soft-md)] hover:-translate-y-1 transition-[transform,box-shadow] duration-300 ease-out flex flex-col justify-center overflow-hidden cursor-default`}
    >
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} rounded-t-2xl`} />

      {/* Background icon */}
      <Icon weight="fill" className={`${iconColor} opacity-[0.07] text-7xl absolute -right-2 -bottom-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]`} />

      {/* Content */}
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 relative z-10">{title}</p>
      <p className="text-2xl font-bold text-slate-900 relative z-10 flex items-baseline gap-1 tabular-nums">
        {prefix && <span className="text-base font-semibold text-slate-500">{prefix}</span>}
        <NumberTicker value={value} />
        {suffix && <span className="text-sm font-medium text-slate-400 ml-0.5">{suffix}</span>}
      </p>
      {subValue && (
        <p className="text-[11px] text-slate-400 mt-1.5 relative z-10 font-mono">{subValue}</p>
      )}
    </div>
  );
}

const STAGE_COLORS = {
  L1: '#94a3b8', L2: '#facc15', L3: '#fb923c', L4: '#22c55e',
  Won: '#10b981', Commit: '#3b82f6', Pipe: '#a78bfa', Lost: '#ef4444',
};

const AREA_PALETTE = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#34d399', '#fbbf24'];
const AREA_COLORS = AREA_PALETTE.map(c => ({ border: c, bg: c + '40' }));

// MW-R Renewal type keywords
const RENEW_TYPES = ['原案續約', '續約增購', '降級購買', '未續約'];
const MWR_TYPE_ITEMS = RENEW_TYPES.map(t => ({ label: t, code: t }));

// Chart definitions for visibility toggle — standard 9 + MW-R 6
const CHART_DEFS = [
  { id: 'trend',   label: 'Weekly Pipeline Trend' },
  { id: 'type',    label: '需求類型占比 (Type)' },
  { id: 'product', label: '產品金額占比 (Cat.)' },
  { id: 'stage',   label: 'Waterfall (Stage)' },
  { id: 'eu',      label: 'Top 10 (EU)' },
  { id: 'partner', label: 'Top 10 (Partner)' },
  { id: 'sales',   label: 'Forecast (Sales)' },
  { id: 'pm',      label: '專案負責總額 (PM)' },
  { id: 'sku',     label: 'Top 10 (SKU)' },
];
const MWR_CHART_DEFS = [
  { id: 'recaptureRate', label: 'Monthly Renewal Recapture Rate' },
  { id: 'mwrMonthlyARR', label: 'Monthly ARR Renewal Comparison' },
  { id: 'mwrType',      label: 'Type 佔比' },
  { id: 'mwrStage',     label: 'Sales Stage 佔比' },
  { id: 'mwrPartner',   label: 'Top 5 Partner' },
  { id: 'rcTopPartner', label: 'Recapture Top 5 Partner' },
  { id: 'rcLowPartner', label: 'Recapture Lowest 5 Partner' },
  { id: 'rcLowEU',      label: 'Recapture Lowest 5 EU' },
  { id: 'mwrEU',        label: 'Top 5 EU' },
  { id: 'rcTopEU',      label: 'Recapture Top 5 EU' },
  { id: 'mwrPartnerARR', label: 'ARR Renewal Comparison Top 10 (Partner)' },
  { id: 'mwrSKU',       label: 'Top 10 SKU' },
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

// ── Pareto (80/20) helpers ──
function makeParetoData(labels, values, barColor, extraBarProps = {}) {
  const total = values.reduce((a, b) => a + b, 0);
  let cumSum = 0;
  const cumPct = values.map(v => { cumSum += v; return total > 0 ? +(cumSum / total * 100).toFixed(1) : 0; });
  if (!labels.length) return { labels: ['無資料'], datasets: [{ data: [0], backgroundColor: barColor }] };
  return {
    labels,
    datasets: [
      { type: 'bar', label: '金額 (NTM)', data: values, backgroundColor: barColor, borderRadius: 4, barPercentage: 0.6, yAxisID: 'y', order: 2, ...extraBarProps },
      { type: 'line', label: '累計佔比', data: cumPct, borderColor: '#f97316', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#f97316', tension: 0.3, yAxisID: 'y1', order: 1 },
      { type: 'line', label: '80%', data: labels.map(() => 80), borderColor: '#ef444460', borderDash: [6, 3], borderWidth: 1.5, pointRadius: 0, yAxisID: 'y1', order: 0 },
    ],
  };
}

function paretoOpts(customTooltip) {
  return {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 30 } },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 10 }, filter: item => item.text !== '80%' } },
      tooltip: { callbacks: { label: customTooltip || (ctx => {
        if (ctx.dataset.label === '80%') return null;
        if (ctx.dataset.yAxisID === 'y1') return ` 累計佔比: ${Number(ctx.raw).toFixed(1)}%`;
        return ` NT$ ${(ctx.raw || 0).toLocaleString()}`;
      }) } },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45, autoSkip: false } },
      y: { grid: { color: '#f1f5f9' }, beginAtZero: true, grace: '15%', position: 'left' },
      y1: { grid: { display: false }, beginAtZero: true, max: 100, position: 'right', ticks: { callback: v => v + '%' } },
    },
  };
}

export default function Dashboard({ data, dictionary, currentUserPermissions }) {
  const rawDict = dictionary || defaultDictData;
  // Ensure mw-r product option always exists in Cat. filter
  const dictData = useMemo(() => {
    const d = { ...rawDict };
    const prodArr = d.product || [];
    if (!prodArr.some(p => p.code.toLowerCase() === 'mw-r')) {
      d.product = [...prodArr, { label: 'MW-R', code: 'mw-r' }];
    }
    return d;
  }, [rawDict]);
  // 嚴格執行勾選邏輯：不論角色，一律依照 checkbox 值
  const canViewSalesRank = !!currentUserPermissions?.view_sales_rank;
  const canViewPmDist    = !!currentUserPermissions?.view_pm_dist;

  // ── (1) Filter panel toggle ──
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // ── (2) Chart visibility ──
  const [chartVis, setChartVis] = useState(
    Object.fromEntries([...CHART_DEFS, ...MWR_CHART_DEFS].map(c => [c.id, true]))
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
  const [filterSegments, setFilterSegments] = useState([]);
  const [filterSalesStages, setFilterSalesStages] = useState([]);
  const [filterQuarters, setFilterQuarters] = useState([]);
  const [filterMonths, setFilterMonths] = useState([]);
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [excludePartners, setExcludePartners] = useState([]);

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

  // Cat. mutually exclusive logic: Azure and mw-r are exclusive modes
  const EXCLUSIVE_CATS = ['azure', 'mw-r'];
  function toggleProduct(value) {
    const lower = value.toLowerCase();
    setFilterProducts(prev => {
      // If already selected, just deselect
      if (prev.includes(value)) return prev.filter(v => v !== value);
      // If clicking an exclusive cat, force single-select
      if (EXCLUSIVE_CATS.includes(lower)) return [value];
      // If clicking a normal cat, remove any exclusive cats first
      const cleaned = prev.filter(v => !EXCLUSIVE_CATS.includes(v.toLowerCase()));
      return [...cleaned, value];
    });
    // Clear irrelevant Type filters when switching modes
    setFilterTypes([]);
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
    setFilterSegments([]);
    setFilterSalesStages([]);
    setFilterQuarters([]);
    setFilterMonths([]);
    setExpStart('');
    setExpEnd('');
    setExcludePartners([]);
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
    if (filterProducts.length) {
      // MW-R is a virtual product code; actual DB records use product='MW'
      const expandedProducts = filterProducts.some(p => p.toLowerCase() === 'mw-r')
        ? [...new Set([...filterProducts, 'MW'])]
        : filterProducts;
      result = result.filter(r => expandedProducts.includes(r.product));
    }
    if (filterStages.length)   result = result.filter(r => filterStages.includes(r.stage));
    if (filterSales.length)    result = result.filter(r => filterSales.includes(r.sales));
    if (filterPMs.length)      result = result.filter(r => filterPMs.includes(r.pm));
    if (filterSegments.length)  result = result.filter(r => filterSegments.includes(r.segment));
    if (filterSalesStages.length)  result = result.filter(r => filterSalesStages.includes(r.sales_stage));
    if (filterQuarters.length)  result = result.filter(r => filterQuarters.every(q => Number(r[q]) > 0));
    if (filterMonths.length)    result = result.filter(r => filterMonths.every(m => Number(r[m]) > 0));
    // MW-R EXP date range
    if (expStart) result = result.filter(r => r.expDate && r.expDate >= expStart);
    if (expEnd)   result = result.filter(r => r.expDate && r.expDate <= expEnd);
    // Exclude specific Partners (巨鯨排除)
    if (excludePartners.length) result = result.filter(r => !(r.si && excludePartners.includes(r.si)));
    return result;
  }, [data, searchTerm, dateStart, dateEnd, filterTypes, filterProducts, filterStages, filterSales, filterPMs, filterSegments, filterSalesStages, filterQuarters, filterMonths, expStart, expEnd, excludePartners]);

  // MW-R mode detection (case-insensitive for safety)
  const isMWR = filterProducts.some(p => p.toLowerCase() === 'mw-r');

  // ═══════ KPI & all 9 chart stats ═══════
  const stats = useMemo(() => {
    // When MW-R mode, only count renewal-type rows for KPI purity
    const kpiData = isMWR
      ? filteredData.filter(row => RENEW_TYPES.includes(row.reqType || ''))
      : filteredData;
    let totalNTM = 0, totalQty = 0;
    const typeStats = {}, prodStats = {}, stageStats = {}, segmentStats = {};
    const salesStats = {}, pmStats = {};
    const euStats = {}, partnerStats = {}, skuStats = {}, skuQtyStats = {};
    const trendStats = {};
    const trendByStage = {};

    kpiData.forEach(row => {
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

      const segLabel = row.segment || '未分類';
      segmentStats[segLabel]   = (segmentStats[segLabel] || 0) + amt;
      salesStats[salesLabel]   = (salesStats[salesLabel] || 0) + amt;
      pmStats[pmLabel]         = (pmStats[pmLabel]       || 0) + amt;
      euStats[row.enduser || '未知客戶']     = (euStats[row.enduser || '未知客戶']   || 0) + amt;
      partnerStats[row.si || '未知代理商']     = (partnerStats[row.si || '未知代理商']   || 0) + amt;
      skuStats[row.sku || '未指定 SKU']        = (skuStats[row.sku || '未指定 SKU']      || 0) + amt;
      skuQtyStats[row.sku || '未指定 SKU']     = (skuQtyStats[row.sku || '未指定 SKU']   || 0) + qty;

      const wk = getWeekStart(row.date);
      if (wk) trendStats[wk] = (trendStats[wk] || 0) + amt;

      // ── Stacked trend by stage ──
      const stageCode = row.stage || '';
      if (wk) {
        if (!trendByStage[wk]) trendByStage[wk] = {};
        trendByStage[wk][stageCode || '未分類'] = (trendByStage[wk][stageCode || '未分類'] || 0) + amt;
      }
    });

    const totalDeals = kpiData.length;
    const avgDeal = totalDeals > 0 ? Math.round(totalNTM / totalDeals) : 0;

    return { totalNTM, totalDeals, totalQty, avgDeal, typeStats, prodStats, stageStats, segmentStats, salesStats, pmStats, euStats, partnerStats, skuStats, skuQtyStats, trendStats, trendByStage };
  }, [filteredData, dictData, isMWR]);

  // ── Shared chart option factories ──
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const val = ctx.raw || 0;
            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = sum > 0 ? ((val / sum) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: NT$ ${val.toLocaleString()} (${pct}%)`;
          },
        },
      },
      datalabels: { display: false },
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
  // 1. Trend (Stacked Area)
  const sortedWeeks = Object.keys(stats.trendStats).sort();
  const allStageKeysInTrend = useMemo(() => {
    const s = new Set();
    for (const wk of Object.values(stats.trendByStage)) {
      for (const k of Object.keys(wk)) s.add(k);
    }
    // Sort stages alphabetically (L1 < L2 < L3 < L4)
    return [...s].sort();
  }, [stats.trendByStage]);

  const trendChartData = {
    labels: sortedWeeks.length ? sortedWeeks : ['無資料'],
    datasets: sortedWeeks.length && allStageKeysInTrend.length
      ? allStageKeysInTrend.map((stage, i) => {
          const c = AREA_COLORS[i % AREA_COLORS.length];
          return {
            label: stage || '未分類',
            data: sortedWeeks.map(w => (stats.trendByStage[w] || {})[stage] || 0),
            borderColor: c.border,
            backgroundColor: c.bg,
            borderWidth: 1.5,
            fill: true,
            stack: 'area1',
            tension: 0.35,
            pointRadius: 2,
          };
        })
      : [{ label: '無資料', data: [0], borderColor: '#ccc', backgroundColor: 'rgba(0,0,0,0.05)', fill: true }],
  };
  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 10 } } },
      tooltip: ntTooltip, datalabels: { display: false },
    },
    scales: {
      y: { stacked: true, grid: { color: '#f1f5f9' }, beginAtZero: true },
      x: { stacked: true, grid: { display: false } },
    },
  };

  // 2. Type (Doughnut)
  const typeLabels = Object.keys(stats.typeStats);
  const typeData = {
    labels: typeLabels.length ? typeLabels : ['無資料'],
    datasets: [{ label: '營收佔比', data: typeLabels.length ? Object.values(stats.typeStats) : [0], backgroundColor: ['#8b5cf6', '#d946ef', '#f43f5e', '#a855f7'], borderWidth: 2, borderColor: '#fff' }],
  };

  // 3. Product / Segment (Doughnut) — swap when Azure is filtered
  const isAzureFiltered = filterProducts.includes('Azure');
  const chartProdLabels = isAzureFiltered ? Object.keys(stats.segmentStats) : Object.keys(stats.prodStats);
  const chartProdValues = isAzureFiltered ? Object.values(stats.segmentStats) : Object.values(stats.prodStats);
  const prodData = {
    labels: chartProdLabels.length ? chartProdLabels : ['無資料'],
    datasets: [{ label: '營收佔比', data: chartProdLabels.length ? chartProdValues : [0], backgroundColor: ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#f97316', '#22c55e'], borderWidth: 2, borderColor: '#fff' }],
  };

  // 4. Stage Waterfall Chart
  const waterfallStageOrder = ['L1', 'L2', 'L3', 'L4'];
  const wfOrderedStages = [...waterfallStageOrder.filter(s => stats.stageStats[getDictLabel('stage', s)] != null || stats.stageStats[s] != null)];
  Object.keys(stats.stageStats).forEach(s => {
    if (!wfOrderedStages.includes(s)) wfOrderedStages.push(s);
  });
  const wfLabels = [...wfOrderedStages, '合計'];
  const wfValues = wfOrderedStages.map(s => stats.stageStats[s] || 0);
  const wfTotal = wfValues.reduce((a, b) => a + b, 0);
  // Build floating bar data: each bar [start, end], total bar sits at [0, total]
  let wfRunning = 0;
  const wfBars = wfValues.map(v => { const s = wfRunning; wfRunning += v; return [s, wfRunning]; });
  wfBars.push([0, wfTotal]); // total bar
  const wfColors = wfOrderedStages.map(s => {
    const code = Object.keys(STAGE_COLORS).find(k => s.toUpperCase().includes(k.toUpperCase()));
    return code ? STAGE_COLORS[code] : '#f97316';
  });
  wfColors.push('#0ea5e9'); // total bar color
  const stageData = {
    labels: wfLabels.length > 1 ? wfLabels : ['無資料'],
    datasets: [{
      label: '預估金額 (NTM)',
      data: wfLabels.length > 1 ? wfBars : [[0, 0]],
      backgroundColor: wfLabels.length > 1 ? wfColors : ['#f97316'],
      borderWidth: 0,
      borderRadius: 4,
      barPercentage: 0.65,
      borderSkipped: false,
    }],
  };
  const waterfallOpts = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'x',
    layout: { padding: { top: 30 } },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => {
        const pair = ctx.raw;
        const val = Array.isArray(pair) ? pair[1] - pair[0] : pair;
        return ` NT$ ${val.toLocaleString()}`;
      } } },
      datalabels: {
        display: true, anchor: 'end', align: 'top', offset: 2,
        color: '#334155',
        font: { weight: 'bold', size: 10 },
        formatter: (v) => {
          const val = Array.isArray(v) ? v[1] - v[0] : v;
          return val > 0 ? `${(val / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K` : '';
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, beginAtZero: true, grace: '15%', ticks: { callback: v => `${(v / 1000000).toFixed(0)}M` } },
    },
  };

  // 5. EU Top 5 (Horizontal Bar)
  const topEU = getTopN(stats.euStats, 10);
  const euData = makeBarData(Object.keys(topEU), Object.values(topEU), '#3b82f6');

  // 6. Partner Top 10 (Horizontal Bar)
  const topPartner = getTopN(stats.partnerStats, 10);
  const partnerData = makeBarData(Object.keys(topPartner), Object.values(topPartner), '#6366f1');

  // 7. Sales (Vertical Bar)
  const sortedSalesKeys = Object.keys(stats.salesStats).sort((a, b) => stats.salesStats[b] - stats.salesStats[a]);
  const salesData = makeBarData(sortedSalesKeys, sortedSalesKeys.map(s => stats.salesStats[s]), '#2563eb');

  // 8. PM (Vertical Bar)
  const sortedPMKeys = Object.keys(stats.pmStats).sort((a, b) => stats.pmStats[b] - stats.pmStats[a]);
  const pmData = makeBarData(sortedPMKeys, sortedPMKeys.map(p => stats.pmStats[p]), '#059669');

  // 9. SKU Top 10 (Horizontal Bar with QTY tooltip)
  const topSKU = getTopN(stats.skuStats, 10);
  const topSKUKeys = Object.keys(topSKU);
  const skuData = {
    labels: topSKUKeys.length ? topSKUKeys : ['無資料'],
    datasets: [{
      data: topSKUKeys.length ? Object.values(topSKU) : [0],
      backgroundColor: '#ec4899',
      borderRadius: 4, barPercentage: 0.6,
      customQty: topSKUKeys.map(k => stats.skuQtyStats[k] || 0),
    }],
  };
  const skuBarOpts = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => {
        const qty = ctx.dataset.customQty?.[ctx.dataIndex] || 0;
        return ` NT$ ${(ctx.raw || 0).toLocaleString()} (數量: ${qty.toLocaleString()})`;
      } } },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { display: true, color: '#f3f2f1' }, beginAtZero: true },
      y: { grid: { display: false } },
    },
  };

  const hasActiveFilters = searchTerm || dateStart || dateEnd || filterTypes.length || filterProducts.length || filterStages.length || filterSales.length || filterPMs.length || filterSegments.length || filterSalesStages.length || filterQuarters.length || filterMonths.length || expStart || expEnd;

  // ═══════ MW-R Stats (Recapture Rate + supplementary + EU/Partner rankings) ═══════
  const mwrStats = useMemo(() => {
    if (!isMWR) return null;
    // filteredData already contains only MW records (via mw-r → MW expansion)
    // Pre-filter: only rows with renewal-type reqType for data purity
    const renewalRows = filteredData.filter(row => RENEW_TYPES.includes(row.reqType || ''));
    const monthBuckets = {}; // month -> { totalNtm, totalOriginalNtm }
    const mwrEU = {}, mwrPartner = {}, mwrSKU = {}, mwrSKUQty = {}, mwrType = {}, mwrSalesStage = {};
    // EU/Partner level recapture accumulators
    const euRC = {}, partnerRC = {};
    let totalRenewNTM = 0;

    renewalRows.forEach(row => {
      const type = row.reqType || '';
      const amt = row.amount || 0;
      const origNtm = row.originalNtm || 0;
      const dateStr = row.expDate || row.date || '';
      const month = dateStr ? dateStr.substring(0, 7) : '未知';

      // Recapture Rate buckets
      if (!monthBuckets[month]) monthBuckets[month] = { totalNtm: 0, totalOriginalNtm: 0 };
      monthBuckets[month].totalNtm += amt;
      monthBuckets[month].totalOriginalNtm += origNtm;
      totalRenewNTM += amt;

      // Type doughnut
      mwrType[type] = (mwrType[type] || 0) + amt;
      const ssLabel = row.sales_stage || '未指定';
      mwrSalesStage[ssLabel] = (mwrSalesStage[ssLabel] || 0) + amt;
      const euKey = row.enduser || '未知';
      const partnerKey = row.si || '未知';
      mwrEU[euKey] = (mwrEU[euKey] || 0) + amt;
      mwrPartner[partnerKey] = (mwrPartner[partnerKey] || 0) + amt;
      mwrSKU[row.sku || '未指定'] = (mwrSKU[row.sku || '未指定'] || 0) + amt;
      mwrSKUQty[row.sku || '未指定'] = (mwrSKUQty[row.sku || '未指定'] || 0) + (row.quantity || 0);

      // EU/Partner recapture accumulators
      if (!euRC[euKey]) euRC[euKey] = { totalNtm: 0, totalOriginalNtm: 0 };
      euRC[euKey].totalNtm += amt;
      euRC[euKey].totalOriginalNtm += origNtm;
      if (!partnerRC[partnerKey]) partnerRC[partnerKey] = { totalNtm: 0, totalOriginalNtm: 0 };
      partnerRC[partnerKey].totalNtm += amt;
      partnerRC[partnerKey].totalOriginalNtm += origNtm;
    });

    // Build recapture array sorted by month
    const recapture = Object.keys(monthBuckets).filter(m => m !== '未知').sort().map(month => {
      const b = monthBuckets[month];
      return {
        month,
        totalNtm: b.totalNtm,
        totalOriginalNtm: b.totalOriginalNtm,
        rate: b.totalOriginalNtm > 0 ? Math.round((b.totalNtm / b.totalOriginalNtm) * 100) : 0,
      };
    });

    // Build EU/Partner recapture rankings (exclude groups with no original NTM)
    const buildRanking = (acc) => Object.entries(acc)
      .filter(([, v]) => v.totalOriginalNtm > 0)
      .map(([name, v]) => ({
        name,
        totalNtm: v.totalNtm,
        totalOriginalNtm: v.totalOriginalNtm,
        rate: Math.round((v.totalNtm / v.totalOriginalNtm) * 100),
      }))
      .sort((a, b) => b.rate - a.rate);

    const sortedEURank = buildRanking(euRC);
    const sortedPartnerRank = buildRanking(partnerRC);

    const rcTopEU = sortedEURank.slice(0, 5);
    const rcLowEU = sortedEURank.slice().reverse().slice(0, 5);
    const rcTopPartner = sortedPartnerRank.slice(0, 5);
    const rcLowPartner = sortedPartnerRank.slice().reverse().slice(0, 5);

    return { recapture, totalRenewNTM, mwrType, mwrSalesStage, mwrEU, mwrPartner, mwrSKU, mwrSKUQty, rcTopEU, rcLowEU, rcTopPartner, rcLowPartner };
  }, [isMWR, filteredData]);

  // ═══════ Debug ═══════
  console.log('Dashboard Render:', { isMWR, catFilter: filterProducts, mwrChartVis: chartVis.recaptureRate, mwrStatsExists: !!mwrStats });

  // ═══════ Render ═══════
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {/* ── Dashboard Header ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shrink-0 shadow-sm relative z-30">
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
                  {(isMWR ? MWR_CHART_DEFS : CHART_DEFS).filter(chart => {
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-6 shadow-sm">
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
              {/* Type — MW-R mode restricts to renewal types; non-MW-R hides renewal types */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Type <span className="text-[9px] font-normal text-gray-400">{isMWR ? '續約類型' : '未勾選=全選'}</span></label>
                <DashFilterGroup items={isMWR ? MWR_TYPE_ITEMS : (dictData.reqType || []).filter(t => !RENEW_TYPES.includes(t.code))} checked={filterTypes} onToggle={v => toggle(v, setFilterTypes)} />
              </div>
              {/* Cat. */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Cat. <span className="text-[9px] font-normal text-gray-400">排他模式</span></label>
                <DashFilterGroup items={dictData.product} checked={filterProducts} onToggle={toggleProduct} />
              </div>
              {/* Stage */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Stage <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.stage} checked={filterStages} onToggle={v => toggle(v, setFilterStages)} />
              </div>
              {/* Sales — SearchableMultiSelect */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Sales <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <SearchableMultiSelect
                  items={(dictData.sales || []).map(s => ({ code: s.code, label: s.label }))}
                  selected={filterSales}
                  onToggle={v => toggle(v, setFilterSales)}
                  placeholder="搜尋 Sales..."
                />
              </div>
              {/* PM */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">PM <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                <DashFilterGroup items={dictData.pm} checked={filterPMs} onToggle={v => toggle(v, setFilterPMs)} />
              </div>
              {/* Exclude Partners */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">排除 Partner <span className="text-[9px] font-normal text-red-400">已勾選將被剔除</span></label>
                <SearchableMultiSelect
                  items={[...new Set(data.map(r => r.si).filter(Boolean))].sort().map(s => ({ code: s, label: s }))}
                  selected={excludePartners}
                  onToggle={v => toggle(v, setExcludePartners)}
                  placeholder="搜尋 Partner..."
                  excludeMode
                />
              </div>
              {/* Reset */}
              <div className="flex items-end justify-start lg:justify-end">
                <button onClick={resetDashFilters} className="text-sm text-brand-600 hover:text-brand-800 font-medium px-4 py-2 hover:bg-brand-50 rounded transition-colors flex items-center gap-1.5 w-full lg:w-auto justify-center border border-brand-200 bg-brand-50/50 cursor-pointer">
                  <ArrowsCounterClockwise size={14} weight="bold" /> 重新載入所有資料
                </button>
              </div>
            </div>

            {/* Azure Advanced Filters */}
            {filterProducts.includes('Azure') && !isMWR && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Azure 進階篩選條件
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Segment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Segment <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                    <DashFilterGroup items={dictData.segment || []} checked={filterSegments} onToggle={v => toggle(v, setFilterSegments)} />
                  </div>
                  {/* Quarters */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">季度篩選 (大於 0)</label>
                    <div className="flex flex-wrap gap-2">
                      {['q1','q2','q3','q4'].map(q => {
                        const isChecked = filterQuarters.includes(q);
                        return (
                          <label key={q} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors border ${isChecked ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => toggle(q, setFilterQuarters)} className="sr-only" />
                            {q.toUpperCase()}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {/* Months */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">月份篩選 (大於 0)</label>
                    <div className="grid grid-cols-6 gap-1">
                      {['jul','aug','sep','oct','nov','dec','jan','feb','mar','apr','may','jun'].map(m => {
                        const isChecked = filterMonths.includes(m);
                        return (
                          <label key={m} className={`inline-flex items-center justify-center px-1 py-0.5 rounded text-[10px] cursor-pointer transition-colors border ${isChecked ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => toggle(m, setFilterMonths)} className="sr-only" />
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MW-R Advanced Filters */}
            {isMWR && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" /> AIBS Renew 進階篩選
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* EXP Date Range */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">EXP (原到期日) 區間</label>
                    <div className="flex items-center gap-2">
                      <input type="date" value={expStart} onChange={e => setExpStart(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none text-gray-700" />
                      <span className="text-gray-400 text-xs">至</span>
                      <input type="date" value={expEnd} onChange={e => setExpEnd(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none text-gray-700" />
                    </div>
                  </div>
                  {/* Segment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Segment <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                    <DashFilterGroup items={dictData.segment || []} checked={filterSegments} onToggle={v => toggle(v, setFilterSegments)} />
                  </div>
                  {/* Sales Stage */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">Sales Stage <span className="text-[9px] font-normal text-gray-400">未勾選=全選</span></label>
                    <DashFilterGroup items={dictData.salesStage || []} checked={filterSalesStages} onToggle={v => toggle(v, setFilterSalesStages)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-brand-500 relative overflow-hidden">
            <CurrencyDollar weight="fill" className="text-brand-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">預估總商機 (NTM)</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10 flex items-baseline gap-1">
              NT$ {stats.totalNTM.toLocaleString()}
              <span className="text-xs font-medium text-gray-500 ml-1 font-mono">≈ ${Math.round(stats.totalNTM / USD_EXCHANGE_RATE).toLocaleString()} USD</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-orange-500 relative overflow-hidden">
            <Target weight="fill" className="text-orange-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">符合條件案件數</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10">{stats.totalDeals} <span className="text-sm font-medium text-gray-400">件</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-teal-500 relative overflow-hidden">
            <Stack weight="fill" className="text-teal-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">授權總數量 (QTY)</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10">{stats.totalQty.toLocaleString()} <span className="text-sm font-medium text-gray-400">套</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-400 relative overflow-hidden">
            <Calculator weight="fill" className="text-blue-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">平均案件金額</p>
            <p className="text-2xl font-bold text-gray-900 relative z-10 flex items-baseline gap-1">
              NT$ {stats.avgDeal.toLocaleString()}
              <span className="text-xs font-medium text-gray-500 ml-1 font-mono">≈ ${Math.round(stats.avgDeal / USD_EXCHANGE_RATE).toLocaleString()} USD</span>
            </p>
          </div>
        </div>

        {/* ── 1. Trend (Full Width) ── */}
        {chartVis.trend && !isMWR && (
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] mb-6 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendUp weight="fill" className="text-brand-500 text-lg" /> Weekly Pipeline Trend
            </h3>
            <div className="relative w-full h-[250px]">
              <Line data={trendChartData} options={trendOptions} />
            </div>
          </div>
        )}

        {/* ── 2–9 Charts Bento Grid ── */}
        {!isMWR && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* 2. Type Doughnut */}
          {chartVis.type && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <ChartPieSlice weight="fill" className="text-purple-500 text-lg" /> 需求類型占比 (Type)
              </h3>
              <div className="relative w-full h-[220px]">
                <Doughnut data={typeData} options={doughnutOptions} />
              </div>
            </div>
          )}

          {/* 3. Product Doughnut */}
          {chartVis.product && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <ChartDonut weight="fill" className="text-teal-500 text-lg" /> {isAzureFiltered ? 'Azure 類型佔比 (Segment)' : '產品金額占比 (Cat.)'}
              </h3>
              <div className="relative w-full h-[220px]">
                <Doughnut data={prodData} options={doughnutOptions} />
              </div>
            </div>
          )}

          {/* 4. Stage Waterfall */}
          {chartVis.stage && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] md:col-span-2 xl:col-span-1 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Funnel weight="fill" className="text-orange-500 text-lg" /> Waterfall (Stage)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={stageData} options={waterfallOpts} />
              </div>
            </div>
          )}

          {/* 5+7. Top 10 EU + Forecast Sales (side by side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-full w-full">
          {chartVis.eu && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Buildings weight="fill" className="text-blue-500 text-lg" /> Top 10 (EU)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={euData} options={hBarOpts()} />
              </div>
            </div>
          )}
          {chartVis.sales && canViewSalesRank && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UsersThree weight="fill" className="text-blue-600 text-lg" /> Forecast (Sales)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={salesData} options={vBarOpts()} />
              </div>
            </div>
          )}
          </div>

          {/* 6. Top 10 Partner (Horizontal Bar) */}
          {chartVis.partner && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] md:col-span-2 xl:col-span-3 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Handshake weight="fill" className="text-indigo-500 text-lg" /> Top 10 (Partner)
              </h3>
              <div className="relative w-full h-[280px]">
                <Bar data={partnerData} options={hBarOpts()} />
              </div>
            </div>
          )}

          {/* 8. PM (Vertical Bar → Full Width) */}
          {chartVis.pm && canViewPmDist && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] md:col-span-2 xl:col-span-3 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UserCircleGear weight="fill" className="text-emerald-600 text-lg" /> 專案負責總額 (PM)
              </h3>
              <div className="relative w-full h-[220px]">
                <Bar data={pmData} options={vBarOpts()} />
              </div>
            </div>
          )}

          {/* 9. SKU Top 10 (Horizontal Bar → Full Width) */}
          {chartVis.sku && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] md:col-span-2 xl:col-span-3 transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Barcode weight="fill" className="text-pink-500 text-lg" /> Top 10 (SKU)
                </h3>
                <span className="text-[10px] text-slate-400 font-normal">💡 提示：使用上方 Cat. 篩選器可快速檢視特定產品線熱銷 SKU</span>
              </div>
              <div className="relative w-full h-[300px]">
                <Bar data={skuData} options={skuBarOpts} />
              </div>
            </div>
          )}
        </div>
        )}

        {/* ═══════ MW-R Specialized View ═══════ */}
        {isMWR && mwrStats && (
          <MWRDashboard mwrStats={mwrStats} chartVis={chartVis} filteredData={filteredData} dateStart={dateStart} dateEnd={dateEnd} makeBarData={makeBarData} hBarOpts={hBarOpts} doughnutOptions={doughnutOptions} ntTooltip={ntTooltip} getTopN={getTopN} />
        )}

        {/* Bottom padding */}
        <div className="h-12 w-full" />
      </div>
    </div>
  );
}

// ═══════ MW-R Specialized Dashboard ═══════
function MWRDashboard({ mwrStats, chartVis, filteredData, dateStart, dateEnd, makeBarData, hBarOpts, doughnutOptions, ntTooltip, getTopN }) {
  const { recapture, mwrType, mwrSalesStage, mwrEU, mwrPartner, mwrSKU, mwrSKUQty, rcTopEU, rcLowEU, rcTopPartner, rcLowPartner } = mwrStats;

  // Recapture Rate Chart data
  const rcLabels = recapture.length ? recapture.map(r => r.month) : ['無資料'];
  const rcRates = recapture.length ? recapture.map(r => r.rate) : [0];
  const rcColors = recapture.length ? recapture.map(r => r.rate >= 100 ? '#22c55e' : '#ef4444') : ['#94a3b8'];
  const rcChartData = {
    labels: rcLabels,
    datasets: [{
      label: 'Recapture Rate',
      data: rcRates,
      backgroundColor: rcColors,
      borderRadius: 4,
      barPercentage: 0.6,
      maxBarThickness: 48,
    }],
  };
  const rcOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: ctx => ctx[0]?.label || '',
          label: ctx => {
            const idx = ctx.dataIndex;
            const d = recapture[idx];
            if (!d) return `Recapture Rate: ${ctx.raw}%`;
            return [
              `Recapture Rate: ${d.rate}%`,
              `新 NTM: NT$ ${d.totalNtm.toLocaleString()}`,
              `原 NTM: NT$ ${d.totalOriginalNtm.toLocaleString()}`,
            ];
          },
        },
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'end',
        offset: 2,
        font: { size: 11, weight: 'bold' },
        color: ctx => {
          const v = ctx.dataset.data[ctx.dataIndex];
          return v >= 100 ? '#16a34a' : '#dc2626';
        },
        formatter: v => v + '%',
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { callback: v => v + '%' },
        suggestedMax: Math.max(...rcRates, 100) * 1.2,
      },
    },
  };

  // Supplementary charts data
  const topEU = getTopN(mwrEU, 5);
  const topPartner = getTopN(mwrPartner, 5);
  const topSKU = getTopN(mwrSKU, 10);
  const euData = makeBarData(Object.keys(topEU), Object.values(topEU), '#3b82f6');
  const partnerData = makeBarData(Object.keys(topPartner), Object.values(topPartner), '#6366f1');
  const topSKUKeys = Object.keys(topSKU);
  const skuData = {
    labels: topSKUKeys.length ? topSKUKeys : ['無資料'],
    datasets: [{
      data: topSKUKeys.length ? Object.values(topSKU) : [0],
      backgroundColor: '#ec4899',
      borderRadius: 4, barPercentage: 0.6,
      customQty: topSKUKeys.map(k => (mwrSKUQty || {})[k] || 0),
    }],
  };
  const mwrSkuBarOpts = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => {
        const qty = ctx.dataset.customQty?.[ctx.dataIndex] || 0;
        return ` NT$ ${(ctx.raw || 0).toLocaleString()} (數量: ${qty.toLocaleString()})`;
      } } },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { display: true, color: '#f3f2f1' }, beginAtZero: true },
      y: { grid: { display: false } },
    },
  };

  const TYPE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#94a3b8'];
  const typeLabels = Object.keys(mwrType);
  const typeData = {
    labels: typeLabels.length ? typeLabels : ['無資料'],
    datasets: [{ data: typeLabels.length ? Object.values(mwrType) : [0], backgroundColor: TYPE_COLORS.slice(0, typeLabels.length || 1), borderWidth: 2, borderColor: '#fff' }],
  };
  const ssLabels = Object.keys(mwrSalesStage);
  const ssData = {
    labels: ssLabels.length ? ssLabels : ['無資料'],
    datasets: [{ data: ssLabels.length ? Object.values(mwrSalesStage) : [0], backgroundColor: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#34d399', '#fbbf24'], borderWidth: 2, borderColor: '#fff' }],
  };

  // MW-R doughnut options: hidden datalabels + tooltip with amount & percentage
  const mwrDoughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const val = ctx.raw || 0;
            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = sum > 0 ? ((val / sum) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: NT$ ${val.toLocaleString()} (${pct}%)`;
          },
        },
      },
      datalabels: { display: false },
    },
  };

  // ── Recapture Rate ranking chart helpers ──
  function makeRcRankData(arr, color) {
    return {
      labels: arr.length ? arr.map(d => d.name) : ['無資料'],
      datasets: [{
        label: 'Recapture Rate',
        data: arr.length ? arr.map(d => d.rate) : [0],
        backgroundColor: arr.length ? arr.map(d => d.rate >= 100 ? '#22c55e' : '#ef4444') : ['#94a3b8'],
        borderWidth: 0, borderRadius: 4, barPercentage: 0.6,
      }],
    };
  }
  function rcRankOpts(maxVal) {
    return {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const idx = ctx.dataIndex;
              const d = ctx.chart.data._rcRawData?.[idx];
              if (!d) return `${ctx.raw}%`;
              return [
                `Recapture Rate: ${d.rate}%`,
                `新 NTM: NT$ ${d.totalNtm.toLocaleString()}`,
                `原 NTM: NT$ ${d.totalOriginalNtm.toLocaleString()}`,
              ];
            },
          },
        },
        datalabels: {
          display: true, anchor: 'end', align: 'right', offset: 4,
          font: { size: 10, weight: 'bold' },
          color: ctx => ctx.dataset.data[ctx.dataIndex] >= 100 ? '#16a34a' : '#dc2626',
          formatter: v => v + '%',
        },
      },
      scales: {
        x: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' }, suggestedMax: (maxVal || 100) * 1.3 },
        y: { grid: { display: false } },
      },
    };
  }

  const rcTopEUData = makeRcRankData(rcTopEU);
  rcTopEUData._rcRawData = rcTopEU;
  const rcLowEUData = makeRcRankData(rcLowEU);
  rcLowEUData._rcRawData = rcLowEU;
  const rcTopPartnerData = makeRcRankData(rcTopPartner);
  rcTopPartnerData._rcRawData = rcTopPartner;
  const rcLowPartnerData = makeRcRankData(rcLowPartner);
  rcLowPartnerData._rcRawData = rcLowPartner;

  // ── Partner ARR Comparison (Top 10, grouped stacked bar) ──
  const partnerARR = useMemo(() => {
    // Pre-filter: only renewal-type rows for data purity
    const renewalOnly = filteredData.filter(r => RENEW_TYPES.includes(r.reqType || ''));
    // Date range fallback: if no POD range set, default to current month
    let rows = renewalOnly;
    if (!dateStart && !dateEnd) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const monthStart = `${y}-${m}-01`;
      const monthEnd = `${y}-${m}-31`;
      rows = rows.filter(r => r.date && r.date >= monthStart && r.date <= monthEnd);
    }

    // Group by Partner
    const partnerMap = {};
    rows.forEach(row => {
      const key = row.si || '未知';
      if (!partnerMap[key]) partnerMap[key] = { totalNtm: 0, originalNtm: 0, expansion: 0, flat: 0, contraction: 0, churnOriginal: 0, origExpansion: 0, origFlat: 0, origContraction: 0, origChurn: 0 };
      const p = partnerMap[key];
      const amt = row.amount || 0;
      const origNtm = row.originalNtm || 0;
      const type = row.reqType || '';
      p.totalNtm += amt;
      p.originalNtm += origNtm;
      if (type.includes('續約增購'))      { p.expansion += amt; p.origExpansion += origNtm; }
      else if (type.includes('原案續約')) { p.flat += amt; p.origFlat += origNtm; }
      else if (type.includes('降級購買')) { p.contraction += amt; p.origContraction += origNtm; }
      else if (type.includes('未續約'))   { p.churnOriginal += origNtm; p.origChurn += origNtm; }
      else                                { p.expansion += amt; p.origExpansion += origNtm; }
    });

    // Sort by totalNtm desc, take top 10
    const sorted = Object.entries(partnerMap)
      .sort(([, a], [, b]) => b.totalNtm - a.totalNtm)
      .slice(0, 10);

    return {
      labels: sorted.map(([k]) => k),
      originalNtm: sorted.map(([, v]) => v.originalNtm),
      expansion: sorted.map(([, v]) => v.expansion),
      flat: sorted.map(([, v]) => v.flat),
      contraction: sorted.map(([, v]) => v.contraction),
      churnOriginal: sorted.map(([, v]) => v.churnOriginal),
      origExpansion: sorted.map(([, v]) => v.origExpansion),
      origFlat: sorted.map(([, v]) => v.origFlat),
      origContraction: sorted.map(([, v]) => v.origContraction),
      origChurn: sorted.map(([, v]) => v.origChurn),
      isEmpty: sorted.length === 0,
      isDefaultMonth: !dateStart && !dateEnd,
    };
  }, [filteredData, dateStart, dateEnd]);

  const partnerARRData = {
    labels: partnerARR.isEmpty ? ['無資料'] : partnerARR.labels,
    datasets: partnerARR.isEmpty ? [{ label: '無資料', data: [0], backgroundColor: '#94a3b8' }] : [
      // Stack 0: 原合約結構 (透明色)
      { label: '續約增購 (原)', data: partnerARR.origExpansion, stack: 'Stack 0', backgroundColor: '#22c55e80', borderRadius: 3, barPercentage: 0.7 },
      { label: '原案續約 (原)', data: partnerARR.origFlat, stack: 'Stack 0', backgroundColor: '#3b82f680', borderRadius: 3, barPercentage: 0.7 },
      { label: '降級購買 (原)', data: partnerARR.origContraction, stack: 'Stack 0', backgroundColor: '#f59e0b80', borderRadius: 3, barPercentage: 0.7 },
      { label: '未續約 (原)', data: partnerARR.origChurn, stack: 'Stack 0', backgroundColor: '#ef444480', borderRadius: 3, barPercentage: 0.7 },
      // Stack 1: 新續約結構 (實色)
      { label: '續約增購', data: partnerARR.expansion, stack: 'Stack 1', backgroundColor: '#22c55e', borderRadius: 3, barPercentage: 0.7 },
      { label: '原案續約', data: partnerARR.flat, stack: 'Stack 1', backgroundColor: '#3b82f6', borderRadius: 3, barPercentage: 0.7 },
      { label: '降級購買', data: partnerARR.contraction, stack: 'Stack 1', backgroundColor: '#f59e0b', borderRadius: 3, barPercentage: 0.7 },
      { label: '未續約流失 (原額)', data: partnerARR.churnOriginal, stack: 'Stack 1', backgroundColor: '#ef4444', borderRadius: 3, barPercentage: 0.7 },
    ],
  };
  // ARR shared tooltip: stack-aware percentage
  const arrTooltipLabel = c => {
    if (!c || !c.chart || !c.chart.data) return '';
    const val = c.raw || 0;
    const ds = c.dataset;
    if (!ds || !ds.stack) return ` ${ds?.label || ''}: NT$ ${val.toLocaleString()}`;
    const stackTotal = c.chart.data.datasets
      .filter(d => d.stack === ds.stack)
      .reduce((sum, d) => sum + (Number(d.data?.[c.dataIndex]) || 0), 0);
    const pct = stackTotal > 0 ? ((val / stackTotal) * 100).toFixed(1) : '0.0';
    return ` ${ds.label}: NT$ ${val.toLocaleString()} (${pct}%)`;
  };

  const arrTooltipFooter = tooltipItems => {
    if (!tooltipItems.length) return '';
    const item = tooltipItems[0];
    const stack = item.dataset?.stack;
    if (!stack) return '';
    const stackTotal = item.chart.data.datasets
      .filter(ds => ds.stack === stack)
      .reduce((sum, ds) => sum + (Number(ds.data?.[item.dataIndex]) || 0), 0);
    const title = stack.includes('0') ? '原 NTM 總額' : '新 NTM 總額';
    return `${title}: NT$ ${stackTotal.toLocaleString()}`;
  };

  const partnerARROpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 10 } } },
      tooltip: { callbacks: { label: arrTooltipLabel, footer: arrTooltipFooter } },
      datalabels: { display: false },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, minRotation: 0, font: { size: 9 } } },
      y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => `${(v / 1000).toLocaleString()}K` } },
    },
  };

  // ── Monthly ARR Dual-Stack (grouped by POD month) ──
  const monthlyARR = useMemo(() => {
    const renewalOnly = filteredData.filter(r => RENEW_TYPES.includes(r.reqType || ''));
    const monthMap = {};
    renewalOnly.forEach(row => {
      const rawDate = row.date;
      const pod = (typeof rawDate === 'string' && rawDate.length >= 7 && rawDate !== '-') ? rawDate.substring(0, 7) : '未指定';
      if (!monthMap[pod]) monthMap[pod] = { expansion: 0, flat: 0, contraction: 0, churnOriginal: 0, origExpansion: 0, origFlat: 0, origContraction: 0, origChurn: 0 };
      const m = monthMap[pod];
      const amt = row.amount || 0;
      const origNtm = row.originalNtm || 0;
      const type = row.reqType || '';
      if (type.includes('續約增購'))      { m.expansion += amt; m.origExpansion += origNtm; }
      else if (type.includes('原案續約')) { m.flat += amt; m.origFlat += origNtm; }
      else if (type.includes('降級購買')) { m.contraction += amt; m.origContraction += origNtm; }
      else if (type.includes('未續約'))   { m.churnOriginal += origNtm; m.origChurn += origNtm; }
      else                                { m.expansion += amt; m.origExpansion += origNtm; }
    });
    const sorted = Object.entries(monthMap).filter(([k]) => k !== '未指定').sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([k]) => k),
      expansion: sorted.map(([, v]) => v.expansion),
      flat: sorted.map(([, v]) => v.flat),
      contraction: sorted.map(([, v]) => v.contraction),
      churnOriginal: sorted.map(([, v]) => v.churnOriginal),
      origExpansion: sorted.map(([, v]) => v.origExpansion),
      origFlat: sorted.map(([, v]) => v.origFlat),
      origContraction: sorted.map(([, v]) => v.origContraction),
      origChurn: sorted.map(([, v]) => v.origChurn),
      isEmpty: sorted.length === 0,
    };
  }, [filteredData]);

  const monthlyARRData = {
    labels: monthlyARR.isEmpty ? ['無資料'] : monthlyARR.labels,
    datasets: monthlyARR.isEmpty ? [{ label: '無資料', data: [0], backgroundColor: '#94a3b8' }] : [
      { label: '續約增購 (原)', data: monthlyARR.origExpansion, stack: 'Stack 0', backgroundColor: '#22c55e80', borderRadius: 3, barPercentage: 0.7 },
      { label: '原案續約 (原)', data: monthlyARR.origFlat, stack: 'Stack 0', backgroundColor: '#3b82f680', borderRadius: 3, barPercentage: 0.7 },
      { label: '降級購買 (原)', data: monthlyARR.origContraction, stack: 'Stack 0', backgroundColor: '#f59e0b80', borderRadius: 3, barPercentage: 0.7 },
      { label: '未續約 (原)', data: monthlyARR.origChurn, stack: 'Stack 0', backgroundColor: '#ef444480', borderRadius: 3, barPercentage: 0.7 },
      { label: '續約增購', data: monthlyARR.expansion, stack: 'Stack 1', backgroundColor: '#22c55e', borderRadius: 3, barPercentage: 0.7 },
      { label: '原案續約', data: monthlyARR.flat, stack: 'Stack 1', backgroundColor: '#3b82f6', borderRadius: 3, barPercentage: 0.7 },
      { label: '降級購買', data: monthlyARR.contraction, stack: 'Stack 1', backgroundColor: '#f59e0b', borderRadius: 3, barPercentage: 0.7 },
      { label: '未續約流失 (原額)', data: monthlyARR.churnOriginal, stack: 'Stack 1', backgroundColor: '#ef4444', borderRadius: 3, barPercentage: 0.7 },
    ],
  };

  return (
    <>
      {/* 1. Monthly Renewal Recapture Rate */}
      {chartVis.recaptureRate && (
      <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] mb-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <TrendUp weight="fill" className="text-indigo-500 text-lg" /> Monthly Renewal Recapture Rate
        </h3>
        <p className="text-[10px] text-slate-400 mb-4">= 新 NTM / 原 NTM × 100%　<span className="text-green-600">■</span> ≥100%　<span className="text-red-500">■</span> &lt;100%</p>
        <div className="relative w-full h-[280px]">
          <Bar data={rcChartData} options={rcOpts} />
        </div>
      </div>
      )}

      {/* 2. Monthly ARR Renewal Comparison */}
      {chartVis.mwrMonthlyARR && (
      <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] mb-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <TrendUp weight="fill" className="text-teal-500 text-lg" /> Monthly ARR Renewal Comparison
        </h3>
        <p className="text-[10px] text-slate-400 mb-4">左柱 = 原合約結構 (透明)　右柱 = 新續約結構 (實色)　X軸 = POD 月份</p>
        <div className="relative w-full h-[340px]">
          <Bar data={monthlyARRData} options={partnerARROpts} />
        </div>
      </div>
      )}

      {/* 3. Type + Sales Stage (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Type Doughnut */}
        {chartVis.mwrType && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ChartPieSlice weight="fill" className="text-purple-500 text-lg" /> Type 占比
          </h3>
          <div className="relative w-full h-[220px]">
            <Doughnut data={typeData} options={mwrDoughnutOpts} />
          </div>
        </div>
        )}

        {/* Sales Stage Doughnut */}
        {chartVis.mwrStage && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ChartDonut weight="fill" className="text-teal-500 text-lg" /> Sales Stage 占比
          </h3>
          <div className="relative w-full h-[220px]">
            <Doughnut data={ssData} options={mwrDoughnutOpts} />
          </div>
        </div>
        )}
      </div>

      {/* Pair A: Top 5 Partner + Recapture Top 5 Partner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        {chartVis.mwrPartner && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Handshake weight="fill" className="text-indigo-500 text-lg" /> Top 5 (Partner)
          </h3>
          <div className="relative w-full h-[260px]">
            <Bar data={partnerData} options={hBarOpts()} />
          </div>
        </div>
        )}
        {chartVis.rcTopPartner && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Handshake weight="fill" className="text-green-600 text-lg" /> Recapture Top 5 (Partner)
          </h3>
          <div className="relative w-full h-[260px]">
            <Bar data={rcTopPartnerData} options={rcRankOpts(Math.max(...(rcTopPartner.map(d => d.rate)), 100))} />
          </div>
        </div>
        )}
      </div>

      {/* Pair C: Recapture Lowest 5 Partner + Recapture Lowest 5 EU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        {chartVis.rcLowPartner && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Handshake weight="fill" className="text-red-500 text-lg" /> Recapture Lowest 5 (Partner)
          </h3>
          <div className="relative w-full h-[260px]">
            <Bar data={rcLowPartnerData} options={rcRankOpts(Math.max(...(rcLowPartner.map(d => d.rate)), 100))} />
          </div>
        </div>
        )}
        {chartVis.rcLowEU && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Buildings weight="fill" className="text-red-500 text-lg" /> Recapture Lowest 5 (EU)
          </h3>
          <div className="relative w-full h-[260px]">
            <Bar data={rcLowEUData} options={rcRankOpts(Math.max(...(rcLowEU.map(d => d.rate)), 100))} />
          </div>
        </div>
        )}
      </div>

      {/* Pair B: Top 5 EU + Recapture Top 5 EU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        {chartVis.mwrEU && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Buildings weight="fill" className="text-blue-500 text-lg" /> Top 5 (EU)
          </h3>
          <div className="relative w-full h-[260px]">
            <Bar data={euData} options={hBarOpts()} />
          </div>
        </div>
        )}
        {chartVis.rcTopEU && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)]">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Buildings weight="fill" className="text-green-600 text-lg" /> Recapture Top 5 (EU)
          </h3>
          <div className="relative w-full h-[260px]">
            <Bar data={rcTopEUData} options={rcRankOpts(Math.max(...(rcTopEU.map(d => d.rate)), 100))} />
          </div>
        </div>
        )}
      </div>

      {/* ARR Renewal Comparison Top 10 (Partner) (full-width) */}
      {chartVis.mwrPartnerARR && (
      <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] mt-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Handshake weight="fill" className="text-indigo-500 text-lg" /> ARR Renewal Comparison Top 10 (Partner)
        </h3>
        <p className="text-[10px] text-slate-400 mb-4">左柱 = 原合約結構 (透明)　右柱 = 今年續約結構 (實色){partnerARR.isDefaultMonth && <span className="ml-2 italic">※ 未選取預計下單日，本圖表預設顯示本月資料</span>}</p>
        <div className="relative w-full h-[340px]">
          <Bar data={partnerARRData} options={partnerARROpts} />
        </div>
      </div>
      )}

      {/* Top 10 SKU (full-width, last) */}
      {chartVis.mwrSKU && (
      <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-[var(--shadow-soft-sm)] mt-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Barcode weight="fill" className="text-pink-500 text-lg" /> Top 10 (SKU)
        </h3>
        <div className="relative w-full h-[280px]">
          <Bar data={skuData} options={mwrSkuBarOpts} />
        </div>
      </div>
      )}
    </>
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

// ═══════ Searchable Multi-Select (lightweight inline dropdown) ═══════
function SearchableMultiSelect({ items, selected, onToggle, placeholder = '搜尋...', excludeMode = false }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div ref={ref} className="relative">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selected.map(code => {
            const item = items.find(i => i.code === code);
            return (
              <span
                key={code}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                  excludeMode
                    ? 'bg-red-50 text-red-600 border border-red-200 line-through'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
                onClick={() => onToggle(code)}
                title="點擊移除"
              >
                {item?.label || code} ×
              </span>
            );
          })}
        </div>
      )}
      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-brand-500 outline-none text-gray-700"
      />
      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg text-xs">
          {filtered.map(item => {
            const isSelected = selected.includes(item.code);
            return (
              <div
                key={item.code}
                onClick={() => onToggle(item.code)}
                className={`px-3 py-1.5 cursor-pointer transition-colors flex items-center gap-2 ${
                  isSelected
                    ? (excludeMode ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700')
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <input type="checkbox" checked={isSelected} readOnly className="rounded-sm w-3 h-3 pointer-events-none" />
                <span className={isSelected && excludeMode ? 'line-through' : ''}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
