import { useState, useCallback, useRef } from 'react';
import {
  X, MicrosoftExcelLogo, DownloadSimple, CheckCircle, Table as TableIcon,
} from '@phosphor-icons/react';

// System fields for column mapping
const SYSTEM_FIELDS = [
  { id: 'skip', label: '忽略此欄 (Skip)' },
  { id: 'enduser', label: 'EU' },
  { id: 'si', label: 'Partner' },
  { id: 'reqType', label: 'Type' },
  { id: 'product', label: 'Cat.' },
  { id: 'sku', label: 'SKU' },
  { id: 'quantity', label: 'QTY' },
  { id: 'amount', label: 'NTM' },
  { id: 'date', label: 'POD' },
  { id: 'stage', label: 'Stage' },
  { id: 'notes', label: 'Notes' },
  { id: 'sales', label: 'Sales' },
  { id: 'pm', label: 'PM' },
];

// Auto-match header text to field id
function autoMatchField(headerText) {
  const h = headerText.trim();
  if (h.includes('EU') || h.includes('客戶')) return 'enduser';
  if (h.includes('Partner') || h.includes('代理')) return 'si';
  if (h.includes('Category') || h.includes('產品') || h.includes('Cat.')) return 'product';
  if (h.includes('Type') || h.includes('類型')) return 'reqType';
  if (h.includes('Sales') || h.includes('業務')) return 'sales';
  if (h.includes('PM')) return 'pm';
  if (h.includes('SKU') || h.includes('明細')) return 'sku';
  if (h.includes('Quantity') || h.includes('數量') || h.includes('套數') || h.includes('QTY')) return 'quantity';
  if (h.includes('NTM') || h.includes('金額')) return 'amount';
  if (h.includes('日') || h.includes('時間') || h.includes('POD')) return 'date';
  if (h.includes('Stage') || h.includes('階段')) return 'stage';
  if (h.includes('Note') || h.includes('案況')) return 'notes';
  return 'skip';
}

