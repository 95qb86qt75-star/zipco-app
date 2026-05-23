import type { LucideIcon } from 'lucide-react';

type EmptyRequestsStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass?: string;
  bgClass?: string;
};

export default function EmptyRequestsState({
  icon: Icon,
  title,
  description,
  colorClass = 'text-gray-400',
  bgClass = 'bg-gray-100'
}: EmptyRequestsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className={`w-20 h-20 ${bgClass} rounded-full flex items-center justify-center mb-4`}>
        <Icon className={`w-10 h-10 ${colorClass}`} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center">{description}</p>
    </div>
  );
}
