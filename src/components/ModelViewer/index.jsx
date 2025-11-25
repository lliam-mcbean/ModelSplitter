import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

// Model component that loads and displays the GLTF
function Model({ url, position = [0, 0, 0], visible = true }) {
  const { scene } = useGLTF(url)

  return (
    <primitive 
      object={scene} 
      scale={1} 
      position={position}
      visible={visible}
    />
  )
}

// Main ModelViewer component
export default function ModelViewer({ files = [], modelVisibility = {} }) {
  const [modelUrls, setModelUrls] = useState({})

  useEffect(() => {
    const urls = {}
    
    files.forEach((file, index) => {
      if (file) {
        const url = URL.createObjectURL(file)
        urls[index] = url
      }
    })
    
    setModelUrls(urls)
    
    return () => {
      // Clean up URLs when component unmounts or files change
      Object.values(urls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  if (files.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No models loaded</p>
      </div>
    )
  }

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          {/* Environment for reflections */}
          <Environment preset="studio" />
          
          {/* Models */}
          {files.map((file, index) => {
            const url = modelUrls[index]
            if (!url) return null
            
            // Position all models at origin to allow proper alignment of split tiles
            // Models contain their world-space coordinates in their geometry
            
            return (
              <Model 
                key={index}
                url={url} 
                position={[0, 0, 0]}
                visible={modelVisibility[index] !== false}
              />
            )
          })}
          
          {/* Camera controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>
      
      {/* Loading overlay */}
      <Suspense fallback={
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <div></div>
      </Suspense>
    </div>
  )
}
