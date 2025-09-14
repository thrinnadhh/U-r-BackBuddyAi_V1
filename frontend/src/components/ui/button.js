import React from 'react';

export const Button = ({ children, className = '', variant = 'default', size = 'md', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base'
  };
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;


