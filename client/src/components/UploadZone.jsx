import { useState, useRef } from 'react'
import { parseFile } from '../utils/parser.js'
import './UploadZone.css'

export function UploadZone({ onTracksParsed }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tracks, setTracks] = useState(null)
  const inputRef = useRef(null)

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
    handleFiles(e.dataTransfer.files)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    handleFiles(e.target.files)
  }

  return (
    <div className="upload-container">
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
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          hidden
        />
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <p className="upload-icon">📁</p>
            <p>Glissez un fichier Excel ou CSV ici</p>
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