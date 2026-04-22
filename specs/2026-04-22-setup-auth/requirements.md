# Requirements: Setup & Auth

## Périmètre

### Must Have
- Structure client/server fonctionnelle
- Auth Spotify OAuth 2.0 Authorization Code Flow
- Page login avec bouton de connexion
- Token stocké et utilisé pour les requêtes API
- Redirect handler fonctionnel

### Nice to Have
- Gestion du refresh token automatique
- Display user info (pseudo, avatar)
- Logout functionality

## Décisions

### Architecture
- **OAuth Flow**: Authorization Code avec PKCE pour sécurité
- **Token Storage**: localStorage (plussimple) ou sessionStorage
- **Redirect**: SPA handling (pas de route serveur dédiée pour callback)

### Stack Technique
- Client: React + Vite
- Server: Express
- Spotify API: spotify-web-api-node (lib)

### Scopes Spotify requis
```
playlist-modify-public
playlist-modify-private
playlist-read-private
user-read-email
```

## Contexte

- Application Single Page
- Pas de base de données pour MVP
- Credentials OAuth en variables d'environnement
- Le client OAuth Spotify se fait via redirect server (plus simple)