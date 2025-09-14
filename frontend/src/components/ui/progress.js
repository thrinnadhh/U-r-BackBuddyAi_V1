import React from 'react';

export const Progress = ({ value = 0, className = '' }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gray-900"
        style={{ width: `${clamped}%`, height: '100%' }}
      />
    </div>
  );
};

export default Progress;


