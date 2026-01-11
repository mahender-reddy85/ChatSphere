// Type definitions for the API module
declare module './api' {
  import { User, UserData, UserCredentials, ApiResponse, AuthResponse, AuthApi } from './types';

  export interface ExtendedError extends Error {
    status?: number;
    data?: any;
  }

  export const authApi: AuthApi;
  
  export function api<T = any>(
    path: string, 
    options?: RequestInit
  ): Promise<T>;
  
  export function initSocket(): Promise<{ connected: boolean }>;
}

// This helps TypeScript understand our JSDoc types
declare global {
  /** @type {import('./types').User} */
  var User: import('./types').User;
  
  /** @type {import('./types').UserData} */
  var UserData: import('./types').UserData;
  
  /** @type {import('./types').UserCredentials} */
  var UserCredentials: import('./types').UserCredentials;
  
  /** @type {import('./types').AuthResponse} */
  var AuthResponse: import('./types').AuthResponse;
}

declare module '*.js' {
  const content: any;
  export default content;
}
