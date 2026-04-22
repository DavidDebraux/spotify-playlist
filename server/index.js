import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8888;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const scopes = [
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-email',
  'user-library-modify',
  'user-follow-modify',
];

app.get('/api/auth/login', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  res.json({ url: authorizeURL });
});

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.send(`<html><body><script>window.opener.postMessage('auth_error', '*'); window.close();</script></body></html>`);
  }
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'auth_success', token: '${access_token}', refresh: '${refresh_token}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
} catch (err) {
    console.error('Catch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/callback', async (req, res) => {
  const { code } = req.body;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    res.json({ access_token, refresh_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  spotifyApi.setAccessToken(token);
  try {
    const data = await spotifyApi.getMe();
    res.json(data.body);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/api/playlist/add-tracks', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { playlistId, tracks } = req.body;

  if (!token || !playlistId || !tracks?.length) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  console.log('Adding', tracks.length, 'tracks to playlist', playlistId);

  try {
    const trackUris = [];
    for (const track of tracks) {
      const query = `${track.title} ${track.artist}`.trim();
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      if (searchData.tracks?.items?.length > 0) {
        trackUris.push(searchData.tracks.items[0].uri);
        console.log(`Found: ${searchData.tracks.items[0].name}`);
      }
    }

    if (trackUris.length === 0) {
      return res.json({ tracksAdded: 0, tracksTotal: tracks.length });
    }

    let totalAdded = 0;
    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/items`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: chunk }),
        }
      );
      if (!response.ok) throw new Error(`Spotify ${response.status}`);
      const result = await response.json();
      console.log(`Chunk OK:`, result.snapshot_id);
      totalAdded += chunk.length;
    }

    res.json({ tracksAdded: totalAdded, tracksTotal: tracks.length });
  } catch (err) {
    console.error('Add tracks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playlist/create', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { name, tracks } = req.body;
  if (!token || !name || !tracks?.length) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  console.log('Creating playlist:', name, 'with', tracks.length, 'tracks');
  spotifyApi.setAccessToken(token);

  try {
    const user = await spotifyApi.getMe();
    const userId = user.body.id;
    console.log('User ID:', userId);
    console.log('User email:', user.body.email);
    console.log('Product:', user.body.product);

    const playlist = await spotifyApi.createPlaylist(userId, {
      name,
      description: 'Created with Spotify Playlist tool',
      public: true,
    });
    const playlistId = playlist.body.id;
    console.log('Playlist ID:', playlistId);
    console.log('Playlist public:', playlist.body.public);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const trackUris = [];
    for (const track of tracks) {
      const query = `${track.title} ${track.artist}`.trim();
      try {
        const search = await spotifyApi.searchTracks(query, { limit: 1 });
        if (search.body.tracks?.items?.length > 0) {
          trackUris.push(search.body.tracks.items[0].uri);
          console.log(`Found: ${search.body.tracks.items[0].name} -> ${search.body.tracks.items[0].uri}`);
        } else {
          console.log(`Not found: ${query}`);
        }
      } catch (err) {
        console.error('Search error:', err.message);
      }
    }

    if (trackUris.length === 0) {
      return res.json({ id: playlistId, name: playlist.body.name, url: playlist.body.external_urls.spotify, tracksAdded: 0, tracksTotal: tracks.length });
    }

    console.log('Adding', trackUris.length, 'tracks using new endpoint...');

    let totalAdded = 0;
    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);
      console.log(`Adding chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.length} tracks`);

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/items`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: chunk }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Spotify ${response.status}: ${errBody}`);
      }

      const result = await response.json();
      console.log(`Chunk OK. Snapshot:`, result.snapshot_id);
      totalAdded += chunk.length;
    }

    console.log('All tracks added:', totalAdded);

    res.json({
      id: playlistId,
      name: playlist.body.name,
      url: playlist.body.external_urls.spotify,
      tracksAdded: totalAdded,
      tracksTotal: tracks.length,
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists', async (req, res) => {
  console.log('Headers:', req.headers);
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  const token = req.headers.authorization?.replace('Bearer ', '');
  console.log('Token after replace:', token ? token.substring(0, 20) + '...' : 'null');
  if (!token) {
    return res.status(401).json({ error: 'No token', received: authHeader });
  }

  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Spotify error:', response.status, errText);
      return res.status(500).json({ error: `Spotify error: ${errText}` });
    }

const data = await response.json();
    console.log('Playlists found:', data.items?.length || 0);

    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    const myId = meData.id;
    console.log('My ID:', myId);

    const playlists = data.items
      .filter(p => p !== null && p.owner?.id === myId)
      .map(p => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0]?.url,
        public: p.public,
      }));
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});