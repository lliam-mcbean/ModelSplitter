import React from 'react'

export default function TileControls({ 
  tiles, 
  tileVisibility, 
  onToggleTile, 
  onExportTile, 
  onExportAll 
}) {
  if (!tiles || tiles.length === 0) return null

  const allVisible = tiles.every((_, index) => tileVisibility[index])
  const allHidden = tiles.every((_, index) => !tileVisibility[index])

  const handleToggleAll = () => {
    if (allVisible) {
      // Hide all
      tiles.forEach((_, index) => onToggleTile(index, false))
    } else {
      // Show all
      tiles.forEach((_, index) => onToggleTile(index, true))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Tile Controls</h3>
        <span className="text-sm text-gray-500">{tiles.length} tile{tiles.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Toggle All Button */}
      <button
        onClick={handleToggleAll}
        className="w-full py-2 px-4 rounded-md font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
      >
        {allVisible ? 'Hide All' : allHidden ? 'Show All' : 'Show All'}
      </button>

      {/* Individual Tile Controls */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tiles.map((tile, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-2 transition-colors ${
              tileVisibility[index]
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleTile(index)}
                  className="flex items-center space-x-2"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    tileVisibility[index]
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {tileVisibility[index] && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{tile.name}</span>
                </button>
              </div>
            </div>

            {/* Tile Info */}
            <div className="text-xs text-gray-600 space-y-1 mb-2">
              <div className="flex justify-between">
                <span>Position:</span>
                <span className="font-mono">({tile.position.x}, {tile.position.z})</span>
              </div>
              {tile.meshCount !== undefined && (
                <div className="flex justify-between">
                  <span>Meshes:</span>
                  <span>{tile.meshCount}</span>
                </div>
              )}
              {tile.triangleCount !== undefined && (
                <div className="flex justify-between">
                  <span>Triangles:</span>
                  <span>{tile.triangleCount.toLocaleString()}</span>
                </div>
              )}
              {tile.size !== undefined && (
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{tile.size.toFixed(2)} units</span>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={() => onExportTile(tile)}
              className="w-full py-1.5 px-3 rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              Export {tile.name}
            </button>
          </div>
        ))}
      </div>

      {/* Export All Button */}
      <button
        onClick={onExportAll}
        className="w-full py-2 px-4 rounded-md font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
      >
        Export All Tiles ({tiles.length})
      </button>
    </div>
  )
}

