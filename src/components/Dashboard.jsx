import { useMemo } from 'react';
import {
  CurrencyDollar,
  Target,
  Stack,
  Calculator,
  ChartPieSlice,
  ChartDonut,
  Funnel,
} from '@phosphor-icons/react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dictData } from '../utils/mockData';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartDataLabels,
);

// Chart.js global defaults matching original
ChartJS.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
ChartJS.defaults.color = '#605e5c';

// --- Helper: resolve dict label from code ---
function getDictLabel(dictKey, code) {
  const entry = dictData[dictKey]?.find((d) => d.code === code);
  return entry ? entry.label : code;
}

export default function Dashboard({ data }) {
  // ===== KPI & chart statistics computed from data prop =====
  const stats = useMemo(() => {
    let totalNTM = 0;
    let totalQty = 0;
    const typeStats = {};
    const prodStats = {};
    const stageStats = {};

    data.forEach((row) => {
      const amount = row.amount || 0;
      const qty = row.quantity || 0;

      totalNTM += amount;
      totalQty += qty;

      // Type (reqType) — use label for display
      const typeLabel = getDictLabel('reqType', row.reqType);
      typeStats[typeLabel] = (typeStats[typeLabel] || 0) + amount;

      // Product — use label
      const prodLabel = getDictLabel('product', row.product);
      prodStats[prodLabel] = (prodStats[prodLabel] || 0) + amount;

      // Stage — use label (L1, L2, ...)
      const stageLabel = getDictLabel('stage', row.stage);
      stageStats[stageLabel] = (stageStats[stageLabel] || 0) + amount;
    });

    const totalDeals = data.length;
    const avgDeal = totalDeals > 0 ? Math.round(totalNTM / totalDeals) : 0;

    return { totalNTM, totalDeals, totalQty, avgDeal, typeStats, prodStats, stageStats };
  }, [data]);

  // ===== Chart configs =====

  // Doughnut shared options builder
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: true, position: 'right' },
      tooltip: {
        callbacks: { label: (c) => ` NT$ ${c.raw.toLocaleString()}` },
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: { weight: 'bold', size: 11 },
        formatter: (value, context) => {
          const sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          if (sum === 0) return '';
          const pct = ((value * 100) / sum).toFixed(1);
          return pct >= 5 ? pct + '%' : '';
        },
      },
    },
  };

  // Type Doughnut
  const typeLabels = Object.keys(stats.typeStats);
  const typeData = {
    labels: typeLabels.length ? typeLabels : ['無資料'],
    datasets: [
      {
        label: '營收佔比',
        data: typeLabels.length ? Object.values(stats.typeStats) : [0],
        backgroundColor: ['#8b5cf6', '#d946ef', '#f43f5e', '#a855f7'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Product Doughnut
  const prodLabels = Object.keys(stats.prodStats);
  const prodData = {
    labels: prodLabels.length ? prodLabels : ['無資料'],
    datasets: [
      {
        label: '營收佔比',
        data: prodLabels.length ? Object.values(stats.prodStats) : [0],
        backgroundColor: ['#14b8a6', '#0ea5e9', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Stage Bar (horizontal)
  const sortedStages = Object.keys(stats.stageStats).sort();
  const stageBarData = {
    labels: sortedStages.length ? sortedStages : ['無資料'],
    datasets: [
      {
        label: '預估金額 (NTM)',
        data: sortedStages.length ? sortedStages.map((s) => stats.stageStats[s]) : [0],
        backgroundColor: '#f97316',
        borderWidth: 0,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const stageBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (c) => ` NT$ ${c.raw.toLocaleString()}` },
      },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { display: true, color: '#f3f2f1' }, beginAtZero: true },
      y: { grid: { display: false }, beginAtZero: true },
    },
  };

  // ===== Render =====
  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto text-fluent-text">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* NTM */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-brand-500 relative overflow-hidden">
          <CurrencyDollar weight="fill" className="text-brand-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">
            預估總商機 (NTM)
          </p>
          <p className="text-2xl font-bold text-gray-900 relative z-10 flex items-baseline gap-1">
            NT$ {stats.totalNTM.toLocaleString()}
          </p>
        </div>

        {/* Deals */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-orange-500 relative overflow-hidden">
          <Target weight="fill" className="text-orange-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">
            符合條件案件數
          </p>
          <p className="text-2xl font-bold text-gray-900 relative z-10">
            {stats.totalDeals} <span className="text-sm font-medium text-gray-400">件</span>
          </p>
        </div>

        {/* QTY */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-teal-500 relative overflow-hidden">
          <Stack weight="fill" className="text-teal-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">
            授權總數量 (QTY)
          </p>
          <p className="text-2xl font-bold text-gray-900 relative z-10">
            {stats.totalQty.toLocaleString()} <span className="text-sm font-medium text-gray-400">套</span>
          </p>
        </div>

        {/* Avg Deal */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-400 relative overflow-hidden">
          <Calculator weight="fill" className="text-blue-100 text-6xl absolute -right-2 -bottom-2 opacity-50" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 relative z-10">
            平均案頭金額
          </p>
          <p className="text-2xl font-bold text-gray-900 relative z-10 flex items-baseline gap-1">
            NT$ {stats.avgDeal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Doughnut: Type */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ChartPieSlice weight="fill" className="text-purple-500 text-lg" />
            需求類型佔比 (Type)
          </h3>
          <div className="relative w-full h-[220px]">
            <Doughnut data={typeData} options={doughnutOptions} />
          </div>
        </div>

        {/* Doughnut: Product */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ChartDonut weight="fill" className="text-teal-600 text-lg" />
            產品線營收佔比 (Cat.)
          </h3>
          <div className="relative w-full h-[220px]">
            <Doughnut data={prodData} options={doughnutOptions} />
          </div>
        </div>

        {/* Bar: Stage Funnel */}
        <div className="bg-white rounded border border-gray-200 p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Funnel weight="fill" className="text-orange-500 text-lg" />
            各階段轉換漏斗 (Stage)
          </h3>
          <div className="relative w-full h-[220px]">
            <Bar data={stageBarData} options={stageBarOptions} />
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-12 w-full" />
    </div>
  );
}
