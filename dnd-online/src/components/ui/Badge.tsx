import { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  outline?: boolean;
  icon?: ReactNode;
}

/**
 * Badge component for labels and status indicators
 * @param props Component props
 * @returns Badge component
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'medium',
  rounded = false,
  outline = false,
  icon,
  className = '',
  ...rest
}: BadgeProps) => {
  // Generate class names
  const badgeClass = `badge badge-${variant} badge-${size} ${
    rounded ? 'badge-rounded' : ''
  } ${outline ? 'badge-outline' : ''} ${icon ? 'badge-with-icon' : ''} ${className}`;

  return (
    <span className={badgeClass} {...rest}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span className="badge-text">{children}</span>
    </span>
  );
};

export default Badge;
