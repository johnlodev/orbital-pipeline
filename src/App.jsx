import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import PipelineTable from './components/PipelineTable'
import RecordDrawer from './components/RecordDrawer'
import SettingsModal from './components/SettingsModal'
import ImportWizardModal from './components/ImportWizardModal'
import AuthScreen from './components/AuthScreen'
import AdminPanel from './components/AdminPanel'
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
  if (!session) return <AuthScreen />

  return <AuthenticatedApp session={session} />
}

function AuthenticatedApp({ session }) {
  const [currentView, setCurrentView] = useState('table')
  const [dbData, setDbData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [dictionary, setDictionary] = useState(() => structuredClone(defaultDictData))

  // ── DB ↔ Frontend 欄位名 mapping (DB: reqtype ↔ Frontend: reqType) ──
  function fromDbRecord(row) {
    if (!row) return row
    const { reqtype, ...rest } = row
    return { ...rest, reqType: reqtype }
  }
  function toDbRecord(record) {
    if (!record) return record
    const { reqType, ...rest } = record
    return { ...rest, reqtype: reqType }
  }
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
      alert('⚠️ 權限資料載入失敗：' + err.message)
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
      alert('⚠️ 無法連線 Supabase，已載入本機測試資料。\n' + err.message)
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
      alert('✅ 已成功匯入 ' + records.length + ' 筆資料！')
    } catch (err) {
      console.error('Import error:', err.message)
      alert('⚠️ 匯入失敗：' + err.message)
      // Optimistic fallback: 仍放入本地
      setDbData(prev => [...records, ...prev])
    }
    setIsImportOpen(false)
  }

  // ── Delete: 先刪 Supabase，成功後 refetch ──
  async function handleDeleteRecord(id, skipConfirm = false) {
    if (!skipConfirm && !window.confirm('確定要刪除這筆商機嗎？此操作無法復原。')) return
    try {
      const { error } = await supabase.from('pipeline').delete().eq('id', id)
      if (error) throw error
      await fetchData()
      alert('✅ 商機已成功刪除。')
    } catch (err) {
      console.error('Delete error:', err.message)
      alert('⚠️ 刪除失敗：' + err.message)
      // Optimistic fallback
      setDbData(prev => prev.filter(item => item.id !== id))
    }
    setIsDrawerOpen(false)
    setEditingRecord(null)
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
      alert('⚠️ 欄位更新失敗：' + err.message)
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
  async function handleSaveRecord(record) {
    try {
      if (editingRecord?.id) {
        // Update existing
        const { error } = await supabase
          .from('pipeline')
          .update(toDbRecord(record))
          .eq('id', editingRecord.id)
        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('pipeline')
          .insert({ ...toDbRecord(record), created_by_email: currentUserEmail })
        if (error) throw error
      }
      await fetchData()
      alert('✅ 資料已成功儲存！')
    } catch (err) {
      console.error('Save error:', err.message)
      alert('⚠️ 儲存失敗：' + err.message)
      // Optimistic fallback
      if (editingRecord?.id) {
        setDbData(prev => prev.map(item => item.id === editingRecord.id ? { ...item, ...record } : item))
      } else {
        setDbData(prev => [{ ...record, id: 'rec_' + Date.now() }, ...prev])
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
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        session={session}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-fluent-muted text-lg">載入中...</p>
          </div>
        ) : currentView === 'admin' && isSuperAdmin ? (
          <AdminPanel onPermissionsChanged={fetchPermissions} />
        ) : currentView === 'dashboard' ? (
          <Dashboard data={dbData} dictionary={dictionary} userRole={userRole} currentUserPermissions={currentUserPermissions} />
        ) : (
          <PipelineTable data={dbData} onDelete={handleDeleteRecord} onOpenDrawer={handleOpenNewDrawer} onEditRecord={handleEditRecord} onUpdateRecord={handleUpdateRecord} onOpenImport={() => setIsImportOpen(true)} dictionary={dictionary} customColumns={customColumns} setCustomColumns={setCustomColumns} userRole={userRole} currentUserPermissions={currentUserPermissions} currentUserEmail={currentUserEmail} />
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
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        dictionary={dictionary}
        setDictionary={setDictionary}
      />

      {/* Import Wizard Modal */}
      <ImportWizardModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        dictionary={dictionary}
        onImport={handleImportData}
      />
    </div>
  )
}

export default App
