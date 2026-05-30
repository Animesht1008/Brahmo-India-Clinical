'use client';

import { useState } from 'react';

interface ResponseComparisonProps {
  genericResponse: string;
  optionCResponse: string;
  patientName: string;
}

function formatResponse(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h4 class="font-bold text-sm mt-3 mb-1 text-gray-900">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold text-sm mt-3 mb-1 text-gray-900">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="font-bold text-base mt-3 mb-1 text-gray-900">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-sm">• $1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-sm list-decimal">$1</li>')
    .replace(/\n{2,}/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

// Simple scoring to highlight Indian-specific content
function countIndianSignals(text: string): { score: number; signals: string[] } {
  const signals: string[] = [];
  const checks = [
    { pattern: /RSSDI/i, label: 'RSSDI guidelines cited' },
    { pattern: /CSI\b/i, label: 'CSI guidelines cited' },
    { pattern: /₹/g, label: 'Rupee prices included' },
    { pattern: /NLEM/i, label: 'NLEM status mentioned' },
    { pattern: /teneligliptin/i, label: 'Teneligliptin mentioned' },
    { pattern: /Jan Aushadhi/i, label: 'Jan Aushadhi mentioned' },
    { pattern: /Streptokinase/i, label: 'Streptokinase referenced' },
    { pattern: /ext\.\s*\d+/i, label: 'Hospital contacts included' },
    { pattern: /Apollo/i, label: 'Apollo Chennai referenced' },
    { pattern: /eGFR/i, label: 'Renal dosing addressed' },
  ];

  checks.forEach(({ pattern, label }) => {
    if (pattern.test(text)) signals.push(label);
  });

  return { score: signals.length, signals };
}

export function ResponseComparison({ genericResponse, optionCResponse, patientName }: ResponseComparisonProps) {
  const [activeTab, setActiveTab] = useState<'split' | 'generic' | 'optionc'>('split');

  const genericSignals = countIndianSignals(genericResponse);
  const optionCSignals = countIndianSignals(optionCResponse);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1">
          {(['split', 'generic', 'optionc'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'split' ? 'Side by Side' : tab === 'generic' ? 'Generic AI' : 'Option C — India'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{patientName}</p>
      </div>

      {/* Score comparison banner */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 bg-gray-50 border-b border-gray-200">
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="text-xs font-medium text-gray-500">Generic AI</div>
          <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < genericSignals.score ? 'bg-gray-400' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">{genericSignals.score}/10 India signals</span>
        </div>
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="text-xs font-semibold text-indigo-700">Option C — India</div>
          <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < optionCSignals.score ? 'bg-indigo-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-indigo-700 font-medium">{optionCSignals.score}/10 India signals</span>
        </div>
      </div>

      {/* Response content */}
      <div className={`grid ${activeTab === 'split' ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-gray-200`}>
        {/* Generic */}
        {(activeTab === 'split' || activeTab === 'generic') && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Generic AI Response</h3>
            </div>
            <div
              className="text-sm text-gray-700 leading-relaxed prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(genericResponse)}</p>` }}
            />
            {genericSignals.signals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">India signals found:</p>
                {genericSignals.signals.map((s, i) => (
                  <span key={i} className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mr-1 mb-1">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Option C */}
        {(activeTab === 'split' || activeTab === 'optionc') && (
          <div className="p-5 bg-indigo-50/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Option C — India Response</h3>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">BRAHMO Enhanced</span>
            </div>
            <div
              className="text-sm text-gray-800 leading-relaxed prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(optionCResponse)}</p>` }}
            />
            {optionCSignals.signals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-indigo-100">
                <p className="text-xs text-indigo-500 mb-1">India signals detected:</p>
                {optionCSignals.signals.map((s, i) => (
                  <span key={i} className="inline-block text-xs bg-indigo-100 text-indigo-600 rounded px-1.5 py-0.5 mr-1 mb-1">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
