import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

export type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  className?: string;
  id?: string;
  label?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Input component
 * @param props Component props
 * @returns Input component
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      size = 'medium',
      leftIcon,
      rightIcon,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    // Generate class names
    const containerClass = `input-container input-${size} ${
      fullWidth ? 'input-full-width' : ''
    } ${error ? 'input-error' : ''} ${className}`;

    const inputClass = `input ${leftIcon ? 'input-with-left-icon' : ''} ${
      rightIcon ? 'input-with-right-icon' : ''
    }`;

    return (
      <div className={containerClass}>
        {label && <label htmlFor={inputId}>{label}</label>}

        <div className="input-wrapper">
          {leftIcon && <div className="input-icon input-icon-left">{leftIcon}</div>}

          <input
            id={inputId}
            ref={ref}
            className={inputClass}
            {...(error ? { 'aria-invalid': 'true' } : {})}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...rest}
          />

          {rightIcon && <div className="input-icon input-icon-right">{rightIcon}</div>}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="input-error-text">
            {error}
          </div>
        )}

        {helperText && !error && (
          <div id={`${inputId}-helper`} className="input-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

