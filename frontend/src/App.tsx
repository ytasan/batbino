import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/context/AuthContext'
import { CalendarPage } from '@/pages/CalendarPage'
import { LoginPage } from '@/pages/LoginPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<CalendarPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
