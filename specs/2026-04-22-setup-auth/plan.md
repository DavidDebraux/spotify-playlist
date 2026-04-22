# Plan: Setup & Auth

## Groupe 1: Initialisation Projet
- [x] 1.1 Créer la structure directories (client/, server/)
- [x] 1.2 Initialiser React avec Vite
- [x] 1.3 Initialiser Express server
- [x] 1.4 Configurer proxyAPI pour développement

## Groupe 2: Configuration OAuth Spotify
- [x] 2.1 Créer app Spotify sur developer.spotify.com
- [x] 2.2 Stocker credentials OAuth (CLIENT_ID, CLIENT_SECRET)
- [x] 2.3.Configurer redirect URIs et scopes
- [x] 2.4 Générer authorization URL

## Groupe 3: Frontend - Page Connexion
- [x] 3.1 Créer page Login avec bouton "Connect to Spotify"
- [x] 3.2 Implémenter redirection OAuth
- [x] 3.3 Gérer le callback et exchange code -> token
- [x] 3.4 Stocker token (localStorage/session)

## Groupe 4: Backend - Auth Handling
- [x] 4.1 Créer endpoint /auth/login (redirect vers Spotify)
- [x] 4.2 Créer endpoint /auth/callback (exchange code)
- [x] 4.3 Stocker refresh token
- [x] 4.4 Gérer token refresh automatique

## Groupe 5: Estado Global
- [x] 5.1 Créer AuthContext React
- [x] 5.2 Vérifier connexion au chargement
- [x] 5.3 Fournir isAuthenticated, user info