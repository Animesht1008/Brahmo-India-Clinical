'use client';

interface GuidelineSourcesProps {
  sources: string[];
}

const SOURCE_COLORS: Record<string, string> = {
  RSSDI: 'bg-blue-100 text-blue-700',
  CSI: 'bg-red-100 text-red-700',
  IHRS: 'bg-purple-100 text-purple-700',
  MoHFW_STG: 'bg-green-100 text-green-700',
  ICMR: 'bg-teal-100 text-teal-700',
  ISN: 'bg-orange-100 text-orange-700',
};

export function GuidelineSources({ sources }: GuidelineSourcesProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-500">Sources:</span>
      {sources.map((source, i) => {
        const key = source.split(' ')[0];
        const color = SOURCE_COLORS[key] || 'bg-gray-100 text-gray-600';
        return (
          <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
            {source}
          </span>
        );
      })}
    </div>
  );
}
