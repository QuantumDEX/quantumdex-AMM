export const shortenAddress = (value?: string | null, chars = 4) => {
  if (!value) return "";
  const prefix = value.slice(0, chars + 2);
  const suffix = value.slice(-chars);
  return `${prefix}...${suffix}`;
};

