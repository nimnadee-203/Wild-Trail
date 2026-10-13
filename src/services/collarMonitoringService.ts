/**
 * Collar Monitoring Service & Risk Zone Evaluation
 * Feature: Monitor Tracked Wildlife and Respond to Risk Alerts (UC3)
 */

import {
  LocationReading,
  RiskZoneBoundary,
  RiskZoneType,
  RiskLevel,
  TrackedAnimal,
  WildlifeRiskAlert,
} from '../types/wildlife';
import { alertDispatchService, AlertDispatchService } from './alertDispatchService';

/**
 * RiskZone represents an operational danger zone configured in the reserve.
 * Provides a geometry helper to test whether a geographic point falls within its perimeter.
 */
export class RiskZone {
  public zoneId: string;
  public zoneName: string;
  public zoneType: RiskZoneType;
  public boundary: RiskZoneBoundary;
  public riskLevel: RiskLevel;
  public description?: string;

  constructor(params: {
    zoneId: string;
    zoneName: string;
    zoneType: RiskZoneType;
    boundary: RiskZoneBoundary;
    riskLevel: RiskLevel;
    description?: string;
  }) {
    this.zoneId = params.zoneId;
    this.zoneName = params.zoneName;
    this.zoneType = params.zoneType;
    this.boundary = params.boundary;
    this.riskLevel = params.riskLevel;
    this.description = params.description;
  }

