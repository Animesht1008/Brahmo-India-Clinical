'use client';

import { useState } from 'react';
import type { SafetyAlert } from '@/lib/types';

interface SafetyAlertsProps {
  alerts: SafetyAlert[];
  safetySummary?: {
    ckd_stage?: string;
    egfr?: number;
    cha2ds2_vasc?: number;
    hyperkalemia_risk?: string;
    critical_alerts_count: number;
  };
}

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', title: 'text-red-900', text: 'text-red-800', badge: 'bg-red-100 text-red-700', icon: '🚨' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', title: 'text-orange-900', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700', icon: '⚠️' },
  moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-900', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', icon: '📋' },
  low:      { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-900', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', icon: 'ℹ️' },
};

export function SafetyAlerts({ alerts, safetySummary }: SafetyAlertsProps) {
  const [showAll, setShowAll] = useState(false);

  const criticals = alerts.filter((a) => a.severity === 'critical');
  const highs = alerts.filter((a) => a.severity === 'high');
  const rest = alerts.filter((a) => a.severity !== 'critical' && a.severity !== 'high');

  const visibleAlerts = showAll ? alerts : [...criticals, ...highs].slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${criticals.length > 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            🛡️ Safety Engine Output — {alerts.length} Alerts
          </h2>
          <div className="flex items-center gap-2 text-xs">
            {criticals.length > 0 && (
              <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                {criticals.length} CRITICAL
              </span>
            )}
            {highs.length > 0 && (
              <span className="bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                {highs.length} HIGH
              </span>
            )}
            {rest.length > 0 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {rest.length} other
              </span>
            )}
          </div>
        </div>

        {/* Clinical summary row */}
        {safetySummary && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
            {safetySummary.ckd_stage && <span>🫘 {safetySummary.ckd_stage}</span>}
            {safetySummary.egfr && <span>eGFR: <strong>{safetySummary.egfr}</strong> mL/min</span>}
            {safetySummary.cha2ds2_vasc !== undefined && (
              <span>CHA₂DS₂-VASc: <strong>{safetySummary.cha2ds2_vasc}</strong></span>
            )}
            {safetySummary.hyperkalemia_risk && safetySummary.hyperkalemia_risk !== 'low' && (
              <span className="text-orange-700 font-semibold">
                K+ Risk: {safetySummary.hyperkalemia_risk.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alert list */}
      <div className="divide-y divide-gray-100">
        {visibleAlerts.map((alert, idx) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          return (
            <div key={idx} className={`px-4 py-3 ${cfg.bg}`}>
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${cfg.title}`}>{alert.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    {alert.type && (
                      <span className="text-xs text-gray-500 capitalize">{alert.type.replace('_', ' ')}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${cfg.text}`}>{alert.detail}</p>
                  <div className={`mt-1.5 text-xs font-medium ${cfg.title} bg-white bg-opacity-60 rounded px-2 py-1`}>
                    → {alert.action}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {alerts.length > visibleAlerts.length && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Show {alerts.length - visibleAlerts.length} more alerts ↓
          </button>
        </div>
      )}
    </div>
  );
}
