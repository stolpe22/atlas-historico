import React, { useState } from 'react';
import { Key, X } from 'lucide-react';

const DynamicIntegrationModal = ({ isOpen, onClose, integration, onSave, addToast }) => {
  const [formData, setFormData] = useState({});

  if (!isOpen || !integration) return null;

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const missing = integration.form_schema.filter(f => f.required && !formData[f.key]);
    if (missing.length > 0) {
      addToast({
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: `Preencha o campo: ${missing[0].label}`
      });
      return;
    }
    onSave(integration.id, formData);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4 text-slate-800 dark:text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key className="text-blue-500" size={20} /> 
            Conectar {integration.name}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          {integration.form_schema.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input 
                type={field.type === 'password' ? 'password' : 'text'}
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder={field.placeholder || ''}
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}

          <button 
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold mt-2 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
          >
            Salvar Conexão
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicIntegrationModal;