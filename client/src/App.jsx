import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import './App.css'

function App() {
  const { isAuthenticated, user, loading, login, logout, handleCallback } = useAuth()

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'auth_success') {
        window.location.reload()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (loading) {
    return <div className="app"><p>Loading...</p></div>
  }

  if (isAuthenticated && user) {
    return (
      <div className="app">
        <header>
          <h1>Spotify Playlist</h1>
          <div className="user-info">
            {user.images?.[0] && (
              <img src={user.images[0].url} alt="" className="avatar" />
            )}
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>
        <main>
          <p>Welcome, {user.display_name}!</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Spotify Playlist</h1>
      </header>
      <main>
        <div className="login-card">
          <h2>Create playlists from Excel</h2>
          <p>Upload a file with your favorite songs and create a new playlist automatically.</p>
          <button onClick={login} className="spotify-btn">
            Connect to Spotify
          </button>
        </div>
      </main>
    </div>
  )
}

export default App