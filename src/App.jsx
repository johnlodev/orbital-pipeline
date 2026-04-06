import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { List, X } from '@phosphor-icons/react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PipelineTable from './components/PipelineTable'
import RecordDrawer from './components/RecordDrawer'
import SettingsModal from './components/SettingsModal'
import ImportWizardModal from './components/ImportWizardModal'
import AuthScreen from './components/AuthScreen'
import AdminPanel from './components/AdminPanel'
import ConfirmModal from './components/ConfirmModal'
import { supabase } from './utils/supabaseClient'
import { dictData as defaultDictData, mockData } from './utils/mockData'

function App() {
  // ── Auth session state ──
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Auth gate: 未登入 → 顯示登入畫面 ──
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <p className="text-gray-400 text-lg">載入中...</p>
      </div>
    )
  }
  if (!session) return <><AuthScreen /><Toaster position="top-center" toastOptions={{ className: 'bg-white text-slate-700 border border-slate-200 shadow-sm text-sm font-sans', duration: 3000 }} /></>

  return <AuthenticatedApp session={session} />
}

function AuthenticatedApp({ session }) {
  const [currentView, setCurrentView] = useState('aibs')
  const [dbData, setDbData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [dictionary, setDictionary] = useState(() => structuredClone(defaultDictData))
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // ── DB ↔ Frontend 欄位名 mapping (DB: reqtype ↔ Frontend: reqType) ──
  // CAIP 新增欄位全部使用 snake_case，前後端名稱一致（無需轉換），
  // 但仍需確保 null → 空字串/0 的安全處理。
  const CAIP_TEXT_FIELDS = ['segment', 'disti_name', 'sales_stage', 'referral_id', 'acr_start_month']
  const CAIP_NUM_FIELDS = [
    'acr_mom', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'q1', 'q2', 'q3', 'q4',
  ]

  function fromDbRecord(row) {
    if (!row) return row
    const { reqtype, ...rest } = row
    const out = { ...rest, reqType: reqtype }
    // CAIP text fields: null → ''
    for (const f of CAIP_TEXT_FIELDS) {
      if (out[f] == null) out[f] = ''
    }
    // CAIP numeric fields: null → 0
    for (const f of CAIP_NUM_FIELDS) {
      out[f] = out[f] != null ? Number(out[f]) : 0
    }
    return out
  }
  function toDbRecord(record) {
    if (!record) return record
    const { reqType, ...rest } = record
    const out = { ...rest, reqtype: reqType }
    // 確保數字欄位寫入時為 number
    for (const f of CAIP_NUM_FIELDS) {
      if (out[f] !== undefined) out[f] = Number(out[f]) || 0
    }
    return out
  }

  // ── Dictionary: 從 Supabase dictionaries table 讀取，首次為空時自動 seed ──
  async function fetchDictionary() {
    try {
      const { data, error } = await supabase
        .from('dictionaries')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error

      if (!data || data.length === 0) {
        // Table 為空 → 自動將預設字典寫入 DB (seed)
        await seedDefaultDictionary()
        return
      }

      // 將 flat rows 轉成 { category: [{label, code, email, _dbId}] } 結構
      const grouped = {}
      const customTitles = {} // 自訂類別的顯示名稱 (from __meta__ rows)
      for (const row of data) {
        const cat = row.category === 'reqtype' ? 'reqType' : row.category
        // __meta__ row 用來存自訂類別的顯示名稱，不放入選項清單
        if (row.code === '__meta__') {
          customTitles[cat] = row.label
          if (!grouped[cat]) grouped[cat] = []
          continue
        }
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push({
          label: row.label,
          code: row.code,
          email: row.email || '',
          _dbId: row.id,
        })
      }

      // 把自訂類別的 _title 掛上去，供 SettingsModal 讀取
      for (const [cat, title] of Object.entries(customTitles)) {
        if (grouped[cat]) {
          grouped[cat]._title = title
        }
      }

      // 確保所有內建 key 都存在（即使 DB 中該類別無資料）
      const builtinKeys = ['sales', 'pm', 'reqType', 'product', 'stage', 'segment']
      for (const key of builtinKeys) {
        if (!grouped[key]) grouped[key] = []
      }

      setDictionary(grouped)
    } catch (err) {
      console.error('Dictionary fetch error:', err.message)
      // Fallback to local default
      setDictionary(structuredClone(defaultDictData))
    }
  }

  // ── Seed: 首次啟動時將 mockData 預設字典寫入 DB ──
  async function seedDefaultDictionary() {
    try {
      const rows = []
      for (const [key, items] of Object.entries(defaultDictData)) {
        const dbCategory = key === 'reqType' ? 'reqtype' : key
        items.forEach((item, index) => {
          rows.push({
            category: dbCategory,
            label: item.label,
            code: item.code,
            email: item.email || '',
            sort_order: index,
          })
        })
      }
      const { error } = await supabase.from('dictionaries').insert(rows)
      if (error) throw error
      // 寫入成功後重新 fetch（這次 table 有資料了，不會再 seed）
      await fetchDictionary()
    } catch (err) {
      console.error('Seed dictionary error:', err.message)
      // Fallback to local
      setDictionary(structuredClone(defaultDictData))
    }
  }

  useEffect(() => {
    fetchDictionary()
  }, [])
  const [customColumns, setCustomColumns] = useState([])
  const [currentUserPermissions, setCurrentUserPermissions] = useState(null)

  // ── RBAC: 角色辨識 ──
  const currentUserEmail = session?.user?.email || ''

  const userRole = (() => {
    const pmMatch = dictionary.pm?.find(p => p.email && p.email.toLowerCase() === currentUserEmail.toLowerCase())
    if (pmMatch) return { role: 'pm', code: pmMatch.code, label: pmMatch.label }
    const salesMatch = dictionary.sales?.find(s => s.email && s.email.toLowerCase() === currentUserEmail.toLowerCase())
    if (salesMatch) return { role: 'sales', code: salesMatch.code, label: salesMatch.label }
    return { role: 'guest', code: null, label: null }
  })()

  // ── Permission: 從 Supabase 撈取當前使用者權限 ──
  async function fetchPermissions() {
    if (!currentUserEmail) return
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', currentUserEmail.toLowerCase())
        .single()
      if (error && error.code !== 'PGRST116') throw error
      setCurrentUserPermissions(data || null)
    } catch (err) {
      console.error('Permission fetch error:', err.message)
      toast.error('權限資料載入失敗：' + err.message)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [currentUserEmail])

  const isSuperAdmin = currentUserPermissions?.role === 'SuperAdmin'

  // ── Read: 從 Supabase 撈取資料，失敗時 fallback 到 mockData ──
  async function fetchData() {
    try {
      const { data, error } = await supabase
        .from('pipeline')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDbData((data || []).map(fromDbRecord))
    } catch (err) {
      console.error('Supabase fetch error:', err.message)
      toast.error('無法連線 Supabase，已載入本機測試資料。')
      setDbData(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Import: 批次寫入 Supabase，成功後 refetch ──
  async function handleImportData(records) {
    try {
      const dbRecords = records.map(r => ({ ...toDbRecord(r), created_by_email: currentUserEmail }))
      const { error } = await supabase.from('pipeline').insert(dbRecords)
      if (error) throw error
      await fetchData()
      toast.success('已成功匯入 ' + records.length + ' 筆資料！')
    } catch (err) {
      console.error('Import error:', err.message)
      toast.error('匯入失敗：' + err.message)
      // Optimistic fallback: 仍放入本地
      setDbData(prev => [...records, ...prev])
    }
    setIsImportOpen(false)
  }

  // ── Delete: 先刪 Supabase，成功後 refetch ──
  async function handleDeleteRecord(id, skipConfirm = false) {
    if (!skipConfirm) {
      setConfirmState({ open: true, message: '確定要刪除這筆商機嗎？此操作無法復原。', onConfirm: () => executeDelete(id) })
      return
    }
    await executeDelete(id)
  }

  async function executeDelete(id) {
    try {
      const { error } = await supabase.from('pipeline').delete().eq('id', id)
      if (error) throw error
      await fetchData()
      toast.success('商機已成功刪除。')
    } catch (err) {
      console.error('Delete error:', err.message)
      toast.error('刪除失敗：' + err.message)
      setDbData(prev => prev.filter(item => item.id !== id))
    }
    setIsDrawerOpen(false)
    setEditingRecord(null)
  }

  // ── Batch Delete: 一次刪除多筆，只彈一次提示 ──
  async function handleBatchDeleteRecords(ids) {
    let successCount = 0
    let failCount = 0
    for (const id of ids) {
      try {
        const { error } = await supabase.from('pipeline').delete().eq('id', id)
        if (error) throw error
        successCount++
      } catch (err) {
        console.error('Batch delete error:', err.message)
        failCount++
      }
    }
    await fetchData()
    if (failCount === 0) {
      toast.success(`已成功刪除 ${successCount} 筆商機`)
    } else {
      toast.warning(`成功刪除 ${successCount} 筆，失敗 ${failCount} 筆`)
    }
  }

  // ── Inline Update: 單欄位即時更新到 Supabase ──
  async function handleUpdateRecord(id, field, value) {
    // Optimistic UI: 先更新本地
    setDbData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
    try {
      const dbField = field === 'reqType' ? 'reqtype' : field
      const { error } = await supabase.from('pipeline').update({ [dbField]: value }).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Inline update error:', err.message)
      toast.error('欄位更新失敗：' + err.message)
      await fetchData() // rollback to server state
    }
  }

  function handleEditRecord(row) {
    setEditingRecord(row)
    setIsDrawerOpen(true)
  }

  function handleOpenNewDrawer() {
    setEditingRecord(null)
    setIsDrawerOpen(true)
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false)
    setEditingRecord(null)
  }

  // ── Create / Update: Drawer 儲存 → Supabase upsert ──
  async function handleSaveRecord(recordOrArray) {
    try {
      if (editingRecord?.id) {
        // ── Edit mode: single record update ──
        const { error } = await supabase
          .from('pipeline')
          .update(toDbRecord(recordOrArray))
          .eq('id', editingRecord.id)
        if (error) throw error
        await fetchData()
        toast.success('資料已成功儲存！')
      } else if (Array.isArray(recordOrArray)) {
        // ── New mode (multi-item): bulk insert ──
        const dbRecords = recordOrArray.map(r => ({ ...toDbRecord(r), created_by_email: currentUserEmail }))
        const { error } = await supabase.from('pipeline').insert(dbRecords)
        if (error) throw error
        await fetchData()
        toast.success(`已成功新增 ${recordOrArray.length} 筆商機！`)
      } else {
        // ── New mode (single record fallback) ──
        const { error } = await supabase
          .from('pipeline')
          .insert({ ...toDbRecord(recordOrArray), created_by_email: currentUserEmail })
        if (error) throw error
        await fetchData()
        toast.success('資料已成功儲存！')
      }
    } catch (err) {
      console.error('Save error:', err.message)
      toast.error('儲存失敗：' + err.message)
      // Optimistic fallback
      if (editingRecord?.id) {
        setDbData(prev => prev.map(item => item.id === editingRecord.id ? { ...item, ...recordOrArray } : item))
      } else if (Array.isArray(recordOrArray)) {
        setDbData(prev => [...recordOrArray.map((r, i) => ({ ...r, id: 'rec_' + Date.now() + '_' + i })), ...prev])
      } else {
        setDbData(prev => [{ ...recordOrArray, id: 'rec_' + Date.now() }, ...prev])
      }
    }
    setIsDrawerOpen(false)
    setEditingRecord(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-fluent-bg text-fluent-text font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Mobile Header — visible only on small screens */}
      <div className="fixed top-0 left-0 right-0 z-[55] md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <img src="/mtglogo.png" alt="MetaAge Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-slate-900 text-base tracking-wide">Pipeline Portal</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(v => !v)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[45] bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); }}
        onOpenSettings={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
        session={session}
        isSuperAdmin={isSuperAdmin}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative pt-14 md:pt-0">
        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-fluent-muted text-lg">載入中...</p>
          </div>
        ) : currentView === 'admin' && isSuperAdmin ? (
          <AdminPanel onPermissionsChanged={fetchPermissions} showConfirm={(msg, cb) => setConfirmState({ open: true, message: msg, onConfirm: cb })} />
        ) : currentView === 'dashboard' ? (
          <Dashboard data={dbData} dictionary={dictionary} userRole={userRole} currentUserPermissions={currentUserPermissions} />
        ) : (
          <PipelineTable data={dbData} onDelete={handleDeleteRecord} onBatchDelete={handleBatchDeleteRecords} onOpenDrawer={handleOpenNewDrawer} onEditRecord={handleEditRecord} onUpdateRecord={handleUpdateRecord} onOpenImport={() => setIsImportOpen(true)} dictionary={dictionary} customColumns={customColumns} setCustomColumns={setCustomColumns} userRole={userRole} currentUserPermissions={currentUserPermissions} currentUserEmail={currentUserEmail} viewMode={currentView === 'caip' ? 'CAIP' : 'AIBS'} showConfirm={(msg, cb) => setConfirmState({ open: true, message: msg, onConfirm: cb })} />
        )}
      </main>

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        editingRecord={editingRecord}
        customColumns={customColumns}
        dictionary={dictionary}
        viewMode={currentView === 'caip' ? 'CAIP' : 'AIBS'}
        showConfirm={(msg, cb) => setConfirmState({ open: true, message: msg, onConfirm: cb })}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        dictionary={dictionary}
        setDictionary={setDictionary}
        onDictionaryChanged={fetchDictionary}
        onDataChanged={fetchData}
        showConfirm={(msg, cb) => setConfirmState({ open: true, message: msg, onConfirm: cb })}
      />

      {/* Import Wizard Modal */}
      <ImportWizardModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        dictionary={dictionary}
        onImport={handleImportData}
        viewMode={currentView === 'caip' ? 'CAIP' : 'AIBS'}
      />

      {/* Confirm Modal (replaces window.confirm) */}
      <ConfirmModal
        isOpen={confirmState.open}
        message={confirmState.message}
        onConfirm={() => { confirmState.onConfirm?.(); setConfirmState({ open: false, message: '', onConfirm: null }); }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />

      {/* Toast Notifications */}
      <Toaster position="top-center" toastOptions={{ className: 'bg-white text-slate-700 border border-slate-200 shadow-sm text-sm font-sans', duration: 3000 }} />
    </div>
  )
}

export default App
