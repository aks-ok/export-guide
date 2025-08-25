import { ApiServiceError, ApiErrorCode } from './types';

export interface ErrorHandlerConfig {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  fallbackData?: any;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: ApiServiceError) => void)[] = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(
    error: ApiServiceError, 
    context: string = 'Unknown',
    config: ErrorHandlerConfig = {}
  ): void {
    const {
      showToast = true,
      logToConsole = true,
      reportToService = false,
      fallbackData = null
    } = config;

    // Log to console if enabled
    if (logToConsole) {
      this.logError(error, context);
    }

    // Show user-friendly message if enabled
    if (showToast) {
      this.showUserMessage(error);
    }

    // Report to error tracking service if enabled
    if (reportToService) {
      this.reportError(error, context);
    }

    // Notify error listeners
    this.notifyListeners(error);
  }

  public addErrorListener(listener: (error: ApiServiceError) => void): void {
    this.errorListeners.push(listener);
  }

  public removeErrorListener(listener: (error: ApiServiceError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  private logError(error: ApiServiceError, context: string): void {
    console.group(`🚨 API Error in ${context}`);
    console.error('Error Code:', error.code);
    console.error('Message:', error.message);
    console.error('Retryable:', error.retryable);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }

  private showUserMessage(error: ApiServiceError): void {
    const message = this.getUserFriendlyMessage(error);
    
    // Try to show toast notification if available
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast(message, 'error');
    } else {
      // Fallback to console for now (can be replaced with actual toast library)
      console.warn('User Message:', message);
    }
  }

  private getUserFriendlyMessage(error: ApiServiceError): string {
    switch (error.code) {
      case ApiErrorCode.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case ApiErrorCode.TIMEOUT:
        return 'The request is taking longer than expected. Please try again.';
      
      case ApiErrorCode.RATE_LIMIT:
        return 'Too many requests. Please wait a moment before trying again.';
      
      case ApiErrorCode.UNAUTHORIZED:
        return 'Authentication failed. Please check your credentials or contact support.';
      
      case ApiErrorCode.NOT_FOUND:
        return 'The requested information could not be found.';
      
      case ApiErrorCode.SERVER_ERROR:
        return 'Server is experiencing issues. Please try again later.';
      
      case ApiErrorCode.INVALID_RESPONSE:
        return 'Received invalid data from the server. Please try again.';
      
      case ApiErrorCode.CACHE_ERROR:
        return 'There was an issue with cached data. Refreshing...';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  private reportError(error: ApiServiceError, context: string): void {
    // This would integrate with error tracking services like Sentry, LogRocket, etc.
    const errorReport = {
      timestamp: new Date().toISOString(),
      context,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack
    };

    // For now, just log to console
    // In production, this would send to an error tracking service
    console.log('Error Report:', errorReport);
  }

  private notifyListeners(error: ApiServiceError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  // Utility methods for common error scenarios
  public createNetworkErrorHandler(context: string) {
    return (error: any) => {
      if (error instanceof ApiServiceError) {
        this.handleError(error, context);
      } else {
        const apiError = new ApiServiceError(
          ApiErrorCode.NETWORK_ERROR,
          'Network request failed',
          true,
          error
        );
        this.handleError(apiError, context);
      }
    };
  }

  public createTimeoutErrorHandler(context: string) {
    return (error: any) => {
      const apiError = new ApiServiceError(
        ApiErrorCode.TIMEOUT,
        'Request timed out',
        true,
        error
      );
      this.handleError(apiError, context);
    };
  }

  public isRetryableError(error: ApiServiceError): boolean {
    return error.retryable;
  }

  public shouldShowFallbackData(error: ApiServiceError): boolean {
    // Show fallback data for certain error types
    return [
      ApiErrorCode.NETWORK_ERROR,
      ApiErrorCode.TIMEOUT,
      ApiErrorCode.SERVER_ERROR,
      ApiErrorCode.RATE_LIMIT
    ].includes(error.code);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// React Hook for error handling
export function useErrorHandler() {
  const handleApiError = (error: any, context: string = 'Component') => {
    if (error instanceof ApiServiceError) {
      errorHandler.handleError(error, context);
    } else {
      const apiError = new ApiServiceError(
        ApiErrorCode.SERVER_ERROR,
        error.message || 'Unknown error',
        false,
        error
      );
      errorHandler.handleError(apiError, context);
    }
  };

  const createErrorBoundary = (context: string) => {
    return (error: any) => {
      handleApiError(error, context);
    };
  };

  return {
    handleApiError,
    createErrorBoundary,
    isRetryable: errorHandler.isRetryableError.bind(errorHandler),
    shouldShowFallback: errorHandler.shouldShowFallbackData.bind(errorHandler)
  };
}

// Global error handler setup
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new ApiServiceError(
      ApiErrorCode.SERVER_ERROR,
      'Unhandled promise rejection',
      false,
      event.reason
    );
    errorHandler.handleError(error, 'Global');
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = new ApiServiceError(
      ApiErrorCode.SERVER_ERROR,
      event.message,
      false,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }
    );
    errorHandler.handleError(error, 'Global');
  });
}