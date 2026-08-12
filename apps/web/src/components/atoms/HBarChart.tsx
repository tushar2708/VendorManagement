import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HBarChartProps {
  readonly data: Array<{ name: string; value: number }>;
  readonly color?: string;
  readonly className?: string;
}

export function HBarChart({ data, color = '#4f46e5', className }: HBarChartProps): React.ReactElement {
  return (
    <div className={className} style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
          <Tooltip />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
