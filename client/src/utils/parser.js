import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const TITLE_SYNONYMS = ['titre', 'title', 'track', 'name', 'song', 'chanson'];
const ARTIST_SYNONYMS = ['artiste', 'artist', 'performer', 'interprète'];

function normalizeColumnName(name) {
  return name?.toString().toLowerCase().trim() || '';
}

function findColumn(headers, synonyms) {
  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    if (synonyms.some(s => normalized.includes(s) || s.includes(normalized))) {
      return header;
    }
  }
  return null;
}

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => resolve(results.data),
      error: reject,
      header: false,
    });
  });
}

export async function parseFile(file) {
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  const data = isCsv ? await parseCsv(file) : await parseExcel(file);

  if (!data || data.length === 0) {
    throw new Error('File is empty');
  }

  const headers = data[0].map(h => h?.toString() || '');
  const titleCol = findColumn(headers, TITLE_SYNONYMS);
  const artistCol = findColumn(headers, ARTIST_SYNONYMS);

  if (!titleCol) {
    throw new Error('Colonne "Titre" non trouvée. Colonnes attendues: Titre, Artiste');
  }

  const tracks = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const title = row[headers.indexOf(titleCol)]?.toString().trim();
    const artist = artistCol ? row[headers.indexOf(artistCol)]?.toString().trim() : '';

    if (title) {
      tracks.push({ title, artist });
    }
  }

  if (tracks.length === 0) {
    throw new Error('Aucune piste valide trouvée');
  }

  return tracks;
}