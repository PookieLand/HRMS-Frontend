"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttendanceDashboard } from "@/lib/api/dashboard";

interface AttendanceChartProps {
  data: AttendanceDashboard | null;
  isLoading: boolean;
}

const chartConfig = {
  present: {
    label: "Present",
    color: "hsl(142, 76%, 36%)", // green
  },
  late: {
    label: "Late",
    color: "hsl(38, 92%, 50%)", // orange
  },
  absent: {
    label: "Absent",
    color: "hsl(0, 84%, 60%)", // red
  },
  notCheckedIn: {
    label: "Not Checked In",
    color: "hsl(215, 16%, 47%)", // gray
  },
} satisfies ChartConfig;

export function AttendanceChart({ data, isLoading }: AttendanceChartProps) {
  if (isLoading) {
    return <AttendanceChartSkeleton />;
  }

  const chartData = [
    {
      name: "Present",
      value: data?.present ?? 0,
      fill: chartConfig.present.color,
    },
    {
      name: "Late",
      value: data?.late ?? 0,
      fill: chartConfig.late.color,
    },
    {
      name: "Absent",
      value: data?.absent ?? 0,
      fill: chartConfig.absent.color,
    },
    {
      name: "Not Checked In",
      value: data?.not_checked_in ?? 0,
      fill: chartConfig.notCheckedIn.color,
    },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const presentPercentage =
    total > 0 ? Math.round(((data?.present ?? 0) / total) * 100) : 0;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
        <CardDescription>
          Today's attendance breakdown •{" "}
          {data?.date ?? new Date().toISOString().split("T")[0]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 @lg/card:grid-cols-2 gap-6">
          {/* Chart */}
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Stats Summary */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatItem
                label="Total Employees"
                value={data?.total_employees ?? 0}
                color="hsl(var(--foreground))"
              />
              <StatItem
                label="Checked In"
                value={data?.checked_in ?? 0}
                color="hsl(var(--primary))"
              />
              <StatItem
                label="Present Rate"
                value={`${presentPercentage}%`}
                color={chartConfig.present.color}
              />
              <StatItem
                label="Pending"
                value={data?.pending ?? 0}
                color="hsl(var(--muted-foreground))"
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-2 border-t">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  label: string;
  value: number | string;
  color: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function AttendanceChartSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 @lg/card:grid-cols-2 gap-6">
          <div className="h-[200px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2 border-t">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
