'use client';

import { useState, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, Award, Edit2 } from 'lucide-react';
import { CriteriaWeight } from '../molecules/CriteriaWeight.js';
import { ScoreBar } from '../atoms/ScoreBar.js';
import { useHoverScale } from '../../hooks/use-hover-scale.js';
import { useGridReveal } from '../../hooks/use-grid-reveal.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';
import { cn } from '../ui.js';

interface AwardThreePaneProps {
  requestId: string;
  candidates: Array<{
    id: string;
    vendorId: string;
    legalName: string | null;
    prequalScore: number | null;
    quotation: {
      unitPrice: number;
      toolingPerUnit: number;
      freightPerUnit: number;
      landedCost: number;
      leadTimeDays: number;
    } | null;
    scores: {
      quality: number | null;
      cost: number | null;
      delivery: number | null;
      risk: number | null;
    } | null;
  }>;
  criteria: Array<{ id: string; name: string; weight: number }>;
  onAward: (vendorId: string, keepOthersWarm: boolean) => void;
  onQuoteEdit: (vendorId: string) => void;
}

const DEFAULT_WEIGHTS = {
  Quality: 45,
  Cost: 30,
  Delivery: 15,
  Risk: 10,
};

const CRITERION_LABELS = {
  quality: 'Quality & Certifications',
  cost: 'Commercials & Cost',
  delivery: 'Delivery & Logistics',
  risk: 'Compliance & Financial Risk',
};

const CRITERION_COLORS = {
  quality: 'bg-green-500',
  cost: 'bg-yellow-500',
  delivery: 'bg-blue-600',
  risk: 'bg-slate-500',
};

function calculateWeightedScore(
  scores: {
    quality: number | null;
    cost: number | null;
    delivery: number | null;
    risk: number | null;
  } | null,
  weights: Record<string, number>
): number {
  if (!scores) return 0;

  const scoredKeys = Object.keys(scores).filter(
    (key) => scores[key as keyof typeof scores] !== null
  );

  if (scoredKeys.length === 0) return 0;

  const totalWeight = scoredKeys.reduce((sum, key) => sum + weights[key] || 0, 0);
  if (totalWeight === 0) {
    const sum = scoredKeys.reduce((sum, key) => sum + (scores[key as keyof typeof scores] || 0), 0);
    return Math.round(sum / scoredKeys.length);
  }

  const value = scoredKeys.reduce(
    (sum, key) => sum + (scores[key as keyof typeof scores] || 0) * (weights[key] || 0),
    0
  );
  return Math.round(value / totalWeight);
}

