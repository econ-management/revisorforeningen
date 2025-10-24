import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our data
export interface KommuneNaringData {
  kommune_nr: string
  kommune: string
  naring: string
  verdiskaping: number
  aarsverk: number
  lonn_trygd_pensjon: number
  skattekostnad_ordinart: number
}

export interface FylkeNaringData {
  fylkes_nr: number
  fylkes_navn: string
  naring: string
  verdiskaping: number
  aarsverk: number
  lonn_trygd_pensjon: number
  skattekostnad_ordinart: number
}

export interface FylkeData {
  fylkes_nr: number
  fylkes_navn: string
  verdiskaping: number
  aarsverk: number
  lonn_trygd_pensjon: number
  skattekostnad_ordinart: number
}

export interface KommuneData {
  kommune_nr: string
  kommune: string
  verdiskaping: number
  aarsverk: number
  lonn_trygd_pensjon: number
  skattekostnad_ordinart: number
}

export interface ForetakData {
  kommune_nr: string
  x_coord: number
  y_coord: number
  ansatte: number
  navn?: string
  [key: string]: any
}

// Database functions
export async function getKommuneNaringData(kommuneNr?: string, naring?: string) {
  console.log('getKommuneNaringData called with:', { kommuneNr, naring })
  
  let allData: KommuneNaringData[] = []
  let from = 0
  const batchSize = 1000
  
  while (true) {
    let query = supabase
      .from('kommune_naring')
      .select('*')
      .range(from, from + batchSize - 1)

    if (kommuneNr) {
      query = query.eq('kommune_nr', kommuneNr)
    }

    if (naring) {
      query = query.eq('naring', naring)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching kommune data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    allData = allData.concat(data as KommuneNaringData[])
    
    // If we got less than batchSize, we've reached the end
    if (data.length < batchSize) {
      break
    }
    
    from += batchSize
  }

  console.log('getKommuneNaringData result:', allData.length, 'rows')
  return allData
}

export async function getFylkeNaringData(fylkeNr?: string, naring?: string) {
  console.log('getFylkeNaringData called with:', { fylkeNr, naring })
  
  let allData: FylkeNaringData[] = []
  let from = 0
  const batchSize = 1000
  
  while (true) {
    let query = supabase
      .from('fylke_naring')
      .select('*')
      .range(from, from + batchSize - 1)

    if (fylkeNr) {
      query = query.eq('fylkes_nr', fylkeNr)
    }

    if (naring) {
      query = query.eq('naring', naring)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching fylke data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    allData = allData.concat(data as FylkeNaringData[])
    
    // If we got less than batchSize, we've reached the end
    if (data.length < batchSize) {
      break
    }
    
    from += batchSize
  }

  console.log('getFylkeNaringData result:', allData.length, 'rows')
  return allData
}

export async function getFylkeData(fylkeNr?: string) {
  console.log('getFylkeData called with:', { fylkeNr })
  
  let allData: FylkeData[] = []
  let from = 0
  const batchSize = 1000
  
  while (true) {
    let query = supabase
      .from('fylke')
      .select('*')
      .range(from, from + batchSize - 1)

    if (fylkeNr) {
      query = query.eq('fylkes_nr', fylkeNr)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching fylke data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    allData = allData.concat(data as FylkeData[])
    
    // If we got less than batchSize, we've reached the end
    if (data.length < batchSize) {
      break
    }
    
    from += batchSize
  }

  console.log('getFylkeData result:', allData.length, 'rows')
  return allData
}

export async function getKommuneData(kommuneNr?: string) {
  console.log('getKommuneData called with:', { kommuneNr })
  
  let allData: KommuneData[] = []
  let from = 0
  const batchSize = 1000
  
  while (true) {
    let query = supabase
      .from('kommune')
      .select('*')
      .range(from, from + batchSize - 1)

    if (kommuneNr) {
      query = query.eq('kommune_nr', kommuneNr)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching kommune data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    allData = allData.concat(data as KommuneData[])
    
    // If we got less than batchSize, we've reached the end
    if (data.length < batchSize) {
      break
    }
    
    from += batchSize
  }

  console.log('getKommuneData result:', allData.length, 'rows')
  return allData
}

export async function getForetakData(kommuneNr: string): Promise<ForetakData[]> {
  console.log('getForetakData called with:', { kommuneNr })
  
  let allData: ForetakData[] = []
  let from = 0
  const batchSize = 1000
  
  while (true) {
    const { data, error } = await supabase
      .from('foretak')
      .select('*')
      .eq('kommune_nr', kommuneNr)
      .range(from, from + batchSize - 1)

    if (error) {
      console.error('Error fetching foretak data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    allData = allData.concat(data as ForetakData[])
    
    // If we got less than batchSize, we've reached the end
    if (data.length < batchSize) {
      break
    }
    
    from += batchSize
  }

  console.log('getForetakData result:', allData.length, 'rows')
  return allData
}

export async function getUniqueNaringer() {
  console.log('getUniqueNaringer called')
  
  // Use the database function with DISTINCT
  const { data, error } = await supabase
    .rpc('get_distinct_naringer')

  if (error) {
    console.error('Error fetching næringer:', error)
    throw error
  }

  console.log('getUniqueNaringer result:', data)
  // Extract just the naring strings from the objects
  return data.map((item: any) => item.naring)
}
