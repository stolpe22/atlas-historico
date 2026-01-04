/**
 * Formata ano para exibição (a.C. / d.C.)
 */
export const formatYear = (year) => {
  if (year === undefined || year === null || year === "") {
    return "Data desc.";
  }
  
  const num = parseInt(year);
  if (isNaN(num)) return "Data desc.";
  
  return num < 0 ? `${Math.abs(num)} a.C.` : `${num}`;
};

/**
 * Formata data para exibição completa
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR");
};

/**
 * Trunca texto com ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (! text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};