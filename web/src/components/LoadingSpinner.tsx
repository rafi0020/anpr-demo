import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <span className="ml-4 text-gray-600 dark:text-gray-400">Loading ANPR System...</span>
    </div>
  );
};

export default LoadingSpinner;
