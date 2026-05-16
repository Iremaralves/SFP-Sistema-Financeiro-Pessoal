export interface Credentials {
  accessToken: string;
  refreshToken: string;
  householdId: string;
  userId: string;
  role: 'admin' | 'operator';
  email: string;
}
