export function DynamicBadge({ text }) {
  let cls = 'bg-gray-100 text-gray-700 border-gray-300';
  if (text === '新購') cls = 'bg-green-50 text-green-700 border-green-200';
  else if (text === '增購') cls = 'bg-orange-50 text-orange-700 border-orange-200';
  else if (text === 'Azure') cls = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (text === 'Modern Work' || text === 'MW') cls = 'bg-teal-50 text-teal-700 border-teal-200';
  else if (text === 'On-Prem' || text === 'On-Premise') cls = 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {text}
    </span>
  );
}

export function StageBadge({ stage }) {
  let cls = 'bg-gray-100 text-gray-700 border-gray-300';
  if (stage === 'L1') cls = 'bg-gray-100 text-gray-700 border-gray-300';
  else if (stage === 'L2') cls = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (stage === 'L3') cls = 'bg-orange-50 text-orange-700 border-orange-200';
  else if (stage === 'L4') cls = 'bg-green-50 text-green-700 border-green-200';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}>
      {stage}
    </span>
  );
}
