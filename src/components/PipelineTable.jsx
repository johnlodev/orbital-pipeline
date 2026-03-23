import { Trash } from '@phosphor-icons/react';
import { dictData } from '../utils/mockData';
import { DynamicBadge, StageBadge } from './Badges';

export default function PipelineTable({ data, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <table className="min-w-full text-sm" id="masterTable">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 font-semibold text-left">End User</th>
            <th className="px-3 py-2 font-semibold text-left">SI / Partner</th>
            <th className="px-3 py-2 font-semibold text-left">需求類型</th>
            <th className="px-3 py-2 font-semibold text-left">產品</th>
            <th className="px-3 py-2 font-semibold text-left">SKU</th>
            <th className="px-3 py-2 font-semibold text-right">數量</th>
            <th className="px-3 py-2 font-semibold text-right">金額</th>
            <th className="px-3 py-2 font-semibold text-left">日期</th>
            <th className="px-3 py-2 font-semibold text-center">Stage</th>
            <th className="px-3 py-2 font-semibold text-left">備註</th>
            <th className="px-3 py-2 font-semibold text-left">Sales</th>
            <th className="px-3 py-2 font-semibold text-left">PM</th>
            <th className="px-3 py-2 font-semibold text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="px-3 py-2">{row.enduser}</td>
              <td className="px-3 py-2">{row.si}</td>
              <td className="px-3 py-2">
                <DynamicBadge text={row.reqType} />
              </td>
              <td className="px-3 py-2">
                <DynamicBadge text={row.product} />
              </td>
              <td className="px-3 py-2">{row.sku}</td>
              <td className="px-3 py-2 text-right">{row.quantity?.toLocaleString?.() ?? row.quantity}</td>
              <td className="px-3 py-2 text-right">
                {row.amount != null ? `NT$ ${row.amount.toLocaleString()}` : '-'}
              </td>
              <td className="px-3 py-2">{row.date}</td>
              <td className="px-3 py-2 text-center">
                <StageBadge stage={row.stage} />
              </td>
              <td className="px-3 py-2">{row.notes}</td>
              <td className="px-3 py-2">{row.sales}</td>
              <td className="px-3 py-2">{row.pm}</td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onDelete(row.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                  title="刪除此筆"
                >
                  <Trash size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
