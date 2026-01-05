import React from 'react';
import { User, Database } from 'lucide-react';

const SourceBadge = ({ source }) => {
  if (!source) return null;

  const isManual = source === 'manual';
  const label = source.charAt(0).toUpperCase() + source.slice(1);

  const Icon = isManual ? User : Database;
  const className = isManual
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <span
      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${className}`}
      title={`Origem: ${label}`}
    >
      <Icon size={10} />
      {label}
    </span>
  );
};

export default SourceBadge;