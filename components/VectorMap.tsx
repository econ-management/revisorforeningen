'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import * as d3 from 'd3'

export default function VectorMap({
  mapType,
  onRegionClick,
  selectedEntity,
}: {
  mapType: 'fylke' | 'kommune'
  onRegionClick: (f: any) => void
  selectedEntity?: string
}) {
  const [geoData, setGeoData] = useState<any>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentTransform = useRef<d3.ZoomTransform | null>(null)

  useEffect(() => {
    (async () => {
      const url = mapType === 'fylke' ? '/counties_cleaned.json' : '/kommuner_cleaned.json'
      const res = await fetch(url)
      const json = await res.json()
      setGeoData(json)
    })()
  }, [mapType])

  useEffect(() => {
    if (!geoData || !svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    
    // Clear previous content
    svg.selectAll('*').remove()

    // Calculate bounds from UTM coordinates
    const bounds = geoData.features.reduce((acc: any, feature: any) => {
      const coords = feature.geometry.coordinates.flat(3)
      const xCoords = coords.filter((_: any, i: number) => i % 2 === 0)
      const yCoords = coords.filter((_: any, i: number) => i % 2 === 1)
      
      return {
        minX: Math.min(acc.minX, ...xCoords),
        maxX: Math.max(acc.maxX, ...xCoords),
        minY: Math.min(acc.minY, ...yCoords),
        maxY: Math.max(acc.maxY, ...yCoords)
      }
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

    // Calculate dimensions
    const countryWidth = bounds.maxX - bounds.minX
    const countryHeight = bounds.maxY - bounds.minY
    const aspectRatio = countryWidth / countryHeight
    
    // Set container dimensions
    const containerWidth = Math.min(800, containerRect.width)
    const containerHeight = containerWidth / aspectRatio
    
    // Calculate initial scale to fit the country
    const scale = containerWidth / countryWidth
    
    // Calculate offset to center the country
    const offsetX = -bounds.minX * scale
    const offsetY = -bounds.minY * scale

    // Create projection function
    const project = (x: number, y: number) => [
      x * scale + offsetX,
      containerHeight - (y * scale + offsetY)
    ]

    // Convert coordinate array to SVG path
    const coordinatesToPath = (coordinates: number[][]): string => {
      if (coordinates.length === 0) return ''
      
      const [first, ...rest] = coordinates
      const [x, y] = project(first[0], first[1])
      let path = `M ${x} ${y}`
      
      for (const coord of rest) {
        const [x, y] = project(coord[0], coord[1])
        path += ` L ${x} ${y}`
      }
      
      return path + ' Z'
    }

    // Handle MultiPolygon geometry
    const multiPolygonToPath = (coordinates: any[]): string => {
      return coordinates.map((polygon: any) => coordinatesToPath(polygon[0])).join(' ')
    }

    // Set SVG dimensions
    svg.attr('width', containerWidth).attr('height', containerHeight)

    // Create main group for the map
    const mapGroup = svg.append('g').attr('class', 'map-group')

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8]) // Limit zoom between 0.5x and 8x
      .on('zoom', (event) => {
        currentTransform.current = event.transform
        mapGroup.attr('transform', event.transform)
      })

    // Apply zoom to SVG
    svg.call(zoom)

    // Restore previous transform if it exists
    if (currentTransform.current) {
      svg.call(zoom.transform, currentTransform.current)
    }

    // Add background click handler to deselect
    svg.on('click', function(event) {
      // Only deselect if clicking on the background (not on a region)
      if (event.target === svg.node()) {
        onRegionClick(null) // Pass null to deselect
      }
    })

    // Add reset button
    const resetButton = svg.append('g')
      .attr('class', 'reset-button')
      .attr('transform', `translate(${containerWidth - 50}, 10)`)
      .style('cursor', 'pointer')
      .on('click', () => {
        currentTransform.current = null
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
        )
      })

    resetButton.append('rect')
      .attr('width', 40)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', 'white')
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 1)

    resetButton.append('text')
      .attr('x', 20)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#1e40af')
      .text('Reset')


    // Render map features
    geoData.features.forEach((feature: any, index: number) => {
      let path = ''
      
      if (feature.geometry.type === 'MultiPolygon') {
        path = multiPolygonToPath(feature.geometry.coordinates)
      } else if (feature.geometry.type === 'Polygon') {
        path = coordinatesToPath(feature.geometry.coordinates[0])
      }
      
      // Get region name for comparison
      const regionName = feature.properties?.name
      const isSelected = selectedEntity && regionName === selectedEntity
      
      // Single clean color
      const baseColor = '#e0f2fe' // Light blue
      const selectedColor = '#1e40af' // Dark blue for selected
      const hoverColor = '#bfdbfe' // Slightly darker blue for hover
      
      const pathElement = mapGroup.append('path')
        .attr('d', path)
        .attr('fill', isSelected ? selectedColor : baseColor)
        .attr('stroke', '#1e40af')
        .attr('stroke-width', '0.5')
        .style('cursor', 'pointer')
        .on('click', function(event) {
          // Only handle click if it's not part of a drag operation
          if (!event.defaultPrevented) {
            onRegionClick(feature)
          }
        })
        .on('mouseenter', function() {
          if (!isSelected) {
            d3.select(this)
              .attr('fill', hoverColor)
              .attr('stroke-width', '1')
          }
        })
        .on('mouseleave', function() {
          if (!isSelected) {
            d3.select(this)
              .attr('fill', baseColor)
              .attr('stroke-width', '0.5')
          }
        })
    })

  }, [geoData, onRegionClick, selectedEntity])

  if (!geoData) {
    return <div style={{ height: '600px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading data...</div>
  }

  // Calculate proper height based on aspect ratio
  const bounds = geoData.features.reduce((acc: any, feature: any) => {
    const coords = feature.geometry.coordinates.flat(3)
    const xCoords = coords.filter((_: any, i: number) => i % 2 === 0)
    const yCoords = coords.filter((_: any, i: number) => i % 2 === 1)
    
    return {
      minX: Math.min(acc.minX, ...xCoords),
      maxX: Math.max(acc.maxX, ...xCoords),
      minY: Math.min(acc.minY, ...yCoords),
      maxY: Math.max(acc.maxY, ...yCoords)
    }
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

  const countryWidth = bounds.maxX - bounds.minX
  const countryHeight = bounds.maxY - bounds.minY
  const aspectRatio = countryWidth / countryHeight
  const containerWidth = 800
  const calculatedHeight = containerWidth / aspectRatio

  return (
    <div 
      ref={containerRef}
      style={{ 
        height: `${calculatedHeight}px`, 
        width: '100%', 
        background: '#ffffff', 
        overflow: 'hidden', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}
    >
      <svg ref={svgRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </div>
  )
}