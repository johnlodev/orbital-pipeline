// ===== Type Badge (green / orange) =====
export function TypeBadge({ text }) {
  let cls = 'bg-gray-100 text-gray-700 border-gray-300';
  if (text === '新購') cls = 'bg-green-50 text-green-700 border-green-200';
  else if (text === '增購') cls = 'bg-orange-50 text-orange-700 border-orange-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {text}
    </span>
  );
}

// ===== Product / Cat Badge (blue / teal / gray) =====
export function ProductBadge({ text }) {
  let cls = 'bg-gray-100 text-gray-700 border-gray-300';
  if (text === 'Azure') cls = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (text === 'Modern Work' || text === 'MW') cls = 'bg-teal-50 text-teal-700 border-teal-200';
  else if (text === 'On-Prem' || text === 'On-Premise') cls = 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {text}
    </span>
  );
}

// ===== Generic DynamicBadge (fallback / legacy) =====
export function DynamicBadge({ text }) {
  let cls = 'bg-gray-100 text-gray-700 border-gray-300';
  if (text === '新購') cls = 'bg-green-50 text-green-700 border-green-200';
  else if (text === '增購') cls = 'bg-orange-50 text-orange-700 border-orange-200';
  else if (text === 'Azure') cls = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (text === 'Modern Work' || text === 'MW') cls = 'bg-teal-50 text-teal-700 border-teal-200';
  else if (text === 'On-Prem' || text === 'On-Premise') cls = 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {text}
    </span>
  );
}

// ===== Stage Badge (progressive L1→L4) =====
export function StageBadge({ stage }) {
  let cls = 'bg-gray-100 text-gray-600 border-gray-300';
  if (stage === 'L1') cls = 'bg-slate-100 text-slate-600 border-slate-300';
  else if (stage === 'L2') cls = 'bg-sky-50 text-sky-700 border-sky-200';
  else if (stage === 'L3') cls = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (stage === 'L4') cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${cls}`}>
      {stage}
    </span>
  );
}
