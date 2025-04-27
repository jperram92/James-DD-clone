import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
    custom?: (value: T[K], formValues: T) => boolean;
    errorMessage?: string;
  };
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormValidationResult<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]?: boolean };
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (onSubmit: (values: T) => void) => (e: FormEvent) => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldTouched: (name: keyof T, isTouched?: boolean) => void;
  resetForm: (newValues?: Partial<T>) => void;
  isValid: boolean;
}

/**
 * Custom hook for form validation
 * @param initialValues Initial form values
 * @param validationRules Validation rules for form fields
 * @returns Form validation utilities
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
): UseFormValidationResult<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      const rules = validationRules[name];
      if (!rules) return undefined;

      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return rules.errorMessage || 'This field is required';
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        return rules.errorMessage || `Minimum length is ${rules.minLength} characters`;
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        return rules.errorMessage || `Maximum length is ${rules.maxLength} characters`;
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return rules.errorMessage || 'Invalid format';
      }

      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        return rules.errorMessage || `Minimum value is ${rules.min}`;
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        return rules.errorMessage || `Maximum value is ${rules.max}`;
      }

      if (rules.custom && !rules.custom(value, values)) {
        return rules.errorMessage || 'Invalid value';
      }

      return undefined;
    },
    [validationRules, values]
  );

  // Validate all fields
  const validateForm = useCallback((): ValidationErrors<T> => {
    const newErrors: ValidationErrors<T> = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    return hasErrors ? newErrors : {};
  }, [validateField, validationRules, values]);

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;
      
      // Convert value based on input type
      let parsedValue: any = value;
      if (type === 'number') {
        parsedValue = value === '' ? '' : Number(value);
      } else if (type === 'checkbox') {
        parsedValue = (e.target as HTMLInputElement).checked;
      }

      setValues((prev) => ({ ...prev, [fieldName]: parsedValue }));
      
      if (touched[fieldName]) {
        const error = validateField(fieldName, parsedValue);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }
    },
    [touched, validateField]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      const fieldName = name as keyof T;
      
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      
      const error = validateField(fieldName, values[fieldName]);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    [validateField, values]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void) => (e: FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as { [K in keyof T]: boolean }
      );
      setTouched(allTouched);
      
      // Validate all fields
      const formErrors = validateForm();
      setErrors(formErrors);
      
      // Submit if no errors
      if (Object.keys(formErrors).length === 0) {
        onSubmit(values);
      }
    },
    [validateForm, validationRules, values]
  );

  // Set field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  // Set field touched state programmatically
  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
    
    if (isTouched) {
      const error = validateField(name, values[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [validateField, values]);

  // Reset form to initial values
  const resetForm = useCallback((newValues?: Partial<T>) => {
    setValues((prev) => ({ ...initialValues, ...newValues }));
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && 
    Object.keys(validationRules).every((key) => {
      const fieldName = key as keyof T;
      return !validationRules[fieldName]?.required || values[fieldName] !== undefined;
    });

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    resetForm,
    isValid,
  };
};
