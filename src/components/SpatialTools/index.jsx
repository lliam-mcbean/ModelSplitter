import React from 'react'

export default function SpatialTools({ onSplitModel, isProcessing, tiles, currentFileName }) {
  const handleSplit = () => {
    onSplitModel()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Spatial Model Tools</h3>
      
      {/* Split Model Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Split Model into Spatial Tiles</h4>
        {currentFileName && (
          <p className="text-sm text-gray-600">
            Splitting: <span className="font-medium">{currentFileName}</span>
          </p>
        )}
        
        <div className="space-y-3">
          <button
            onClick={handleSplit}
            disabled={isProcessing}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Split into 4 Spatial Chunks (2x2 Grid)'}
          </button>
        </div>
      </div>

      {/* Tiles Info */}
      {tiles && tiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Spatial Tiles ({tiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tiles.map((tile, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-sm text-gray-700">{tile.name}</span>
                  <p className="text-xs text-gray-500">
                    Position: ({tile.position.x}, {tile.position.z})
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {tile.meshCount} mesh{tile.meshCount !== 1 ? 'es' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="pt-4 border-t border-gray-200">
        <h5 className="text-sm font-medium text-gray-700 mb-2">How it works:</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Computes overall bounding box of the model</li>
          <li>• Divides into 2x2 spatial grid (4 chunks)</li>
          <li>• Each chunk contains triangles in that region</li>
          <li>• Creates separate GLB files for each chunk</li>
          <li>• Preserves geometry in world space</li>
        </ul>
      </div>
    </div>
  )
}
