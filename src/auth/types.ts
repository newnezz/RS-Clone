export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface PlayerSession {
  userId: string;
  email: string;
  username: string;
  mode: 'online' | 'offline';
}

export function createOfflineSession(username = 'Traveler'): PlayerSession {
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return {
    userId: `offline_${crypto.randomUUID()}`,
    email: '',
    username: `${username}${suffix}`,
    mode: 'offline',
  };
}

export function authUserToSession(user: AuthUser): PlayerSession {
  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    mode: 'online',
  };
}
