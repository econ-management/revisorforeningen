'use client';

import { useEffect, useRef, useState } from 'react';
import { ForetakData, getKommuneData } from '@/lib/supabase';
import 'leaflet/dist/leaflet.css';

interface MunicipalityDetailMapProps {
  kommuneName: string;
  kommuneNr: string;
  foretakData: ForetakData[];
  onClose: () => void;
}

// Helper function to validate coordinates
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180 &&
         lat !== 0 && lng !== 0 &&
         isFinite(lat) && isFinite(lng);
};

export default function MunicipalityDetailMap({ 
  kommuneName, 
  kommuneNr, 
  foretakData, 
  onClose 
}: MunicipalityDetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [municipalityData, setMunicipalityData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

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

  // Load municipality data
  useEffect(() => {
    const loadMunicipalityData = async () => {
      try {
        setDataLoading(true)
        console.log('Loading municipality data for:', kommuneNr)
        const data = await getKommuneData(kommuneNr)
        console.log('Municipality data result:', data)
        if (data && data.length > 0) {
          setMunicipalityData(data[0])
        } else {
          setMunicipalityData(null)
        }
      } catch (error) {
        console.error('Error loading municipality data:', error)
        setMunicipalityData(null)
      } finally {
        setDataLoading(false)
      }
    }

    loadMunicipalityData()
  }, [kommuneNr])

  useEffect(() => {
    if (!mapRef.current || foretakData.length === 0) {
      setLoading(false);
      return;
    }

    const loadMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');

        // Create map
        const map = L.map(mapRef.current!).setView([59.9139, 10.7522], 10); // Default to Oslo
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Filter valid coordinates and calculate bounds
        const validCompanies = foretakData.filter(company => {
          const lat = Number(company.y_coord);
          const lng = Number(company.x_coord);
          return isValidCoordinate(lat, lng);
        });

        if (validCompanies.length > 0) {
          // Calculate bounds from valid companies
          const bounds = validCompanies.reduce((acc, company) => {
            const lat = company.y_coord;
            const lng = company.x_coord;
            
            acc.latMin = Math.min(acc.latMin, lat);
            acc.latMax = Math.max(acc.latMax, lat);
            acc.lngMin = Math.min(acc.lngMin, lng);
            acc.lngMax = Math.max(acc.lngMax, lng);
            return acc;
          }, {
            latMin: Infinity,
            latMax: -Infinity,
            lngMin: Infinity,
            lngMax: -Infinity
          });

          // If we have valid bounds, fit the map to them
          if (bounds.latMin !== Infinity && bounds.latMax !== -Infinity) {
            const boundsArray = [[bounds.latMin, bounds.lngMin], [bounds.latMax, bounds.lngMax]];
            map.fitBounds(boundsArray, { padding: [20, 20] });
          }
        } else {
          // Default to Oslo if no valid coordinates
          map.setView([59.9139, 10.7522], 10);
        }

        // Calculate radius range based on employee counts (area proportional)
        const employeeCounts = validCompanies.map(c => Number(c.ansatte) || 0);
        const maxEmployees = Math.max(...employeeCounts);
        const minRadius = 1; // Minimum radius for zero employees
        const maxRadius = 20; // Maximum radius for largest company

        // Add markers for valid companies only with a small delay
        setTimeout(() => {
          validCompanies.forEach((company) => {
            const lat = Number(company.y_coord);
            const lng = Number(company.x_coord);
            const employees = Number(company.ansatte) || 0;
            
            // Double-check coordinates are valid
            if (isValidCoordinate(lat, lng)) {
              try {
                // Calculate radius so that area is proportional to employee count
                let radius = minRadius;
                if (maxEmployees > 0) {
                  // For area to be proportional, radius should be sqrt(employees/maxEmployees) * maxRadius
                  const areaRatio = employees / maxEmployees;
                  radius = minRadius + (Math.sqrt(areaRatio) * (maxRadius - minRadius));
                }

                const circle = L.circle([lat, lng], {
                  radius: radius * 10, // Convert to meters for L.circle
                  fillColor: '#3b82f6',
                  color: '#1e40af',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
                }).addTo(map);

                // Add click event to show company info in sidebar
                circle.on('click', () => {
                  setSelectedCompany(company);
                });
              } catch (error) {
                console.warn('Invalid coordinates for company:', company, error);
              }
            }
          });
        }, 100);

        setLoading(false);
      } catch (error) {
        console.error('Error loading map:', error);
        setLoading(false);
      }
    };

    loadMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [foretakData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex">
        {/* Left Side - Map */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Næringslivet i {kommuneName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Laster kart...</p>
                </div>
              </div>
            )}
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              {foretakData.filter(company => {
                const lat = Number(company.y_coord);
                const lng = Number(company.x_coord);
                return isValidCoordinate(lat, lng);
              }).length} bedrifter i {kommuneName}
            </p>
          </div>
        </div>

        {/* Right Side - Statistics or Company Info */}
        <div className="w-80 border-l bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            {selectedCompany ? (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bedriftsinformasjon
                </h3>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  {kommuneName}
                </h3>
                <p className="text-sm text-gray-600">Alle næringer</p>
              </>
            )}
          </div>

          <div className="flex-1 p-4">
            {selectedCompany ? (
              /* Company Information */
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Bedriftsnavn</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedCompany.navn || 'Ukjent bedrift'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Ansatte</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Number(selectedCompany.ansatte || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">Omsetning</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedCompany.driftsinntekter_sum)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Verdiskaping</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(selectedCompany.verdiskaping)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedCompany.siste_regnsk && (
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-teal-900">Siste leverte regnskap</p>
                        <p className="text-lg font-bold text-teal-600">
                          {selectedCompany.siste_regnsk}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedCompany.adresse && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Adresse</p>
                        <p className="text-sm font-bold text-gray-700">
                          {selectedCompany.adresse}
                          {selectedCompany.postnummer && selectedCompany.poststed && 
                            `, ${selectedCompany.postnummer} ${selectedCompany.poststed}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedCompany.orgnr && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Organisasjonsnummer</p>
                        <p className="text-sm font-bold text-gray-700">
                          {selectedCompany.orgnr}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedCompany.orgnr && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <a
                          href={`https://virksomhet.brreg.no/nb/oppslag/enheter/${selectedCompany.orgnr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                        >
                          Se årsregnskap og mer info om {selectedCompany.navn || 'bedriften'} her
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedCompany.organisasjonsform && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Organisasjonsform</p>
                        <p className="text-lg font-bold text-yellow-600">
                          {selectedCompany.organisasjonsform}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedCompany.næringskode && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Næringskode</p>
                        <p className="text-lg font-bold text-purple-600">
                          {selectedCompany.næringskode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedCompany.næring && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-900">Næring</p>
                        <p className="text-lg font-bold text-orange-600">
                          {selectedCompany.næring}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : dataLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : municipalityData ? (
              <div className="space-y-4">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Verdiskaping</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(municipalityData.verdiskaping)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Sysselsatte</p>
                        <p className="text-2xl font-bold text-green-600">
                          {municipalityData.total_ansatte?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Lønn</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(municipalityData.lonn_trygd_pensjon)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Inntektsskatt</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(municipalityData.skatt_pa_inntekt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-900">Arbeidsgiveravgift</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency((municipalityData.lonn_trygd_pensjon || 0) * 0.12)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-900">Selskapsskatt</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency((municipalityData.skattekostnad_ordinart || 0) + (municipalityData.skattekostnad_pa_ekstraordinaert_resultat || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Skatt på utbytte</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatCurrency((municipalityData.utbytte_sum || 0) * 0.37)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Ingen data tilgjengelig
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
