/**
 * Input Validation & Sanitization Utilities
 * Provides validation functions for all user inputs to prevent XSS, injection attacks,
 * and ensure data integrity.
 */

export type ValidationError = string | null;

/**
 * Transaction validation rules
 */
export const validateTransaction = {
  description: (value: string): ValidationError => {
    if (!value || value.trim().length === 0) {
      return 'Description is required';
    }
    if (value.length > 500) {
      return 'Description too long (max 500 characters)';
    }
    // Prevent HTML/script tags and common XSS patterns
    if (/<script|<iframe|javascript:|on\w+\s*=/i.test(value)) {
      return 'Invalid characters detected';
    }
    return null;
  },

  amount: (value: number | string): ValidationError => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return 'Amount must be a valid number';
    }
    if (numValue <= 0) {
      return 'Amount must be positive';
    }
    if (numValue > 1000000000) {
      return 'Amount exceeds maximum ($1,000,000,000)';
    }
    // Check for max 2 decimal places
    const decimalPart = numValue.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      return 'Amount can have maximum 2 decimal places';
    }
    return null;
  },

  date: (value: string): ValidationError => {
    if (!value) {
      return 'Date is required';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }
    const now = new Date();
    if (date > now) {
      return 'Date cannot be in the future';
    }
    // Don't allow dates before year 2000
    if (date < new Date('2000-01-01')) {
      return 'Date too far in the past (must be after 2000)';
    }
    return null;
  },

  category: (value: string): ValidationError => {
    if (!value || value.trim().length === 0) {
      return 'Category is required';
    }
    return null;
  }
};

/**
 * Budget validation rules
 */
export const validateBudget = {
  limit: (value: number | string): ValidationError => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return 'Budget limit must be a valid number';
    }
    if (numValue <= 0) {
      return 'Budget limit must be positive';
    }
    if (numValue > 1000000000) {
      return 'Budget limit exceeds maximum ($1,000,000,000)';
    }
    // Check for max 2 decimal places
    const decimalPart = numValue.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      return 'Budget limit can have maximum 2 decimal places';
    }
    return null;
  },

  period: (value: string): ValidationError => {
    const validPeriods = ['monthly', 'yearly', 'custom'];
    if (!validPeriods.includes(value)) {
      return 'Invalid budget period';
    }
    return null;
  },

  category: (value: string): ValidationError => {
    if (!value || value.trim().length === 0) {
      return 'Category is required';
    }
    return null;
  }
};

/**
 * Category validation rules
 */
export const validateCategory = {
  name: (value: string): ValidationError => {
    if (!value || value.trim().length === 0) {
      return 'Category name is required';
    }
    if (value.length > 100) {
      return 'Category name too long (max 100 characters)';
    }
    // Prevent HTML/script tags
    if (/<script|<iframe|javascript:/i.test(value)) {
      return 'Invalid characters detected';
    }
    return null;
  },

  expenseType: (value: string): ValidationError => {
    const validTypes = ['fixed', 'variable', 'controllable_fixed'];
    if (!validTypes.includes(value)) {
      return 'Invalid expense type';
    }
    return null;
  }
};

/**
 * User profile validation rules
 */
export const validateProfile = {
  firstName: (value: string): ValidationError => {
    if (!value || value.trim().length === 0) {
      return 'First name is required';
    }
    if (value.length > 50) {
      return 'First name too long (max 50 characters)';
    }
    // Only allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(value)) {
      return 'First name contains invalid characters';
    }
    return null;
  },

  lastName: (value: string): ValidationError => {
    if (!value || value.trim().length === 0) {
      return 'Last name is required';
    }
    if (value.length > 50) {
      return 'Last name too long (max 50 characters)';
    }
    // Only allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(value)) {
      return 'Last name contains invalid characters';
    }
    return null;
  },

  location: (value: string): ValidationError => {
    if (value && value.length > 100) {
      return 'Location too long (max 100 characters)';
    }
    return null;
  },

  goal: (value: string): ValidationError => {
    if (value && value.length > 500) {
      return 'Goal too long (max 500 characters)';
    }
    return null;
  }
};

/**
 * Sanitize input string by removing potentially dangerous characters
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim()
    .substring(0, 500); // Enforce maximum length
};

/**
 * Sanitize HTML to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  // Remove all script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'link', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized.trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationError => {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }

  if (email.length > 255) {
    return 'Email too long (max 255 characters)';
  }

  return null;
};

/**
 * Validate all fields in an object using a validator map
 * Returns an object with field names as keys and error messages as values
 */
export function validateFields<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationError>
): Record<keyof T, ValidationError> {
  const errors = {} as Record<keyof T, ValidationError>;

  for (const field in validators) {
    errors[field] = validators[field](data[field]);
  }

  return errors;
}

/**
 * Check if validation errors object has any errors
 */
export function hasValidationErrors<T extends Record<string, ValidationError>>(
  errors: T
): boolean {
  return Object.values(errors).some(error => error !== null);
}
