import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  headerAction?: ReactNode;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  bordered?: boolean;
  fullWidth?: boolean;
}

/**
 * Card component
 * @param props Component props
 * @returns Card component
 */
const Card = ({
  children,
  title,
  subtitle,
  footer,
  headerAction,
  elevation = 'medium',
  bordered = false,
  fullWidth = false,
  className = '',
  ...rest
}: CardProps) => {
  // Generate class names
  const cardClass = `card card-elevation-${elevation} ${
    bordered ? 'card-bordered' : ''
  } ${fullWidth ? 'card-full-width' : ''} ${className}`;

  const hasHeader = title || subtitle || headerAction;

  return (
    <div className={cardClass} {...rest}>
      {hasHeader && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          
          {headerAction && <div className="card-header-action">{headerAction}</div>}
        </div>
      )}
      
      <div className="card-body">{children}</div>
      
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
