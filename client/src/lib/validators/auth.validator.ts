// ============================================================
// auth.validator.ts — Validaciones del cliente (Next.js)
// Mismas reglas que el servidor para UX en tiempo real
// ============================================================

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gender: string;
  country: string;
}

export interface LoginForm {
  identifier: string;
  password: string;
}

export interface FieldErrors {
  firstName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

const FORBIDDEN_CHARS = /[><=$\/]/;
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9 ]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateRegisterField(field: keyof RegisterForm, value: string, form?: Partial<RegisterForm>): string | undefined {
  if (FORBIDDEN_CHARS.test(value)) {
    return 'Contiene caracteres prohibidos (> < = $ /)';
  }

  switch (field) {
    case 'firstName':
      if (!value.trim()) return 'El nombre es obligatorio';
      if (!NAME_REGEX.test(value.trim())) return 'Solo letras, números y espacios';
      break;

    case 'lastName':
      if (!value.trim()) return 'El apellido es obligatorio';
      if (!NAME_REGEX.test(value.trim())) return 'Solo letras, números y espacios';
      break;

    case 'birthDate':
      if (!value) return 'La fecha de nacimiento es obligatoria';
      break;

    case 'gender':
      if (!value) return 'El género es obligatorio';
      break;

    case 'country':
      if (!value.trim()) return 'El país es obligatorio';
      if (!NAME_REGEX.test(value.trim())) return 'Solo letras, números y espacios';
      break;

    case 'email':
      if (!value.trim()) return 'El correo es obligatorio';
      if (!EMAIL_REGEX.test(value.trim()))
        return 'Debe ser un correo electrónico válido';
      break;

    case 'username':
      if (!value.trim()) return 'El usuario es obligatorio';
      if (!/^[A-Za-z0-9]+$/.test(value)) return 'Solo letras y números (sin espacios ni especiales)';
      if (value.trim().length < 3) return 'Mínimo 3 caracteres';
      if (value.trim().length > 30) return 'Máximo 30 caracteres';
      break;

    case 'password':
      if (!value) return 'La contraseña es obligatoria';
      if (value.length < 8) return 'Mínimo 8 caracteres';
      if (value.length > 12) return 'Máximo 12 caracteres';
      if (!/[A-Z]/.test(value)) return 'Debe tener al menos 1 mayúscula';
      if (!/[a-z]/.test(value)) return 'Debe contener minúsculas';
      if (!/\d/.test(value)) return 'Debe tener al menos 1 número';
      if (!/[^a-zA-Z0-9]/.test(value)) return 'Debe tener al menos 1 carácter especial';
      break;

    case 'confirmPassword':
      if (!value) return 'Confirma tu contraseña';
      if (form?.password && value !== form.password) return 'Las contraseñas no coinciden';
      break;
  }

  return undefined;
}

export function validateRegisterForm(form: RegisterForm): FieldErrors {
  const errors: FieldErrors = {};
  (Object.keys(form) as (keyof RegisterForm)[]).forEach((field) => {
    const error = validateRegisterField(field, form[field], form);
    if (error) errors[field] = error;
  });
  return errors;
}

export function validateLoginForm(form: LoginForm): { identifier?: string; password?: string } {
  const errors: { identifier?: string; password?: string } = {};
  if (!form.identifier.trim()) errors.identifier = 'El correo o usuario es obligatorio';
  else if (FORBIDDEN_CHARS.test(form.identifier)) errors.identifier = 'Contiene caracteres prohibidos';
  if (!form.password) errors.password = 'La contraseña es obligatoria';
  else if (FORBIDDEN_CHARS.test(form.password)) errors.password = 'Contiene caracteres prohibidos';
  return errors;
}

// ─── Indicador de fortaleza de contraseña ──────────────────────
export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}
