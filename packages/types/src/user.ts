export type UserRole = 'ADMIN' | 'MODERATOR' | 'USER'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'

export interface AuthUser {
  id: string
  email: string
  username: string
  role: UserRole
  status: UserStatus
}

export interface UserSummary extends AuthUser {
  emailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
}
