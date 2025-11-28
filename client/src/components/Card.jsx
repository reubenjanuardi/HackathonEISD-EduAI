import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  headerAction,
  ...props 
}) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
