'use client';

interface PatientInfo {
  code: string;
  label: string;
  subtitle: string;
  scenario: string;
  tag: string;
  tagColor: string;
  defaultQuery: string;
}

interface PatientCardProps {
  patient: PatientInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const tagIcons: Record<string, string> = {
  diabetes: '🩸',
  cardiac: '❤️',
  overlap: '⭐',
};

export function PatientCard({ patient, isSelected, onSelect }: PatientCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 transition-colors ${
        isSelected
          ? 'bg-indigo-50 border-l-4 border-indigo-500'
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{tagIcons[patient.tag] || '🏥'}</span>
        <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
          {patient.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 leading-snug ml-6">{patient.subtitle}</p>
    </button>
  );
}
