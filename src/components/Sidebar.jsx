import { useState } from 'react';
import {
  List,
  Table,
  ChartPieSlice,
  Gear,
  SignOut,
  ShieldCheck,
} from '@phosphor-icons/react';
import { supabase } from '../utils/supabaseClient';

const navItems = [
  { key: 'table', label: '商機總表', icon: Table },
  { key: 'dashboard', label: 'Dashboard', icon: ChartPieSlice },
];

export default function Sidebar({ currentView, setCurrentView, onOpenSettings, session, isSuperAdmin }) {
  const [collapsed, setCollapsed] = useState(false);

  const userEmail = session?.user?.email || '';
  const displayName = userEmail.split('@')[0] || 'User';

  return (
    <aside
      className={`bg-white border-r border-slate-200 text-slate-600 flex-shrink-0 flex-col z-40 hidden md:flex relative transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 transition-all">
        {!collapsed && (
          <div className="flex items-center overflow-hidden">
            <img src="/mtglogo.png" alt="MetaAge Logo" className="w-8 h-8 object-contain min-w-[24px]" />
            <span className="ml-3 font-bold text-slate-900 text-lg tracking-wide whitespace-nowrap">
              Pipeline Portal
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-slate-400 hover:text-slate-700 focus:outline-none p-1.5 rounded hover:bg-slate-100 transition-colors flex items-center justify-center"
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
              className={`flex items-center p-2.5 rounded-lg transition-colors group relative w-full ${
                isActive
                  ? 'bg-blue-50 text-[#0078d4]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} className="min-w-[24px]" />
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

        {/* Admin - SuperAdmin only */}
        {isSuperAdmin && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center p-2.5 rounded-lg transition-colors group relative w-full ${
              currentView === 'admin'
                ? 'bg-red-50 text-red-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            } ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <ShieldCheck size={20} weight={currentView === 'admin' ? 'fill' : 'regular'} className="min-w-[24px]" />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap">
                權限管理
              </span>
            )}
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors group relative w-full mt-2 border-t border-slate-200 pt-3 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Gear size={20} className="min-w-[24px]" />
          {!collapsed && (
            <span className="ml-3 text-sm font-medium whitespace-nowrap">
              系統設定
            </span>
          )}
        </button>
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t border-slate-200 flex items-center transition-all ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="relative min-w-[32px]">
          <div className="w-8 h-8 rounded-lg bg-[#0078d4] flex items-center justify-center text-white text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full pointer-events-none" />
        </div>
        {!collapsed && (
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm text-slate-800 font-medium truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => supabase.auth.signOut()}
            title="登出"
            className="ml-2 p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <SignOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
