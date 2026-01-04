import React from 'react';
import { Database, Globe, User } from 'lucide-react';

const SOURCE_CONFIG = {
  manual: {
    icon: User,
    label: "Manual",
    className: "bg-green-100 text-green-700 border-green-200"
  },
  seed: {
    icon: Database,
    label: "Fixo",
    className: "bg-purple-100 text-purple-700 border-purple-200"
  },
  wikidata: {
    icon: Globe,
    label:  "Wiki",
    className:  "bg-blue-100 text-blue-700 border-blue-200"
  }
};

const SourceBadge = ({ source }) => {
  const config = SOURCE_CONFIG[source];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span 
      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${config.className}`}
      title={`Origem: ${config.label}`}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
};

export default SourceBadge;