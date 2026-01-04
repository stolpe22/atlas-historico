import { useState, useEffect, useCallback } from 'react';
import { eventsApi } from '../services/api';

export function useEvents(dateRange, selectedContinent) {
  const [allEvents, setAllEvents] = useState([]);
  const [mapEvents, setMapEvents] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [allResponse, filteredResponse] = await Promise.all([
        eventsApi.getAll(),
        eventsApi.getFiltered(dateRange[0], dateRange[1], selectedContinent)
      ]);

      setAllEvents(allResponse.data);
      setMapEvents(filteredResponse.data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedContinent]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData) => {
    try {
      await eventsApi.create(eventData);
      await fetchEvents();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await eventsApi.delete(eventId);
      setAllEvents(prev => prev.filter(e => e.id !== eventId));
      setMapEvents(prev => {
        if (! prev) return null;
        return {
          ...prev,
          features: prev.features.filter(f => f.properties.id !== eventId)
        };
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const filterEvents = useCallback((searchTerm) => {
    return allEvents.filter(e => {
      const matchesContinent = selectedContinent === "Todos" || e.continent === selectedContinent;
      const matchesDate = e.year_start >= dateRange[0] && e.year_start <= dateRange[1];
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesContinent && matchesDate && matchesSearch;
    });
  }, [allEvents, dateRange, selectedContinent]);

  return {
    allEvents,
    mapEvents,
    isLoading,
    error,
    refresh: fetchEvents,
    createEvent,
    deleteEvent,
    filterEvents
  };
}