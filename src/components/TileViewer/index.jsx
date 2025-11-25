import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

// Tile component for displaying individual spatial tiles
function TileModel({ tile, visible = true, color = null }) {
  const modelRef = useRef()

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = visible
    }
  }, [visible])

  if (!tile.scene) {
    return null
  }

  const hexColor = color || 0x4ecdc4

  return (
    <group ref={modelRef} position={[tile.center.x, tile.center.y, tile.center.z]}>
      {/* Render the tile scene */}
      <primitive object={tile.scene} />
      
      {/* Add wireframe bounding box */}
      <mesh>
        <boxGeometry args={[tile.size, tile.bounds.max.y - tile.bounds.min.y, tile.size]} />
        <meshBasicMaterial 
          color={hexColor} 
          wireframe={true}
          opacity={0.5}
          transparent
        />
      </mesh>
      
      {/* Corner markers */}
      {(() => {
        const halfSize = tile.size / 2
        const halfHeight = (tile.bounds.max.y - tile.bounds.min.y) / 2
        
        return (
          <>
            <mesh position={[halfSize, halfHeight, halfSize]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color={hexColor} />
            </mesh>
            <mesh position={[-halfSize, halfHeight, halfSize]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color={hexColor} />
            </mesh>
            <mesh position={[halfSize, -halfHeight, halfSize]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color={hexColor} />
            </mesh>
            <mesh position={[-halfSize, -halfHeight, halfSize]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color={hexColor} />
            </mesh>
          </>
        )
      })()}
    </group>
  )
}

// Main TileViewer component
export default function TileViewer({ tiles = null, tileVisibility = {} }) {
  if (!tiles || tiles.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No tiles loaded</p>
      </div>
    )
  }

  // Generate colors for tiles
  const tileColors = [
    0xff6b6b, // Red
    0x4ecdc4, // Teal
    0x45b7d1, // Blue
    0x96ceb4, // Green
    0xfeca57, // Yellow
    0xff9ff3, // Pink
    0x54a0ff, // Light Blue
    0x5f27cd, // Purple
    0x00d2d3, // Cyan
    0xff9f43, // Orange
    0x2ecc71, // Emerald
    0xe74c3c, // Alizarin
    0x9b59b6, // Amethyst
    0x1abc9c, // Turquoise
    0x34495e, // Wet Asphalt
    0xe67e22, // Carrot
    0x3498db, // Peter River
    0x95a5a6, // Concrete
    0xf39c12, // Orange
    0x8e44ad, // Wisteria
  ]

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          {/* Environment for reflections */}
          <Environment preset="studio" />
          
          {/* Render tiles */}
          {tiles.map((tile, index) => (
            <TileModel
              key={index}
              tile={tile}
              visible={tileVisibility[index] !== false}
              color={tileColors[index % tileColors.length]}
            />
          ))}
          
          {/* Camera controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={50}
          />
        </Suspense>
      </Canvas>
      
    </div>
  )
}
