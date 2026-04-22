import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleMessage = async (event) => {
      const data = event.data
      if (data && data.type === 'auth_success') {
        localStorage.setItem('spotify_token', data.token)
        localStorage.setItem('spotify_refresh', data.refresh)
        await fetchUser(data.token)
      } else if (data && data.type === 'auth_error') {
        console.error('Auth error:', data.error)
        setLoading(false)
      }
    }
    window.addEventListener('message', handleMessage)

    const token = localStorage.getItem('spotify_token')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const fetchUser = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.display_name) {
        setUser(data)
        setIsAuthenticated(true)
      }
    } catch (err) {
      localStorage.removeItem('spotify_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    const res = await fetch('/api/auth/login')
    const data = await res.json()
    const width = 500
    const height = 600
    const left = (screen.width - width) / 2
    const top = (screen.height - height) / 2
    window.open(
      data.url,
      'Spotify Login',
      `width=${width},height=${height},left=${left},top=${top}`
    )
  }

  const logout = () => {
    localStorage.removeItem('spotify_token')
    localStorage.removeItem('spotify_refresh')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}