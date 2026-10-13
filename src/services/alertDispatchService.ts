/**
 * Alert Dispatch & Responder Management Service
 * Feature: Monitor Tracked Wildlife and Respond to Risk Alerts (UC3)
 * Supports both Rangers and Community Liaison Officers, escalation lifecycle,
 * and Cannot Respond handling.
 */

import {
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertLifecycleStatus,
  DeclineRecord,
  EligibleResponder,
  LocationReading,
  ResponderRole,
  TrackedAnimal,
  WildlifeRiskAlert,
} from '../types/wildlife';
import { RiskZone } from './collarMonitoringService';
import { db } from './firebaseConfig';

export interface CreateAlertParams {
  animal: TrackedAnimal;
  riskZone: RiskZone;
  reading: LocationReading;
}

export const DEFAULT_ELIGIBLE_RESPONDERS: EligibleResponder[] = [
  {
    id: 'ranger-204',
    userId: 'usr-ranger-204',
    name: 'Ranger Nimal Perera',
    role: 'ranger',
    badge: 'RG-204',
    parkId: 'yala',
    zoneId: 'block-01',
    status: 'AVAILABLE',
  },
  {
    id: 'ranger-105',
    userId: 'usr-ranger-105',
    name: 'Ranger Sunil Rathnayake',
    role: 'ranger',
    badge: 'RG-105',
    parkId: 'yala',
    zoneId: 'block-02',
    status: 'AVAILABLE',
  },
  {
    id: 'usr-liaison-305',
    userId: 'usr-liaison-305',
    name: 'Liaison Anura Bandara',
    role: 'liaison',
    badge: 'LIA-305',
    parkId: 'yala',
    zoneId: 'community-buffer-b',
    status: 'AVAILABLE',
  },
  {
    id: 'usr-liaison-306',
    userId: 'usr-liaison-306',
    name: 'Liaison Kamal Jayawardena',
    role: 'liaison',
    badge: 'LIA-306',
    parkId: 'yala',
    zoneId: 'farmland-border-a',
    status: 'AVAILABLE',
  },
];

export class AlertDispatchService {
  private alerts: Map<string, WildlifeRiskAlert> = new Map();
  private responders: Map<string, EligibleResponder> = new Map();
  private escalationTimeoutMs: number = 5 * 60 * 1000; // Default 5 minutes

  constructor(initialResponders: EligibleResponder[] = DEFAULT_ELIGIBLE_RESPONDERS) {
    initialResponders.forEach((r) => this.responders.set(r.id, { ...r }));
  }

  // --- Configuration ---
  public setEscalationTimeout(timeoutMs: number): void {
    if (timeoutMs > 0) {
      this.escalationTimeoutMs = timeoutMs;
    }
  }

  public getEscalationTimeout(): number {
    return this.escalationTimeoutMs;
  }

  // --- Responder Registry ---
  public registerResponder(responder: EligibleResponder): void {
    this.responders.set(responder.id, { ...responder });
  }

  public getResponder(id: string): EligibleResponder | undefined {
    return this.responders.get(id);
  }

  public getAllResponders(): EligibleResponder[] {
    return Array.from(this.responders.values());
  }

  public updateResponderStatus(
    id: string,
    status: EligibleResponder['status']
  ): void {
    const responder = this.responders.get(id);
    if (responder) {
      responder.status = status;
    }
  }

  /**
   * Identifies eligible responders for a risk alert.
   * Supports BOTH Rangers and Community Liaison Officers.
   * Filters out responders who have already declined this specific alert or are unavailable.
   */
  public async getEligibleResponders(alert: WildlifeRiskAlert): Promise<EligibleResponder[]> {
    const declinedIds = new Set(
      (alert.declinedResponders || []).map((d) => d.responderId)
    );

    const availableResponders = Array.from(this.responders.values()).filter(
      (r) => r.status === 'AVAILABLE' && !declinedIds.has(r.id)
    );

    // If alert is in a community/farmland/village zone, prioritize Liaison officers alongside rangers
    if (
      alert.riskZoneType === 'Farmland' ||
      alert.riskZoneType === 'Village' ||
      alert.riskZoneType === 'Buffer Zone'
    ) {
      return availableResponders.sort((a, b) => {
        if (a.role === 'liaison' && b.role !== 'liaison') return -1;
        if (a.role !== 'liaison' && b.role === 'liaison') return 1;
        return 0;
      });
    }

    return availableResponders;
  }

