"use no memo";
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/design";

type ChartPalette = {
  tooltipBg: string;
  tooltipFg: string;
  axisTick: string;
  legendFg: string;
  grid: string;
  pieStroke: string;
};

function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return dark
    ? {
        tooltipBg: "rgba(240, 240, 245, 0.96)",
        tooltipFg: "#1c1c1e",
        axisTick: "#a5a8b5",
        legendFg: "#b5b8c5",
        grid: "rgba(255, 255, 255, 0.12)",
        pieStroke: "#3a3a3a",
      }
    : {
        tooltipBg: "rgba(28, 28, 30, 0.95)",
        tooltipFg: "#ffffff",
        axisTick: "#8e91a0",
        legendFg: "#555a6a",
        grid: "rgba(224, 226, 232, 0.6)",
        pieStroke: "#ffffff",
      };
}

const VIEW_NAME = "analytics:dashboard:default";
type WidgetKey = "trend" | "status" | "outcome" | "forms";

interface SavedView {
  hidden: WidgetKey[];
}

interface Bucket {
  name: string;
  value: number;
}

interface TrendPoint {
  day: string;
  submitted: number;
  closed: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#cbd5e1",
  SUBMITTED: "#60a5fa",
  IN_REVIEW: "#a78bfa",
  IN_PROGRESS: "#fbbf24",
  PENDING_REVIEW: "#fb923c",
  ON_HOLD: "#f87171",
  CLOSED: "#34d399",
  CANCELLED: "#94a3b8",
};

const OUTCOME_COLORS: Record<string, string> = {
  SUCCESSFUL: "#34d399",
  SUCCESSFUL_WITH_ISSUES: "#facc15",
  UNSUCCESSFUL: "#fb7185",
  WITHDRAWN: "#94a3b8",
  REJECTED: "#fb923c",
  SUPERSEDED: "#a78bfa",
  ABANDONED: "#cbd5e1",
  EXPIRED: "#9ca3af",
};

export function AnalyticsCharts({
  statusData,
  outcomeData,
  formData,
  trendData,
}: {
  statusData: Bucket[];
  outcomeData: Bucket[];
  formData: Bucket[];
  trendData: TrendPoint[];
}) {
  const [hidden, setHidden] = useState<WidgetKey[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/workflow/saved-filters")
      .then((r) => r.json())
      .then(
        (data: {
          filters?: Array<{ name: string; filterJson: SavedView }>;
        }) => {
          const view = data.filters?.find((f) => f.name === VIEW_NAME);
          if (view?.filterJson?.hidden) setHidden(view.filterJson.hidden);
        },
      )
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = (key: WidgetKey) => {
    const next = hidden.includes(key)
      ? hidden.filter((k) => k !== key)
      : [...hidden, key];
    setHidden(next);
    fetch("/api/workflow/saved-filters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: VIEW_NAME, filter: { hidden: next } }),
    }).catch(() => {});
  };

  const visible = (k: WidgetKey) => !hidden.includes(k);

  return (
    <>
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <span className="text-caption text-stone">Show:</span>
        {(
          [
            ["trend", "Trend"],
            ["status", "Status"],
            ["outcome", "Outcome"],
            ["forms", "Top forms"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="text-body-sm text-charcoal inline-flex cursor-pointer items-center gap-2"
          >
            <input
              type="checkbox"
              checked={visible(key)}
              onChange={() => toggle(key)}
              disabled={!loaded}
              className="custom-checkbox"
            />
            {label}
          </label>
        ))}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible("trend") ? <TrendCard data={trendData} /> : null}
        {visible("status") ? <StatusCard data={statusData} /> : null}
        {visible("outcome") ? <OutcomeCard data={outcomeData} /> : null}
        {visible("forms") ? <FormsCard data={formData} /> : null}
      </div>
    </>
  );
}

function TrendCard({ data }: { data: TrendPoint[] }) {
  const palette = useChartPalette();
  const tickStyle = { fill: palette.axisTick, fontSize: 10 };
  const gridStroke = palette.grid;
  return (
    <Card>
      <h3 className="text-body-md-medium text-ink">Requests over time</h3>
      <p className="text-caption text-stone mb-3">
        Daily submissions vs. closures
      </p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="submittedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="day"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.tooltipBg,
                border: 0,
                borderRadius: 8,
                color: palette.tooltipFg,
                fontSize: 12,
              }}
              labelStyle={{ color: palette.tooltipFg }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: palette.legendFg }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="submitted"
              name="Submitted"
              stroke="#fbbf24"
              strokeWidth={2.5}
              fill="url(#submittedFill)"
            />
            <Line
              type="monotone"
              dataKey="closed"
              name="Closed"
              stroke="#34d399"
              strokeWidth={2.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function StatusCard({ data }: { data: Bucket[] }) {
  const palette = useChartPalette();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card>
      <h3 className="text-body-md-medium text-ink">By status</h3>
      <p className="text-caption text-stone mb-3">
        All-time · {total} request{total === 1 ? "" : "s"}
      </p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value);
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return [`${v} (${pct}%)`, String(name)];
              }}
              contentStyle={{
                backgroundColor: palette.tooltipBg,
                border: 0,
                borderRadius: 8,
                color: palette.tooltipFg,
                fontSize: 12,
              }}
              labelStyle={{ color: palette.tooltipFg }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 11, color: palette.legendFg }}
              iconType="circle"
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="56%"
              outerRadius="90%"
              paddingAngle={2}
              stroke={palette.pieStroke}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] ?? "#cbd5e1"}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function OutcomeCard({ data }: { data: Bucket[] }) {
  const palette = useChartPalette();
  const tickStyle = { fill: palette.axisTick, fontSize: 10 };
  const gridStroke = palette.grid;
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-body-md-medium text-ink">By outcome</h3>
        <p className="text-caption text-stone mb-3">Terminal requests only</p>
        <div className="text-body-sm text-stone flex h-60 items-center justify-center">
          No terminal requests yet.
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <h3 className="text-body-md-medium text-ink">By outcome</h3>
      <p className="text-caption text-stone mb-3">Terminal requests only</p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
          >
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="name"
              tick={tickStyle}
              angle={-30}
              textAnchor="end"
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.tooltipBg,
                border: 0,
                borderRadius: 8,
                color: palette.tooltipFg,
                fontSize: 12,
              }}
              labelStyle={{ color: palette.tooltipFg }}
            />
            <Bar dataKey="value" name="Requests" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={OUTCOME_COLORS[entry.name] ?? "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function FormsCard({ data }: { data: Bucket[] }) {
  const palette = useChartPalette();
  const tickStyle = { fill: palette.axisTick, fontSize: 10 };
  const gridStroke = palette.grid;
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-body-md-medium text-ink">Top forms (30 days)</h3>
        <p className="text-caption text-stone mb-3">By submission count</p>
        <div className="text-body-sm text-stone flex h-60 items-center justify-center">
          No submissions in the last 30 days.
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <h3 className="text-body-md-medium text-ink">Top forms (30 days)</h3>
      <p className="text-caption text-stone mb-3">By submission count</p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke={gridStroke} horizontal={false} />
            <XAxis
              type="number"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: palette.legendFg, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.tooltipBg,
                border: 0,
                borderRadius: 8,
                color: palette.tooltipFg,
                fontSize: 12,
              }}
              labelStyle={{ color: palette.tooltipFg }}
            />
            <Bar
              dataKey="value"
              name="Submissions"
              fill="#fbbf24"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
