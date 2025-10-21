export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
}

export interface User {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
  readonly status: UserStatus;
}
