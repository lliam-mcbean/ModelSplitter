import React from 'react'

export default function ModelControls({ files, modelVisibility, onToggleModel }) {
  if (!files || files.length === 0) {
    return null
  }

  const modelColors = [
    { bg: 'bg-red-500', text: 'text-red-700' },
    { bg: 'bg-teal-500', text: 'text-teal-700' },
    { bg: 'bg-blue-500', text: 'text-blue-700' },
    { bg: 'bg-green-500', text: 'text-green-700' },
    { bg: 'bg-yellow-500', text: 'text-yellow-700' },
    { bg: 'bg-pink-500', text: 'text-pink-700' },
    { bg: 'bg-indigo-500', text: 'text-indigo-700' },
    { bg: 'bg-purple-500', text: 'text-purple-700' },
    { bg: 'bg-cyan-500', text: 'text-cyan-700' },
    { bg: 'bg-orange-500', text: 'text-orange-700' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h4 className="text-md font-medium text-gray-700 mb-4">Model Controls</h4>
      
      <div className="space-y-3">
        {files.map((file, index) => {
          const color = modelColors[index % modelColors.length]
          const isVisible = modelVisibility[index] !== false
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {/* Color indicator */}
                <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                
                {/* Model info */}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {/* Visibility toggle */}
              <button
                onClick={() => onToggleModel(index)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isVisible
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          )
        })}
      </div>
      
      {/* Global controls */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => files.forEach((_, index) => onToggleModel(index, true))}
            className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => files.forEach((_, index) => onToggleModel(index, false))}
            className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Hide All
          </button>
        </div>
      </div>
    </div>
  )
}




