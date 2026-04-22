# Requirements: Upload & Parsing

## Périmètre

### Must Have
- Zone drag&drop pour fichier .xlsx et .csv
- Support format Excel (.xlsx) et CSV (.csv)
- Colonnes attendues: "Titre" et "Artiste" (ou synonymes)
- Preview des tracks trouvés avant création

### Nice to Have
- Détection automatique des colonnes
- Support autres formats (Google Sheets export)
- Édition manuelle avant création

## Décisions

### Format fichier attendu
```
| Titre                    | Artiste           |
|-------------------------|-----------------|
| Bohemian Rhapsody        | Queen           |
| Imagine               | John Lennon     |
```

### Synonymes acceptés
- Titre: "Title", "Track", "Name", "Song"
- Artiste: "Artist", "Artist Name", "Performer"

### libraries
- **xlsx**: SheetJS pour parsing Excel
- **papaparse**: pour CSV

### Validation
- Minimum 1 ligne valide requise
- Avertir si colonnes non trouvées
- Ignorer lignes sans Titre