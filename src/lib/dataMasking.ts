// Data masking utilities for free tier users

export const maskPhone = (phone: string | null): string | null => {
  if (!phone) return null;
  return '(***) ***-****';
};

export const maskEmail = (email: string | null): string | null => {
  if (!email) return null;
  return '***@***.com';
};

export const maskWebsite = (website: string | null): string | null => {
  if (!website) return null;
  return 'https://***.***/***';
};

export const isMaskedPhone = (phone: string | null): boolean => {
  return phone === '(***) ***-****';
};

export const isMaskedWebsite = (website: string | null): boolean => {
  return website === 'https://***.***/***';
};
