import { HTMLAttributes } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  thickness?: 'thin' | 'regular' | 'thick';
  label?: string;
}

/**
 * Spinner component for loading states
 * @param props Component props
 * @returns Spinner component
 */
const Spinner = ({
  size = 'medium',
  color = 'primary',
  thickness = 'regular',
  label = 'Loading...',
  className = '',
  ...rest
}: SpinnerProps) => {
  // Generate spinner class names
  const spinnerSizeClass = `spinner-${size}`;
  const spinnerColorClass = `spinner-color-${color}`;
  const spinnerThicknessClass = `spinner-thickness-${thickness}`;

  // Generate class names
  const spinnerClass = `spinner ${spinnerSizeClass} ${spinnerColorClass} ${spinnerThicknessClass} ${className}`;

  return (
    <div className={spinnerClass} role="status" {...rest}>
      <div className="spinner-circle"></div>

      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
};

export default Spinner;
