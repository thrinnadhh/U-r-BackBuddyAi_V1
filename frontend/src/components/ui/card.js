import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`border border-gray-200 bg-white rounded-xl ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-4 pt-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-4 pb-4 ${className}`}>{children}</div>
);

export default Card;


