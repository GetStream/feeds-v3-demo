import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function Error({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading the content.',
  onRetry,
  showRetry = true 
}: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="flex items-center space-x-2 text-red-400">
        <AlertCircle className="w-6 h-6" />
        <span className="text-lg font-medium">{title}</span>
      </div>
      <p className="text-gray-400 text-center max-w-md">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
} 