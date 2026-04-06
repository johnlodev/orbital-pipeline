// ===== Shared color palette for deterministic badge coloring =====
const BADGE_PALETTE = [
  'bg-blue-50/80 text-blue-700 ring-blue-600/20',
  'bg-violet-50/80 text-violet-700 ring-violet-600/20',
  'bg-sky-50/80 text-sky-700 ring-sky-600/20',
  'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20',
  'bg-rose-50/80 text-rose-700 ring-rose-600/20',
  'bg-pink-50/80 text-pink-700 ring-pink-600/20',
  'bg-fuchsia-50/80 text-fuchsia-700 ring-fuchsia-600/20',
  'bg-cyan-50/80 text-cyan-700 ring-cyan-600/20',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAutoColor(text) {
  if (!text) return 'bg-slate-100/80 text-slate-600 ring-slate-400/20';
  return BADGE_PALETTE[hashCode(text.toLowerCase()) % BADGE_PALETTE.length];
}

// ===== Shared base classes for all badges =====
const BADGE_BASE = 'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium ring-1 ring-inset transition-colors duration-200 hover:shadow-[var(--shadow-soft-xs)] cursor-default backdrop-blur-sm';

// ===== Explicit color maps (code-based, case-insensitive) =====
const TYPE_COLORS = {
  '新購': 'bg-teal-50/80 text-teal-700 ring-teal-600/20',
  '增購': 'bg-rose-50/80 text-rose-700 ring-rose-600/20',
  '移轉': 'bg-amber-50/80 text-amber-700 ring-amber-600/20',
  '轉移': 'bg-amber-50/80 text-amber-700 ring-amber-600/20',
  'transfer': 'bg-amber-50/80 text-amber-700 ring-amber-600/20',
};

const PRODUCT_COLORS = {
  'azure': 'bg-blue-50/80 text-blue-700 ring-blue-600/20',
  'mw': 'bg-indigo-50/80 text-indigo-700 ring-indigo-600/20',
  'modern work': 'bg-indigo-50/80 text-indigo-700 ring-indigo-600/20',
  'on-prem': 'bg-cyan-50/80 text-cyan-700 ring-cyan-600/20',
  'on-premise': 'bg-cyan-50/80 text-cyan-700 ring-cyan-600/20',
};

const STAGE_COLORS = {
  'l1': 'bg-zinc-100/80 text-zinc-700 ring-zinc-500/20',
  'l2': 'bg-amber-50/80 text-amber-700 ring-amber-500/20',
  'l3': 'bg-orange-50/80 text-orange-700 ring-orange-500/20',
  'l4': 'bg-emerald-50/80 text-emerald-700 ring-emerald-500/20',
};

// ===== All explicit colors merged for general lookup =====
const ALL_COLORS = { ...TYPE_COLORS, ...PRODUCT_COLORS, ...STAGE_COLORS };

function resolveColor(colorMap, code) {
  if (!code) return 'bg-slate-100/80 text-slate-600 ring-slate-400/20';
  const key = code.toString().trim().toLowerCase();
  return colorMap[key] || colorMap[code.toString().trim()] || getAutoColor(code);
}

// ===== Exported dynamic color resolver =====
export function getBadgeStyle(code) {
  if (!code) return 'bg-slate-100/80 text-slate-600 ring-slate-400/20';
  const key = code.toString().trim().toLowerCase();
  return ALL_COLORS[key] || ALL_COLORS[code.toString().trim()] || getAutoColor(code);
}

// ===== Type Badge =====
export function TypeBadge({ code, label }) {
  const display = label || code || '';
  const cls = resolveColor(TYPE_COLORS, code || label);
  return (
    <span className={`${BADGE_BASE} ${cls}`}>
      {display}
    </span>
  );
}

// ===== Product / Cat Badge =====
export function ProductBadge({ code, label, text }) {
  const c = code || text || '';
  const display = label || c;
  const cls = resolveColor(PRODUCT_COLORS, c);
  return (
    <span className={`${BADGE_BASE} ${cls}`}>
      {display}
    </span>
  );
}

// ===== Generic DynamicBadge (auto-color by hash) =====
export function DynamicBadge({ code, label, text }) {
  const c = code || text || '';
  const display = label || c;
  const cls = getBadgeStyle(c);
  return (
    <span className={`${BADGE_BASE} ${cls}`}>
      {display}
    </span>
  );
}

// ===== Stage Badge =====
export function StageBadge({ stage, label }) {
  const display = label || stage || '';
  const cls = resolveColor(STAGE_COLORS, stage);
  return (
    <span className={`${BADGE_BASE} font-semibold ${cls}`}>
      {display}
    </span>
  );
}
