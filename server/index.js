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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});