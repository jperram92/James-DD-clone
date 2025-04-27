import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Checkbox component
 * @param props Component props
 * @returns Checkbox component
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, ...rest }, ref) => {
    // Generate unique ID if not provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    // Generate class names
    const containerClass = `checkbox-container ${
      error ? 'checkbox-error' : ''
    } ${className}`;

    return (
      <div className={containerClass}>
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className="checkbox"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${checkboxId}-error`
                : helperText
                ? `${checkboxId}-helper`
                : undefined
            }
            {...rest}
          />

          {label && (
            <label htmlFor={checkboxId} className="checkbox-label">
              {label}
            </label>
          )}
        </div>

        {error && (
          <div id={`${checkboxId}-error`} className="checkbox-error-text">
            {error}
          </div>
        )}

        {helperText && !error && (
          <div id={`${checkboxId}-helper`} className="checkbox-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
