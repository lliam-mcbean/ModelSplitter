import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

export class SpatialSplitter {
  constructor() {
    this.loader = new GLTFLoader()
    this.exporter = new GLTFExporter()
  }

  intersectsAABB(aMin, aMax, bMin, bMax) {
    return (aMin.x <= bMax.x && aMax.x >= bMin.x) &&
           (aMin.y <= bMax.y && aMax.y >= bMin.y) &&
           (aMin.z <= bMax.z && aMax.z >= bMin.z)
  }

  cloneSubsetGeometry(geometry, triIndices) {
    // geometry: BufferGeometry with index
    // triIndices: array of triangle indices (each index is a *triangle* number, not vertex index)
    const index = geometry.index.array
    const posAttr = geometry.attributes.position
    const normAttr = geometry.attributes.normal
    const uvAttr = geometry.attributes.uv

    const used = new Map() // oldIndex -> newIndex
    const newIndices = []
    const positions = []
    const normals = normAttr ? [] : null
    const uvs = uvAttr ? [] : null

    const addVertex = (oldIdx) => {
      if (used.has(oldIdx)) return used.get(oldIdx)
      const newIdx = used.size
      used.set(oldIdx, newIdx)
      // position (vec3)
      positions.push(
        posAttr.getX(oldIdx), posAttr.getY(oldIdx), posAttr.getZ(oldIdx)
      )
      if (normals) {
        normals.push(
          normAttr.getX(oldIdx), normAttr.getY(oldIdx), normAttr.getZ(oldIdx)
        )
      }
      if (uvs) {
        uvs.push(uvAttr.getX(oldIdx), uvAttr.getY(oldIdx))
      }
      return newIdx
    }

    for (const tri of triIndices) {
      const i0 = index[tri * 3 + 0]
      const i1 = index[tri * 3 + 1]
      const i2 = index[tri * 3 + 2]
      newIndices.push(
        addVertex(i0), addVertex(i1), addVertex(i2)
      )
    }

    const out = new THREE.BufferGeometry()
    out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    if (normals) out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    if (uvs) out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    out.setIndex(new THREE.Uint32BufferAttribute(newIndices, 1))
    out.computeBoundingBox()
    out.computeBoundingSphere()
    return out
  }

  bakeWorldTransform(geom, matrixWorld) {
    const g = geom.clone()
    g.applyMatrix4(matrixWorld)
    // After baking, clear transform on the mesh that will hold this geometry
    return g
  }

  trianglesInTile(geometry, tileMin, tileMax) {
    // Very simple tri-AABB test using per-triangle min/max from positions.
    const pos = geometry.attributes.position
    const index = geometry.index.array
    const tris = []

    const tMin = new THREE.Vector3()
    const tMax = new THREE.Vector3()
    const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]

