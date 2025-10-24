'use client'

import VectorMap from './VectorMap'
import StatisticsBox from './StatisticsBox'

interface DesktopMapViewProps {
  mapType: 'fylke' | 'kommune'
  data: any[]
  selectedRegion: any
  selectedRegions: any[]
  naringer: string[]
  selectedNaring: string
  onNaringChange: (naring: string) => void
  onRegionClick: (region: any) => void
  onRemoveRegion: (index: number) => void
  onClearAll: () => void
  onToggleComparison: () => void
  comparisonMode: boolean
}

export default function DesktopMapView({
  mapType,
  data,
  selectedRegion,
  selectedRegions,
  naringer,
  selectedNaring,
  onNaringChange,
  onRegionClick,
  onRemoveRegion,
  onClearAll,
  onToggleComparison,
  comparisonMode
}: DesktopMapViewProps) {
  const currentData = selectedRegion 
    ? data.filter(d => (d.fylkes_nr || d.fylke_nr || d.kommune_nr) === (selectedRegion.fylkes_nr || selectedRegion.fylke_nr || selectedRegion.kommune_nr))
    : []

  const selectedRegionIds = selectedRegions.map(r => r.fylkes_nr || r.fylke_nr || r.kommune_nr)

  return (
    <div className="hidden lg:grid lg:grid-cols-3 gap-8">
      {/* Map section */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {mapType === 'fylke' ? 'Fylkeskart' : 'Kommunekart'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Klikk på et {mapType === 'fylke' ? 'fylke' : 'kommune'} for å se statistikk
            </p>
          </div>
          <VectorMap
            data={data}
            onRegionClick={onRegionClick}
            selectedRegions={selectedRegionIds}
            mapType={mapType}
            className="h-96"
          />
        </div>
      </div>

      {/* Statistics section */}
      <div className="space-y-6">
        {/* Statistics box */}
        <StatisticsBox
          data={currentData}
          selectedRegion={selectedRegion}
          naringer={naringer}
          selectedNaring={selectedNaring}
          onNaringChange={onNaringChange}
        />

      </div>
    </div>
  )
}
