import { useState, useCallback } from 'react';

const INITIAL_STATE = {
  name: "",
  description: "",
  content: "",
  year_start: "",
  latitude: 0,
  longitude: 0,
  continent: "Outro"
};

export function useEventForm() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa erro do campo quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const setCoordinates = useCallback((lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude:  lng
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.year_start && formData.year_start !== 0) {
      newErrors.year_start = "Ano é obrigatório";
    }

    if (! formData.latitude && ! formData.longitude) {
      newErrors.location = "Selecione um local no mapa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(INITIAL_STATE);
    setErrors({});
  }, []);

  const getPayload = useCallback(() => ({
    ...formData,
    year_start: parseInt(formData.year_start),
    source: "manual"
  }), [formData]);

  return {
    formData,
    errors,
    updateField,
    setCoordinates,
    validate,
    reset,
    getPayload
  };
}