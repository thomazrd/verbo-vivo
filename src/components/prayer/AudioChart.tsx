
"use client";

import { Bar, BarChart, ResponsiveContainer, YAxis } from "recharts";

interface AudioChartProps {
    data: Array<{ value: number }>;
}

export default function AudioChart({ data }: AudioChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} margin={{top:10, right: 10, bottom: 10, left: 10}}>
                <YAxis domain={[0, 256]} hide />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
        </ResponsiveContainer>
    )
}
