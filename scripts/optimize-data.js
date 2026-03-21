import { readFileSync, writeFileSync } from 'fs'
import { topology } from 'topojson-server'
import { presimplify, simplify, quantile } from 'topojson-simplify'

const DATA_DIR = new URL('../public/data/', import.meta.url).pathname

function cleanFeatures(geojson) {
  return {
    ...geojson,
    features: geojson.features.filter(f => {
      const g = f.geometry
      if (!g || !g.coordinates) return false
      if (g.type === 'Point') return g.coordinates.length >= 2
      if (g.type === 'LineString') return g.coordinates.length >= 2
      if (g.type === 'Polygon') return g.coordinates.length > 0 && g.coordinates[0].length >= 4
      if (g.type === 'MultiPolygon') return g.coordinates.length > 0
      if (g.type === 'MultiLineString') return g.coordinates.length > 0
      return true
    })
  }
}

const files = [
  { input: 'concesiones_salmones.geojson', output: 'concesiones_salmones.topojson', name: 'concesiones', doSimplify: true },
  { input: 'areas_apropiadas.geojson', output: 'areas_apropiadas.topojson', name: 'areas', doSimplify: false },
  { input: 'amp_nacional.geojson', output: 'amp_nacional.topojson', name: 'amp', doSimplify: true },
]

for (const file of files) {
  const inputPath = DATA_DIR + file.input
  const outputPath = DATA_DIR + file.output

  console.log(`\nProcessing ${file.input}...`)
  const raw = JSON.parse(readFileSync(inputPath, 'utf-8'))
  const geojson = cleanFeatures(raw)
  const inputSize = readFileSync(inputPath).length
  console.log(`  Features: ${raw.features.length} → ${geojson.features.length} (after cleaning)`)
  console.log(`  Input size: ${(inputSize / 1024).toFixed(0)} KB`)

  const topo = topology({ [file.name]: geojson }, 1e5)

  let result = topo
  if (file.doSimplify) {
    try {
      const pre = presimplify(topo)
      const minWeight = quantile(pre, 0.05)
      result = simplify(pre, minWeight)
    } catch (e) {
      console.log(`  Simplification failed: ${e.message}`)
    }
  }

  const output = JSON.stringify(result)
  writeFileSync(outputPath, output)
  console.log(`  Output size: ${(output.length / 1024).toFixed(0)} KB`)
  console.log(`  Reduction: ${(100 - (output.length / inputSize) * 100).toFixed(0)}%`)
}

console.log('\nDone!')
