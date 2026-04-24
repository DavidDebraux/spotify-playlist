# Roadmap

## Phase 1: Setup & Auth (Priorité haute)
- [x] Initialiser projet React + Express
- [x] Configurer OAuth Spotify
- [x] Page de connexion avec bouton "Connect to Spotify"
- [x] Gestion du token d'accès

## Phase 2: Upload & Parsing (Priorité haute)
- [x] Zone drag&drop pour upload
- [x] Support format .xlsx et .csv
- [x] Parser les colonnes titre/artiste
- [x] Validation des données

## Phase 3: Upload Image/OCR (Priorité haute)
- [x] Zone upload image (photo playlist écrite/imprimée)
- [x] Intégration Tesseract.js pour OCR
- [x] Parser le texte extrait vers titre/artiste
- [ ] Validation et correction manuelle

## Phase 4: Création Playlist (Priorité haute)
- [x] Créer playlist via API Spotify
- [x] Rechercher tracks (search endpoint)
- [x] Ajouter tracks à la playlist
- [x] Feedback utilisateur (succès/erreurs)

## Phase 5: Liste Existantes (Priorité moyenne)
- [x] Récupérer playlists de l'utilisateur
- [x] Interface de sélection
- [x] Ajout à playlist existante

## Phase 6: Améliorations
- [ ] Gestion des erreurs (track non trouvé)
- [x] UI/UX responsive (2 colonnes sur desktop)
- [ ] Refresh CSS et apparence générale
- [ ] Tests