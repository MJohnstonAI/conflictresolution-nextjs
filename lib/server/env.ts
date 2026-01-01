export const cleanEnvValue = (value?: string | null): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/\s+#.*$/, "").trim();
  return cleaned ? cleaned : null;
};
