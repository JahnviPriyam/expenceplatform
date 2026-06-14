import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Layers, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown,
  DollarSign, Calendar, Tag, TrendingUp
} from 'lucide-react';
import type { Expense } from '../types';
import { useExpenses } from '../hooks/useData';

type SortKey = 'date' | 'amount' | 'payer' | 'category';
type SortDir = 'asc' | 'desc';

const CATEGORY_COLORS: Record<string, string> = {
  Travel:        '#ff4fd8',
  Software:      '#b84dff',
  Marketing:     '#00aaff',
  'Office Supplies': '#00ff88',
  Hardware:      '#ff8c00',
  Meals:         '#ff6ec7',
  Other:         '#64748b',
};

function colorFor(cat: string) {
  return CATEGORY_COLORS[cat] ?? '#64748b';
}

export default function Expenses() {
  const { expenses, loading } = useExpenses();

  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [sortKey, setSortKey]     = useState<SortKey>('date');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');

  // Derived category list
  const categories = useMemo(() => {
    const cats = Array.from(new Set((expenses ?? []).map((e) => e.category).filter(Boolean)));
    return ['All', ...cats];
  }, [expenses]);

  // Filtered + sorted data
  const filtered = useMemo(() => {
    let data = [...(expenses ?? [])];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.payer?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }
    if (catFilter !== 'All') data = data.filter((e) => e.category === catFilter);
    data.sort((a, b) => {
      let av: any = a[sortKey as keyof Expense];
      let bv: any = b[sortKey as keyof Expense];
      if (sortKey === 'amount') { av = parseFloat(av ?? 0); bv = parseFloat(bv ?? 0); }
      if (sortKey === 'date')   { av = new Date(av); bv = new Date(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [expenses, search, catFilter, sortKey, sortDir]);

  const totalAmount = useMemo(
    () => (expenses ?? []).reduce((s, e) => s + parseFloat(e.amount ?? 0), 0),
    [expenses]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} style={{ color: '#ff4fd8' }} /> : <ChevronDown size={12} style={{ color: '#ff4fd8' }} />;
  }

  const statCards = [
    { icon: DollarSign, label: 'Total Spend',    value: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#ff4fd8' },
    { icon: Layers,     label: 'Total Records',  value: (expenses?.length ?? 0).toString(), color: '#b84dff' },
    { icon: Tag,        label: 'Categories',     value: (categories.length - 1).toString(), color: '#00aaff' },
    { icon: TrendingUp, label: 'Avg per Record', value: expenses?.length ? `$${(totalAmount / expenses.length).toFixed(2)}` : '$0', color: '#00ff88' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(255,79,216,0.1)', border: '1px solid rgba(255,79,216,0.2)' }}>
            <Layers size={20} style={{ color: '#ff4fd8' }} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
            EXPENSES
          </h1>
        </div>
        <p className="text-sm text-[#475569] ml-14">Browse, filter and sort all expense records</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <span className="text-xs text-[#475569]">{label}</span>
            </div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            placeholder="Search vendor, category, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#475569] outline-none focus:ring-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              '--tw-ring-color': '#ff4fd8',
            } as React.CSSProperties}
          />
        </div>
        {/* Category filter */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: '#0a0b1a' }}>{c}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
              <Layers size={28} style={{ color: '#ff4fd8' }} />
            </motion.div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { key: 'date',        label: 'Date' },
                    { key: 'payer',    label: 'Payer' },
                    { key: 'amount',      label: 'Amount' },
                    { key: 'category',    label: 'Category' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key as SortKey)}
                      className="text-left px-4 py-3 text-xs font-medium text-[#475569] cursor-pointer hover:text-white transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {label}
                        <SortIcon col={key as SortKey} />
                      </div>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#475569]">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#475569]">Currency</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[#475569]">
                      No expenses found. Import a CSV to get started.
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp, i) => {
                    const amt = parseFloat(exp.amount ?? 0);
                    const catColor = colorFor(exp.category);
                    return (
                      <motion.tr
                        key={exp.id ?? i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="border-t border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      >
                        <td className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-[#475569]" />
                            {exp.date ? new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{exp.payer || '—'}</td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: amt > 5000 ? '#ff3d3d' : '#00ff88' }}>
                          ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}
                          >
                            {exp.category || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#64748b] max-w-[200px] truncate">{exp.description || '—'}</td>
                        <td className="px-4 py-3 text-xs text-[#475569]">{exp.currency || 'USD'}</td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.04)] text-xs text-[#475569]">
            Showing <span className="text-white font-medium">{filtered.length}</span> of {expenses?.length ?? 0} records
          </div>
        )}
      </motion.div>
    </div>
  );
}
