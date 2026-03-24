import {
  Plus,
  MicrosoftExcelLogo,
  Eye,
  Faders,
} from '@phosphor-icons/react';

export default function Header({ currentView, onOpenDrawer }) {
  if (currentView === 'dashboard') {
    return <DashboardHeader />;
  }
  return <TableHeader onOpenDrawer={onOpenDrawer} />;
}

/* ────────── Table View Header ────────── */
function TableHeader({ onOpenDrawer }) {
  return (
    <header className="bg-white border-b border-fluent-border px-6 py-4 shrink-0 shadow-sm relative z-30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 tracking-wider border border-brand-200">
              MetaAge | Microsoft
            </span>
            <span className="text-xs text-fluent-muted">整合所有產品線商機</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">微軟跨線授權需求總表</h1>
        </div>

        {/* Right: Actions + KPI */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 lg:justify-end">
          <button
            onClick={onOpenDrawer}
            className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> 單筆新增
          </button>
          <button className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
            <MicrosoftExcelLogo size={16} /> EXCEL 匯入
          </button>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block" />

          {/* KPI Summary */}
          <div className="text-right hidden lg:block">
            <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase mb-0.5">
              當前篩選商機總額
            </p>
            <div className="flex flex-col items-end">
              <p className="text-lg font-bold text-brand-600 leading-none">
                NT$ 0 <span className="text-xs font-medium text-gray-500 ml-0.5">TWD</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-mono">≈ $0 USD</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ────────── Dashboard View Header ────────── */
function DashboardHeader() {
  return (
    <header className="bg-white border-b border-fluent-border px-6 py-4 shrink-0 shadow-sm relative z-30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase tracking-wider border border-green-200">
              Analytics
            </span>
            <span className="text-xs text-fluent-muted">Microsoft</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
            <Eye size={16} /> 圖表顯示
          </button>
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
            <Faders size={16} /> 隱藏篩選器
          </button>
        </div>
      </div>
    </header>
  );
}
