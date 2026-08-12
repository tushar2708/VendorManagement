import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DonutChartProps {
  readonly data: Array<{ name: string; value: number; color: string }>;
  readonly innerRadius?: number;
  readonly outerRadius?: number;
  readonly className?: string;
}

export function DonutChart({ data, innerRadius = 50, outerRadius = 80, className }: DonutChartProps): React.ReactElement {
  return (
    <div className={className} style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} dataKey="value" paddingAngle={2}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(value: number) => [value, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
