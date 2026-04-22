import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { UploadZone } from './components/UploadZone.jsx'
import './App.css'

function App() {
  const { isAuthenticated, user, loading, login, logout, handleCallback } = useAuth()
  const [tracks, setTracks] = useState([])
  const [playlistName, setPlaylistName] = useState('')
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)

  const createPlaylist = async () => {
    const token = localStorage.getItem('spotify_token')
    if (!token || !tracks.length || !playlistName) return

    setCreating(true)
    setResult(null)

    try {
      const res = await fetch('/api/playlist/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: playlistName, tracks }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setCreating(false)
    }
  }

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
          <div className="create-section">
            <h2>Create a new playlist</h2>
            <p>Upload a file with your favorite songs</p>
            <div className="playlist-name-input">
              <label>Playlist name:</label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Playlist"
              />
            </div>
            <UploadZone onTracksParsed={setTracks} />
            {tracks.length > 0 && playlistName && (
              <button
                className="spotify-btn create-btn"
                onClick={createPlaylist}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Playlist'}
              </button>
            )}
            {result && (
              <div className={result.error ? 'result-error' : 'result-success'}>
                {result.error ? result.error : `Playlist "${result.name}" created! ${result.tracksAdded}/${result.tracksTotal} tracks added.`}
                {result.url && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer">Open in Spotify</a>
                )}
              </div>
            )}
          </div>
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