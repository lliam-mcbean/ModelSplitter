# GLTF Model Converter

A powerful web application for processing and splitting 3D GLTF/GLB models into spatial chunks. Built with React, Three.js, and Vite.

## Features

### 🎨 3D Model Viewer
- Upload and preview multiple GLTF/GLB files simultaneously
- Interactive 3D viewer with orbit controls (rotate, zoom, pan)
- Toggle visibility of individual models
- Support for materials, textures, and lighting

### ✂️ Spatial Splitting
- **Split models into 4 spatial chunks** using a 2x2 grid system
- Divides models along the XZ plane while preserving full Y-axis height
- Maintains exact geometry positions in world space
- Triangle-based splitting ensures accurate spatial distribution

### 📦 Tile Management
- Visual preview of all generated tiles
- Individual tile visibility controls
- Detailed tile information (position, mesh count, triangle count, size)
- Toggle all tiles on/off at once

### 💾 Export Capabilities
- Export individual tiles as separate GLB files
- Batch export all tiles at once
- **Re-importable tiles** - Upload split chunks to reconstruct the original model
- Tiles maintain correct spatial alignment when re-uploaded together

### 🎯 Use Cases
- Optimize large 3D models for web streaming
- Create level-of-detail (LOD) systems
- Implement spatial culling for better performance
- Distribute model loading across multiple requests
- Process models for game engines or 3D applications

## Technical Details

### How Spatial Splitting Works
1. Computes the overall bounding box of the entire model
2. Divides the model into a 2×2 spatial grid (4 chunks)
3. For each grid cell, identifies all triangles that intersect with that region
4. Bakes world transforms into geometry to preserve exact positions
5. Exports each chunk as a separate GLB file with geometry in absolute world coordinates

### When Re-Uploading Split Tiles
- All tiles are positioned at origin `(0, 0, 0)`
- Geometry contains absolute world-space coordinates
- Multiple tiles seamlessly reconstruct the original model
- No gaps or misalignment between chunks

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for react-three-fiber
- **Tailwind CSS** - Styling

## File Size Limits

- Maximum file size: 100MB per model
- Supports `.gltf` and `.glb` file formats
- Multiple file uploads supported

## Browser Compatibility

Works in all modern browsers with WebGL support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
