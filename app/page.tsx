'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, MapPin } from 'lucide-react'
import VectorMap from '@/components/VectorMap'
import { getKommuneNaringData, getFylkeNaringData, getUniqueNaringer, getFylkeData, getKommuneData, getForetakData } from '@/lib/supabase'
import { getKommunePopulationByNr, getFylkePopulationByNr } from '@/lib/population-data'
import MunicipalityDetailMap from '@/components/MunicipalityDetailMap'

export default function Home() {
  const [mapType, setMapType] = useState<'fylke' | 'kommune'>('fylke')
  const [data, setData] = useState<any[]>([])
  const [kommuneData, setKommuneData] = useState<any[]>([])
  const [fylkeData, setFylkeData] = useState<any[]>([])
  const [combinedKommuneData, setCombinedKommuneData] = useState<any[]>([])
  const [combinedFylkeData, setCombinedFylkeData] = useState<any[]>([])
  const [naringer, setNaringer] = useState<string[]>([])
  const [filteredNaringer, setFilteredNaringer] = useState<string[]>([])
  const [selectedNaring, setSelectedNaring] = useState<string>('')
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [population, setPopulation] = useState<number | null>(null)
  const [showDetailMap, setShowDetailMap] = useState(false)
  const [detailKommuneName, setDetailKommuneName] = useState('')
  const [detailKommuneNr, setDetailKommuneNr] = useState('')
  const [foretakData, setForetakData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [kommunerGeoData, setKommunerGeoData] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const hasLoadedData = useRef(false)

  // Function to format currency values in Norwegian format
  const formatCurrency = (value: number | null | undefined): string => {
    if (!value || isNaN(value)) return 'N/A'
    
    const numValue = Number(value)
    const isNegative = numValue < 0
    const absValue = Math.abs(numValue)
    
    let formattedValue: string
    
    if (absValue >= 1000000000) {
      // More than 1 billion - format as "4.2 mrd. kr" or "-4.2 mrd. kr"
      const billions = (absValue / 1000000000).toFixed(1)
      formattedValue = `${billions} mrd. kr`
    } else if (absValue >= 1000000) {
      // More than 1 million but less than 1 billion - format as "100 mill. kr" (no decimals)
      const millions = Math.round(absValue / 1000000)
      formattedValue = `${millions} mill. kr`
    } else {
      // Less than 1 million - just add "kr"
      formattedValue = `${absValue.toLocaleString()} kr`
    }
    
    return isNegative ? `-${formattedValue}` : formattedValue
  }

  // Function to load population data for selected entity
  const loadPopulationData = async (feature: any) => {
    if (!feature) {
      setPopulation(null)
      return
    }

    try {
      let populationData: number | null = null

      if (mapType === 'fylke') {
        // For counties, use county_number to get fylkes_nr
        if (feature.properties?.county_number) {
          populationData = await getFylkePopulationByNr(feature.properties.county_number)
        }
      } else {
        // For municipalities, use municipality_code to get kommune_nr
        if (feature.properties?.municipality_code) {
          populationData = await getKommunePopulationByNr(feature.properties.municipality_code)
        }
      }

      setPopulation(populationData)
    } catch (error) {
      console.error('Error loading population data:', error)
      setPopulation(null)
    }
  }

  // Function to show detailed municipality map
  const showMunicipalityDetail = async (kommuneName: string, kommuneNr: string) => {
    try {
      setDetailKommuneName(kommuneName)
      setDetailKommuneNr(kommuneNr)
      setShowDetailMap(true)
      
      // Load foretak data
      const data = await getForetakData(kommuneNr)
      setForetakData(data)
    } catch (error) {
      console.error('Error loading foretak data:', error)
    }
  }

  // Function to filter næring options based on available data for selected entity
  const updateFilteredNaringer = (entityName: string, currentData: any[]) => {
    if (!entityName || currentData.length === 0) {
      setFilteredNaringer(naringer)
      return
    }

    // Find all næring options that have data for this entity
    const availableNaringer = currentData
      .filter(row => {
        if (mapType === 'fylke') {
          return row.fylkes_navn === entityName
        } else {
          return row.kommune === entityName
        }
      })
      .map(row => row.naring)
      .filter((naring, index, array) => array.indexOf(naring) === index) // Remove duplicates

    setFilteredNaringer(availableNaringer)
    
    // If current selected næring is not available, reset it
    if (selectedNaring && !availableNaringer.includes(selectedNaring)) {
      setSelectedNaring('')
    }
  }

  // Load data once when component mounts
  // Load kommuner geo data for search
  useEffect(() => {
    if (mapType === 'kommune' && !kommunerGeoData) {
      fetch('/kommuner_cleaned.json')
        .then(res => res.json())
        .then(data => setKommunerGeoData(data))
        .catch(err => console.error('Error loading kommuner geo data:', err))
    }
  }, [mapType, kommunerGeoData])

  useEffect(() => {
    if (hasLoadedData.current) return // Prevent duplicate requests
    
    const loadData = async () => {
      try {
        setLoading(true)
        hasLoadedData.current = true // Mark as loaded
        
        // Load all data once
        console.log('Loading all data...')
        const [kommuneData, fylkeData, combinedKommuneData, combinedFylkeData, naringerResult] = await Promise.all([
          getKommuneNaringData(),
          getFylkeNaringData(),
          getKommuneData(),
          getFylkeData(),
          getUniqueNaringer()
        ])
        
        console.log('Kommune data:', kommuneData)
        console.log('Fylke data:', fylkeData)
        console.log('Combined kommune data:', combinedKommuneData)
        console.log('Combined fylke data:', combinedFylkeData)
        console.log('Naringer result:', naringerResult)
        
        // Store all data separately
        setKommuneData(kommuneData)
        setFylkeData(fylkeData)
        setCombinedKommuneData(combinedKommuneData)
        setCombinedFylkeData(combinedFylkeData)
        setNaringer(naringerResult)
        
        // Set initial data based on map type
        setData(mapType === 'fylke' ? fylkeData : kommuneData)
        
        // Initialize filtered næringer with all options
        setFilteredNaringer(naringerResult)
        
        // Default to "alle næringer" (empty string) instead of first næring
        // setSelectedNaring('') is already the default state
        
        // Don't set initial entity selection - show national totals by default
      } catch (error) {
        console.error('Error loading data:', error)
        hasLoadedData.current = false // Reset on error
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // Only run once on mount

  // Update data when map type changes
  useEffect(() => {
    if (kommuneData.length > 0 || fylkeData.length > 0) {
      // Switch between stored data
      const newData = mapType === 'fylke' ? fylkeData : kommuneData
      setData(newData)
      
      // Reset selected entity when switching map type - show national totals by default
      setSelectedEntity('')
      setSelectedFeature(null)
      setPopulation(null)
      setSearchResults([])
      setShowDropdown(false)
      setSelectedIndex(-1)
    }
  }, [mapType, kommuneData, fylkeData])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-norwegian-blue" />
              <h1 className="text-2xl font-bold text-gray-900">
                Næringslivet i tall
              </h1>
            </div>
            
            {/* Map type selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setMapType('fylke')
                  setSelectedNaring('')
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mapType === 'fylke'
                    ? 'bg-white text-norwegian-blue shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Fylker</span>
              </button>
              <button
                onClick={() => {
                  setMapType('kommune')
                  setSelectedNaring('')
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mapType === 'kommune'
                    ? 'bg-white text-norwegian-blue shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Kommuner</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-norwegian-blue"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="border rounded-lg bg-gray-50 relative" style={{ height: 'auto', minHeight: '400px', overflow: 'hidden' }}>
                     <VectorMap 
                       mapType={mapType}
                       selectedEntity={selectedEntity}
                       onRegionClick={async (feature) => {
                         if (feature) {
                         const name = feature.properties?.name
                         if (name) {
                           setSelectedEntity(name)
                             setSelectedNaring('') // Reset to "alle næringer" when selecting new entity
                           setSelectedFeature(feature)
                             // Load population data for the selected entity
                             await loadPopulationData(feature)
                           }
                         } else {
                           // Deselect when clicking on background
                           setSelectedEntity('')
                           setSelectedFeature(null)
                           setPopulation(null)
                         }
                       }}
                     />
                     
                     {/* Top Left Box - Search or Selected Feature */}
                     {(mapType === 'kommune' && !selectedFeature) || selectedFeature ? (
                       <div className="absolute top-6 left-6 bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-sm z-10">
                         {mapType === 'kommune' && !selectedFeature ? (
                         // Search Bar for Kommuner with Dropdown
                         <div className="relative">
                           <div className="mb-2">
                             <label className="text-sm font-medium text-gray-700">Søk kommune</label>
                           </div>
                           <input
                             type="text"
                             placeholder="Skriv kommune navn..."
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             onChange={(e) => {
                               const searchTerm = e.target.value.toLowerCase()
                               if (searchTerm.length > 1 && kommunerGeoData) {
                                 // Find all matching kommuner
                                 const matches = kommunerGeoData.features?.filter((feature: any) => 
                                   feature.properties?.name?.toLowerCase().includes(searchTerm)
                                 ).slice(0, 10) // Limit to 10 results
                                 
                                 setSearchResults(matches || [])
                                 setShowDropdown(true)
                                 setSelectedIndex(-1) // Reset selection when typing
                               } else {
                                 setSearchResults([])
                                 setShowDropdown(false)
                                 setSelectedIndex(-1)
                               }
                             }}
                             onKeyDown={(e) => {
                               if (!showDropdown || searchResults.length === 0) return
                               
                               if (e.key === 'ArrowDown') {
                                 e.preventDefault()
                                 setSelectedIndex(prev => 
                                   prev < searchResults.length - 1 ? prev + 1 : 0
                                 )
                               } else if (e.key === 'ArrowUp') {
                                 e.preventDefault()
                                 setSelectedIndex(prev => 
                                   prev > 0 ? prev - 1 : searchResults.length - 1
                                 )
                               } else if (e.key === 'Enter') {
                                 e.preventDefault()
                                 if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                                   const feature = searchResults[selectedIndex]
                                   const name = feature.properties?.name
                                   if (name) {
                                     setSelectedEntity(name)
                                     setSelectedNaring('')
                                     setSelectedFeature(feature)
                                     setShowDropdown(false)
                                     setSelectedIndex(-1)
                                     // Load population data
                                     getKommunePopulationByNr(feature.properties?.municipality_code || '')
                                       .then(pop => setPopulation(pop))
                                       .catch(err => console.error('Error loading population:', err))
                                   }
                                 }
                               } else if (e.key === 'Escape') {
                                 setShowDropdown(false)
                                 setSelectedIndex(-1)
                               }
                             }}
                             onFocus={() => {
                               if (searchResults.length > 0) {
                                 setShowDropdown(true)
                               }
                             }}
                             onBlur={() => {
                               // Delay hiding to allow clicking on dropdown items
                               setTimeout(() => setShowDropdown(false), 200)
                             }}
                           />
                           
                           {/* Dropdown with search results */}
                           {showDropdown && searchResults.length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                               {searchResults.map((feature, index) => (
                                 <div
                                   key={index}
                                   className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                     index === selectedIndex 
                                       ? 'bg-blue-100 text-blue-900' 
                                       : 'hover:bg-gray-100'
                                   }`}
                                   onClick={() => {
                                     const name = feature.properties?.name
                                     if (name) {
                                       setSelectedEntity(name)
                                       setSelectedNaring('')
                                       setSelectedFeature(feature)
                                       setShowDropdown(false)
                                       setSelectedIndex(-1)
                                       // Load population data
                                       getKommunePopulationByNr(feature.properties?.municipality_code || '')
                                         .then(pop => setPopulation(pop))
                                         .catch(err => console.error('Error loading population:', err))
                                     }
                                   }}
                                 >
                                   <div className="font-medium text-gray-900">{feature.properties?.name}</div>
                                   <div className="text-sm text-gray-500">Kommune</div>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       ) : selectedFeature ? (
                         // Selected Feature Info
                         <div>
                           <h3 className="text-lg font-bold text-gray-900 mb-4">
                             {selectedFeature.properties?.name || selectedFeature.properties?.fylkesnavn}
                           </h3>
                           {population !== null && (
                             <div className="space-y-2 mb-4">
                               <div className="text-sm text-gray-600">Befolkning</div>
                               <div className="text-2xl font-bold text-gray-900">
                                 {population.toLocaleString()}
                             </div>
                             </div>
                           )}
                         </div>
                       ) : null}
                       </div>
                     ) : null}
                     
                     {/* Detail Link - Positioned next to selected shape */}
                     {selectedFeature && mapType === 'kommune' && selectedFeature.properties?.municipality_code && (
                       <div className="absolute top-1/2 right-6 transform -translate-y-1/2 z-10">
                         <button
                           onClick={() => showMunicipalityDetail(
                             selectedFeature.properties?.name || selectedEntity,
                             selectedFeature.properties.municipality_code
                           )}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
                         >
                           Se nærmere på næringslivet i {selectedFeature.properties?.name || selectedEntity}
                         </button>
                       </div>
                     )}
                     
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Statistics Box */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedEntity || 'NORGE'}
                  </h2>

                  {/* Næring Selector */}
                  <div className="mb-6">
                    <div className="flex items-center justify-end mb-2">
                      {selectedNaring && (
                        <button
                          onClick={() => setSelectedNaring('')}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Vis totalt
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedNaring}
                      onChange={(e) => setSelectedNaring(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Alle næringer (totalt)</option>
                      {naringer.map((naring) => (
                        <option key={naring} value={naring}>
                          {naring}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Statistics Content */}
                <div className="p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    {selectedNaring || 'Alle næringer'}
                  </h3>
                  
                  {(() => {
                    console.log('Debug - mapType:', mapType)
                    console.log('Debug - selectedEntity:', selectedEntity)
                    console.log('Debug - selectedNaring:', selectedNaring)
                    console.log('Debug - data length:', data.length)
                    console.log('Debug - first data row:', data[0])
                    
                    // Show national summary when nothing is selected
                    if (!selectedEntity) {
                      let nationalTotals
                      
                      if (selectedNaring) {
                        // Calculate national totals for specific næring
                        nationalTotals = fylkeData
                          .filter(row => row.naring === selectedNaring)
                          .reduce((totals, row) => {
                            return {
                              verdiskaping: (totals.verdiskaping || 0) + (row.verdiskaping || 0),
                              total_ansatte: (totals.total_ansatte || 0) + (row.total_ansatte || 0),
                              lonn_trygd_pensjon: (totals.lonn_trygd_pensjon || 0) + (row.lonn_trygd_pensjon || 0),
                              skatt_pa_inntekt: (totals.skatt_pa_inntekt || 0) + (row.skatt_pa_inntekt || 0),
                              skattekostnad_ordinart: (totals.skattekostnad_ordinart || 0) + (row.skattekostnad_ordinart || 0),
                              skattekostnad_pa_ekstraordinaert_resultat: (totals.skattekostnad_pa_ekstraordinaert_resultat || 0) + (row.skattekostnad_pa_ekstraordinaert_resultat || 0),
                              utbytte_sum: (totals.utbytte_sum || 0) + (row.utbytte_sum || 0)
                            }
                          }, {})
                      } else {
                        // Calculate national totals from all fylke data (alle næringer)
                        nationalTotals = combinedFylkeData.reduce((totals, row) => {
                          return {
                            verdiskaping: (totals.verdiskaping || 0) + (row.verdiskaping || 0),
                            total_ansatte: (totals.total_ansatte || 0) + (row.total_ansatte || 0),
                            lonn_trygd_pensjon: (totals.lonn_trygd_pensjon || 0) + (row.lonn_trygd_pensjon || 0),
                            skatt_pa_inntekt: (totals.skatt_pa_inntekt || 0) + (row.skatt_pa_inntekt || 0),
                            skattekostnad_ordinart: (totals.skattekostnad_ordinart || 0) + (row.skattekostnad_ordinart || 0),
                            skattekostnad_pa_ekstraordinaert_resultat: (totals.skattekostnad_pa_ekstraordinaert_resultat || 0) + (row.skattekostnad_pa_ekstraordinaert_resultat || 0),
                            utbytte_sum: (totals.utbytte_sum || 0) + (row.utbytte_sum || 0)
                          }
                        }, {})
                      }
                      
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Verdiskaping</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(nationalTotals.verdiskaping)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-900">Sysselsatte</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {nationalTotals.total_ansatte?.toLocaleString() || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-yellow-900">Lønn</p>
                                  <p className="text-2xl font-bold text-yellow-600">
                                    {formatCurrency(nationalTotals.lonn_trygd_pensjon)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-purple-900">Inntektsskatt</p>
                                  <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(nationalTotals.skatt_pa_inntekt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-orange-900">Arbeidsgiveravgift</p>
                                  <p className="text-2xl font-bold text-orange-600">
                                    {formatCurrency((nationalTotals.lonn_trygd_pensjon || 0) * 0.12)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-red-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-red-900">Selskapsskatt</p>
                                  <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency((nationalTotals.skattekostnad_ordinart || 0) + (nationalTotals.skattekostnad_pa_ekstraordinaert_resultat || 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-indigo-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-indigo-900">Skatt på utbytte</p>
                                  <p className="text-2xl font-bold text-indigo-600">
                                    {formatCurrency((nationalTotals.utbytte_sum || 0) * 0.37)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    // If we're showing national totals, return early
                    if (!selectedEntity) {
                      return null // This should never be reached due to the return above
                    }
                    
                    let matchingRow = null
                    
                    if (selectedNaring) {
                      // If næring is selected, use the næring-separated data
                      matchingRow = data.find(row => {
                        if (mapType === 'fylke') {
                          // For counties, match by fylkes_nr using county_number from map
                          if (selectedFeature && selectedFeature.properties?.county_number) {
                            const fylkeId = parseInt(selectedFeature.properties.county_number)
                            return row.fylkes_nr === fylkeId && row.naring === selectedNaring
                          }
                          // Fallback to name matching if no county_number
                          return row.fylkes_navn === selectedEntity && row.naring === selectedNaring
                        } else {
                          // For municipalities, we need to match by kommune_nr since names don't match
                          // We'll need to get the municipality code from the selected feature
                          if (selectedFeature && selectedFeature.properties?.municipality_code) {
                            const municipalityCode = parseInt(selectedFeature.properties.municipality_code)
                            return row.kommune_nr === municipalityCode && row.naring === selectedNaring
                          }
                          // Fallback to name matching if no municipality code
                          return row.kommune === selectedEntity && row.naring === selectedNaring
                        }
                      })
                    } else {
                      // If no næring selected, use the combined data
                      const combinedData = mapType === 'fylke' ? combinedFylkeData : combinedKommuneData
                      matchingRow = combinedData.find(row => {
                        if (mapType === 'fylke') {
                          // For counties, match by fylkes_nr using county_number from map
                          if (selectedFeature && selectedFeature.properties?.county_number) {
                            const fylkeId = parseInt(selectedFeature.properties.county_number)
                            return row.fylkes_nr === fylkeId
                          }
                          // Fallback to name matching if no county_number
                          return row.fylkes_navn === selectedEntity
                        } else {
                          // For municipalities, match by kommune_nr
                          if (selectedFeature && selectedFeature.properties?.municipality_code) {
                            const municipalityCode = parseInt(selectedFeature.properties.municipality_code)
                            return row.kommune_nr === municipalityCode
                          }
                          // Fallback to name matching if no municipality code
                          return row.kommune === selectedEntity
                        }
                      })
                    }
                    
                    if (!matchingRow) {
                      return (
                        <div className="text-center text-sm text-gray-500 py-8">
                          {selectedEntity 
                            ? (selectedNaring ? 'No data found for the selected combination' : 'No data found for the selected entity')
                            : 'Please select an entity to view data'}
                        </div>
                      )
                    }
                    
                    return (
                      <div className="space-y-4">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-900">Verdiskaping</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(matchingRow.verdiskaping)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-900">Sysselsatte</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {matchingRow.total_ansatte?.toLocaleString() || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-yellow-900">Lønn</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                  {formatCurrency(matchingRow.lonn_trygd_pensjon)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-purple-900">Inntektsskatt</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {formatCurrency(matchingRow.skatt_pa_inntekt)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-orange-900">Arbeidsgiveravgift</p>
                                <p className="text-2xl font-bold text-orange-600">
                                  {formatCurrency(matchingRow.lonn_trygd_pensjon * 0.12)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-red-900">Selskapsskatt</p>
                                <p className="text-2xl font-bold text-red-600">
                                  {formatCurrency((matchingRow.skattekostnad_ordinart || 0) + (matchingRow.skattekostnad_pa_ekstraordinaert_resultat || 0))}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-indigo-900">Skatt på utbytte</p>
                                <p className="text-2xl font-bold text-indigo-600">
                                  {formatCurrency((matchingRow.utbytte_sum || 0) * 0.37)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Municipality Detail Map Modal */}
      {showDetailMap && (
        <MunicipalityDetailMap
          kommuneName={detailKommuneName}
          kommuneNr={detailKommuneNr}
          foretakData={foretakData}
          onClose={() => {
            setShowDetailMap(false)
            setDetailKommuneName('')
            setDetailKommuneNr('')
            setForetakData([])
          }}
        />
      )}
    </div>
  )
}