export function AwardThreePane({
  requestId,
  candidates,
  criteria,
  onAward,
  onQuoteEdit,
}: AwardThreePaneProps): React.ReactElement {
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'score' | 'price' | 'lead'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const headingRef = useTextReveal<HTMLHeadingElement>();
  const { ref: gridRef, relayout } = useGridReveal<HTMLTableSectionElement>();
  const hoverRef = useHoverScale<HTMLDivElement>();

  const handleWeightChange = (criterion: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [criterion]: value,
    }));
  };

  const sortedCandidates = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortColumn === 'score') {
        aVal = calculateWeightedScore(a.scores, weights);
        bVal = calculateWeightedScore(b.scores, weights);
      } else if (sortColumn === 'price') {
        aVal = a.quotation?.landedCost ?? Infinity;
        bVal = b.quotation?.landedCost ?? Infinity;
      } else {
        aVal = a.quotation?.leadTimeDays ?? Infinity;
        bVal = b.quotation?.leadTimeDays ?? Infinity;
      }

      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return sorted;
  }, [candidates, weights, sortColumn, sortDirection]);

  const selectedCandidate = selectedCandidateId
    ? sortedCandidates.find((c) => c.id === selectedCandidateId)
    : null;

  const handleSort = (column: 'score' | 'price' | 'lead') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    relayout();
  };

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const isValidWeights = totalWeight === 100;

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header section */}
        <div className="mb-8">
          <h1
            ref={headingRef}
            className="text-3xl font-bold tracking-tight text-slate-900 mb-2"
          >
            Score, Clear & Award
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Set your evaluation criteria weights, review vendor scores, and confirm your sourcing
            decision. All off-platform negotiations complete.
          </p>
        </div>

        {/* Three-pane layout */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
          {/* Left pane: Criteria weights */}
          <div className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Evaluation Weights</h2>
            <p className="text-xs text-slate-500 mb-6">Adjust how each criterion impacts scoring.</p>

            <div className="space-y-6">
              {Object.entries(DEFAULT_WEIGHTS).map(([criterion, defaultValue]) => (
                <CriteriaWeight
                  key={criterion}
                  name={criterion}
                  weight={weights[criterion] || defaultValue}
                  onChange={(value) => handleWeightChange(criterion, value)}
                />
              ))}

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-600">Total Weight</span>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      isValidWeights ? 'text-slate-900' : 'text-amber-600'
                    )}
                  >
                    {totalWeight}%
                  </span>
                </div>
                {!isValidWeights && (
                  <p className="text-xs text-amber-600 mt-2">
                    Must equal 100% to enable awards.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center and right pane wrapper for hover scale */}
          <div ref={hoverRef} className="grid gap-6 lg:grid-cols-[1fr_auto] lg:col-span-2">
            {/* Center pane: Candidate table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">
                  Cleared Candidates ({candidates.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ranked by your current criteria weights.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-slate-700 text-xs uppercase tracking-wider">
                        Vendor
                      </th>
                      <th
                        className="px-6 py-3 text-right font-medium text-slate-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('score')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Score
                          {sortColumn === 'score' && (
                            sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right font-medium text-slate-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Landed Cost
                          {sortColumn === 'price' && (
                            sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right font-medium text-slate-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('lead')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Lead Time
                          {sortColumn === 'lead' && (
                            sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-slate-700 text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody ref={gridRef} className="divide-y divide-slate-200">
                    {sortedCandidates.map((candidate) => {
                      const score = calculateWeightedScore(candidate.scores, weights);
                      const isSelected = selectedCandidateId === candidate.id;

                      return (
                        <tr
                          key={candidate.id}
                          onClick={() => setSelectedCandidateId(candidate.id)}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-slate-50',
                            isSelected && 'bg-indigo-50 border-l-4 border-l-indigo-600'
                          )}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {candidate.legalName || `Vendor ${candidate.vendorId}`}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums">
                            <span className="text-base font-semibold text-slate-900">{score}</span>
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-slate-700">
                            {candidate.quotation ? formatCurrency(candidate.quotation.landedCost) : '—'}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-slate-700">
                            {candidate.quotation ? `${candidate.quotation.leadTimeDays}d` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuoteEdit(candidate.vendorId);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                              Quote
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right pane: Deep-dive */}
            <div className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm w-full lg:w-80">
              {selectedCandidate ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {selectedCandidate.legalName || `Vendor ${selectedCandidate.vendorId}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Deep-dive analysis</p>
                  </div>

                  {/* Commercial breakdown */}
                  {selectedCandidate.quotation && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                        Commercial Breakdown
                      </p>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Unit Price</dt>
                          <dd className="font-medium text-slate-900">
                            {formatCurrency(selectedCandidate.quotation.unitPrice)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Tooling / Unit</dt>
                          <dd className="font-medium text-slate-900">
                            {formatCurrency(selectedCandidate.quotation.toolingPerUnit)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Freight / Unit</dt>
                          <dd className="font-medium text-slate-900">
                            {formatCurrency(selectedCandidate.quotation.freightPerUnit)}
                          </dd>
                        </div>
                        <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                          <dt className="font-medium text-slate-900">Landed Cost</dt>
                          <dd className="font-semibold text-slate-900">
                            {formatCurrency(selectedCandidate.quotation.landedCost)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Scoring breakdown */}
                  {selectedCandidate.scores && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                        Score Breakdown
                      </p>
                      <div className="space-y-3">
                        {Object.entries(selectedCandidate.scores).map(
                          ([key, value]) =>
                            value !== null && (
                              <ScoreBar
                                key={key}
                                label={
                                  CRITERION_LABELS[key as keyof typeof CRITERION_LABELS] || key
                                }
                                value={value}
                                color={
                                  CRITERION_COLORS[key as keyof typeof CRITERION_COLORS] ||
                                  'bg-slate-500'
                                }
                              />
                            )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Award action */}
                  <button
                    disabled={!isValidWeights}
                    onClick={() => onAward(selectedCandidate.vendorId, false)}
                    className={cn(
                      'w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2',
                      isValidWeights
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    <Award size={16} />
                    Award Vendor
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Award size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No vendor selected</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a vendor from the table to view details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AwardThreePane;
