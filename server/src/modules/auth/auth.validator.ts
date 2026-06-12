// ============================================================
// auth.validator.ts — Validaciones del pizarrón
// ============================================================

export interface RegisterDTO {
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

export interface LoginDTO {
  identifier: string;
  password: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Caracteres prohibidos: > < = & /
const FORBIDDEN_CHARS = /[><=&\/]/;

// Nombre: solo letras (incluyendo tildes/ñ), espacios y números
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9 ]+$/;

// Email: validación estándar
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password: 8-12 chars, ≥1 mayúscula, ≥1 minúscula, ≥1 número, ≥1 especial
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,12}$/;

export function validateRegister(data: RegisterDTO): ValidationResult {
  const errors: string[] = [];

  // --- Nombre ---
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('El nombre es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.firstName)) {
    errors.push('El nombre contiene caracteres prohibidos (> < = & /).');
  } else if (!NAME_REGEX.test(data.firstName.trim())) {
    errors.push('El nombre solo puede contener letras, números y espacios.');
  }

  // --- Apellido ---
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('El apellido es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.lastName)) {
    errors.push('El apellido contiene caracteres prohibidos (> < = & /).');
  } else if (!NAME_REGEX.test(data.lastName.trim())) {
    errors.push('El apellido solo puede contener letras, números y espacios.');
  }

  // --- Fecha de Nacimiento ---
  if (!data.birthDate) {
    errors.push('La fecha de nacimiento es obligatoria.');
  } else if (FORBIDDEN_CHARS.test(data.birthDate)) {
    errors.push('La fecha de nacimiento contiene caracteres prohibidos.');
  } else {
    const birth = new Date(data.birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) {
      errors.push('La fecha de nacimiento no es válida.');
    } else if (birth >= today) {
      errors.push('La fecha de nacimiento no puede ser en el futuro.');
    }
  }

  // --- Género ---
  if (!data.gender) {
    errors.push('El género es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.gender)) {
    errors.push('El género contiene caracteres prohibidos.');
  }

  // --- País ---
  if (!data.country || data.country.trim().length === 0) {
    errors.push('El país es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.country)) {
    errors.push('El país contiene caracteres prohibidos (> < = & /).');
  } else if (!NAME_REGEX.test(data.country.trim())) {
    errors.push('El país solo puede contener letras, números y espacios.');
  }

  // --- Email ---
  if (!data.email || data.email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.email)) {
    errors.push('El correo contiene caracteres prohibidos.');
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push('El correo debe ser un correo electrónico válido (ej: usuario@gmail.com, usuario@empresa.com).');
  }

  // --- Username ---
  if (!data.username || data.username.trim().length === 0) {
    errors.push('El nombre de usuario es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.username)) {
    errors.push('El usuario contiene caracteres prohibidos (> < = & /).');
  } else if (!/^[A-Za-z0-9]+$/.test(data.username)) {
    errors.push('El nombre de usuario solo puede contener letras y números (sin espacios ni caracteres especiales).');
  } else if (data.username.length < 3 || data.username.length > 30) {
    errors.push('El usuario debe tener entre 3 y 30 caracteres.');
  }

  // --- Password ---
  if (!data.password) {
    errors.push('La contraseña es obligatoria.');
  } else if (FORBIDDEN_CHARS.test(data.password)) {
    errors.push('La contraseña contiene caracteres prohibidos (> < = & /).');
  } else if (data.password.length < 8) {
    errors.push('La contraseña debe tener mínimo 8 caracteres.');
  } else if (data.password.length > 12) {
    errors.push('La contraseña debe tener máximo 12 caracteres.');
  } else if (!/[A-Z]/.test(data.password)) {
    errors.push('La contraseña debe tener al menos 1 letra mayúscula.');
  } else if (!/[a-z]/.test(data.password)) {
    errors.push('La contraseña debe contener letras minúsculas.');
  } else if (!/\d/.test(data.password)) {
    errors.push('La contraseña debe tener al menos 1 número.');
  } else if (!/[^a-zA-Z0-9]/.test(data.password)) {
    errors.push('La contraseña debe tener al menos 1 carácter especial (ej: @, #, !, %).');
  }

  // --- Confirmar Password ---
  if (!data.confirmPassword) {
    errors.push('Debes confirmar la contraseña.');
  } else if (data.password !== data.confirmPassword) {
    errors.push('Las contraseñas no coinciden.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateLogin(data: LoginDTO): ValidationResult {
  const errors: string[] = [];

  if (!data.identifier || data.identifier.trim().length === 0) {
    errors.push('El usuario o correo electrónico es obligatorio.');
  } else if (FORBIDDEN_CHARS.test(data.identifier)) {
    errors.push('El usuario/correo contiene caracteres prohibidos.');
  }

  if (!data.password) {
    errors.push('La contraseña es obligatoria.');
  } else if (FORBIDDEN_CHARS.test(data.password)) {
    errors.push('La contraseña contiene caracteres prohibidos.');
  }

  return { valid: errors.length === 0, errors };
}
