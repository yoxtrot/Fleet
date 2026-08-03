import type { VehicleType } from './vehicleTypes'

export const CUSTOM_CATALOG_VALUE = '__custom__'

const CURRENT_YEAR = new Date().getFullYear()

export const VEHICLE_YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1949 },
  (_, index) => CURRENT_YEAR - index,
)

const CAR_MAKES = [
  'Acura',
  'Audi',
  'BMW',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ford',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jeep',
  'Kia',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Porsche',
  'Ram',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
]

const MOTORCYCLE_MAKES = [
  'BMW',
  'Ducati',
  'Harley-Davidson',
  'Honda',
  'Indian',
  'Kawasaki',
  'KTM',
  'Suzuki',
  'Triumph',
  'Yamaha',
]

const BIKE_MAKES = [
  'Cannondale',
  'Canyon',
  'Cervelo',
  'Giant',
  'Santa Cruz',
  'Scott',
  'Specialized',
  'Surly',
  'Trek',
]

const POPULAR_MODELS_BY_TYPE_AND_MAKE: Record<VehicleType, Record<string, string[]>> = {
  car: {
    Acura: ['ILX', 'TLX', 'RDX', 'MDX', 'Integra'],
    Audi: ['A3', 'A4', 'A6', 'Q5', 'Q7'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5', 'M3'],
    Buick: ['Encore', 'Envision', 'Enclave'],
    Cadillac: ['CT4', 'CT5', 'XT5', 'Escalade'],
    Chevrolet: ['Silverado', 'Colorado', 'Camaro', 'Corvette', 'Equinox', 'Tahoe'],
    Chrysler: ['300', 'Pacifica'],
    Dodge: ['Charger', 'Challenger', 'Durango'],
    Ford: ['Mustang', 'F-150', 'Bronco', 'Explorer', 'Escape', 'Ranger', 'Focus', 'Fusion'],
    GMC: ['Sierra', 'Canyon', 'Yukon', 'Terrain'],
    Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline'],
    Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Ioniq 5'],
    Infiniti: ['Q50', 'QX50', 'QX60'],
    Jeep: ['Wrangler', 'Grand Cherokee', 'Gladiator', 'Cherokee'],
    Kia: ['Forte', 'K5', 'Sportage', 'Telluride', 'EV6'],
    Lexus: ['IS', 'ES', 'RX', 'GX', 'LX'],
    Mazda: ['Mazda3', 'Mazda6', 'CX-5', 'CX-50', 'MX-5 Miata'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE'],
    Mini: ['Cooper', 'Countryman'],
    Mitsubishi: ['Outlander', 'Eclipse Cross'],
    Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', '370Z', 'GT-R'],
    Porsche: ['911', 'Cayman', 'Macan', 'Cayenne'],
    Ram: ['1500', '2500', '3500'],
    Subaru: ['Impreza', 'WRX', 'WRX STI', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'BRZ'],
    Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Tacoma', 'Tundra', '4Runner', 'Prius', 'Supra'],
    Volkswagen: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'GTI'],
    Volvo: ['S60', 'XC40', 'XC60', 'XC90'],
  },
  motorcycle: {
    BMW: ['R 1250 GS', 'S 1000 RR', 'F 850 GS'],
    Ducati: ['Monster', 'Panigale', 'Multistrada', 'Scrambler'],
    'Harley-Davidson': ['Sportster', 'Street Glide', 'Fat Boy', 'Iron 883'],
    Honda: ['CBR600RR', 'CBR1000RR', 'Africa Twin', 'Rebel 500', 'Gold Wing'],
    Indian: ['Scout', 'Chief', 'Chieftain'],
    Kawasaki: ['Ninja 650', 'Ninja ZX-6R', 'Z900', 'KLR 650', 'Versys'],
    KTM: ['390 Duke', '890 Adventure', '1290 Super Duke'],
    Suzuki: ['GSX-R600', 'GSX-R1000', 'V-Strom', 'SV650'],
    Triumph: ['Bonneville', 'Street Triple', 'Tiger', 'Speed Triple'],
    Yamaha: ['MT-07', 'MT-09', 'YZF-R1', 'YZF-R6', 'Tenere 700', 'XSR700'],
  },
  bike: {
    Cannondale: ['Synapse', 'Topstone', 'Habit', 'Scalpel'],
    Giant: ['Defy', 'TCR', 'Trance', 'Revolt'],
    Specialized: ['Stumpjumper', 'Tarmac', 'Rockhopper', 'Diverge', 'Turbo Levo'],
    Trek: ['Marlin', 'Domane', 'Fuel EX', 'Checkpoint', 'Emonda'],
    'Santa Cruz': ['Hightower', 'Bronson', 'Chameleon', 'Tallboy'],
    Surly: ['Straggler', 'Bridge Club', 'Karate Monkey'],
    Canyon: ['Endurace', 'Ultimate', 'Spectral', 'Grizl'],
    Cervelo: ['R5', 'Caledonia', 'Aspero'],
    Scott: ['Spark', 'Addict', 'Scale'],
  },
}

export function popularMakesForVehicleType(vehicleType: VehicleType) {
  if (vehicleType === 'motorcycle') return MOTORCYCLE_MAKES
  if (vehicleType === 'bike') return [...new Set(BIKE_MAKES)].sort((a, b) => a.localeCompare(b))
  return CAR_MAKES
}

export function popularModelsForMake(vehicleType: VehicleType, make: string) {
  return POPULAR_MODELS_BY_TYPE_AND_MAKE[vehicleType][make] ?? []
}

type NhtsaModelRow = { Model_Name?: string }

/**
 * Year-specific models from the NHTSA VPIC catalog for cars and motorcycles.
 * Falls back to the popular static list when the network call fails or returns nothing.
 */
export async function fetchModelsForMakeYear(
  vehicleType: VehicleType,
  make: string,
  year: number,
): Promise<string[]> {
  const fallback = popularModelsForMake(vehicleType, make)
  if (vehicleType === 'bike') return fallback

  try {
    const vehicleTypeQuery =
      vehicleType === 'motorcycle' ? '&vehicleType=motorcycle' : '&vehicleType=car'
    const url =
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/` +
      `${encodeURIComponent(make)}/modelyear/${year}?format=json${vehicleTypeQuery}`
    const response = await fetch(url)
    if (!response.ok) return fallback

    const payload = (await response.json()) as { Results?: NhtsaModelRow[] }
    const models = [
      ...new Set(
        (payload.Results ?? [])
          .map((row) => row.Model_Name?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    ].sort((left, right) => left.localeCompare(right))

    if (models.length === 0) return fallback

    // Keep popular garage staples visible even when NHTSA omits a trim-level name.
    for (const popular of fallback) {
      if (!models.some((model) => model.toLowerCase() === popular.toLowerCase())) {
        models.push(popular)
      }
    }
    return models.sort((left, right) => left.localeCompare(right))
  } catch {
    return fallback
  }
}

export function resolveCatalogSelection(selectedValue: string, customValue: string) {
  if (selectedValue === CUSTOM_CATALOG_VALUE) return customValue.trim()
  return selectedValue.trim()
}