  /**
   * Geometry helper checking if coordinates fall inside the configured boundary.
   */
  public isPointInside(latitude: number, longitude: number): boolean {
    const { minLat, maxLat, minLng, maxLng, polygon } = this.boundary;

    const latMin = Math.min(minLat, maxLat);
    const latMax = Math.max(minLat, maxLat);
    const lngMin = Math.min(minLng, maxLng);
    const lngMax = Math.max(minLng, maxLng);

    const insideBbox =
      latitude >= latMin &&
      latitude <= latMax &&
      longitude >= lngMin &&
      longitude <= lngMax;

    if (!insideBbox) {
      return false;
    }

    if (!polygon || polygon.length < 3) {
      return true;
    }

    // Ray casting algorithm for arbitrary polygonal boundaries
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersect =
        yi > longitude !== yj > longitude &&
        latitude < ((xj - xi) * (longitude - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }
}

export interface ReadingValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ReadingProcessResult {
  status: 'SAFE_ZONE' | 'RISK_DETECTED' | 'INVALID_READING' | 'ALERT_CREATED' | 'ALERT_EXISTS';
  reading: LocationReading;
  animal?: TrackedAnimal;
  riskZone?: RiskZone | null;
  alert?: WildlifeRiskAlert | null;
}

/**
 * Standard default risk zones across Yala / Southern Wildlife Reserve
 */
export const DEFAULT_RISK_ZONES: RiskZone[] = [
  new RiskZone({
    zoneId: 'ZONE-FARMLAND-B',
    zoneName: 'Farmland Zone B',
    zoneType: 'Farmland',
    boundary: { minLat: 6.29, maxLat: 6.31, minLng: 81.33, maxLng: 81.35 },
    riskLevel: 'HIGH',
    description: 'Paddy cultivations and village crop perimeter adjacent to Sector 4 fence',
  }),
  new RiskZone({
    zoneId: 'ZONE-ROAD-A',
    zoneName: 'Highway Crossway A12',
    zoneType: 'Road',
    boundary: { minLat: 6.35, maxLat: 6.37, minLng: 81.40, maxLng: 81.43 },
    riskLevel: 'HIGH',
    description: 'High-speed coastal transport corridor crossing elephant migratory corridor',
  }),
  new RiskZone({
    zoneId: 'ZONE-VILLAGE-C',
    zoneName: 'Kataragama Village Border',
    zoneType: 'Village',
    boundary: { minLat: 6.40, maxLat: 6.42, minLng: 81.31, maxLng: 81.34 },
    riskLevel: 'HIGH',
    description: 'Residential community and school compound boundary',
  }),
  new RiskZone({
    zoneId: 'ZONE-WATERHOLE-C',
    zoneName: 'Waterhole Transition Zone C',
    zoneType: 'Waterhole',
    boundary: { minLat: 6.85, maxLat: 6.87, minLng: 80.92, maxLng: 80.95 },
    riskLevel: 'MEDIUM',
    description: 'Seasonal water reservoir frequented during dusk dry spells',
  }),
  new RiskZone({
    zoneId: 'ZONE-BOUNDARY-EAST',
    zoneName: 'Eastern Forest Sanctuary Boundary',
    zoneType: 'Forest Boundary',
    boundary: { minLat: 6.83, maxLat: 6.85, minLng: 80.90, maxLng: 80.93 },
    riskLevel: 'MEDIUM',
    description: 'Perimeter fence between reserve parkland and community buffer',
  }),
];

/**
 * Initial catalogue of collared animals
 */
export const DEFAULT_TRACKED_ANIMALS: TrackedAnimal[] = [
  {
    animalId: 'E-014',
    name: 'Elephant E-014',
    species: 'Asian Elephant (Bull, 28 yrs)',
    collarId: 'COL-014',
    sex: 'Male',
    age: 28,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg',
    notes: 'Large dominant bull with frequent border-crossing tendencies towards farmland.',
  },
  {
    animalId: 'E-011',
    name: 'Elephant E-011',
    species: 'Asian Elephant (Cow, Herd leader)',
    collarId: 'COL-011',
    sex: 'Female',
    age: 34,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Elephant_near_ndutu.jpg/320px-Elephant_near_ndutu.jpg',
    notes: 'Matriarch leading herd of 8 along the southern migration path.',
  },
  {
    animalId: 'L-003',
    name: 'Leopard L-003',
    species: 'Indian Leopard',
    collarId: 'COL-003',
    sex: 'Male',
    age: 6,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Sri_Lankan_leopard_%28Panthera_pardus_kotiya%29_male.jpg/320px-Sri_Lankan_leopard_%28Panthera_pardus_kotiya%29_male.jpg',
    notes: 'Territorial male roaming northern ridge sanctuary.',
  },
];

/**
 * CollarMonitoringService
 * Orchestrates ingestion of simulated GPS collar readings, validates telemetry,
 * evaluates animal coordinates against configured risk zones, and initiates alert creation.
 */
export class CollarMonitoringService {
  private animals: Map<string, TrackedAnimal> = new Map();
  private riskZones: Map<string, RiskZone> = new Map();
  private dispatchService: AlertDispatchService;

  constructor(
    initialAnimals: TrackedAnimal[] = DEFAULT_TRACKED_ANIMALS,
    initialZones: RiskZone[] = DEFAULT_RISK_ZONES,
    dispatchService?: AlertDispatchService
  ) {
    this.dispatchService = dispatchService || alertDispatchService;
    initialAnimals.forEach((a) => this.animals.set(a.animalId, { ...a }));
    initialZones.forEach((z) => this.riskZones.set(z.zoneId, z));
  }

  // --- Animal Registry ---
  public registerAnimal(animal: TrackedAnimal): void {
    this.animals.set(animal.animalId, { ...animal });
  }

  public getAnimal(animalId: string): TrackedAnimal | undefined {
    return this.animals.get(animalId);
  }

  public getAllAnimals(): TrackedAnimal[] {
    return Array.from(this.animals.values());
  }

  // --- Risk Zone Registry ---
  public registerRiskZone(zone: RiskZone): void {
    this.riskZones.set(zone.zoneId, zone);
  }

  public getRiskZones(): RiskZone[] {
    return Array.from(this.riskZones.values());
  }

  public getRiskZoneById(zoneId: string): RiskZone | undefined {
    return this.riskZones.get(zoneId);
  }

  public clearRiskZones(): void {
    this.riskZones.clear();
  }

  // --- Telemetry Validation ---
  public validateLocationReading(reading: unknown): ReadingValidationResult {
    if (!reading || typeof reading !== 'object') {
      return { isValid: false, error: 'Reading must be a non-null object' };
    }

    const r = reading as Partial<LocationReading>;

    if (!r.readingId || typeof r.readingId !== 'string' || !r.readingId.trim()) {
      return { isValid: false, error: 'Missing or invalid readingId' };
    }

    if (!r.animalId || typeof r.animalId !== 'string' || !r.animalId.trim()) {
      return { isValid: false, error: 'Missing or invalid animalId' };
    }

    if (typeof r.latitude !== 'number' || isNaN(r.latitude)) {
      return { isValid: false, error: 'Latitude must be a valid number' };
    }

    if (r.latitude < -90 || r.latitude > 90) {
      return { isValid: false, error: 'Latitude out of range [-90, 90]' };
    }

    if (typeof r.longitude !== 'number' || isNaN(r.longitude)) {
      return { isValid: false, error: 'Longitude must be a valid number' };
    }

    if (r.longitude < -180 || r.longitude > 180) {
      return { isValid: false, error: 'Longitude out of range [-180, 180]' };
    }

    if (!r.timestamp || typeof r.timestamp !== 'string') {
      return { isValid: false, error: 'Missing or invalid timestamp' };
    }

    const parsedDate = Date.parse(r.timestamp);
    if (isNaN(parsedDate)) {
      return { isValid: false, error: 'Timestamp must be a valid ISO date string' };
    }

    return { isValid: true };
  }

  // --- Core Telemetry Processing ---
  public async processLocationReading(reading: LocationReading): Promise<ReadingProcessResult> {
    const validation = this.validateLocationReading(reading);
    if (!validation.isValid) {
      return {
        status: 'INVALID_READING',
        reading,
        alert: null,
      };
    }

    // Locate or link tracked animal
    let animal = this.getAnimal(reading.animalId);
    if (!animal) {
      // Auto-register with basic info if collar is recognized by ID
      animal = {
        animalId: reading.animalId,
        species: 'Tracked Wildlife',
        name: `Animal ${reading.animalId}`,
        collarId: `COL-${reading.animalId}`,
      };
      this.registerAnimal(animal);
    }

    // Update animal's latest telemetry
    animal.lastKnownLocation = {
      latitude: reading.latitude,
      longitude: reading.longitude,
      timestamp: reading.timestamp,
    };

    // Check animal's position against configured risk zones (UML: +checkRiskZone)
    const detectedZone = this.checkRiskZone(reading.latitude, reading.longitude);

    // Outside all risk zones -> Safe
    if (!detectedZone) {
      return {
        status: 'SAFE_ZONE',
        reading,
        animal,
        riskZone: null,
        alert: null,
      };
    }

    // Animal has entered a risk zone (UML: +createAlert)
    const alert = await this.createAlert(animal, detectedZone, reading);

    return {
      status: 'ALERT_CREATED',
      reading,
      animal,
      riskZone: detectedZone,
      alert,
    };
  }

  /**
   * UML Method: +evaluateLocation()
   * Evaluates and validates incoming coordinates and telemetry reading.
   */
  public evaluateLocation(reading: unknown): ReadingValidationResult {
    return this.validateLocationReading(reading);
  }

  /**
   * UML Method: +checkRiskZone()
   * Evaluates geographic coordinates against configured risk zones.
   */
  public checkRiskZone(latitude: number, longitude: number): RiskZone | null {
    for (const zone of this.riskZones.values()) {
      if (zone.isPointInside(latitude, longitude)) {
        return zone;
      }
    }
    return null;
  }

  /**
   * UML Method: +createAlert()
   * Generates a new risk alert through the alert dispatch service.
   */
  public async createAlert(
    animal: TrackedAnimal,
    riskZone: RiskZone,
    reading: LocationReading
  ): Promise<WildlifeRiskAlert> {
    return this.dispatchService.createAlertFromCollarReading({
      animal,
      riskZone,
      reading,
    });
  }
}

/**
 * GPS Collar Simulator for testing and telemetry generation
 */
export class GPSCollarSimulator {
  private service: CollarMonitoringService;

  constructor(service: CollarMonitoringService) {
    this.service = service;
  }

  public createReading(params: {
    animalId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: string;
    timestamp?: string;
    readingId?: string;
  }): LocationReading {
    return {
      readingId: params.readingId || `READ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      animalId: params.animalId,
      latitude: params.latitude,
      longitude: params.longitude,
      timestamp: params.timestamp || new Date().toISOString(),
      speed: params.speed ?? 1.5,
      heading: params.heading ?? 'SW',
      batteryLevel: 88,
    };
  }

  public async simulatePing(params: {
    animalId: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
  }): Promise<ReadingProcessResult> {
    const reading = this.createReading(params);
    return this.service.processLocationReading(reading);
  }
}

export const collarMonitoringService = new CollarMonitoringService();
export const collarSimulator = new GPSCollarSimulator(collarMonitoringService);
