export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isNonEmpty(text?: string | null): boolean {
  return text != null && text.trim().length > 0;
}
