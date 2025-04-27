import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resizable?: boolean;
}

/**
 * TextArea component
 * @param props Component props
 * @returns TextArea component
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      resizable = true,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    // Generate class names
    const containerClass = `textarea-container ${
      fullWidth ? 'textarea-full-width' : ''
    } ${error ? 'textarea-error' : ''} ${className}`;

    const textareaClass = `textarea ${!resizable ? 'textarea-no-resize' : ''}`;

    return (
      <div className={containerClass}>
        {label && <label htmlFor={textareaId}>{label}</label>}

        <textarea
          id={textareaId}
          ref={ref}
          className={textareaClass}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          {...rest}
        />

        {error && (
          <div id={`${textareaId}-error`} className="textarea-error-text">
            {error}
          </div>
        )}

        {helperText && !error && (
          <div id={`${textareaId}-helper`} className="textarea-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
