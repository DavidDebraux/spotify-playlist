import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { UploadZone } from './components/UploadZone.jsx'
import './App.css'

function App() {
  const { isAuthenticated, user, loading, login, logout, handleCallback } = useAuth()
  const [tracks, setTracks] = useState([])

  const handleTracksParsed = (parsedTracks) => {
    setTracks(parsedTracks)
    setResult(null)
  }
  const [playlistName, setPlaylistName] = useState('')
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState('new')
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  const fetchPlaylists = async () => {
    const token = localStorage.getItem('spotify_token')
    console.log('Fetching playlists, token exists:', !!token)
    if (!token || loadingPlaylists) return

    setLoadingPlaylists(true)
    try {
      const res = await fetch('http://localhost:8888/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Response:', res.status)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch playlists')
      }
      const data = await res.json()
      console.log('Got playlists:', data.length)
      setPlaylists(data || [])
    } catch (err) {
      console.error('Fetch playlists error:', err.message)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  useEffect(() => {
    console.log('Mode changed to:', mode, 'isAuthenticated:', isAuthenticated, 'playlists:', playlists.length)
    if (isAuthenticated && mode === 'existing' && playlists.length === 0) {
      console.log('Calling fetchPlaylists')
      fetchPlaylists()
    }
  }, [isAuthenticated, mode])

  const addToExisting = async () => {
    const token = localStorage.getItem('spotify_token')
    if (!token || !tracks.length || !selectedPlaylist) return

    setCreating(true)
    setResult(null)

    try {
      const res = await fetch('http://localhost:8888/api/playlist/add-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ playlistId: selectedPlaylist, tracks }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setCreating(false)
    }
  }

  const createPlaylist = async () => {
    const token = localStorage.getItem('spotify_token')
    if (!token || !tracks.length || !playlistName) return

    setCreating(true)
    setResult(null)

    try {
      const res = await fetch('http://localhost:8888/api/playlist/create', {
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
            <span className="user-name">{user.display_name}</span>
            {user.images?.[0] && (
              <img src={user.images[0].url} alt="" className="avatar" />
            )}
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>
        <main>
          <div className="create-section">
            <div className="mode-switch">
              <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>New Playlist</button>
              <button className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>
                {loadingPlaylists ? 'Loading...' : 'Existing Playlist'}
              </button>
            </div>
            {loadingPlaylists && <p className="loading-text">Loading playlists...</p>}

            <div className="playlist-info">
              {mode === 'new' ? (
                <>
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
                </>
              ) : (
                <>
                  <h2>Add to existing playlist</h2>
                  <p>Select a playlist to add your tracks to</p>
                  <div className="playlist-name-input">
                    <label>Select playlist:</label>
                    <select value={selectedPlaylist} onChange={(e) => setSelectedPlaylist(e.target.value)}>
                      <option value="">Choose a playlist...</option>
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="upload-info">
              <UploadZone onTracksParsed={handleTracksParsed} />
            </div>

            <div className="create-actions">
              {mode === 'new' ? (
                <button
                  className="spotify-btn create-btn"
                  onClick={createPlaylist}
                  disabled={creating || !playlistName || tracks.length === 0 || result?.tracksAdded !== undefined}
                >
                  {creating ? 'Creating...' : 'Create Playlist'}
                </button>
              ) : (
                <button
                  className="spotify-btn create-btn"
                  onClick={addToExisting}
                  disabled={creating || !selectedPlaylist || tracks.length === 0 || result?.tracksAdded !== undefined}
                >
                  {creating ? 'Adding...' : 'Add Tracks'}
                </button>
              )}
              {mode === 'new' && !playlistName && tracks.length > 0 && <span className="hint">Enter a playlist name</span>}
              {mode === 'existing' && !selectedPlaylist && tracks.length > 0 && <span className="hint">Select a playlist</span>}
            </div>
            {result && (
              <div className={result.error ? 'result-error' : 'result-success'}>
                {result.error ? `Error: ${result.error}` : mode === 'new' ? 'Playlist created!' : 'Tracks added!'}
                {result.tracksAdded !== undefined && (
                  <p>{result.tracksAdded}/{result.tracksTotal} tracks added</p>
                )}
                {result.url && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="spotify-link">Open in Spotify</a>
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
      <main>
        <div className="login-card">
          <div className="login-hero">
            <svg viewBox="0 0 140 120" className="login-icon">
              <defs>
                <linearGradient id="caseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3a3a3a"/>
                  <stop offset="100%" stopColor="#222"/>
                </linearGradient>
                <linearGradient id="vinylGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a1a1a"/>
                  <stop offset="100%" stopColor="#0a0a0a"/>
                </linearGradient>
              </defs>
              
              <rect x="10" y="10" width="120" height="90" rx="6" fill="url(#caseGrad)" stroke="#1DB954" strokeWidth="1.5"/>
              
              <circle cx="55" cy="52" r="30" fill="url(#vinylGrad)" stroke="#333" strokeWidth="1">
                <animateTransform attributeName="transform" type="rotate" from="0 55 52" to="360 55 52" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="55" cy="52" r="26" fill="transparent" stroke="#1DB954" strokeWidth="0.5" opacity="0.5">
                <animateTransform attributeName="transform" type="rotate" from="0 55 52" to="360 55 52" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="55" cy="52" r="20" fill="transparent" stroke="#1DB954" strokeWidth="0.5" strokeDasharray="20 5">
                <animateTransform attributeName="transform" type="rotate" from="0 55 52" to="360 55 52" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="55" cy="52" r="11" fill="#1DB954" opacity="0.15"/>
              <circle cx="55" cy="52" r="4" fill="#1DB954"/>
              
              <rect x="30" y="35" width="6" height="35" rx="3" fill="#1DB954" transform="rotate(-25 33 35)"/>
              <circle cx="33" cy="32" r="5" fill="#444" stroke="#1DB954" strokeWidth="1.5"/>
              
              <rect x="95" y="40" width="25" height="18" rx="3" fill="#222" stroke="#1DB954" strokeWidth="1.5"/>
              <rect x="98" y="43" width="19" height="12" rx="2" fill="#1DB954">
                <animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite"/>
              </rect>
              <rect x="100" y="45" width="4" height="8" rx="1" fill="#222" opacity="0.5"/>
              <rect x="106" y="45" width="4" height="8" rx="1" fill="#222" opacity="0.5"/>
              <rect x="112" y="45" width="2" height="8" rx="1" fill="#222" opacity="0.3"/>
            </svg>
          </div>
          <h2>Spotify Playlist</h2>
          <p>Create playlists from Excel, CSV or Image</p>
          <button onClick={login} className="spotify-btn">
            Connect to Spotify
          </button>
        </div>
      </main>
    </div>
  )
}

export default App