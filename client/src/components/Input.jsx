import React from 'react';

const Input = ({ 
  label, 
  error, 
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-neutral-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-400">{error}</span>
      )}
    </div>
  );
};

export default Input;
