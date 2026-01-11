export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  isOnline?: boolean;
  profilePicture?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface UserData extends UserCredentials {
  email: string;
  name?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
  token?: string;
  status?: number;
}

export interface AuthResponse extends ApiResponse<{ user: User; token: string }> {
  token: string;
  user: User;
}

export interface AuthApi {
  register: (userData: UserData) => Promise<AuthResponse>;
  login: (credentials: UserCredentials) => Promise<AuthResponse>;
  getMe: () => Promise<AuthResponse>;
  updateProfile: (userData: Partial<UserData>) => Promise<AuthResponse>;
  changePassword: (data: { 
    currentPassword: string; 
    newPassword: string;
  }) => Promise<{ message: string }>;
}