  // --- Alert Creation & Relationships ---
  public async createAlertFromCollarReading(params: CreateAlertParams): Promise<WildlifeRiskAlert> {
    const { animal, riskZone, reading } = params;

    const alertDocId = `ALERT-${animal.animalId}-${Date.now().toString(36).toUpperCase()}`;
    const createdAt = reading.timestamp || new Date().toISOString();

    const newAlert: WildlifeRiskAlert = {
      id: alertDocId,
      alertId: alertDocId,
      animalId: animal.animalId,
      species: animal.species,
      riskZoneId: riskZone.zoneId,
      riskZoneName: riskZone.zoneName,
      riskZoneType: riskZone.zoneType,
      riskLevel: riskZone.riskLevel,
      location: riskZone.zoneName,
      latitude: reading.latitude,
      longitude: reading.longitude,
      status: 'NEW',
      createdAt,
      image: animal.imageUrl,
      description: `Tracked ${animal.species} (${animal.name || animal.animalId}) entered ${riskZone.zoneName} (${riskZone.zoneType}). Risk level: ${riskZone.riskLevel}.`,
      declinedResponders: [],
    };

    // Find and assign initial eligible responder if available
    const eligible = await this.getEligibleResponders(newAlert);
    if (eligible.length > 0) {
      const primary = eligible[0];
      newAlert.assignedResponder = {
        responderId: primary.id,
        responderName: primary.name,
        responderRole: primary.role,
        assignedAt: createdAt,
      };
    }

    this.alerts.set(alertDocId, newAlert);

    // Synchronize to Firestore collection 'alerts' if available
    try {
      if (db) {
        const docRef = doc(db, 'alerts', alertDocId);
        await setDoc(docRef, {
          animalId: animal.name || animal.animalId,
          rawAnimalId: animal.animalId,
          species: animal.species,
          location: riskZone.zoneName,
          distance: '350m to houses',
          level: riskZone.riskLevel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'PENDING',
          image: animal.imageUrl || '',
          description: newAlert.description,
          latitude: reading.latitude,
          longitude: reading.longitude,
          riskZoneId: riskZone.zoneId,
          riskZoneType: riskZone.zoneType,
          createdAt,
          assignedResponder: newAlert.assignedResponder || null,
        });
      }
    } catch {
      // In tests or offline, local memory persists
    }

    return newAlert;
  }

  public getAlert(alertId: string): WildlifeRiskAlert | undefined {
    return this.alerts.get(alertId);
  }

  public getAllAlerts(): WildlifeRiskAlert[] {
    return Array.from(this.alerts.values());
  }

  public getAlertsForAnimal(animalId: string): WildlifeRiskAlert[] {
    return Array.from(this.alerts.values()).filter((a) => a.animalId === animalId);
  }

  // --- Alert Acknowledgement & Response ---
  public async acknowledgeAlert(
    alertId: string,
    responder: { id: string; name: string; role: ResponderRole }
  ): Promise<WildlifeRiskAlert> {
    let alert = this.alerts.get(alertId);
    if (!alert) {
      alert = {
        id: alertId,
        alertId,
        animalId: 'Unknown',
        species: 'Wildlife',
        riskZoneId: 'ZONE-DEFAULT',
        riskZoneName: 'Risk Zone',
        riskZoneType: 'Farmland',
        riskLevel: 'HIGH',
        location: 'Risk Zone',
        latitude: 0,
        longitude: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        declinedResponders: [],
      };
      this.alerts.set(alertId, alert);
    }

    if (alert.status === 'RESOLVED') {
      throw new Error('Cannot acknowledge an already resolved alert');
    }

    if (alert.status === 'ACKNOWLEDGED') {
      throw new Error('Alert has already been acknowledged');
    }

    const now = new Date().toISOString();
    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = now;
    alert.assignedResponder = {
      responderId: responder.id,
      responderName: responder.name,
      responderRole: responder.role,
      assignedAt: now,
    };

    // Update responder status to RESPONDING_TO_ALERT
    this.updateResponderStatus(responder.id, 'RESPONDING_TO_ALERT');

    // Sync to Firestore
    try {
      if (db) {
        const alertRef = doc(db, 'alerts', alertId);
        await updateDoc(alertRef, {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: now,
          assignedResponder: alert.assignedResponder,
        });
      }
    } catch {
      // local memory updated
    }

    return alert;
  }

