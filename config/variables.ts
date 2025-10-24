// Configuration file for easy variable changes
// Add or modify variables here to change what data is displayed

export const DISPLAY_VARIABLES = [
  {
    key: 'verdiskaping',
    label: 'Verdskaping',
    description: 'Total value creation',
    icon: 'TrendingUp',
    color: '#0066CC',
    format: 'currency'
  },
  {
    key: 'aarsverk',
    label: 'Årsverk',
    description: 'Full-time equivalent positions',
    icon: 'Users',
    color: '#D52B1E',
    format: 'number'
  },
  {
    key: 'lonn_trygd_pensjon',
    label: 'Lønn, trygd og pensjon',
    description: 'Wages, benefits and pensions',
    icon: 'DollarSign',
    color: '#00AA44',
    format: 'currency'
  },
  {
    key: 'skattekostnad_ordinart',
    label: 'Skattekostnad ordinær',
    description: 'Ordinary tax costs',
    icon: 'Building2',
    color: '#FF8800',
    format: 'currency'
  }
]

// Color scheme for different industries
export const INDUSTRY_COLORS = [
  '#0066CC', // Norwegian blue
  '#D52B1E', // Norwegian red
  '#00AA44', // Green
  '#FF8800', // Orange
  '#9900CC', // Purple
  '#00CCAA', // Teal
  '#CC4400', // Brown
  '#FFD700', // Gold
  '#FF69B4', // Pink
  '#32CD32', // Lime green
  '#FF6347', // Tomato
  '#4169E1', // Royal blue
  '#DC143C', // Crimson
  '#00CED1', // Dark turquoise
  '#FF8C00'  // Dark orange
]

// Map configuration
export const MAP_CONFIG = {
  norway: {
    center: [10, 64],
    scale: 4000,
    width: 800,
    height: 600
  },
  colors: {
    default: '#f0f0f0',
    selected: '#0066CC',
    hover: '#0066CC',
    stroke: '#ffffff'
  }
}

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
}
