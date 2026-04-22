# Validation: Upload & Parsing

## Critères de Succès

### File Upload
- [ ] Zone drag&drop visible sur page login
- [ ] Glisser un fichier .xlsx fonctionne
- [ ] Glisser un fichier .csv fonctionne
- [ ] Click sur zone ouvre sélecteur fichier
- [ ] Feedback visuel pendant drag

### Parsing
- [ ] Fichier .xlsx parsé correctement
- [ ] Fichier .csv parsé correctement
- [ ] Colonnes Titre et Artiste détectées
- [ ] Lignes vides ignorées

### Validation
- [ ] Message d'erreur si colonnes manquantes
- [ ] Aperçu affiche les tracks trouvés
- [ ] Nombre de tracks affiché

## Tests Manuels

1. **Excel**: Créer .xlsx avec 3 lignes → Upload → Preview affiche 3 tracks
2. **CSV**: Créer .csv avec 3 lignes → Upload → Preview affiche 3 tracks
3. **Erreur**: Fichier sans colonnes → Message d'erreur affiché