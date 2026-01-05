import axios from 'axios';

const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL || 'http://localhost:5000';

export async function translateText(text, source = 'en', target = 'pt') {
  if (!text) return '';
  const { data } = await axios.post(
    `${TRANSLATE_URL}/translate`,
    { q: text, source, target, format: 'text' },
    { timeout: 15000 }
  );
  return data.translatedText;
}