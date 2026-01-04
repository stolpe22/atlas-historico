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
 * Formata intervalo de anos (ex: "1939 - 1945")
 */
export const formatYearRange = (start, end) => {
  const startStr = formatYear(start);
  
  // Se não tem fim, ou se o fim é igual ao início, mostra só o início
  if (end === undefined || end === null || end === "" || end === start) {
    return startStr;
  }

  const endStr = formatYear(end);
  return `${startStr} - ${endStr}`;
};

/**
 * Trunca texto com ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (! text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};