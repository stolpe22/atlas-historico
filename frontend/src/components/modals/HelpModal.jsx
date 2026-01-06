import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { settingsApi } from '../../services/api';

const HelpModal = ({ slug, isOpen, onClose }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isOpen && slug) {
      settingsApi.getTutorial(slug).then(res => setContent(res.data.content));
    }
  }, [isOpen, slug]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/70 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 rounded-2xl">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold">
          Fechar
        </button>
      </div>
    </div>
  );
};

export default HelpModal;