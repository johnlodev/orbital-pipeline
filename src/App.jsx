import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import PipelineTable from './components/PipelineTable'
import RecordDrawer from './components/RecordDrawer'
import { supabase } from './utils/supabaseClient'

function App() {
  const [currentView, setCurrentView] = useState('table')
  const [dbData, setDbData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  async function fetchData() {
    const { data, error } = await supabase
      .from('pipeline')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error.message)
    } else {
      setDbData(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleAddRecord(newRecord) {
    const { error } = await supabase.from('pipeline').insert([newRecord])
    if (error) {
      console.error('Insert error:', error.message)
      alert('新增失敗：' + error.message)
      return
    }
    setIsDrawerOpen(false)
    await fetchData()
  }

  async function handleDeleteRecord(id) {
    if (!window.confirm('確定要刪除這筆商機嗎？此操作無法復原。')) return
    const { error } = await supabase.from('pipeline').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error.message)
      alert('刪除失敗：' + error.message)
      return
    }
    await fetchData()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-fluent-bg text-fluent-text font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header
          currentView={currentView}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />

        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-fluent-muted text-lg">載入中...</p>
          </div>
        ) : currentView === 'dashboard' ? (
          <Dashboard data={dbData} />
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            <PipelineTable data={dbData} onDelete={handleDeleteRecord} />
          </div>
        )}
      </main>

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleAddRecord}
      />
    </div>
  )
}

export default App
