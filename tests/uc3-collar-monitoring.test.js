/**
 * UC3 Wildlife Collar Monitoring & Risk Alert Tests
 * Feature: Monitor Tracked Wildlife and Respond to Risk Alerts
 * Verifies all 18 requirements:
 * 1. Valid GPS collar reading
 * 2. Invalid GPS collar reading
 * 3. Animal outside all risk zones
 * 4. Animal entering a high-risk zone
 * 5. Correct alert creation
 * 6. Correct animal-to-alert relationship
 * 7. Different configured risk zone types
 * 8. Ranger accepting an alert
 * 9. Community Liaison Officer accepting an alert
 * 10. Ranger selecting Cannot Respond
 * 11. Cancellation of Cannot Respond confirmation
 * 12. Saving a Cannot Respond reason
 * 13. Escalation after timeout
 * 14. Reassignment to another eligible responder
 * 15. Resolving an acknowledged alert
 * 16. Preventing resolved alerts from escalating again
 * 17. Missing or unavailable responders
 * 18. Invalid status transitions
 */

const env = require('./helpers/screen-environment');
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert, Platform } = require('react-native');
const fs = require('firebase/firestore');

// Domain classes & services
const {
  CollarMonitoringService,
  RiskZone,
  GPSCollarSimulator,
  DEFAULT_RISK_ZONES,
  DEFAULT_TRACKED_ANIMALS,
} = require('../src/services/collarMonitoringService');

const {
  AlertDispatchService,
  DEFAULT_ELIGIBLE_RESPONDERS,
} = require('../src/services/alertDispatchService');

