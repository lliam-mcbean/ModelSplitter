import React, { useState, useRef } from 'react'
import ModelViewer from '../ModelViewer'
import TileViewer from '../TileViewer'
import SpatialTools from '../SpatialTools'
import TileControls from '../TileControls'
import ModelControls from '../ModelControls'
import { SpatialSplitter } from '../../utils/spatialSplitter'

export default function Upload() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [selectedFileIndex, setSelectedFileIndex] = useState(0)
  const [error, setError] = useState('')
  const [tiles, setTiles] = useState(null)
  const [tileVisibility, setTileVisibility] = useState({})
  const [modelVisibility, setModelVisibility] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)
  const spatialSplitter = useRef(new SpatialSplitter())

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (files) => {
    setError('')
    
    const validFiles = []
    const errors = []
    
    files.forEach((file) => {
      // Validate file type
      const validExtensions = ['.gltf', '.glb']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        errors.push(`${file.name}: Invalid file type. Please upload GLTF files (.gltf or .glb)`)
        return
      }

      // Validate file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size must be less than 100MB`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => {
        const newFiles = [...prev, ...validFiles]
        // Initialize visibility for new files
        const newVisibility = {}
        newFiles.forEach((_, index) => {
          newVisibility[index] = true
        })
        setModelVisibility(newVisibility)
        return newFiles
      })
      if (uploadedFiles.length === 0) {
        setSelectedFileIndex(0)
      }
      console.log('GLTF files uploaded:', validFiles.map(f => f.name))
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    
    // Update model visibility for remaining files
    const newVisibility = {}
    newFiles.forEach((_, i) => {
      const originalIndex = uploadedFiles.findIndex((_, origI) => origI === i)
      newVisibility[i] = modelVisibility[originalIndex] !== false
    })
    setModelVisibility(newVisibility)
    
    if (newFiles.length === 0) {
      setTiles(null)
      setTileVisibility({})
      setSelectedFileIndex(0)
    } else if (selectedFileIndex >= newFiles.length) {
      setSelectedFileIndex(newFiles.length - 1)
    }
    
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAllFiles = () => {
    setUploadedFiles([])
    setTiles(null)
    setTileVisibility({})
    setModelVisibility({})
    setSelectedFileIndex(0)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSplitModel = async (gridSize) => {
    if (uploadedFiles.length === 0) return

    setIsProcessing(true)
    setError('')

    try {
      console.log(`Starting spatial split with ${gridSize}x${gridSize} grid`)
      
      // Split the currently selected file
      const currentFile = uploadedFiles[selectedFileIndex]
      const splitTiles = await spatialSplitter.current.splitGlbIntoTiles(currentFile, gridSize)
      setTiles(splitTiles)
      
      // Initialize visibility for all tiles
      const initialVisibility = {}
      splitTiles.forEach((_, index) => {
        initialVisibility[index] = true
      })
      setTileVisibility(initialVisibility)
      
      console.log(`Model split into ${splitTiles.length} spatial tiles:`, splitTiles)
    } catch (err) {
      setError(`Failed to split model: ${err.message}`)
      console.error('Split error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleTile = (index, forceVisible = null) => {
    setTileVisibility(prev => ({
      ...prev,
      [index]: forceVisible !== null ? forceVisible : !prev[index]
    }))
  }

  const handleToggleModel = (index, forceVisible = null) => {
    setModelVisibility(prev => ({
      ...prev,
      [index]: forceVisible !== null ? forceVisible : !prev[index]
    }))
  }

  const handleExportTile = async (tile) => {
    try {
      console.log('Exporting tile:', tile.name, tile)
      console.log('Tile scene children:', tile.scene?.children?.length)
      
      const blob = await spatialSplitter.current.exportTile(tile)
      console.log('Export blob created:', blob, 'Size:', blob.size)
      
      if (blob.size === 0) {
        throw new Error('Exported file is empty')
      }
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tile.name.toLowerCase().replace(/\s+/g, '_')}.glb`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(`Failed to export tile: ${err.message}`)
      console.error('Export error:', err)
    }
  }

  const handleExportAllTiles = async () => {
    if (!tiles || tiles.length === 0) return

    try {
      // Export all tiles
      for (const tile of tiles) {
        await handleExportTile(tile)
        // Small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (err) {
      setError(`Failed to export tiles: ${err.message}`)
      console.error('Export error:', err)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Upload Section */}
      <div className="w-full max-w-md mx-auto">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : uploadedFiles.length > 0 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".gltf,.glb"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          
          {uploadedFiles.length > 0 ? (
            <div className="space-y-4">
              <div className="text-green-600">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                </p>
                <p className="text-sm text-gray-500">
                  Total size: {(uploadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={removeAllFiles}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove all
                </button>
                <button
                  onClick={handleButtonClick}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Add more files
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Upload GLTF Model
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your .gltf or .glb files here, or click to browse
                </p>
              </div>
              <button
                onClick={handleButtonClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Choose Files
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">
              {uploadedFiles.length} GLTF file{uploadedFiles.length !== 1 ? 's' : ''} ready for processing!
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedFileIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFileIndex(index)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedFileIndex === index && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Selected
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Model/Tile Viewer */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {tiles ? 'Spatial Tiles' : '3D Model Preview'}
            </h3>
            <div className="mb-2 text-center text-sm text-gray-600">
              {tiles ? `Viewing tiles from: ${uploadedFiles[selectedFileIndex]?.name}` : `Viewing ${uploadedFiles.length} model${uploadedFiles.length !== 1 ? 's' : ''}`}
            </div>
            {tiles ? (
              <TileViewer 
                tiles={tiles}
                tileVisibility={tileVisibility}
              />
            ) : (
              <ModelViewer 
                files={uploadedFiles} 
                modelVisibility={modelVisibility}
              />
            )}
            <div className="mt-2 text-center text-sm text-gray-500">
              <p>Use mouse to rotate, scroll to zoom, right-click to pan</p>
            </div>
          </div>

          {/* Tools and Controls Panel */}
          <div className="space-y-6">
            {/* Model Controls */}
            {!tiles && (
              <ModelControls
                files={uploadedFiles}
                modelVisibility={modelVisibility}
                onToggleModel={handleToggleModel}
              />
            )}

            {/* Spatial Tools Panel */}
            <SpatialTools 
              onSplitModel={handleSplitModel}
              isProcessing={isProcessing}
              tiles={tiles}
              currentFileName={uploadedFiles[selectedFileIndex]?.name}
            />

            {/* Tile Controls */}
            {tiles && tiles.length > 0 && (
              <TileControls
                tiles={tiles}
                tileVisibility={tileVisibility}
                onToggleTile={handleToggleTile}
                onExportTile={handleExportTile}
                onExportAll={handleExportAllTiles}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
