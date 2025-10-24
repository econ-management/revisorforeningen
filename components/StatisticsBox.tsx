'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, DollarSign, Building2, Eye, EyeOff } from 'lucide-react'

interface StatisticsBoxProps {
  data: any[]
  selectedRegion: any
  naringer: string[]
  selectedNaring: string
  onNaringChange: (naring: string) => void
  className?: string
}

const COLORS = ['#0066CC', '#D52B1E', '#00AA44', '#FF8800', '#9900CC', '#00CCAA', '#CC4400']

export default function StatisticsBox({
  data,
  selectedRegion,
  naringer,
  selectedNaring,
  onNaringChange,
  className = ''
}: StatisticsBoxProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'icons'>('chart')
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

  if (!selectedRegion) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Velg et fylke eller kommune på kartet for å se statistikk</p>
        </div>
      </div>
    )
  }

  const currentData = data.filter(d => d.naring === selectedNaring)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getRegionName = (region: any) => {
    return region.fylkes_navn || region.fylke || region.kommune || 'Ukjent'
  }

  const renderIcons = () => {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">{getRegionName(selectedRegion)}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verdskaping</p>
                <p className="font-semibold">{formatNumber(selectedRegion.verdiskaping)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Årsverk</p>
                <p className="font-semibold">{formatNumber(selectedRegion.aarsverk)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lønn m.m.</p>
                <p className="font-semibold">{formatNumber(selectedRegion.lonn_trygd_pensjon)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Skattekostnad</p>
                <p className="font-semibold">{formatNumber(selectedRegion.skattekostnad_ordinart)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    const chartData = naringer.map(naring => {
      const regionData = data.find(d => d.naring === naring)
      return {
        name: naring,
        verdiskaping: regionData?.verdiskaping || 0,
        aarsverk: regionData?.aarsverk || 0,
        lonn_trygd_pensjon: regionData?.lonn_trygd_pensjon || 0,
        skattekostnad_ordinart: regionData?.skattekostnad_ordinart || 0
      }
    })

    if (chartType === 'pie') {
      const pieData = chartData.map(item => ({
        name: item.name,
        value: item.verdiskaping
      }))

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value as number)} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip formatter={(value) => formatNumber(value as number)} />
          <Bar dataKey="verdiskaping" fill="#0066CC" name="Verdskaping" />
          <Bar dataKey="aarsverk" fill="#D52B1E" name="Årsverk" />
          <Bar dataKey="lonn_trygd_pensjon" fill="#00AA44" name="Lønn m.m." />
          <Bar dataKey="skattekostnad_ordinart" fill="#FF8800" name="Skattekostnad" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {`${getRegionName(selectedRegion)} - ${selectedNaring}`}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('icons')}
            className={`p-2 rounded ${viewMode === 'icons' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`p-2 rounded ${viewMode === 'chart' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Industry selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Velg næring:
        </label>
        <select
          value={selectedNaring}
          onChange={(e) => onNaringChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {naringer.map(naring => (
            <option key={naring} value={naring}>{naring}</option>
          ))}
        </select>
      </div>

      {/* Chart type selector */}
      {viewMode === 'chart' && (
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded text-sm ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              Stolpediagram
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 rounded text-sm ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              Kakediagram
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'icons' ? renderIcons() : renderChart()}
    </div>
  )
}
