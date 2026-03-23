import { useState, useEffect } from 'react';
import { X, PencilLine, FloppyDisk, Trash } from '@phosphor-icons/react';
import { dictData } from '../utils/mockData';

const emptyForm = {
  enduser: '',
  si: '',
  reqType: '',
  product: '',
  sku: '',
  quantity: '',
  amount: '',
  date: '',
  stage: '',
  sales: '',
  pm: '',
  notes: '',
};

export default function RecordDrawer({ isOpen, onClose, onSave, onDelete, editingRecord, customColumns }) {
  const [form, setForm] = useState({ ...emptyForm });

  const isEditMode = !!editingRecord;

  // When editingRecord changes, populate form
  useEffect(() => {
    if (editingRecord) {
      setForm({
        ...emptyForm,
        ...editingRecord,
        quantity: editingRecord.quantity ?? '',
        amount: editingRecord.amount ?? '',
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [editingRecord]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function handleSave() {
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
    const missing = required.filter(f => {
      const v = form[f.key];
      return v === '' || v === null || v === undefined;
    });
    if (missing.length > 0) {
      alert('請填寫所有必填欄位（帶有 * 號的項目）！\n\n缺少：' + missing.map(f => f.label).join(', '));
      return;
    }
    const record = {
      ...form,
      quantity: form.quantity ? Number(form.quantity) : 0,
      amount: form.amount ? Number(String(form.amount).replace(/,/g, '')) : 0,
    };
    onSave(record);
    setForm({ ...emptyForm });
  }

  function handleClose() {
    setForm({ ...emptyForm });
    onClose();
  }

  function handleDelete() {
    if (!editingRecord?.id) return;
    if (!window.confirm('確定要刪除這筆商機嗎？此操作無法復原。')) return;
    onDelete?.(editingRecord.id);
  }

  const inputCls =
    'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none';
  const labelCls =
    'block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[70] transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Drawer – widened to max-w-4xl */}
      <div
        className={`fixed top-0 right-0 h-full max-w-4xl w-full bg-white shadow-2xl z-[75] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-[#faf9f8] shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <PencilLine weight="fill" className="text-brand-600" />
            {isEditMode ? '編輯商機需求' : '新增商機需求'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded hover:bg-gray-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-white flex flex-col gap-4">
          {/* EU / Partner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                EU (最終客戶) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.enduser}
                onChange={(e) => set('enduser', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>
                Partner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.si}
                onChange={(e) => set('si', e.target.value)}
              />
            </div>
          </div>

          {/* Type / Cat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={form.reqType}
                onChange={(e) => set('reqType', e.target.value)}
              >
                <option value="">請選擇</option>
                {dictData.reqType.map((d) => (
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
                value={form.product}
                onChange={(e) => set('product', e.target.value)}
              >
                <option value="">請選擇</option>
                {dictData.product.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SKU / QTY */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
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
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
              />
            </div>
          </div>

          {/* NTM / POD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                NTM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">NT$</span>
                </div>
                <input
                  type="text"
                  className={`${inputCls} pl-[3.25rem] font-mono`}
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
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
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
          </div>

          {/* Stage / Sales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Stage <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={form.stage}
                onChange={(e) => set('stage', e.target.value)}
              >
                <option value="">請選擇</option>
                {dictData.stage.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Sales <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={form.sales}
                onChange={(e) => set('sales', e.target.value)}
              >
                <option value="">請選擇</option>
                {dictData.sales.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                PM <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={form.pm}
                onChange={(e) => set('pm', e.target.value)}
              >
                <option value="">請選擇</option>
                {dictData.pm.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div />
          </div>

          {/* Custom Columns */}
          {customColumns && customColumns.length > 0 && (
            <div className="border-t border-gray-100 my-2 pt-4">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">自訂欄位</div>
              <div className="grid grid-cols-2 gap-4">
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

        {/* Footer – delete (left) + cancel/save (right) */}
        <div className="px-6 py-4 border-t border-gray-200 bg-[#faf9f8] flex justify-between shrink-0">
          {isEditMode ? (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash size={16} /> 刪除此筆
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2.5 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-200 rounded transition-colors border border-gray-300 bg-white cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FloppyDisk size={16} /> {isEditMode ? '儲存變更' : '儲存'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
