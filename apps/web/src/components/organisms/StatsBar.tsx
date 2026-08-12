import { StatCard } from '../molecules/StatCard.js';

interface Stats {
  readonly active: number;
  readonly waitingOnYou: number;
  readonly completed: number;
  readonly vendorsOnboarded: number;
  readonly openLongestDays: number;
}

interface StatsBarProps {
  readonly stats: Stats;
}

export function StatsBar({ stats }: StatsBarProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Active requests" value={stats.active} />
      <StatCard label="Waiting on you" value={stats.waitingOnYou} />
      <StatCard label="Completed" value={stats.completed} />
      <StatCard label="Vendors onboarded" value={stats.vendorsOnboarded} />
      <StatCard label="Open longest" value={stats.openLongestDays > 0 ? `${stats.openLongestDays}d` : '—'} />
    </div>
  );
}
