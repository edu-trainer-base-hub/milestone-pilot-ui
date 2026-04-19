export const shorten = (text: string, prefixLength: number, suffixLength: number = prefixLength): string => {
  if (!text || text.length <= prefixLength + suffixLength) return text;
  return `${text.slice(0, prefixLength)}...${text.slice(-suffixLength)}`;
};
