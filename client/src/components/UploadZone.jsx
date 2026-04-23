import { useState, useRef } from 'react'
import { parseFile } from '../utils/parser.js'
import Tesseract from 'tesseract.js'
import './UploadZone.css'

export function UploadZone({ onTracksParsed }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tracks, setTracks] = useState(null)
  const [uploadMode, setUploadMode] = useState('file')
  const inputRef = useRef(null)

  const parseImageText = (text) => {
    const lines = text.split('\n').filter(l => l.trim())
    const tracks = []
    
    for (const line of lines) {
      const cleanLine = line.trim()
      if (cleanLine.length < 3) continue

      const dashMatch = cleanLine.match(/^(.+?)\s*[-–—]\s*(.+)$/)
      if (dashMatch) {
        tracks.push({ title: dashMatch[2].trim(), artist: dashMatch[1].trim() })
      } else if (cleanLine.match(/^\d+[\.)\-]\s*/)) {
        const parts = cleanLine.replace(/^\d+[\.)\-]\s*/, '').match(/^(.+?)\s*[-–—]\s*(.+)$/)
        if (parts) {
          tracks.push({ title: parts[2].trim(), artist: parts[1].trim() })
        } else {
          tracks.push({ title: cleanLine, artist: '' })
        }
      } else if (cleanLine.length > 2) {
        tracks.push({ title: cleanLine, artist: '' })
      }
    }
    return tracks
  }

  const handleImageFile = async (file) => {
    setLoading(true)
    setError(null)

    try {
      const result = await Tesseract.recognize(file, 'eng+fra', {
        logger: m => console.log('OCR:', m)
      })
      
      console.log('OCR Text:', result.data.text)
      const parsedTracks = parseImageText(result.data.text)
      console.log('Parsed from image:', parsedTracks)
      
      if (parsedTracks.length === 0) {
        setError('Aucun titre trouvé. Essayez une image plus nette.')
        return
      }
      
      setTracks(parsedTracks)
      onTracksParsed(parsedTracks)
    } catch (err) {
      setError('Erreur OCR: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return

    const ext = file.name.toLowerCase().split('.').pop()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Format non supporté. Utilisez .xlsx ou .csv')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const parsedTracks = await parseFile(file)
      console.log('Parsed from file:', parsedTracks)
      setTracks(parsedTracks)
      onTracksParsed(parsedTracks)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    
    if (uploadMode === 'image') {
      if (!file.type.startsWith('image/')) {
        setError('Sélectionnez une image')
        return
      }
      handleImageFile(file)
    } else {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (uploadMode === 'image') {
      if (!file.type.startsWith('image/')) {
        setError('Sélectionnez une image')
        return
      }
      handleImageFile(file)
    } else {
      handleFiles(e.target.files)
    }
  }

  const acceptTypes = uploadMode === 'image' ? 'image/*' : '.xlsx,.xls,.csv'
  const acceptLabel = uploadMode === 'image' ? 'une image de playlist' : 'un fichier Excel ou CSV'

  return (
    <div className="upload-container">
      <div className="mode-switch">
        <button 
          className={uploadMode === 'file' ? 'active' : ''} 
          onClick={() => { setUploadMode('file'); setTracks(null); setError(null); }}
        >
          📄 Fichier
        </button>
        <button 
          className={uploadMode === 'image' ? 'active' : ''} 
          onClick={() => { setUploadMode('image'); setTracks(null); setError(null); }}
        >
          🖼️ Image
        </button>
      </div>
      
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleChange}
          hidden
        />
        {loading ? (
          <p>Chargement OCR en cours...</p>
        ) : (
          <>
            <p className="upload-icon">{uploadMode === 'image' ? '🖼️' : '📁'}</p>
            <p>Glissez {acceptLabel} ici</p>
            <p className="upload-hint">ou cliquez pour sélectionner</p>
          </>
        )}
      </div>

      {error && <div className="upload-error">{error}</div>}

      {tracks && !error && (
        <div className="tracks-preview">
          <h3>{tracks.length} pistes trouvées</h3>
          <ul>
            {tracks.slice(0, 5).map((track, i) => (
              <li key={i}>
                <strong>{track.title}</strong>
                {track.artist && <span> - {track.artist}</span>}
              </li>
            ))}
            {tracks.length > 5 && (
              <li className="more">...et {tracks.length - 5} autres</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}