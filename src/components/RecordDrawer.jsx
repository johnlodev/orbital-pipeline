import { useState, useEffect } from 'react';
import { X, PencilLine, FloppyDisk, Trash, Plus, Minus, Copy, ArrowClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';

/* ── CAIP 欄位定義 ── */
const CAIP_TEXT_KEYS = ['segment', 'disti_name', 'sales_stage', 'referral_id', 'acr_start_month'];
const CAIP_NUM_KEYS = [
  'acr_mom', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'q1', 'q2', 'q3', 'q4',
];
const CAIP_LABELS = {
  segment: 'Segment', disti_name: 'Disti', sales_stage: 'Sales Stage',
  referral_id: 'Referral ID', acr_start_month: 'ACR Start Month', acr_mom: 'ACR/Month',
  jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
  q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4',
};

function emptyCaipFields() {
  const obj = {};
  for (const k of CAIP_TEXT_KEYS) obj[k] = '';
  for (const k of CAIP_NUM_KEYS) obj[k] = 0;
  obj.disti_name = 'MetaAge';
  return obj;
}

/* ── 共用資訊 (表頭) ── */
const emptyCommon = {
  enduser: '',
  si: '',
  sales: '',
  pm: '',
};

/* ── 品項明細 (表身) ── */
const emptyItem = {
  reqType: '',
  product: '',
  sku: '',
  quantity: '',
  amount: '',
  date: '',
  stage: '',
  notes: '',
  ...emptyCaipFields(),
};

/* ── 編輯模式用完整表單（含全部欄位） ── */
const emptyForm = {
  ...emptyCommon,
  ...emptyItem,
};

export default function RecordDrawer({ isOpen, onClose, onSave, onDelete, editingRecord, customColumns, dictionary, viewMode = 'AIBS', showConfirm }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [commonInfo, setCommonInfo] = useState({ ...emptyCommon });
  const [newItems, setNewItems] = useState([{ ...emptyItem }]);

  const dictData = dictionary || {};
  const isCAIP = viewMode === 'CAIP';
  const isEditMode = !!editingRecord;

  const setCommon = (key, value) => setCommonInfo(prev => ({ ...prev, [key]: value }));

  // When editingRecord changes, populate form
  useEffect(() => {
    if (editingRecord) {
      const ef = { ...emptyForm };
      // Copy all known fields
      for (const k of Object.keys(ef)) {
        if (editingRecord[k] !== undefined && editingRecord[k] !== null) {
          ef[k] = editingRecord[k];
        }
      }
      // Copy custom column values (not in emptyForm)
      if (customColumns) {
        for (const col of customColumns) {
          if (editingRecord[col.id] !== undefined && editingRecord[col.id] !== null) {
            ef[col.id] = editingRecord[col.id];
          }
        }
      }
      ef.quantity = editingRecord.quantity ?? '';
      ef.amount = editingRecord.amount ?? '';
      setForm(ef);
    } else {
      setForm({ ...emptyForm });
      setCommonInfo({ ...emptyCommon });
      setNewItems([{ ...emptyItem }]);
    }
  }, [editingRecord]);

  const set = (key, value) => setForm((prev) => {
    const next = { ...prev, [key]: value };
    // Auto-calc quarterly sums
    if (['jul', 'aug', 'sep'].includes(key)) {
      next.q1 = (Number(next.jul) || 0) + (Number(next.aug) || 0) + (Number(next.sep) || 0);
    }
    if (['oct', 'nov', 'dec'].includes(key)) {
      next.q2 = (Number(next.oct) || 0) + (Number(next.nov) || 0) + (Number(next.dec) || 0);
    }
    if (['jan', 'feb', 'mar'].includes(key)) {
      next.q3 = (Number(next.jan) || 0) + (Number(next.feb) || 0) + (Number(next.mar) || 0);
    }
    if (['apr', 'may', 'jun'].includes(key)) {
      next.q4 = (Number(next.apr) || 0) + (Number(next.may) || 0) + (Number(next.jun) || 0);
    }
    // Auto-calc NTM = Q1+Q2+Q3+Q4
    const months = ['jul','aug','sep','oct','nov','dec','jan','feb','mar','apr','may','jun'];
    if (months.includes(key)) {
      const q1 = (Number(next.jul) || 0) + (Number(next.aug) || 0) + (Number(next.sep) || 0);
      const q2 = (Number(next.oct) || 0) + (Number(next.nov) || 0) + (Number(next.dec) || 0);
      const q3 = (Number(next.jan) || 0) + (Number(next.feb) || 0) + (Number(next.mar) || 0);
      const q4 = (Number(next.apr) || 0) + (Number(next.may) || 0) + (Number(next.jun) || 0);
      next.q1 = q1; next.q2 = q2; next.q3 = q3; next.q4 = q4;
      next.amount = q1 + q2 + q3 + q4;
    }
    return next;
  });

  const setNewItem = (idx, key, value) => {
    setNewItems(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [key]: value };
      // Auto quarterly sums
      if (['jul','aug','sep'].includes(key)) {
        arr[idx].q1 = (Number(arr[idx].jul)||0)+(Number(arr[idx].aug)||0)+(Number(arr[idx].sep)||0);
      }
      if (['oct','nov','dec'].includes(key)) {
        arr[idx].q2 = (Number(arr[idx].oct)||0)+(Number(arr[idx].nov)||0)+(Number(arr[idx].dec)||0);
      }
      if (['jan','feb','mar'].includes(key)) {
        arr[idx].q3 = (Number(arr[idx].jan)||0)+(Number(arr[idx].feb)||0)+(Number(arr[idx].mar)||0);
      }
      if (['apr','may','jun'].includes(key)) {
        arr[idx].q4 = (Number(arr[idx].apr)||0)+(Number(arr[idx].may)||0)+(Number(arr[idx].jun)||0);
      }
      const months = ['jul','aug','sep','oct','nov','dec','jan','feb','mar','apr','may','jun'];
      if (months.includes(key)) {
        const q1 = (Number(arr[idx].jul)||0)+(Number(arr[idx].aug)||0)+(Number(arr[idx].sep)||0);
        const q2 = (Number(arr[idx].oct)||0)+(Number(arr[idx].nov)||0)+(Number(arr[idx].dec)||0);
        const q3 = (Number(arr[idx].jan)||0)+(Number(arr[idx].feb)||0)+(Number(arr[idx].mar)||0);
        const q4 = (Number(arr[idx].apr)||0)+(Number(arr[idx].may)||0)+(Number(arr[idx].jun)||0);
        arr[idx].q1 = q1; arr[idx].q2 = q2; arr[idx].q3 = q3; arr[idx].q4 = q4;
        arr[idx].amount = q1+q2+q3+q4;
      }
      return arr;
    });
  };

  function addNewItem() {
    setNewItems(prev => [...prev, { ...emptyItem }]);
  }
  function removeNewItem(idx) {
    setNewItems(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));
  }
  function handleDuplicate(idx) {
    setNewItems(prev => {
      const clone = { ...prev[idx] };
      return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
    });
    toast.success(`已複製第 ${idx + 1} 筆品項`);
  }

  function validateRecord(rec) {
    const required = [
      { key: 'enduser', label: 'EU' },
      { key: 'si',      label: 'Partner' },
      { key: 'reqType', label: 'Type' },
      { key: 'product', label: 'Cat.' },
      { key: 'sku',     label: 'SKU' },
      { key: 'quantity',label: 'QTY' },
      { key: 'amount',  label: 'NTM' },
      { key: 'date',    label: 'POD' },
      { key: 'stage',   label: 'Stage' },
      { key: 'sales',   label: 'Sales' },
      { key: 'pm',      label: 'PM' },
    ];
    if (isCAIP) {
      required.push({ key: 'segment', label: 'Segment' });
    }
    const missing = required.filter(f => {
      const v = rec[f.key];
      return v === '' || v === null || v === undefined;
    });
    return missing;
  }

  function handleSave() {
    if (isEditMode) {
      const missing = validateRecord(form);
      if (missing.length > 0) {
        toast.error('請填寫所有必填欄位（帶有 * 號的項目）！\n缺少：' + missing.map(f => f.label).join(', '));
        return;
      }
      const record = {
        ...form,
        quantity: form.quantity ? Number(form.quantity) : 0,
        amount: form.amount ? Number(String(form.amount).replace(/,/g, '')) : 0,
      };
      for (const k of CAIP_NUM_KEYS) {
        if (record[k] !== undefined) record[k] = Number(record[k]) || 0;
      }
      onSave(record);
      setForm({ ...emptyForm });
    } else {
      // Validate commonInfo fields first
      const commonMissing = [
        { key: 'enduser', label: 'EU' },
        { key: 'si',      label: 'Partner' },
        { key: 'sales',   label: 'Sales' },
        { key: 'pm',      label: 'PM' },
      ].filter(f => !commonInfo[f.key]);
      if (commonMissing.length > 0) {
        toast.error('共用資訊缺少必填欄位：' + commonMissing.map(f => f.label).join(', '));
        return;
      }
      // Validate each item
      const items = newItems;
      for (let i = 0; i < items.length; i++) {
        const merged = { ...commonInfo, ...items[i] };
        const missing = validateRecord(merged);
        if (missing.length > 0) {
          toast.error(`品項 #${i + 1} 缺少必填欄位：${missing.map(f => f.label).join(', ')}`);
          return;
        }
      }
      // Merge and send
      const records = items.map(item => {
        const record = {
          ...commonInfo,
          ...item,
          quantity: item.quantity ? Number(item.quantity) : 0,
          amount: item.amount ? Number(String(item.amount).replace(/,/g, '')) : 0,
        };
        for (const k of CAIP_NUM_KEYS) {
          if (record[k] !== undefined) record[k] = Number(record[k]) || 0;
        }
        return record;
      });
      onSave(records);
      setCommonInfo({ ...emptyCommon });
      setNewItems([{ ...emptyItem }]);
    }
  }

  function handleSaveAndContinue() {
    if (isEditMode) return; // only for new mode
    // Validate commonInfo
    const commonMissing = [
      { key: 'enduser', label: 'EU' },
      { key: 'si',      label: 'Partner' },
      { key: 'sales',   label: 'Sales' },
      { key: 'pm',      label: 'PM' },
    ].filter(f => !commonInfo[f.key]);
    if (commonMissing.length > 0) {
      toast.error('共用資訊缺少必填欄位：' + commonMissing.map(f => f.label).join(', '));
      return;
    }
    // Validate each item
    for (let i = 0; i < newItems.length; i++) {
      const merged = { ...commonInfo, ...newItems[i] };
      const missing = validateRecord(merged);
      if (missing.length > 0) {
        toast.error(`品項 #${i + 1} 缺少必填欄位：${missing.map(f => f.label).join(', ')}`);
        return;
      }
    }
    // Merge and send
    const records = newItems.map(item => {
      const record = {
        ...commonInfo,
        ...item,
        quantity: item.quantity ? Number(item.quantity) : 0,
        amount: item.amount ? Number(String(item.amount).replace(/,/g, '')) : 0,
      };
      for (const k of CAIP_NUM_KEYS) {
        if (record[k] !== undefined) record[k] = Number(record[k]) || 0;
      }
      return record;
    });
    onSave(records);
    // Reset for next entry — don't close drawer
    setCommonInfo({ ...emptyCommon });
    setNewItems([{ ...emptyItem }]);
    toast.success('已儲存！請繼續新增下一筆。');
  }

  function handleClose() {
    setForm({ ...emptyForm });
    setCommonInfo({ ...emptyCommon });
    setNewItems([{ ...emptyItem }]);
    onClose();
  }

  function handleDelete() {
    if (!editingRecord?.id) return;
    showConfirm?.('確定要刪除這筆商機嗎？此操作無法復原。', () => {
      onDelete?.(editingRecord.id, true);
    });
  }

  const inputCls =
    'w-full border border-gray-300 rounded px-3 py-2.5 text-[15px] focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none';
  const labelCls =
    'block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1';

  /* ── 共用資訊欄位 (表頭: EU / Partner / Sales / PM) ── */
  function renderCommonFields(data, setter) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              EU (最終客戶) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputCls}
              value={data.enduser}
              onChange={(e) => setter('enduser', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>
              Partner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputCls}
              value={data.si}
              onChange={(e) => setter('si', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Sales <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={data.sales}
              onChange={(e) => setter('sales', e.target.value)}
            >
              <option value="">請選擇</option>
              {(dictData.sales || []).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              PM <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={data.pm}
              onChange={(e) => setter('pm', e.target.value)}
            >
              <option value="">請選擇</option>
              {(dictData.pm || []).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  }

  /* ── 品項明細欄位 (表身: Type / Cat / SKU / QTY / NTM / POD / Stage) ── */
  function renderItemFields(data, setter) {
    return (
      <>
        {/* Type / Cat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Type <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={data.reqType}
              onChange={(e) => setter('reqType', e.target.value)}
            >
              <option value="">請選擇</option>
              {(dictData.reqType || []).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Cat. <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={data.product}
              onChange={(e) => setter('product', e.target.value)}
            >
              <option value="">請選擇</option>
              {(dictData.product || [])
                .filter(d => isCAIP ? d.code.toLowerCase() === 'azure' : d.code.toLowerCase() !== 'azure')
                .map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SKU / QTY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="請確實輸入SkuTitle"
              value={data.sku}
              onChange={(e) => setter('sku', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>
              QTY <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={data.quantity}
              onChange={(e) => setter('quantity', e.target.value)}
            />
          </div>
        </div>

        {/* NTM / POD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              NTM {!isCAIP && <span className="text-red-500">*</span>}
              {isCAIP && <span className="text-gray-400 text-[10px] ml-1">（此欄位自動計算）</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">NT$</span>
              </div>
              <input
                type="text"
                className={`${inputCls} pl-[3.25rem] font-mono`}
                placeholder="0"
                value={data.amount}
                onChange={(e) => setter('amount', e.target.value)}
                readOnly={isCAIP}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              POD <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputCls}
              value={data.date}
              onChange={(e) => setter('date', e.target.value)}
            />
          </div>
        </div>

        {/* Stage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Stage <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={data.stage}
              onChange={(e) => setter('stage', e.target.value)}
            >
              <option value="">請選擇</option>
              {(dictData.stage || []).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div />
        </div>
      </>
    );
  }

  /* ── 編輯模式用完整欄位（全部合在一起） ── */
  function renderCoreFields(data, setter) {
    return (
      <>
        {renderCommonFields(data, setter)}
        {renderItemFields(data, setter)}
      </>
    );
  }

  /* ── CAIP Extended Fields ── */
  function renderCaipFields(data, setter) {
    if (!isCAIP) return null;
    const segmentOptions = dictData.segment || [];
    return (
      <div className="border-t border-gray-200 mt-2 pt-4">
        <div className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider mb-3">CAIP 擴充欄位</div>

        {/* Segment / Disti / Sales Stage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className={labelCls}>Segment <span className="text-red-500">*</span></label>
            <select
              className={inputCls}
              value={data.segment}
              onChange={(e) => setter('segment', e.target.value)}
              required
            >
              <option value="">請選擇</option>
              {segmentOptions.map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Disti</label>
            <input type="text" className={inputCls} value={data.disti_name} onChange={(e) => setter('disti_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Sales Stage</label>
            <input type="text" className={inputCls} value={data.sales_stage} onChange={(e) => setter('sales_stage', e.target.value)} />
          </div>
        </div>

        {/* Referral ID / ACR Start Month / ACR MoM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className={labelCls}>Referral ID</label>
            <input type="text" className={inputCls} value={data.referral_id} onChange={(e) => setter('referral_id', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>ACR Start Month</label>
            <input type="month" className={inputCls} value={data.acr_start_month} onChange={(e) => setter('acr_start_month', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>ACR/Month</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">$</span>
              </div>
              <input type="number" className={`${inputCls} pl-7 font-mono`} value={data.acr_mom} onChange={(e) => setter('acr_mom', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Monthly Fields: Jul–Dec */}
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-2">Monthly Revenue (Jul – Jun)</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">
          {['jul','aug','sep','oct','nov','dec'].map(m => (
            <div key={m}>
              <label className={labelCls}>{CAIP_LABELS[m]}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs font-medium">$</span>
                </div>
                <input type="number" className={`${inputCls} pl-6 font-mono`} value={data[m]} onChange={(e) => setter(m, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        {/* Monthly Fields: Jan–Jun */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          {['jan','feb','mar','apr','may','jun'].map(m => (
            <div key={m}>
              <label className={labelCls}>{CAIP_LABELS[m]}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs font-medium">$</span>
                </div>
                <input type="number" className={`${inputCls} pl-6 font-mono`} value={data[m]} onChange={(e) => setter(m, e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        {/* Quarterly Sums (read-only) */}
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Quarterly Totals（以下欄位自動計算）</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['q1','q2','q3','q4'].map(q => (
            <div key={q}>
              <label className={labelCls}>{CAIP_LABELS[q]}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs font-medium">$</span>
                </div>
                <input type="number" className={`${inputCls} pl-6 bg-gray-50 font-mono`} value={data[q]} readOnly />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[70] transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:max-w-4xl bg-white shadow-2xl z-[75] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:rounded-l-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <PencilLine weight="fill" className="text-brand-600" />
            {isEditMode ? '編輯商機需求' : '新增商機需求'}
            {isCAIP && <span className="text-xs font-medium text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">CAIP</span>}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded hover:bg-gray-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-4 md:px-6 py-6 flex-1 overflow-y-auto bg-slate-50 flex flex-col gap-4">
          {isEditMode ? (
            /* ── Edit Mode: single record ── */
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
              {renderCoreFields(form, set)}
              {renderCaipFields(form, set)}

              {/* Custom Columns */}
              {customColumns && customColumns.length > 0 && (
                <div className="border-t border-gray-100 my-2 pt-4">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">自訂欄位</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customColumns.map(col => (
                      <div key={col.id}>
                        <label className={labelCls}>{col.name}</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={form[col.id] || ''}
                          onChange={(e) => set(col.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="border-t border-gray-100 my-2 pt-4 flex-1 flex flex-col">
                <label className={labelCls}>Notes</label>
                <textarea
                  className="w-full flex-1 min-h-[120px] border border-brand-300 bg-brand-50/30 rounded p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                  placeholder="請輸入詳細進度與備註..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* ── New Mode: common info + multi-item ── */
            <>
              {/* Common Info Card (表頭) */}
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-brand-200 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">共用資訊（適用於下方所有品項）</span>
                </div>
                {renderCommonFields(commonInfo, setCommon)}
              </div>

              {/* Item Cards (表身) */}
              {newItems.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col gap-4 relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-brand-600">品項 #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDuplicate(idx)} title="複製此筆" className="text-brand-400 hover:text-brand-600 p-1 rounded hover:bg-brand-50 cursor-pointer transition-colors">
                        <Copy size={16} />
                      </button>
                      {newItems.length > 1 && (
                        <button onClick={() => removeNewItem(idx)} title="刪除此筆" className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors">
                          <Minus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {renderItemFields(item, (k, v) => setNewItem(idx, k, v))}
                  {renderCaipFields(item, (k, v) => setNewItem(idx, k, v))}

                  {/* Custom Columns */}
                  {customColumns && customColumns.length > 0 && (
                    <div className="border-t border-gray-100 my-2 pt-4">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">自訂欄位</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customColumns.map(col => (
                          <div key={col.id}>
                            <label className={labelCls}>{col.name}</label>
                            <input
                              type="text"
                              className={inputCls}
                              value={item[col.id] || ''}
                              onChange={(e) => setNewItem(idx, col.id, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="border-t border-gray-100 my-2 pt-4 flex-1 flex flex-col">
                    <label className={labelCls}>Notes</label>
                    <textarea
                      className="w-full flex-1 min-h-[80px] border border-brand-300 bg-brand-50/30 rounded p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                      placeholder="請輸入詳細進度與備註..."
                      value={item.notes}
                      onChange={(e) => setNewItem(idx, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {/* Add another item button */}
              <button
                onClick={addNewItem}
                className="flex items-center justify-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 border border-dashed border-brand-300 rounded-xl py-3 hover:bg-brand-50 transition-colors cursor-pointer"
              >
                <Plus size={16} weight="bold" /> 再新增一筆
              </button>
            </>
          )}
        </div>

        {/* Footer – delete/total (left) + cancel/save (right) */}
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-between items-center shrink-0">
          {isEditMode ? (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash size={16} /> 刪除此筆
            </button>
          ) : (
            <div className="text-sm text-slate-600">
              <span className="font-medium">預估總額：</span>
              <span className="font-bold text-brand-600">
                NT$ {newItems.reduce((sum, item) => sum + (Number(String(item.amount).replace(/,/g, '')) || 0), 0).toLocaleString()}
              </span>
              <span className="text-slate-400 ml-1.5 text-xs">({newItems.length} 筆品項)</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              取消
            </button>
            {!isEditMode && (
              <button
                onClick={handleSaveAndContinue}
                className="px-4 py-2 border border-brand-300 text-brand-600 hover:bg-brand-50 text-sm font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowClockwise size={16} />
                儲存並繼續
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FloppyDisk size={16} weight="bold" />
              {isEditMode ? '儲存變更' : `儲存 (${newItems.length} 筆)`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
