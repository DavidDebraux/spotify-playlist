import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

const scopes = [
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'user-read-email',
].join(' ');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export function getAuthorizeURL() {
  return spotifyApi.createAuthorizeURL(scopes, 'state');
}

export default spotifyApi;