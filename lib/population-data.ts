import * as XLSX from 'xlsx';

export interface PopulationData {
  kommune_nr?: string;
  fylkes_nr?: string;
  SUM: number;
  '0-24': number;
  '25-34': number;
  '35-44': number;
  '45-69': number;
  '70-79': number;
  '80+': number;
}

let kommunePopulationCache: PopulationData[] | null = null;
let fylkePopulationCache: PopulationData[] | null = null;

/**
 * Read Excel file and return population data
 */
async function readPopulationExcel(filePath: string): Promise<PopulationData[]> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error('No worksheet found');
    }
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData as PopulationData[];
  } catch (error) {
    console.error('Error reading population Excel file:', error);
    throw error;
  }
}

/**
 * Get population data for kommune
 */
export async function getKommunePopulation(): Promise<PopulationData[]> {
  if (kommunePopulationCache) {
    return kommunePopulationCache;
  }
  
  try {
    const data = await readPopulationExcel('/befolkning_kommune.xlsx');
    kommunePopulationCache = data;
    return data;
  } catch (error) {
    console.error('Error loading kommune population data:', error);
    return [];
  }
}

/**
 * Get population data for fylke
 */
export async function getFylkePopulation(): Promise<PopulationData[]> {
  if (fylkePopulationCache) {
    return fylkePopulationCache;
  }
  
  try {
    const data = await readPopulationExcel('/befolkning_fylke.xlsx');
    fylkePopulationCache = data;
    return data;
  } catch (error) {
    console.error('Error loading fylke population data:', error);
    return [];
  }
}

/**
 * Get population for a specific kommune
 */
export async function getKommunePopulationByNr(kommuneNr: string): Promise<number | null> {
  try {
    const data = await getKommunePopulation();
    const kommune = data.find(item => item.kommune_nr === kommuneNr);
    return kommune?.SUM || null;
  } catch (error) {
    console.error('Error getting kommune population:', error);
    return null;
  }
}

/**
 * Get population for a specific fylke
 */
export async function getFylkePopulationByNr(fylkesNr: string): Promise<number | null> {
  try {
    const data = await getFylkePopulation();
    const fylke = data.find(item => item.fylkes_nr === fylkesNr);
    return fylke?.SUM || null;
  } catch (error) {
    console.error('Error getting fylke population:', error);
    return null;
  }
}

/**
 * Get full population data (including age groups) for a specific kommune
 */
export async function getKommunePopulationDataByNr(kommuneNr: string): Promise<PopulationData | null> {
  try {
    const data = await getKommunePopulation();
    const kommune = data.find(item => item.kommune_nr === kommuneNr);
    return kommune || null;
  } catch (error) {
    console.error('Error getting kommune population data:', error);
    return null;
  }
}

/**
 * Get full population data (including age groups) for a specific fylke
 */
export async function getFylkePopulationDataByNr(fylkesNr: string): Promise<PopulationData | null> {
  try {
    const data = await getFylkePopulation();
    const fylke = data.find(item => item.fylkes_nr === fylkesNr);
    return fylke || null;
  } catch (error) {
    console.error('Error getting fylke population data:', error);
    return null;
  }
}
