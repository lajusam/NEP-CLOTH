import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice } from '../../lib/api';
import { AdminAlert, AdminEmptyState } from './ui/AdminFeedback';

function compactRupees(value) {
  if (value >= 10000000) return `NPR ${(value / 10000000).toFixed(value % 10000000 ? 1 : 0)}Cr`;
  if (value >= 100000) return `NPR ${(value / 100000).toFixed(value % 100000 ? 1 : 0)}L`;
  if (value >= 1000) return `NPR ${(value / 1000).toFixed(value % 1000 ? 1 : 0)}K`;
  return `NPR ${Math.round(value)}`;
}

function SalesTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="admin-chart-tooltip"><strong>{point.date || point.day}</strong><span>{formatPrice(Number(point.sales) || 0)}</span><small>{Number.isFinite(point.orderCount) ? `${point.orderCount} delivered orders` : 'Order count unavailable from API'}</small></div>;
}

export default function SalesChart({ data7d, data30d }) {
  const [range, setRange] = useState('7D');
  const data = range === '7D' ? data7d : data30d;
  const chartData = useMemo(() => Array.isArray(data) ? data.map((point) => ({ ...point, rupees: (Number(point.sales) || 0) / 100 })) : [], [data]);
  const totalPaisa = chartData.reduce((total, point) => total + (Number(point.sales) || 0), 0);
  const periodOrderCount = chartData.every((point) => Number.isFinite(point.orderCount))
    ? chartData.reduce((total, point) => total + point.orderCount, 0)
    : null;
  const latestDate = new Date().toISOString().slice(0, 10);
  const hasRevenue = chartData.some((point) => point.rupees > 0);

  return <section className="admin-card admin-sales-card" aria-labelledby="sales-chart-heading">
    <header className="admin-chart-header">
      <div><span className="admin-eyebrow">Revenue</span><h2 id="sales-chart-heading">Sales overview</h2><p className="admin-chart-description">Period total: <strong>{formatPrice(totalPaisa)}</strong><span className="admin-chart-separator">·</span>Orders: <strong>{periodOrderCount === null ? 'Unavailable' : periodOrderCount}</strong></p></div>
      <div className="admin-segmented" role="group" aria-label="Sales period">
        {['7D', '30D'].map((option) => <button key={option} type="button" aria-pressed={range === option} onClick={() => setRange(option)}>{option === '7D' ? '7 days' : '30 days'}</button>)}
      </div>
    </header>
    <div className="admin-chart-note"><AdminAlert tone="warning">The current API series includes non-cancelled orders, not delivered-only totals. Daily order counts are not returned.</AdminAlert></div>
    {!hasRevenue ? <AdminEmptyState title={`No revenue in the last ${range === '7D' ? '7' : '30'} days`} description="There are no sales recorded in this period." /> : <div className="admin-chart-content">
      <div className="admin-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--admin-border)" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-muted)', fontSize: 12 }} interval={range === '30D' ? 3 : 0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-muted)', fontSize: 12 }} tickFormatter={compactRupees} width={76} />
            <Tooltip content={<SalesTooltip />} cursor={{ fill: 'var(--admin-neutral-bg)' }} />
            <Bar dataKey="rupees" radius={[4, 4, 0, 0]} maxBarSize={range === '7D' ? 46 : 24} minPointSize={2}>
              {chartData.map((point, index) => <Cell key={`${point.date || point.day}-${index}`} fill={point.date === latestDate ? 'var(--admin-primary)' : 'var(--admin-bar-muted)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="admin-chart-footnote">Daily zero-sales dates display as a small baseline mark. Currency values are converted from paisa to NPR.</p>
    </div>}
  </section>;
}