  /**
   * Cannot Respond flow:
   * Responder declines alert with a reason.
   * Keeps alert active, stores reason, timestamp, and reassigns or escalates.
   */
  public async recordCannotRespond(
    alertId: string,
    responder: { id: string; name: string; role: ResponderRole },
    reason: string
  ): Promise<{ alert: WildlifeRiskAlert; reassignedTo?: EligibleResponder; escalated: boolean }> {
    let alert = this.alerts.get(alertId);
    if (!alert) {
      alert = {
        id: alertId,
        alertId,
        animalId: 'Unknown',
        species: 'Wildlife',
        riskZoneId: 'ZONE-DEFAULT',
        riskZoneName: 'Risk Zone',
        riskZoneType: 'Farmland',
        riskLevel: 'HIGH',
        location: 'Risk Zone',
        latitude: 0,
        longitude: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        declinedResponders: [],
      };
      this.alerts.set(alertId, alert);
    }

    if (alert.status === 'RESOLVED') {
      throw new Error('Cannot decline an already resolved alert');
    }

    const timestamp = new Date().toISOString();
    const declineEntry: DeclineRecord = {
      responderId: responder.id,
      responderName: responder.name,
      responderRole: responder.role,
      reason,
      timestamp,
    };

    if (!alert.declinedResponders) {
      alert.declinedResponders = [];
    }
    alert.declinedResponders.push(declineEntry);
    alert.declineReason = reason;

    // Reset responder assignment
    alert.assignedResponder = null;

    // Attempt to offer to another available eligible responder
    const alternativeResponders = await this.getEligibleResponders(alert);
    let reassignedTo: EligibleResponder | undefined = undefined;
    let escalated = false;

    if (alternativeResponders.length > 0) {
      const nextResponder = alternativeResponders[0];
      reassignedTo = nextResponder;
      alert.assignedResponder = {
        responderId: nextResponder.id,
        responderName: nextResponder.name,
        responderRole: nextResponder.role,
        assignedAt: timestamp,
      };
    } else {
      // No remaining available responders -> escalate alert!
      alert.status = 'ESCALATED';
      alert.escalatedAt = timestamp;
      alert.escalationReason = `No available responders remaining after decline by ${responder.name} (${reason})`;
      alert.escalationCount = (alert.escalationCount || 0) + 1;
      escalated = true;
    }

    // Sync with Firestore
    try {
      if (db) {
        const alertRef = doc(db, 'alerts', alertId);
        await updateDoc(alertRef, {
          status: alert.status === 'ESCALATED' ? 'ESCALATED' : 'PENDING',
          declineReason: reason,
          declinedResponders: alert.declinedResponders,
          assignedResponder: alert.assignedResponder || null,
          escalatedAt: alert.escalatedAt || null,
          escalationReason: alert.escalationReason || null,
        });
      }
    } catch {
      // local memory updated
    }

    return { alert, reassignedTo, escalated };
  }

  // --- Escalation Management ---
  public async checkAndEscalateAlerts(timeoutOverrideMs?: number): Promise<WildlifeRiskAlert[]> {
    const timeoutMs = timeoutOverrideMs ?? this.escalationTimeoutMs;
    const now = Date.now();
    const escalatedAlerts: WildlifeRiskAlert[] = [];

    for (const alert of this.alerts.values()) {
      // Prevent already resolved or responded alerts from escalating
      if (alert.status === 'RESOLVED' || alert.status === 'RESPONDED') {
        continue;
      }

      // Check if unacknowledged alert has expired
      if (alert.status === 'NEW' || alert.status === 'PENDING') {
        const createdTime = Date.parse(alert.createdAt);
        if (!isNaN(createdTime) && now - createdTime >= timeoutMs) {
          alert.status = 'ESCALATED';
          alert.escalatedAt = new Date().toISOString();
          alert.escalationReason = `Acknowledgement timed out after ${timeoutMs}ms`;
          alert.escalationCount = (alert.escalationCount || 0) + 1;

          // Attempt reassignment to another eligible responder
          const alternatives = await this.getEligibleResponders(alert);
          if (alternatives.length > 0) {
            const next = alternatives[0];
            alert.assignedResponder = {
              responderId: next.id,
              responderName: next.name,
              responderRole: next.role,
              assignedAt: alert.escalatedAt,
            };
          }

          escalatedAlerts.push(alert);

          try {
            if (db) {
              const alertRef = doc(db, 'alerts', alert.id);
              await updateDoc(alertRef, {
                status: 'ESCALATED',
                escalatedAt: alert.escalatedAt,
                escalationReason: alert.escalationReason,
                assignedResponder: alert.assignedResponder || null,
              });
            }
          } catch {
            // local memory updated
          }
        }
      }
    }

    return escalatedAlerts;
  }

