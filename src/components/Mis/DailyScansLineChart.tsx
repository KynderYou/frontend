import { useEffect, useId, useRef, useState } from 'react';
import { colors } from '../../styles/theme';
import { MONTH_LABELS } from './misData';

const theme = colors.light;
const CHART_H = 240;
const PAD = { top: 16, right: 18, bottom: 30, left: 34 };
const LINE = '#dd127b';

type DailyScansLineChartProps = {
  year: number;
  /** Scans per day for each month (index 0 = Jan). */
  scansByDay: number[][];
  month: number;
  onMonthChange: (month: number) => void;
};

function daysIn(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function yScale(max: number) {
  const step = Math.max(1, Math.ceil(max / 4));
  return { step, top: step * 4 };
}

export function DailyScansLineChart({ year, scansByDay, month, onMonthChange }: DailyScansLineChartProps) {
  const gradientId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const lastMonth = isCurrentYear ? now.getMonth() : year > now.getFullYear() ? -1 : 11;
  const dayCount = daysIn(year, month);
  const values = Array.from({ length: dayCount }, (_, i) => scansByDay[month]?.[i] ?? 0);
  /** In the running month the line stops at today. */
  const lastDay = isCurrentYear && month === now.getMonth() ? now.getDate() : dayCount;
  const total = values.reduce((sum, v) => sum + v, 0);
  const peak = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
  const { step, top } = yScale(Math.max(...values, 0));

  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (dayCount === 1 ? plotW / 2 : (i * plotW) / (dayCount - 1));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  const shown = values.slice(0, lastDay);
  const linePath = shown.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPath = shown.length
    ? `${linePath} L${x(shown.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
    : '';
  const labelEvery = width < 560 ? 5 : width < 900 ? 2 : 1;
  const showLabel = (i: number) => i === 0 || i === dayCount - 1 || (i + 1) % labelEvery === 0;
  const slotW = plotW / Math.max(1, dayCount - 1);

  return (
    <div className="dash-card mis-chart-card mis-line-card">
      <div className="mis-chart-head">
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
            Daily scans
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-secondary'] }}>
            Scans uploaded each day in {MONTH_LABELS[month]} {year}
          </p>
        </div>
        <div className="mis-chart-head-actions">
          <span className="mis-chart-total">{total.toLocaleString('en-IN')} total</span>
          {total > 0 ? (
            <span className="mis-line-peak">
              Peak · {peak + 1} {MONTH_LABELS[month]} ({values[peak]})
            </span>
          ) : null}
          <select
            className="mis-select"
            aria-label="Month"
            value={month}
            onChange={(e) => {
              setHover(null);
              onMonthChange(Number(e.target.value));
            }}
          >
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index} disabled={index > lastMonth}>
                {label} {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={wrapRef} className="mis-line-wrap" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={CHART_H} role="img" aria-label={`Daily scans in ${MONTH_LABELS[month]} ${year}`}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE} stopOpacity="0.22" />
              <stop offset="100%" stopColor={LINE} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick * step)}
                y2={y(tick * step)}
                stroke="#eef0f3"
                strokeDasharray={tick === 0 ? undefined : '4 4'}
              />
              <text x={PAD.left - 8} y={y(tick * step) + 4} textAnchor="end" className="mis-line-axis">
                {tick * step}
              </text>
            </g>
          ))}

          {values.map((_, i) =>
            showLabel(i) ? (
              <text key={i} x={x(i)} y={CHART_H - 8} textAnchor="middle" className={`mis-line-axis${hover === i ? ' is-active' : ''}`}>
                {i + 1}
              </text>
            ) : null,
          )}

          {hover !== null ? (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="#f3c4dc" strokeDasharray="3 3" />
          ) : null}

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
          {linePath ? <path d={linePath} fill="none" stroke={LINE} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" /> : null}

          {shown.map((v, i) =>
            v > 0 || hover === i ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3.5} fill="#fff" stroke={LINE} strokeWidth={2} />
            ) : null,
          )}

          {values.map((_, i) => (
            <rect
              key={i}
              x={x(i) - slotW / 2}
              y={PAD.top}
              width={slotW}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i < lastDay ? i : null)}
            />
          ))}
        </svg>

        {hover !== null ? (
          <div
            className="mis-line-tooltip"
            style={{ left: Math.min(Math.max(x(hover), 60), width - 60), top: Math.max(y(values[hover]) - 46, 0) }}
          >
            <strong>
              {values[hover]} {values[hover] === 1 ? 'scan' : 'scans'}
            </strong>
            <span>
              {hover + 1} {MONTH_LABELS[month]} {year}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
