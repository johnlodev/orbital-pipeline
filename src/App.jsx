import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import PipelineTable from './components/PipelineTable'
import RecordDrawer from './components/RecordDrawer'
import SettingsModal from './components/SettingsModal'
import ImportWizardModal from './components/ImportWizardModal'
import { supabase } from './utils/supabaseClient'
import { dictData as defaultDictData, mockData } from './utils/mockData'

function App() {
  const [currentView, setCurrentView] = useState('table')
  const [dbData, setDbData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [dictionary, setDictionary] = useState(() => structuredClone(defaultDictData))
  const [customColumns, setCustomColumns] = useState([])

  // ── Read: 從 Supabase 撈取資料，失敗時 fallback 到 mockData ──
  async function fetchData() {
    try {
      const { data, error } = await supabase
        .from('pipeline')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDbData(data)
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
      const { error } = await supabase.from('pipeline').insert(records)
      if (error) throw error
      await fetchData()
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
      const { error } = await supabase.from('pipeline').update({ [field]: value }).eq('id', id)
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
          .update(record)
          .eq('id', editingRecord.id)
        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('pipeline')
          .insert(record)
        if (error) throw error
      }
      await fetchData()
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

  return (
    <div className="flex h-screen overflow-hidden bg-fluent-bg text-fluent-text font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-fluent-muted text-lg">載入中...</p>
          </div>
        ) : currentView === 'dashboard' ? (
          <Dashboard data={dbData} dictionary={dictionary} />
        ) : (
          <PipelineTable data={dbData} onDelete={handleDeleteRecord} onOpenDrawer={handleOpenNewDrawer} onEditRecord={handleEditRecord} onUpdateRecord={handleUpdateRecord} onOpenImport={() => setIsImportOpen(true)} dictionary={dictionary} customColumns={customColumns} setCustomColumns={setCustomColumns} />
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
