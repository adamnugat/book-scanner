const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: unknown): ValidationError | null {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return { field: 'email', message: 'Valid email is required' };
  }
  return null;
}

export function validatePassword(password: unknown): ValidationError | null {
  if (typeof password !== 'string' || password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters' };
  }
  return null;
}

export function collectErrors(...results: (ValidationError | null)[]): ValidationError[] {
  return results.filter((r): r is ValidationError => r !== null);
}
