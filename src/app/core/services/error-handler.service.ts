import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorMessage {
  message: string;
  code?: number;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  handleError(error: HttpErrorResponse): ErrorMessage {
    let errorMessage: ErrorMessage = {
      message: 'An unknown error occurred',
      code: error.status
    };
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage.message = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.entity) {
        errorMessage.message = error.error.entity;
      } else if (error.error && error.error.message) {
        errorMessage.message = error.error.message;
      } else {
        errorMessage.message = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
      
      errorMessage.code = error.status;
      errorMessage.details = error.error;
    }
    
    console.error('API Error:', errorMessage);
    return errorMessage;
  }

  getErrorMessage(error: any): string {
    if (error?.error?.entity) {
      return error.error.entity;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }
}
