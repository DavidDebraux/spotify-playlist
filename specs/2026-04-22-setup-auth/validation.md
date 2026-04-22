# Validation: Setup & Auth

## Critères de Succès

### Setup Projet
- [x] `npm run dev` lance client React sur port 5173
- [x] `npm run server` (ou start) lance Express sur port 8888
- [x] Client peut appeler `/api/*` endpoints

### OAuth Flow
- [x] Page login affiche bouton "Connect to Spotify"
- [x] Click bouton -> redirect vers Spotify authorization page
- [x] Après approval -> redirect vers app avec token en hash ou callback
- [x] User info display (nom, avatar) après connexion

### Mergeable
- [x] Code builds sans erreur (`npm run build`)
- [x] Pas de console errors au runtime
- [x] OAuth credentials configurables via .env

## Tests Manuels

1. **Connexion**: Bouton click -> Spotify login page -> Return token -> Logged in
2. **Persistance**: Rafraîchir page -> Still logged in (si token valide)
3. **Logout**: Clear session -> Return to login page

## Checkpoints Code Review

- Credentials NON hardcodés
- Token NON exposé en URL (utiliser hash ou server exchange)
- Scopes appropriés demandés
- Error handling sur token exchange