  // --- Alert Resolution ---
  public async resolveAlert(alertId: string, responderId?: string): Promise<WildlifeRiskAlert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert with id ${alertId} not found`);
    }

    if (alert.status === 'RESOLVED') {
      return alert; // Already resolved
    }

    const now = new Date().toISOString();
    alert.status = 'RESOLVED';
    alert.resolvedAt = now;

    const actingResponderId = responderId || alert.assignedResponder?.responderId;
    if (actingResponderId) {
      this.updateResponderStatus(actingResponderId, 'AVAILABLE');
    }

    try {
      if (db) {
        const alertRef = doc(db, 'alerts', alertId);
        await updateDoc(alertRef, {
          status: 'RESOLVED',
          resolvedAt: now,
        });
      }
    } catch {
      // local memory updated
    }

    return alert;
  }

  /**
   * Dispatch rapid response team.
   * Resolved alerts must NOT allow new team dispatches unless explicitly reopened!
   */
  public async dispatchTeam(alertId: string, teamInfo?: string): Promise<WildlifeRiskAlert> {
    let alert = this.alerts.get(alertId);
    if (!alert) {
      alert = {
        id: alertId,
        alertId,
        animalId: 'Unknown',
        species: 'Wildlife',
        riskZoneId: 'ZONE-DEFAULT',
        riskZoneName: 'Risk Zone',
        riskZoneType: 'Farmland',
        riskLevel: 'HIGH',
        location: 'Risk Zone',
        latitude: 0,
        longitude: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        declinedResponders: [],
      };
      this.alerts.set(alertId, alert);
    }

    if (alert.status === 'RESOLVED') {
      throw new Error('Cannot dispatch team to an already resolved alert');
    }

    alert.status = 'RESPONDED';
    alert.respondedAt = new Date().toISOString();

    try {
      if (db) {
        const alertRef = doc(db, 'alerts', alertId);
        await updateDoc(alertRef, {
          status: 'RESPONDED',
          respondedAt: alert.respondedAt,
        });
      }
    } catch {
      // local memory updated
    }

    return alert;
  }

  /**
   * Reopen a resolved alert to allow further dispatch and responses.
   */
  public async reopenAlert(alertId: string, reason?: string): Promise<WildlifeRiskAlert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert with id ${alertId} not found`);
    }

    alert.status = 'PENDING';
    alert.resolvedAt = undefined;

    try {
      if (db) {
        const alertRef = doc(db, 'alerts', alertId);
        await updateDoc(alertRef, {
          status: 'PENDING',
          reopenedAt: new Date().toISOString(),
          reopenReason: reason || 'Reopened by operations',
        });
      }
    } catch {
      // local memory updated
    }

    return alert;
  }

  public isAlertActive(status: AlertLifecycleStatus | string): boolean {
    return status !== 'RESOLVED';
  }

  public isResponseCompleted(status: AlertLifecycleStatus | string): boolean {
    return status === 'RESOLVED' || status === 'RESPONDED';
  }

  // --- Status Transition Validation ---
  public validateStatusTransition(
    currentStatus: AlertLifecycleStatus,
    targetStatus: AlertLifecycleStatus
  ): boolean {
    if (currentStatus === 'RESOLVED' && targetStatus !== 'PENDING') {
      return false; // Terminal state unless explicitly reopened to PENDING
    }

    const allowedTransitions: Record<AlertLifecycleStatus, AlertLifecycleStatus[]> = {
      NEW: ['ACKNOWLEDGED', 'ESCALATED', 'RESOLVED', 'PENDING', 'RESPONDED'],
      PENDING: ['ACKNOWLEDGED', 'ESCALATED', 'RESOLVED', 'RESPONDED'],
      ACKNOWLEDGED: ['RESPONDING', 'RESPONDED', 'RESOLVED', 'ESCALATED'],
      RESPONDING: ['RESOLVED'],
      RESPONDED: ['RESOLVED'],
      ESCALATED: ['ACKNOWLEDGED', 'RESPONDING', 'RESPONDED', 'RESOLVED'],
      RESOLVED: ['PENDING'],
    };

    return allowedTransitions[currentStatus]?.includes(targetStatus) ?? false;
  }
}

export const alertDispatchService = new AlertDispatchService();
