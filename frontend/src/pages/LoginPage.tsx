import type { FormEvent } from 'react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { token, login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (tab === 'login') await login(email, password)
      else await register(email, password, name)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[#131314] p-8">
      <div className="w-full max-w-md rounded-xl border border-[#3c4043] bg-[#1e1f20] p-8 shadow-2xl">
        <h1 className="mb-2 text-2xl font-normal text-[#e3e3e3]">Calendar</h1>
        <p className="mb-8 text-[14px] text-[#80868b]">Hesap oluşturun veya oturum açın.</p>
        <div className="mb-6 flex gap-2 rounded-lg bg-[#131314] p-1">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
              tab === 'login'
                ? 'bg-[#292a2d] text-[#e3e3e3]'
                : 'text-[#bdc1c6] hover:bg-[#292a2d]/60'
            }`}
          >
            Giriş
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
              tab === 'register'
                ? 'bg-[#292a2d] text-[#e3e3e3]'
                : 'text-[#bdc1c6] hover:bg-[#292a2d]/60'
            }`}
          >
            Kayıt
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4">
          {tab === 'register' ? (
            <div className="grid gap-2">
              <Label htmlFor="name">İsim</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="email">E‑posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw">Şifre</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error ? <p className="text-sm text-[#ea4335]">{error}</p> : null}
          <Button variant="primary" type="submit" className="mt-4 w-full" disabled={busy}>
            {busy ? 'İşlem…' : tab === 'login' ? 'Giriş yap' : 'Kayıt ol'}
          </Button>
        </form>
        <div className="mt-10 text-center text-xs text-[#80868b]">
          MVP — DB: PostgreSQL, API REST
        </div>
      </div>
    </div>
  )
}
