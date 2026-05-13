import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserMe } from '@/lib/api'
import {
  getToken,
  loginApi,
  registerApi,
  setToken as persistToken,
} from '@/lib/api'

const USER_KEY = 'calendar_user'

function readStoredUser(): UserMe | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserMe
  } catch {
    return null
  }
}

function writeStoredUser(user: UserMe | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

type AuthContextValue = {
  token: string | null
  user: UserMe | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<UserMe | null>(() => readStoredUser())
  const [ready] = useState(true)

  const logout = useCallback(() => {
    persistToken(null)
    writeStoredUser(null)
    setTokenState(null)
    setUser(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password)
    persistToken(data.token)
    writeStoredUser(data.user)
    setTokenState(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await registerApi({ email, password, name })
    persistToken(data.token)
    writeStoredUser(data.user)
    setTokenState(data.token)
    setUser(data.user)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      ready,
      login,
      register,
      logout,
    }),
    [login, logout, register, token, ready, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
