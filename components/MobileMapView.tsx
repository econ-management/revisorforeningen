'use client'

import { useState } from 'react'
import { MapPin, BarChart3 } from 'lucide-react'
import VectorMap from './VectorMap'
import StatisticsBox from './StatisticsBox'

interface MobileMapViewProps {
  mapType: 'fylke' | 'kommune'
  data: any[]
  selectedRegion: any
  selectedRegions: any[]
  naringer: string[]
  selectedNaring: string
  onNaringChange: (naring: string) => void
  onRegionClick: (region: any) => void
  comparisonMode: boolean
}

export default function MobileMapView({
  mapType,
  data,
  selectedRegion,
  selectedRegions,
  naringer,
  selectedNaring,
  onNaringChange,
  onRegionClick,
  comparisonMode
}: MobileMapViewProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'stats'>('map')

  const currentData = selectedRegion 
    ? data.filter(d => (d.fylke_nr || d.kommune_nr) === (selectedRegion.fylke_nr || selectedRegion.kommune_nr))
    : []

  const selectedRegionIds = selectedRegions.map(r => r.fylke_nr || r.kommune_nr)

  return (
    <div className="lg:hidden">
      {/* Tab navigation */}
      <div className="flex bg-white shadow-sm rounded-t-lg border-b">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium ${
            activeTab === 'map'
              ? 'text-norwegian-blue border-b-2 border-norwegian-blue'
              : 'text-gray-600'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Kart</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium ${
            activeTab === 'stats'
              ? 'text-norwegian-blue border-b-2 border-norwegian-blue'
              : 'text-gray-600'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistikk</span>
        </button>
      </div>

      {/* Content area */}
      <div className="bg-white rounded-b-lg shadow-lg">
        {activeTab === 'map' && (
          <div className="p-4">
            <VectorMap
              data={data}
              onRegionClick={onRegionClick}
              selectedRegions={selectedRegionIds}
              mapType={mapType}
              className="h-64"
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-4">
            <div className="space-y-4">
              <StatisticsBox
                data={currentData}
                selectedRegion={selectedRegion}
                naringer={naringer}
                selectedNaring={selectedNaring}
                onNaringChange={onNaringChange}
                className="shadow-none"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