    for (let tri = 0; tri < index.length / 3; tri++) {
      const i0 = index[tri*3+0], i1 = index[tri*3+1], i2 = index[tri*3+2]

      v[0].set(pos.getX(i0), pos.getY(i0), pos.getZ(i0))
      v[1].set(pos.getX(i1), pos.getY(i1), pos.getZ(i1))
      v[2].set(pos.getX(i2), pos.getY(i2), pos.getZ(i2))

      tMin.set(
        Math.min(v[0].x, v[1].x, v[2].x),
        Math.min(v[0].y, v[1].y, v[2].y),
        Math.min(v[0].z, v[1].z, v[2].z)
      )
      tMax.set(
        Math.max(v[0].x, v[1].x, v[2].x),
        Math.max(v[0].y, v[1].y, v[2].y),
        Math.max(v[0].z, v[1].z, v[2].z)
      )

      if (this.intersectsAABB(tMin, tMax, tileMin, tileMax)) {
        tris.push(tri)
      }
    }
    return tris
  }

  downloadBlob(blob, filename) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async splitGlbIntoTiles(file) {
    try {
      console.log('Loading GLB file for spatial splitting...')
      
      // Create object URL from file
      const url = URL.createObjectURL(file)
      const { scene } = await this.loader.loadAsync(url)
      URL.revokeObjectURL(url) // Clean up

      // Collect all Meshes and bake their world transforms
      const meshes = []
      scene.traverse(o => {
        if (o.isMesh && o.geometry && o.geometry.index) {
          meshes.push(o)
        }
      })

      console.log(`Found ${meshes.length} meshes to process`)

      // Compute overall bounding box
      const overallBBox = new THREE.Box3()
      for (const mesh of meshes) {
        mesh.updateMatrixWorld(true)
        const meshBox = new THREE.Box3().setFromObject(mesh)
        overallBBox.union(meshBox)
      }

      console.log('Overall bounds:', overallBBox)

      // Create 2x2 grid (4 tiles)
      const gridSize = 2
      const tiles = []
      
      const xSize = (overallBBox.max.x - overallBBox.min.x) / gridSize
      const zSize = (overallBBox.max.z - overallBBox.min.z) / gridSize

      for (let ix = 0; ix < gridSize; ix++) {
        for (let iz = 0; iz < gridSize; iz++) {
          const tileMin = new THREE.Vector3(
            overallBBox.min.x + ix * xSize,
            overallBBox.min.y, // Keep full Y range
            overallBBox.min.z + iz * zSize
          )
          const tileMax = new THREE.Vector3(
            overallBBox.min.x + (ix + 1) * xSize,
            overallBBox.max.y, // Keep full Y range
            overallBBox.min.z + (iz + 1) * zSize
          )

          console.log(`Processing tile (${ix}, ${iz})`)

          // Collect all triangles from all meshes that intersect this tile
          const tileScene = new THREE.Scene()
          let totalTriangles = 0

          for (const mesh of meshes) {
            // Bake world transform into geometry
            const bakedGeom = this.bakeWorldTransform(mesh.geometry, mesh.matrixWorld)
            
            // Find triangles in this tile
            const tris = this.trianglesInTile(bakedGeom, tileMin, tileMax)
            
            if (tris.length > 0) {
              console.log(`  Mesh has ${tris.length} triangles in this tile`)
              totalTriangles += tris.length
              
              // Clone subset of geometry for these triangles
              // Keep geometry in absolute world coordinates
              const subsetGeom = this.cloneSubsetGeometry(bakedGeom, tris)
              
              // Create mesh with the subset geometry
              // Keep at origin since geometry is already in world space
              const tileMesh = new THREE.Mesh(subsetGeom, mesh.material)
              tileMesh.position.set(0, 0, 0)
              tileMesh.rotation.set(0, 0, 0)
              tileMesh.scale.set(1, 1, 1)
              
              tileScene.add(tileMesh)
            }
          }

          if (totalTriangles > 0) {
            console.log(`Tile (${ix}, ${iz}) has ${totalTriangles} total triangles`)
            
            tiles.push({
              scene: tileScene,
              bounds: {
                min: tileMin.clone(),
                max: tileMax.clone()
              },
              position: {
                x: ix,
                z: iz
              },
              center: new THREE.Vector3(
                (tileMin.x + tileMax.x) / 2,
                (tileMin.y + tileMax.y) / 2,
                (tileMin.z + tileMax.z) / 2
              ),
              size: Math.max(xSize, zSize),
              meshCount: tileScene.children.length,
              triangleCount: totalTriangles,
              name: `Tile_${ix}_${iz}`
            })
          } else {
            console.log(`Tile (${ix}, ${iz}) is empty, skipping`)
          }
        }
      }

      console.log(`Created ${tiles.length} spatial tiles from 2x2 grid`)
      return tiles

    } catch (error) {
      console.error('Error splitting GLB into tiles:', error)
      throw error
    }
  }

  async exportTile(tile) {
    try {
      return new Promise((resolve, reject) => {
        // Ensure the scene has proper structure
        if (!tile.scene || tile.scene.children.length === 0) {
          reject(new Error('Tile scene is empty or invalid'))
          return
        }

        // Clone the scene to avoid modifying the original
        const sceneClone = tile.scene.clone()
        
        // Ensure all meshes have proper geometry and materials
        sceneClone.traverse((child) => {
          if (child.isMesh) {
            if (!child.geometry || !child.material) {
              console.warn('Mesh missing geometry or material:', child)
            }
          }
        })

        this.exporter.parse(
          sceneClone,
          (result) => {
            try {
              // Check if result is valid
              if (!result) {
                reject(new Error('Export result is null or undefined'))
                return
              }

              // Ensure result is an ArrayBuffer
              let arrayBuffer
              if (result instanceof ArrayBuffer) {
                arrayBuffer = result
              } else if (result.buffer instanceof ArrayBuffer) {
                arrayBuffer = result.buffer
              } else {
                console.error('Invalid export result type:', typeof result, result)
                reject(new Error('Export result is not a valid ArrayBuffer'))
                return
              }

              const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' })
              resolve(blob)
            } catch (parseError) {
              console.error('Error processing export result:', parseError)
              reject(parseError)
            }
          },
          (error) => {
            console.error('GLTFExporter error:', error)
            reject(error)
          },
          { 
            binary: true, 
            onlyVisible: false, 
            trs: false, // Bake transforms into geometry so each tile is at absolute world position
            includeCustomExtensions: false
          }
        )
      })
    } catch (error) {
      console.error('Error exporting tile:', error)
      throw error
    }
  }

}
