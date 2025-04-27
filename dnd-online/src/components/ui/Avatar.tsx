import { HTMLAttributes } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  border?: boolean;
}

/**
 * Avatar component for user profiles
 * @param props Component props
 * @returns Avatar component
 */
const Avatar = ({
  src,
  alt,
  name,
  size = 'medium',
  shape = 'circle',
  status,
  border = false,
  className = '',
  ...rest
}: AvatarProps) => {
  // Generate initials from name
  const getInitials = () => {
    if (!name) return '';

    const nameParts = name.split(' ').filter(Boolean);

    if (nameParts.length === 0) return '';
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Generate color class based on name
  const getColorClass = () => {
    if (!name) return 'avatar-color-default';

    const colors = [
      'primary',
      'primary-dark',
      'primary-light',
      'secondary',
      'secondary-dark',
      'secondary-light',
    ];

    const hash = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return `avatar-color-${colors[hash % colors.length]}`;
  };

  // Generate class names
  const avatarClass = `avatar avatar-${size} avatar-${shape} ${
    border ? 'avatar-border' : ''
  } ${className}`;

  return (
    <div className={avatarClass} {...rest}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="avatar-image"
        />
      ) : (
        <div
          className={`avatar-initials ${getColorClass()}`}
        >
          {getInitials()}
        </div>
      )}

      {status && <div className={`avatar-status avatar-status-${status}`} />}
    </div>
  );
};

export default Avatar;
