# Tech Stack

## Frontend
- **Framework**: React (Vite)
- **Styling**: CSS Modules / Styled Components
- **State**: React Context ou Zustand

## Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **API**: REST

## Spotify Integration
- Spotify Web API
- OAuth 2.0 (Authorization Code Flow)

## Data Processing
- SheetJS (xlsx) pour parsing Excel/CSV
- CSV parser (papaparse)

## Architecture
```
client/          - React frontend
server/          - Express API
├── auth/        - OAuth handling
├── spotify/     - Spotify API client
└── routes/      - API routes
```