import './App.css'
import Upload from './components/Upload'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          GLTF Model Converter
        </h1>
        <Upload />
      </div>
    </div>
  )
}

export default App
