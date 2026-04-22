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
  'user-read-email',
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
    res.send(`<html><body><script>window.opener.postMessage({ type: 'auth_error', error: '${err.message}' }, '*'); window.close();</script></body></html>`);
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

app.post('/api/playlist/create', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { name, tracks } = req.body;
  if (!token || !name || !tracks?.length) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  spotifyApi.setAccessToken(token);
  try {
    const user = await spotifyApi.getMe();
    const playlist = await spotifyApi.createPlaylist(user.body.id, {
      name,
      description: 'Created with Spotify Playlist tool',
      public: false,
    });
    const playlistId = playlist.body.id;

    const trackUris = [];
    for (const track of tracks) {
      const query = `${track.title} ${track.artist}`.trim();
      try {
        const search = await spotifyApi.searchTracks(query, { limit: 1 });
        if (search.body.tracks.items.length > 0) {
          trackUris.push(search.body.tracks.items[0].uri);
        }
      } catch (err) {
        console.error(`Search error for "${query}":`, err.message);
      }
    }

    if (trackUris.length > 0) {
      await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    }

    res.json({
      id: playlistId,
      name: playlist.body.name,
      url: playlist.body.external_urls.spotify,
      tracksAdded: trackUris.length,
      tracksTotal: tracks.length,
    });
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