export default function ImportWizardModal({ isOpen, onClose, dictionary, onImport }) {
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [colMapping, setColMapping] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pasteText, setPasteText] = useState('');
  const textareaRef = useRef(null);

  const hasParsed = parsedHeaders.length > 0 && parsedData.length > 0;

  // --- Reset state ---
  function resetState() {
    setParsedHeaders([]);
    setParsedData([]);
    setColMapping([]);
    setErrorMsg('');
    setPasteText('');
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // --- Download CSV template ---
  function downloadTemplate() {
    const headers = SYSTEM_FIELDS.filter(f => f.id !== 'skip').map(f => f.label);
    const csvContent = '\uFEFF' + headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Orbital_Pipeline_Import_Template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // --- Parse pasted data ---
  const handlePaste = useCallback(() => {
    // Use setTimeout to let the browser update the textarea value first
    setTimeout(() => {
      const text = textareaRef.current?.value?.trim();
      if (!text || text.length < 10) return;

      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) {
        setErrorMsg('錯誤：請貼上包含「表頭」與至少「一筆資料」的完整範圍。');
        setParsedHeaders([]);
        setParsedData([]);
        setColMapping([]);
        return;
      }

      const separator = lines[0].includes('\t') ? '\t' : (lines[0].includes(',') ? ',' : '\t');
      const headers = lines[0].split(separator).map(h => h.trim());
      const data = lines.slice(1).map(l => l.split(separator).map(c => c.trim()));

      // Auto-match columns
      const mapping = headers.map(h => autoMatchField(h));

      setParsedHeaders(headers);
      setParsedData(data);
      setColMapping(mapping);
      setErrorMsg('');
    }, 100);
  }, []);

  // --- Update column mapping ---
  function updateMapping(colIndex, fieldId) {
    setColMapping(prev => {
      const next = [...prev];
      next[colIndex] = fieldId;
      return next;
    });
  }

  // --- Confirm import with dict validation ---
  const handleConfirmImport = useCallback(() => {
    // Build colMap: colIndex -> fieldId (skip excluded)
    const colMap = {};
    colMapping.forEach((fieldId, idx) => {
      if (fieldId !== 'skip') colMap[idx] = fieldId;
    });

    if (Object.keys(colMap).length === 0) {
      setErrorMsg('您尚未對應任何欄位！');
      return;
    }

    // Build dict validation lookup: fieldId -> set of valid codes/labels
    const dictValidations = {};
    if (dictionary) {
      for (const key of Object.keys(dictionary)) {
        const items = dictionary[key];
        if (Array.isArray(items)) {
          dictValidations[key] = new Set(items.flatMap(x => [x.code, x.label]));
        }
      }
    }

    // Validate each row
    for (let rIdx = 0; rIdx < parsedData.length; rIdx++) {
      const row = parsedData[rIdx];
      for (const [colIdx, fieldId] of Object.entries(colMap)) {
        const val = row[colIdx]?.trim();
        if (!val) continue;
        if (dictValidations[fieldId] && !dictValidations[fieldId].has(val)) {
          setErrorMsg(`匯入驗證失敗！第 ${rIdx + 1} 筆: 欄位「${fieldId}」有未知選項 "${val}"。請先至系統設定加入該選項。`);
          return;
        }
      }
    }

    // Build importable records
    const records = parsedData.map(row => {
      const mapped = {};
      for (const [colIdx, fieldId] of Object.entries(colMap)) {
        mapped[fieldId] = row[colIdx]?.trim() || '';
      }

      // Parse numeric fields
      let amount = mapped.amount ? Number(mapped.amount.replace(/[^0-9.-]/g, '')) : 0;
      if (isNaN(amount)) amount = 0;
      let quantity = mapped.quantity ? Number(mapped.quantity.replace(/[^0-9.-]/g, '')) : 0;
      if (isNaN(quantity)) quantity = 0;

      // Resolve dict codes for sales/pm/stage
      const resolveDictCode = (dictKey, rawVal) => {
        if (!rawVal || !dictionary?.[dictKey]) return rawVal || '';
        const items = dictionary[dictKey];
        const match = items.find(s => s.label === rawVal || s.code === rawVal);
        return match ? match.code : rawVal;
      };

      return {
        enduser: mapped.enduser || '未提供',
        si: mapped.si || '-',
        reqType: mapped.reqType || '-',
        product: mapped.product || '-',
        sku: mapped.sku || '-',
        quantity,
        amount,
        date: mapped.date || '-',
        stage: resolveDictCode('stage', mapped.stage),
        sales: resolveDictCode('sales', mapped.sales),
        pm: resolveDictCode('pm', mapped.pm),
        notes: mapped.notes || '',
      };
    });

    onImport(records);
    resetState();
  }, [colMapping, parsedData, dictionary, onImport]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="relative bg-white rounded-md shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh] pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-[#faf9f8] shrink-0">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MicrosoftExcelLogo size={20} weight="fill" className="text-green-600" />
              引導式匯入精靈 (3 步驟無痛匯入)
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="p-6 overflow-y-auto flex flex-col gap-6 bg-white min-h-[400px]">
            {/* 3-Step Guide Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-6">
              {/* Step 1 */}
              <div className="bg-gray-50 rounded border border-gray-200 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
                <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="bg-brand-100 text-brand-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                  下載最新範本
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  系統會自動抓取總表的「最新動態欄位」產生專屬 Excel (.csv) 格式供您填寫。
                </p>
                <button
                  onClick={downloadTemplate}
                  className="w-full bg-white border border-brand-500 text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <DownloadSimple size={14} /> 下載最新 CSV 範本
                </button>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 rounded border border-gray-200 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                  複製資料 (Ctrl+C)
                </h3>
                <p className="text-xs text-gray-500">
                  在您下載的 Excel 或 CSV 中填寫好資料後，將包含「表頭」的範圍直接全選複製。
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 rounded border border-gray-200 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                  在此貼上 (Ctrl+V)
                </h3>
                <p className="text-xs text-gray-500">
                  點擊下方虛線框，按下 Ctrl+V 貼上。系統會自動驗證字典檔，零錯誤即匯入。
                </p>
              </div>
            </div>

            {/* Paste area + Preview */}
            <div className="flex flex-col xl:flex-row gap-6 flex-1">
              {/* Textarea */}
              <div className="flex-1 min-w-[300px] flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  onPaste={handlePaste}
                  className="w-full flex-1 min-h-[200px] border-2 border-dashed border-gray-300 rounded p-4 font-mono text-[11px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none placeholder-gray-400 bg-gray-50 whitespace-pre"
                  placeholder="[步驟 3] 點擊此處並按下 Ctrl + V 貼上..."
                />
              </div>

              {/* Preview area */}
              <div className="flex-[2] flex flex-col min-w-0">
                {!hasParsed ? (
                  /* Empty state */
                  <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 rounded bg-gray-50 text-gray-400 min-h-[200px]">
                    <TableIcon size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">等待貼上資料，將於此處顯示對應預覽...</p>
                  </div>
                ) : (
                  /* Preview table */
                  <div className="border border-gray-200 rounded overflow-hidden flex-1 shadow-sm flex flex-col min-h-[200px]">
                    {/* Success message */}
                    <div className="bg-green-50 border-b border-green-100 px-3 py-2 flex items-center gap-2 text-green-700 text-xs font-medium shrink-0">
                      <CheckCircle size={16} weight="fill" />
                      成功偵測到 {parsedData.length} 筆資料與 {parsedHeaders.length} 個欄位！請確認欄位對應。
                    </div>

                    {/* Table with mapping selects */}
                    <div className="overflow-x-auto grid-scroll flex-1 bg-white">
                      <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#faf9f8] border-b border-gray-200 text-xs">
                          {/* Row 1: Column mapping selects */}
                          <tr>
                            {parsedHeaders.map((_, colIdx) => {
                              const mapped = colMapping[colIdx] || 'skip';
                              const isMatched = mapped !== 'skip';
                              return (
                                <th key={colIdx} className="p-2 font-normal border-r border-gray-200 min-w-[120px]">
                                  <select
                                    value={mapped}
                                    onChange={e => updateMapping(colIdx, e.target.value)}
                                    className={`w-full border rounded py-1 px-1 text-xs font-semibold outline-none ${
                                      isMatched
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-300 bg-white text-gray-500'
                                    }`}
                                  >
                                    {SYSTEM_FIELDS.map(f => (
                                      <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                  </select>
                                </th>
                              );
                            })}
                          </tr>
                          {/* Row 2: Original header names */}
                          <tr className="text-gray-500 bg-gray-100/50">
                            {parsedHeaders.map((header, colIdx) => (
                              <th
                                key={colIdx}
                                className="px-2 py-1.5 text-[10px] border-r border-gray-200 font-mono truncate max-w-[120px]"
                                title={header}
                              >
                                原欄: {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-[11px] text-gray-700 divide-y divide-gray-100">
                          {parsedData.slice(0, 3).map((row, rIdx) => (
                            <tr key={rIdx}>
                              {parsedHeaders.map((_, cIdx) => (
                                <td key={cIdx} className="px-2 py-2 border-r border-gray-200 truncate max-w-[120px]">
                                  {row[cIdx] != null && row[cIdx] !== ''
                                    ? row[cIdx]
                                    : <span className="italic text-gray-400">空白</span>
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-200 bg-[#faf9f8] rounded-b flex justify-between shrink-0 items-center">
            <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
            <div className="flex gap-2.5">
              <button
                onClick={handleClose}
                className="px-4 py-1.5 text-gray-600 text-sm font-medium hover:bg-gray-200 rounded transition-colors border border-gray-300 bg-white"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!hasParsed}
                className={`px-6 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${
                  hasParsed
                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={16} /> 確認匯入資料
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
