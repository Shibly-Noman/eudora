export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  mustChangePassword: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  permissions: string[];
};

export type CurrentUser = PublicUser & {
  permissions: string[];
};
