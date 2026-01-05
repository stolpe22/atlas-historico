import { useState, useCallback } from 'react';
import { translateText } from '../services/translate';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useTranslations(targetLang = 'pt') {
  const [cache, setCache] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const translateEvent = useCallback(
    async (evt) => {
      if (!evt?.id) return evt;
      if (cache[evt.id]) return { ...evt, ...cache[evt.id], _translated: true };

      const [namePt, descPt, contentPt] = await Promise.all([
        translateText(evt.name, 'en', targetLang),
        translateText(evt.description, 'en', targetLang),
        translateText(evt.content, 'en', targetLang),
      ]);

      const tr = {
        name: namePt || evt.name,
        description: descPt || evt.description,
        content: contentPt || evt.content,
      };
      setCache((prev) => ({ ...prev, [evt.id]: tr }));
      return { ...evt, ...tr, _translated: true };
    },
    [cache, targetLang]
  );

  const translateList = useCallback(
    async (events = [], { maxItems = 200, chunkSize = 25, delayMs = 80 } = {}) => {
      setIsTranslating(true);
      try {
        const limited = events.slice(0, maxItems);
        const out = [];
        for (let i = 0; i < limited.length; i += chunkSize) {
          const chunk = limited.slice(i, i + chunkSize);
          const translatedChunk = [];
          for (const e of chunk) {
            translatedChunk.push(await translateEvent(e));
          }
          out.push(...translatedChunk);
          if (delayMs) await sleep(delayMs);
        }
        return out;
      } finally {
        setIsTranslating(false);
      }
    },
    [translateEvent]
  );

  return { translateEvent, translateList, isTranslating };
}