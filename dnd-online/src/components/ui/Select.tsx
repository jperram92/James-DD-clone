import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

export type SelectSize = 'small' | 'medium' | 'large';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  size?: SelectSize;
  icon?: ReactNode;
  helperText?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

/**
 * Select component
 * @param props Component props
 * @returns Select component
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      size = 'medium',
      icon,
      helperText,
      fullWidth = false,
      className = '',
      id,
      placeholder,
      ...rest
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    // Generate class names
    const containerClass = `select-container select-${size} ${
      fullWidth ? 'select-full-width' : ''
    } ${error ? 'select-error' : ''} ${className}`;

    const selectClass = `select ${icon ? 'select-with-icon' : ''}`;

    return (
      <div className={containerClass}>
        {label && <label htmlFor={selectId}>{label}</label>}

        <div className="select-wrapper">
          {icon && <div className="select-icon">{icon}</div>}

          <select
            id={selectId}
            ref={ref}
            className={selectClass}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="select-arrow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {error && (
          <div id={`${selectId}-error`} className="select-error-text">
            {error}
          </div>
        )}

        {helperText && !error && (
          <div id={`${selectId}-helper`} className="select-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
