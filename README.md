# Norsk Bedriftsstatistikk

An interactive website that displays Norwegian business statistics for counties (fylker) and municipalities (kommuner) with industry breakdowns.

## Features

- **Interactive Maps**: Vector maps for Norwegian counties and municipalities
- **Statistics Visualization**: Multiple chart types (bar charts, pie charts, icon views)
- **Industry Filtering**: Toggle between different næringer (industries)
- **Comparison Mode**: Compare multiple regions side by side
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Real-time Data**: Connected to Supabase database

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: D3.js with TopoJSON
- **Charts**: Recharts
- **Database**: Supabase
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
# Supabase configuration
ECONM_DB_URL=your_supabase_url_here
ECONM_DB_ANON_KEY=your_supabase_anon_key_here

# Next.js configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Setup

Your Supabase database should have the following tables:

#### `kommune_naring` table structure:
```sql
CREATE TABLE kommune_naring (
  kommune_nr VARCHAR(4),
  kommune VARCHAR(255),
  naring VARCHAR(255),
  verdiskaping NUMERIC,
  aarsverk NUMERIC,
  lonn_trygd_pensjon NUMERIC,
  skattekostnad_ordinart NUMERIC
);
```

#### `fylke_naring` table structure:
```sql
CREATE TABLE fylke_naring (
  fylke_nr VARCHAR(2),
  fylke VARCHAR(255),
  naring VARCHAR(255),
  verdiskaping NUMERIC,
  aarsverk NUMERIC,
  lonn_trygd_pensjon NUMERIC,
  skattekostnad_ordinart NUMERIC
);
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Customization

### Adding New Variables

To add new variables to display, edit `config/variables.ts`:

```typescript
export const DISPLAY_VARIABLES = [
  {
    key: 'your_new_variable',
    label: 'Your Variable Label',
    description: 'Description of your variable',
    icon: 'IconName',
    color: '#HEX_COLOR',
    format: 'currency' | 'number'
  },
  // ... existing variables
]
```

### Map Data Sources

The application uses TopoJSON data for Norwegian maps. You can replace the map data URLs in `components/VectorMap.tsx` with your own map data sources.

### Styling

The application uses Tailwind CSS with custom Norwegian color scheme. You can modify colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      norwegian: {
        blue: '#0066CC',
        red: '#D52B1E',
        white: '#FFFFFF',
        navy: '#003366',
      }
    }
  }
}
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── VectorMap.tsx      # Interactive map component
│   ├── StatisticsBox.tsx  # Statistics display component
│   ├── ComparisonPanel.tsx # Region comparison component
│   ├── DesktopMapView.tsx # Desktop layout
│   └── MobileMapView.tsx  # Mobile layout
├── config/               # Configuration files
│   └── variables.ts      # Display variables configuration
├── lib/                  # Utility libraries
│   └── supabase.ts       # Database connection and queries
└── public/               # Static assets
```

## Usage

1. **Select Map Type**: Choose between counties (fylker) or municipalities (kommuner)
2. **Click on Regions**: Click any region on the map to view its statistics
3. **Filter by Industry**: Use the dropdown to filter data by næring (industry)
4. **Compare Regions**: Add multiple regions to compare their statistics
5. **Toggle Views**: Switch between chart view and icon view for statistics

## Mobile Optimization

The application automatically detects screen size and provides:
- **Mobile**: Tabbed interface with collapsible sections
- **Desktop**: Side-by-side map and statistics layout

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