describe('UC3 Collar Monitoring and Risk Alert System', () => {
  let monitoringService;
  let dispatchService;
  let simulator;

  beforeEach(() => {
    // Fresh isolated instances for deterministic unit tests
    dispatchService = new AlertDispatchService([
      {
        id: 'ranger-204',
        name: 'Ranger Nimal Perera',
        role: 'ranger',
        badge: 'RG-204',
        status: 'AVAILABLE',
      },
      {
        id: 'ranger-105',
        name: 'Ranger Sunil Rathnayake',
        role: 'ranger',
        badge: 'RG-105',
        status: 'AVAILABLE',
      },
      {
        id: 'usr-liaison-305',
        name: 'Liaison Anura Bandara',
        role: 'liaison',
        badge: 'LIA-305',
        status: 'AVAILABLE',
      },
    ]);

    monitoringService = new CollarMonitoringService(
      DEFAULT_TRACKED_ANIMALS,
      DEFAULT_RISK_ZONES,
      dispatchService
    );

    simulator = new GPSCollarSimulator(monitoringService);

    if (!fs.setDoc) {
      fs.setDoc = jest.fn();
    }
    fs.setDoc.mockResolvedValue();
    if (!fs.updateDoc) {
      fs.updateDoc = jest.fn();
    }
    fs.updateDoc.mockResolvedValue();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  // 1. Valid GPS collar reading
  test('1. Valid GPS collar reading is correctly validated', () => {
    const validReading = simulator.createReading({
      animalId: 'E-014',
      latitude: 6.3015,
      longitude: 81.3412,
      timestamp: '2026-10-12T10:00:00Z',
    });

    const validation = monitoringService.validateLocationReading(validReading);
    expect(validation.isValid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  // 2. Invalid GPS collar reading
  test.each([
    [{ latitude: 105, longitude: 81.34 }, 'Latitude out of range'],
    [{ latitude: -95, longitude: 81.34 }, 'Latitude out of range'],
    [{ latitude: 6.3, longitude: 200 }, 'Longitude out of range'],
    [{ latitude: 6.3, longitude: -190 }, 'Longitude out of range'],
    [{ latitude: NaN, longitude: 81.34 }, 'Latitude must be a valid number'],
    [{ animalId: '' }, 'Missing or invalid animalId'],
    [{ readingId: '' }, 'Missing or invalid readingId'],
    [{ timestamp: 'invalid-date' }, 'Timestamp must be a valid ISO date string'],
    [null, 'Reading must be a non-null object'],
  ])('2. Invalid GPS collar reading (%s) is rejected', async (override, expectedErrorPart) => {
    let reading;
    if (override === null) {
      reading = null;
    } else {
      reading = simulator.createReading({
        animalId: 'E-014',
        latitude: 6.3015,
        longitude: 81.3412,
        ...override,
      });
      if (override.readingId !== undefined) reading.readingId = override.readingId;
      if (override.animalId !== undefined) reading.animalId = override.animalId;
      if (override.timestamp !== undefined) reading.timestamp = override.timestamp;
    }

    const validation = monitoringService.validateLocationReading(reading);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain(expectedErrorPart);

    if (reading) {
      const result = await monitoringService.processLocationReading(reading);
      expect(result.status).toBe('INVALID_READING');
      expect(result.alert).toBeNull();
    }
  });

  // 3. Animal outside all risk zones
  test('3. Animal outside all risk zones is marked SAFE_ZONE without alert creation', async () => {
    // Interior coordinates far from any configured risk zone
    const reading = simulator.createReading({
      animalId: 'E-014',
      latitude: 6.55,
      longitude: 81.65,
    });

    const result = await monitoringService.processLocationReading(reading);
    expect(result.status).toBe('SAFE_ZONE');
    expect(result.riskZone).toBeNull();
    expect(result.alert).toBeNull();
  });

  // 4. Animal entering a high-risk zone
  test('4. Animal entering a high-risk zone creates an alert with HIGH risk level', async () => {
    // Farmland Zone B is bbox: lat [6.29, 6.31], lng [81.33, 81.35], riskLevel: 'HIGH'
    const reading = simulator.createReading({
      animalId: 'E-014',
      latitude: 6.3025,
      longitude: 81.342,
    });

    const result = await monitoringService.processLocationReading(reading);
    expect(result.status).toBe('ALERT_CREATED');
    expect(result.riskZone).toBeTruthy();
    expect(result.riskZone.riskLevel).toBe('HIGH');
    expect(result.alert).toBeTruthy();
    expect(result.alert.riskLevel).toBe('HIGH');
    expect(result.alert.riskZoneType).toBe('Farmland');
  });

  // 5. Correct alert creation
  test('5. Alert contains all required metadata fields and correct initial lifecycle state', async () => {
    const reading = simulator.createReading({
      animalId: 'E-014',
      latitude: 6.3025,
      longitude: 81.342,
      timestamp: '2026-10-12T14:30:00Z',
    });

    const result = await monitoringService.processLocationReading(reading);
    const alert = result.alert;

    expect(alert).toMatchObject({
      animalId: 'E-014',
      riskZoneId: 'ZONE-FARMLAND-B',
      riskLevel: 'HIGH',
      status: 'NEW',
      createdAt: '2026-10-12T14:30:00Z',
    });
    expect(alert.alertId).toContain('ALERT-E-014');
    expect(alert.latitude).toBe(6.3025);
    expect(alert.longitude).toBe(81.342);
    expect(alert.assignedResponder).toBeTruthy();
  });

  // 6. Correct animal-to-alert relationship
  test('6. Alert correctly references tracked animal and history can be queried', async () => {
    const reading = simulator.createReading({
      animalId: 'E-014',
      latitude: 6.3025,
      longitude: 81.342,
    });

    const result = await monitoringService.processLocationReading(reading);
    const createdAlert = result.alert;

    // Animal relationship check
    const animal = monitoringService.getAnimal(createdAlert.animalId);
    expect(animal).toBeTruthy();
    expect(animal.species).toBe('Asian Elephant (Bull, 28 yrs)');
    expect(animal.name).toBe('Elephant E-014');

    // Animal history query check
    const animalAlerts = dispatchService.getAlertsForAnimal('E-014');
    expect(animalAlerts.length).toBeGreaterThanOrEqual(1);
    expect(animalAlerts[0].animalId).toBe('E-014');
  });

  // 7. Different configured risk zone types
  test.each([
    ['Farmland', 6.30, 81.34, 'Farmland Zone B', 'HIGH'],
    ['Road', 6.36, 81.41, 'Highway Crossway A12', 'HIGH'],
    ['Village', 6.41, 81.32, 'Kataragama Village Border', 'HIGH'],
    ['Waterhole', 6.86, 80.93, 'Waterhole Transition Zone C', 'MEDIUM'],
    ['Forest Boundary', 6.84, 80.91, 'Eastern Forest Sanctuary Boundary', 'MEDIUM'],
  ])('7. Configured zone type %s correctly detects risk and maps properties', async (type, lat, lng, expectedName, expectedLevel) => {
    const reading = simulator.createReading({
      animalId: 'E-011',
      latitude: lat,
      longitude: lng,
    });

    const result = await monitoringService.processLocationReading(reading);
    expect(result.status).toBe('ALERT_CREATED');
    expect(result.riskZone.zoneType).toBe(type);
    expect(result.riskZone.zoneName).toBe(expectedName);
    expect(result.riskZone.riskLevel).toBe(expectedLevel);
    expect(result.alert.riskZoneType).toBe(type);
  });

  // 8. Ranger accepting an alert
  test('8. Ranger accepting an alert updates status to ACKNOWLEDGED and saves responder details', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    const acknowledged = await dispatchService.acknowledgeAlert(alert.alertId, {
      id: 'ranger-204',
      name: 'Ranger Nimal Perera',
      role: 'ranger',
    });

    expect(acknowledged.status).toBe('ACKNOWLEDGED');
    expect(acknowledged.assignedResponder).toEqual(
      expect.objectContaining({
        responderId: 'ranger-204',
        responderName: 'Ranger Nimal Perera',
        responderRole: 'ranger',
      }),
    );
    expect(acknowledged.acknowledgedAt).toBeTruthy();

    const responder = dispatchService.getResponder('ranger-204');
    expect(responder.status).toBe('RESPONDING_TO_ALERT');
  });

  // 9. Community Liaison Officer accepting an alert
  test('9. Community Liaison Officer accepting an alert updates status and records liaison details', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-VILLAGE-C'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.41, longitude: 81.32 }),
    });

    const acknowledged = await dispatchService.acknowledgeAlert(alert.alertId, {
      id: 'usr-liaison-305',
      name: 'Liaison Anura Bandara',
      role: 'liaison',
    });

    expect(acknowledged.status).toBe('ACKNOWLEDGED');
    expect(acknowledged.assignedResponder).toEqual(
      expect.objectContaining({
        responderId: 'usr-liaison-305',
        responderName: 'Liaison Anura Bandara',
        responderRole: 'liaison',
      }),
    );
    expect(acknowledged.acknowledgedAt).toBeTruthy();
  });

  // 10. Ranger selecting Cannot Respond
  test('10. Ranger selecting Cannot Respond keeps alert active and records decision', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    const result = await dispatchService.recordCannotRespond(
      alert.alertId,
      {
        id: 'ranger-204',
        name: 'Ranger Nimal Perera',
        role: 'ranger',
      },
      'Currently handling another incident',
    );

    // Alert must NOT be marked RESOLVED
    expect(result.alert.status).not.toBe('RESOLVED');
    expect(result.alert.declinedResponders).toHaveLength(1);
    expect(result.alert.declinedResponders[0]).toMatchObject({
      responderId: 'ranger-204',
      reason: 'Currently handling another incident',
      responderRole: 'ranger',
    });
  });

  // 11. Cancellation of Cannot Respond confirmation in UI
  test('11. Cancellation of Cannot Respond confirmation leaves alert unaffected', async () => {
    const Details = require('../src/app/(ranger)/alerts/[id]').default;
    env.params.id = 'alert-test-11';
    fs.getDoc.mockResolvedValueOnce({
      id: 'alert-test-11',
      exists: () => true,
      data: () => ({
        animalId: 'E-014',
        species: 'Asian Elephant',
        location: 'Farmland Zone B',
        level: 'HIGH',
        status: 'PENDING',
        latitude: 6.30,
        longitude: 81.34,
      }),
    });

    const screen = await render(React.createElement(Details));
    // Open modal
    await fireEvent.press(screen.getByText('Cannot Respond'));
    expect(screen.getByText('Cannot Respond to Alert')).toBeTruthy();

    // Cancel modal
    await fireEvent.press(screen.getByText('Cancel'));
    // Firestore should NOT have been updated with decline
    expect(fs.updateDoc).not.toHaveBeenCalled();
  }, 15000);

  // 12. Saving a Cannot Respond reason via UI confirmation
  test('12. Confirming Cannot Respond in UI saves reason, updates Firestore, and navigates', async () => {
    const Details = require('../src/app/(ranger)/alerts/[id]').default;
    env.params.id = 'alert-test-12';
    fs.getDoc.mockResolvedValueOnce({
      id: 'alert-test-12',
      exists: () => true,
      data: () => ({
        animalId: 'E-014',
        species: 'Asian Elephant',
        location: 'Farmland Zone B',
        level: 'HIGH',
        status: 'PENDING',
        latitude: 6.30,
        longitude: 81.34,
      }),
    });

    const screen = await render(React.createElement(Details));
    await fireEvent.press(screen.getByText('Cannot Respond'));

    // Select reason
    await fireEvent.press(screen.getByText('Too far from the location'));

    // Confirm
    await fireEvent.press(screen.getByText('Confirm'));

    expect(fs.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'alert-test-12' }),
      expect.objectContaining({
        declineReason: 'Too far from the location',
      }),
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Alert Declined',
      expect.stringContaining('offered to another available responder'),
    );
  }, 15000);

  // 13. Escalation after timeout
  test('13. Unacknowledged alert escalates after configurable timeout', async () => {
    dispatchService.setEscalationTimeout(100); // 100ms for test

    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({
        animalId: 'E-014',
        latitude: 6.3,
        longitude: 81.34,
        timestamp: new Date(Date.now() - 200).toISOString(), // 200ms ago
      }),
    });

    const escalated = await dispatchService.checkAndEscalateAlerts();
    expect(escalated.length).toBe(1);
    expect(escalated[0].status).toBe('ESCALATED');
    expect(escalated[0].escalatedAt).toBeTruthy();
    expect(escalated[0].escalationReason).toContain('timed out');
  });

  // 14. Reassignment to another eligible responder
  test('14. Declined alert is automatically offered/reassigned to another eligible responder', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    // Ranger 204 declines
    const result = await dispatchService.recordCannotRespond(
      alert.alertId,
      { id: 'ranger-204', name: 'Ranger Nimal Perera', role: 'ranger' },
      'Too far from the location',
    );

    expect(result.escalated).toBe(false);
    expect(result.reassignedTo).toBeTruthy();
    // Must NOT be the same ranger that declined
    expect(result.reassignedTo.id).not.toBe('ranger-204');
    expect(result.alert.assignedResponder.responderId).toBe(result.reassignedTo.id);
  });

  // 15. Resolving an acknowledged alert
  test('15. Resolving an acknowledged alert records resolved timestamp and sets responder available', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    await dispatchService.acknowledgeAlert(alert.alertId, {
      id: 'ranger-204',
      name: 'Ranger Nimal Perera',
      role: 'ranger',
    });

    const resolved = await dispatchService.resolveAlert(alert.alertId, 'ranger-204');
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedAt).toBeTruthy();

    const responder = dispatchService.getResponder('ranger-204');
    expect(responder.status).toBe('AVAILABLE');
  });

  // 16. Preventing resolved alerts from escalating again
  test('16. Already resolved alert is prevented from escalating again', async () => {
    dispatchService.setEscalationTimeout(50);

    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({
        animalId: 'E-014',
        latitude: 6.3,
        longitude: 81.34,
        timestamp: new Date(Date.now() - 500).toISOString(),
      }),
    });

    // Resolve the alert
    await dispatchService.resolveAlert(alert.alertId);
    expect(alert.status).toBe('RESOLVED');

    // Run escalation check
    const escalated = await dispatchService.checkAndEscalateAlerts();
    expect(escalated.find((a) => a.alertId === alert.alertId)).toBeUndefined();
    expect(alert.status).toBe('RESOLVED');
  });

  // 17. Missing or unavailable responders
  test('17. When all responders are unavailable, alert automatically escalates upon decline', async () => {
    // Set all responders to UNAVAILABLE
    dispatchService.updateResponderStatus('ranger-204', 'UNAVAILABLE');
    dispatchService.updateResponderStatus('ranger-105', 'UNAVAILABLE');
    dispatchService.updateResponderStatus('usr-liaison-305', 'UNAVAILABLE');

    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    // Check eligible list is empty
    const eligible = await dispatchService.getEligibleResponders(alert);
    expect(eligible).toHaveLength(0);

    // Decline causes automatic escalation since no fallback responder exists
    const result = await dispatchService.recordCannotRespond(
      alert.alertId,
      { id: 'ranger-204', name: 'Ranger Nimal Perera', role: 'ranger' },
      'Unavailable',
    );

    expect(result.escalated).toBe(true);
    expect(result.alert.status).toBe('ESCALATED');
    expect(result.alert.escalationReason).toContain('No available responders remaining');
  });

  // 18. Invalid status transitions
  test('18. Invalid status transitions from terminal state are rejected', async () => {
    expect(dispatchService.validateStatusTransition('RESOLVED', 'NEW')).toBe(false);
    expect(dispatchService.validateStatusTransition('RESOLVED', 'ESCALATED')).toBe(false);
    expect(dispatchService.validateStatusTransition('RESOLVED', 'ACKNOWLEDGED')).toBe(false);
    expect(dispatchService.validateStatusTransition('NEW', 'ACKNOWLEDGED')).toBe(true);
    expect(dispatchService.validateStatusTransition('ACKNOWLEDGED', 'RESOLVED')).toBe(true);

    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    await dispatchService.resolveAlert(alert.alertId);

    // Attempting to acknowledge already resolved alert must throw
    await expect(
      dispatchService.acknowledgeAlert(alert.alertId, {
        id: 'ranger-204',
        name: 'Ranger Nimal Perera',
        role: 'ranger',
      }),
    ).rejects.toThrow('Cannot acknowledge an already resolved alert');
  });

  // 19. Polygon boundary geometry helper
  test('19. RiskZone polygon geometry helper correctly checks point-in-polygon', () => {
    const polygonZone = new RiskZone({
      zoneId: 'ZONE-POLY-TEST',
      zoneName: 'Test Polygon Zone',
      zoneType: 'Buffer Zone',
      boundary: {
        minLat: 6.0,
        maxLat: 7.0,
        minLng: 80.0,
        maxLng: 82.0,
        polygon: [
          [6.1, 80.5],
          [6.9, 80.5],
          [6.9, 81.5],
          [6.1, 81.5],
        ],
      },
      riskLevel: 'MEDIUM',
    });

    expect(polygonZone.isPointInside(6.5, 81.0)).toBe(true);
    expect(polygonZone.isPointInside(6.5, 80.2)).toBe(false);
    expect(polygonZone.isPointInside(5.0, 81.0)).toBe(false);
  });

  // 20. Registry accessors and helpers
  test('20. Animal & risk zone registry accessors and auto-registration behave correctly', async () => {
    expect(monitoringService.getAllAnimals().length).toBeGreaterThanOrEqual(3);
    expect(monitoringService.getRiskZones().length).toBeGreaterThanOrEqual(5);
    expect(dispatchService.getAllResponders().length).toBeGreaterThanOrEqual(3);
    expect(dispatchService.getEscalationTimeout()).toBe(5 * 60 * 1000);

    // Auto-registration on unknown collar ID
    const unknownPing = simulator.createReading({
      animalId: 'UNKNOWN-X',
      latitude: 6.302,
      longitude: 81.341,
    });
    const result = await monitoringService.processLocationReading(unknownPing);
    expect(result.animal.animalId).toBe('UNKNOWN-X');
    expect(monitoringService.getAnimal('UNKNOWN-X')).toBeTruthy();

    // Idempotent resolveAlert
    const resolvedAgain = await dispatchService.resolveAlert(result.alert.alertId);
    expect(resolvedAgain.status).toBe('RESOLVED');
  });

  // 21. An already acknowledged alert must not be acknowledged again
  test('21. An already acknowledged alert cannot be acknowledged a second time', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    await dispatchService.acknowledgeAlert(alert.alertId, {
      id: 'ranger-204',
      name: 'Ranger Nimal Perera',
      role: 'ranger',
    });

    await expect(
      dispatchService.acknowledgeAlert(alert.alertId, {
        id: 'ranger-105',
        name: 'Ranger Sunil Rathnayake',
        role: 'ranger',
      }),
    ).rejects.toThrow('Alert has already been acknowledged');

    // Dispatching sets status to RESPONDED
    await dispatchService.dispatchTeam(alert.alertId);

    // Responded alert cannot be acknowledged again
    await expect(
      dispatchService.acknowledgeAlert(alert.alertId, {
        id: 'ranger-105',
        name: 'Ranger Sunil Rathnayake',
        role: 'ranger',
      }),
    ).rejects.toThrow('Cannot acknowledge an alert that has already been responded to');

    // Responded alert cannot be declined
    await expect(
      dispatchService.recordCannotRespond(
        alert.alertId,
        { id: 'ranger-105', name: 'Ranger Sunil Rathnayake', role: 'ranger' },
        'Unavailable',
      ),
    ).rejects.toThrow('Cannot decline an alert that has already been responded to');
  });

  // 22. An alert with completed response must not show Acknowledge & Respond or Cannot Respond
  test('22. An alert with completed response does not show action buttons on details screen', async () => {
    const Details = require('../src/app/(ranger)/alerts/[id]').default;
    env.params.id = 'alert-resolved-22';
    fs.getDoc.mockResolvedValueOnce({
      id: 'alert-resolved-22',
      exists: () => true,
      data: () => ({
        animalId: 'E-014',
        species: 'Asian Elephant',
        location: 'Farmland Zone B',
        level: 'HIGH',
        status: 'RESOLVED',
        latitude: 6.30,
        longitude: 81.34,
      }),
    });

    const screen = await render(React.createElement(Details));
    expect(screen.queryByText('Acknowledge & Respond')).toBeNull();
    expect(screen.queryByText('Cannot Respond')).toBeNull();
    expect(screen.getByText('Response Completed')).toBeTruthy();
  }, 15000);

  // 23. Resolved alerts must not allow new team dispatches unless explicitly reopened
  test('23. Resolved alerts reject team dispatches unless explicitly reopened', async () => {
    const alert = await dispatchService.createAlertFromCollarReading({
      animal: monitoringService.getAnimal('E-014'),
      riskZone: monitoringService.getRiskZoneById('ZONE-FARMLAND-B'),
      reading: simulator.createReading({ animalId: 'E-014', latitude: 6.3, longitude: 81.34 }),
    });

    await dispatchService.resolveAlert(alert.alertId);

    // Dispatching a resolved alert must throw
    await expect(dispatchService.dispatchTeam(alert.alertId)).rejects.toThrow(
      'Cannot dispatch team to an already resolved alert',
    );

    // After explicit reopening, dispatch is allowed
    await dispatchService.reopenAlert(alert.alertId, 'Renewed boundary incursion');
    const dispatched = await dispatchService.dispatchTeam(alert.alertId);
    expect(dispatched.status).toBe('RESPONDED');

    // Dispatching an already responded alert must throw
    await expect(dispatchService.dispatchTeam(alert.alertId)).rejects.toThrow(
      'Cannot dispatch team to an alert that has already been responded to',
    );
  });

  // 24. Clear and consistent meanings for statuses
  test('24. Status semantics properly identify active alerts and completed responses', () => {
    expect(dispatchService.isAlertActive('NEW')).toBe(true);
    expect(dispatchService.isAlertActive('PENDING')).toBe(true);
    expect(dispatchService.isAlertActive('ACKNOWLEDGED')).toBe(true);
    expect(dispatchService.isAlertActive('RESPONDING')).toBe(true);
    expect(dispatchService.isAlertActive('RESPONDED')).toBe(true);
    expect(dispatchService.isAlertActive('ESCALATED')).toBe(true);
    expect(dispatchService.isAlertActive('RESOLVED')).toBe(false);

    expect(dispatchService.isResponseCompleted('RESOLVED')).toBe(true);
    expect(dispatchService.isResponseCompleted('RESPONDED')).toBe(true);
    expect(dispatchService.isResponseCompleted('PENDING')).toBe(false);
  });

  // 25. Active-alert count includes only appropriate statuses
  test('25. Active-alert count excludes resolved alerts from total', async () => {
    const Screen = require('../src/app/(ranger)/alerts/index').default;
    const stop = jest.fn();
    fs.onSnapshot.mockReturnValue(stop);

    const screen = await render(React.createElement(Screen));
    await act(async () =>
      fs.onSnapshot.mock.calls.at(-1)[1]({
        forEach: (callback) => {
          callback({ id: 'a1', data: () => ({ animalId: 'E1', level: 'HIGH', status: 'PENDING' }) });
          callback({ id: 'a2', data: () => ({ animalId: 'E2', level: 'HIGH', status: 'ACKNOWLEDGED' }) });
          callback({ id: 'a3', data: () => ({ animalId: 'E3', level: 'HIGH', status: 'RESOLVED' }) });
        },
      }),
    );

    // Total 3 alerts, but only 2 active (a1, a2)
    expect(screen.getByText('2 Active')).toBeTruthy();
  }, 15000);

  // 26. Sri Lankan GPS coordinates hemisphere verification
  test('26. Sri Lankan GPS coordinates are verified in the Northern and Eastern hemispheres', () => {
    DEFAULT_RISK_ZONES.forEach((zone) => {
      // Sri Lanka latitude is between 5° N and 10° N (positive numbers)
      expect(zone.boundary.minLat).toBeGreaterThan(5);
      expect(zone.boundary.maxLat).toBeLessThan(10);
      // Sri Lanka longitude is between 79° E and 82° E (positive numbers)
      expect(zone.boundary.minLng).toBeGreaterThan(79);
      expect(zone.boundary.maxLng).toBeLessThan(83);
    });
  });
});
