import { useState } from 'react';
import {
  List,
  Table,
  ChartPieSlice,
  Gear,
  MicrosoftOutlookLogo,
} from '@phosphor-icons/react';

const navItems = [
  { key: 'table', label: '跨線授權總表', icon: Table },
  { key: 'dashboard', label: '視覺化 Dashboard', icon: ChartPieSlice },
];

export default function Sidebar({ currentView, setCurrentView, onOpenSettings }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-[#111827] text-gray-300 flex-shrink-0 flex-col z-40 shadow-xl hidden md:flex relative transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800 transition-all">
        {!collapsed && (
          <div className="flex items-center overflow-hidden">
            <MicrosoftOutlookLogo weight="fill" className="text-brand-500 text-2xl min-w-[24px]" />
            <span className="ml-3 font-semibold text-white text-lg tracking-wide whitespace-nowrap">
              CSP Portal
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-400 hover:text-white focus:outline-none p-1.5 rounded hover:bg-gray-800 transition-colors flex items-center justify-center"
        >
          <List size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              className={`flex items-center p-2.5 rounded transition-colors group relative w-full ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={20} className="min-w-[24px]" />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer to push settings to bottom */}
        <div className="mt-auto" />

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center p-2.5 rounded hover:bg-gray-800 hover:text-white transition-colors group relative w-full mt-2 border-t border-gray-800 pt-3 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Gear size={20} className="min-w-[24px]" />
          {!collapsed && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">
              系統設定 (字典檔)
            </span>
          )}
        </button>
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t border-gray-800 flex items-center transition-all ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="relative min-w-[32px]">
          <img
            src="https://i.pravatar.cc/150?img=32"
            alt="User"
            className="w-8 h-8 rounded border border-gray-600"
          />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#111827] rounded-full pointer-events-none" />
        </div>
        {!collapsed && (
          <div className="ml-3">
            <p className="text-sm text-white font-medium">Sarah Lee</p>
            <p className="text-[11px] text-gray-500">Sr. Operations PM</p>
          </div>
        )}
      </div>
    </aside>
  );
}
