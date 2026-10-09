import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagerAlert } from '../../services/managerAlerts';
import { StatusPill } from './ManagerUI';

interface AlertDetailSideBoxProps {
  alert: ManagerAlert | null;
  onClose: () => void;
  onResolve?: (firestoreId: string) => Promise<void> | void;
  isResolving?: boolean;
}

const DEFAULT_ANIMAL_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg';

export function AlertDetailSideBox({
  alert,
  onClose,
  onResolve,
  isResolving = false,
}: AlertDetailSideBoxProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const sideBoxWidth = isCompact ? width : Math.min(480, Math.max(380, width * 0.4));

  const [slideAnim] = useState(() => new Animated.Value(sideBoxWidth));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (alert) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(sideBoxWidth);
      fadeAnim.setValue(0);
    }
  }, [alert, fadeAnim, sideBoxWidth, slideAnim]);

  if (!alert) return null;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: sideBoxWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Semi-transparent Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: fadeAnim }]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel="Close side box" />
      </Animated.View>

      {/* Side Box Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: sideBoxWidth,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <AlertDetailInnerContent
          key={alert.firestoreId}
          alert={alert}
          onClose={handleClose}
          onResolve={onResolve}
          isResolving={isResolving}
        />
      </Animated.View>
    </View>
  );
}

function AlertDetailInnerContent({
  alert,
  onClose,
  onResolve,
  isResolving,
}: {
  alert: ManagerAlert;
  onClose: () => void;
  onResolve?: (firestoreId: string) => Promise<void> | void;
  isResolving: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopyCoordinates = () => {
    const lat = alert.latitude !== undefined ? alert.latitude : '6.2982° S';
    const lng = alert.longitude !== undefined ? alert.longitude : '81.3392° E';
    const textToCopy = `${lat}, ${lng}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const latitudeDisplay = alert.latitude !== undefined ? String(alert.latitude) : '6.2982° S';
  const longitudeDisplay = alert.longitude !== undefined ? String(alert.longitude) : '81.3392° E';
  const distanceDisplay = alert.distance ?? 'Approx. 350m from boundary';
  const descriptionDisplay =
    alert.description ??
    'Telemetry system recorded perimeter proximity breach. Field response unit notified.';
  const speciesDisplay = alert.species ?? 'Asian Elephant';
  const animalIdDisplay = alert.animalId ?? alert.id;
  const imageUrl = alert.image && !imageError ? alert.image : DEFAULT_ANIMAL_IMAGE;

  const isResolved = alert.status === 'Resolved';

  return (
    <View style={styles.drawerInner}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadge}>
            <Ionicons name="warning-outline" size={13} color="#2B8263" />
            <Text style={styles.headerBadgeText}>ALERT DETAILS</Text>
          </View>
          <Text style={styles.alertTitle} numberOfLines={2}>
            {alert.title}
          </Text>
          <View style={styles.statusRow}>
            <StatusPill value={alert.severity} />
            <StatusPill value={alert.status} />
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close alert details"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color="#53655D" />
        </TouchableOpacity>
      </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Animal Profile Card */}
          <View style={styles.card}>
            <View style={styles.animalRow}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.animalImage}
                  onError={() => setImageError(true)}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.animalMeta}>
                <View style={styles.animalTagRow}>
                  <Ionicons name="paw" size={14} color="#2B8263" />
                  <Text style={styles.animalIdText}>{animalIdDisplay}</Text>
                </View>
                <Text style={styles.speciesText}>{speciesDisplay}</Text>
                <View style={styles.riskChip}>
                  <Ionicons
                    name="alert-circle"
                    size={13}
                    color={alert.severity === 'High' ? '#DC2626' : alert.severity === 'Medium' ? '#D97706' : '#2B8263'}
                  />
                  <Text
                    style={[
                      styles.riskChipText,
                      {
                        color:
                          alert.severity === 'High'
                            ? '#DC2626'
                            : alert.severity === 'Medium'
                            ? '#D97706'
                            : '#2B8263',
                      },
                    ]}
                  >
                    {alert.severity.toUpperCase()} RISK LEVEL
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Location & Sector Telemetry */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>LOCATION &amp; PROXIMITY</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="location-sharp" size={17} color="#D35F50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Risk Zone / Sector</Text>
                <Text style={styles.infoValue}>{alert.zone}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="navigate-outline" size={17} color="#2B8263" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Boundary Proximity</Text>
                <Text style={styles.infoValue}>{distanceDisplay}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="time-outline" size={17} color="#71817A" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Detection Timestamp</Text>
                <Text style={styles.infoValue}>{alert.time}</Text>
              </View>
            </View>
          </View>

          {/* Mini Topographic / Geofence Radar Preview */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>SECTOR RADAR SNIPPET</Text>
            <View style={styles.radarContainer}>
              <View style={styles.radarTerrain}>
                {/* Geofence polygon preview */}
                <View style={styles.radarGeofence}>
                  <Text style={styles.radarZoneLabel}>{alert.zone}</Text>
                  <Text style={styles.radarRiskNotice}>
                    {alert.severity === 'High' ? 'CRITICAL BUFFER' : 'MONITORED CORRIDOR'}
                  </Text>
                </View>

                {/* Pulsing Animal Pin */}
                <View style={styles.animalPin}>
                  <Ionicons name="paw" size={14} color="#FFFFFF" />
                </View>

                {/* Compass Marker */}
                <View style={styles.compassBox}>
                  <Text style={styles.compassLetter}>N</Text>
                  <Ionicons name="navigate" size={11} color="#17342B" />
                </View>

                {/* Distance Scale Bar */}
                <View style={styles.scaleBarBox}>
                  <Text style={styles.scaleBarText}>0  500m  1km</Text>
                  <View style={styles.scaleBarLine} />
                </View>
              </View>

              {/* Map Legend */}
              <View style={styles.mapLegendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.legendDotRed} />
                  <Text style={styles.legendText}>Animal Position</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.legendDashBox} />
                  <Text style={styles.legendText}>Geofence Boundary</Text>
                </View>
              </View>
            </View>
          </View>

          {/* GPS Coordinates & Copy Action */}
          <View style={styles.card}>
            <View style={styles.coordHeader}>
              <View>
                <Text style={styles.cardSectionTitle}>GPS COORDINATES</Text>
                <Text style={styles.coordSub}>Direct collar telemetry coordinates</Text>
              </View>
              <TouchableOpacity
                style={[styles.copyButton, copied && styles.copyButtonDone]}
                onPress={handleCopyCoordinates}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={copied ? '#FFFFFF' : '#2B8263'}
                />
                <Text style={[styles.copyButtonText, copied && styles.copyButtonTextDone]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.coordGrid}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordNumber}>{latitudeDisplay}</Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordNumber}>{longitudeDisplay}</Text>
              </View>
            </View>
          </View>

          {/* Incident Telemetry Log / Description */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>TELEMETRY LOG &amp; NOTES</Text>
            <View style={styles.descBox}>
              <Text style={styles.descText}>{descriptionDisplay}</Text>
            </View>
            <View style={styles.auditRow}>
              <Text style={styles.auditText}>Alert ID: {alert.id}</Text>
              <Text style={styles.auditText}>Ref: {alert.firestoreId}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {!isResolved && onResolve ? (
            <TouchableOpacity
              style={[styles.resolveButton, isResolving && styles.resolveButtonDisabled]}
              onPress={() => onResolve(alert.firestoreId)}
              disabled={isResolving}
              activeOpacity={0.85}
            >
              {isResolving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.resolvedBanner}>
              <Ionicons name="checkmark-done-circle" size={19} color="#2B8263" />
              <Text style={styles.resolvedBannerText}>This alert is marked as resolved</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissButtonText}>Close Side Box</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerInner: {
    flex: 1,
    flexDirection: 'column',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 34, 28, 0.42)',
    zIndex: 9998,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#F7FAF8',
    borderLeftWidth: 1,
    borderLeftColor: '#E2EBE6',
    zIndex: 9999,
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '-6px 0 24px rgba(0, 0, 0, 0.12)',
      },
      default: {
        elevation: 16,
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEE9',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2B8263',
    letterSpacing: 0.8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17342B',
    lineHeight: 24,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  alertTime: {
    fontSize: 12,
    color: '#71817A',
    fontWeight: '500',
    marginLeft: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4ECE7',
    padding: 16,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A9992',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  animalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageContainer: {
    width: 82,
    height: 82,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2ECE7',
    borderWidth: 1,
    borderColor: '#D4E3DB',
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
  animalMeta: {
    flex: 1,
  },
  animalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  animalIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17342B',
  },
  speciesText: {
    fontSize: 13,
    color: '#53655D',
    marginBottom: 8,
  },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FBF0EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  riskChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F6F4',
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#8A9992',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#17342B',
    fontWeight: '700',
  },
  radarContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E5DE',
  },
  radarTerrain: {
    height: 150,
    backgroundColor: '#3E573F',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  radarGeofence: {
    position: 'absolute',
    width: '68%',
    height: '68%',
    borderWidth: 2,
    borderColor: '#E86A56',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(232, 106, 86, 0.28)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
  },
  radarZoneLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  radarRiskNotice: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  animalPin: {
    position: 'absolute',
    left: '32%',
    top: '36%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17342B',
    borderWidth: 2,
    borderColor: '#E86A56',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  compassBox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  compassLetter: {
    fontSize: 9,
    fontWeight: '800',
    color: '#17342B',
  },
  scaleBarBox: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'flex-end',
  },
  scaleBarText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scaleBarLine: {
    height: 2,
    width: 60,
    backgroundColor: '#FFFFFF',
  },
  mapLegendRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E6EEE9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E86A56',
  },
  legendDashBox: {
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderColor: '#E86A56',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(232, 106, 86, 0.2)',
  },
  legendText: {
    fontSize: 11,
    color: '#53655D',
    fontWeight: '600',
  },
  coordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  coordSub: {
    fontSize: 11,
    color: '#71817A',
    marginTop: -8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2B8263',
    backgroundColor: '#F0F7F4',
  },
  copyButtonDone: {
    backgroundColor: '#2B8263',
    borderColor: '#2B8263',
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B8263',
  },
  copyButtonTextDone: {
    color: '#FFFFFF',
  },
  coordGrid: {
    flexDirection: 'row',
    backgroundColor: '#F7FAF8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EBE6',
    padding: 12,
    alignItems: 'center',
  },
  coordItem: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A9992',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  coordNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#17342B',
  },
  coordDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#DCE7E1',
    marginHorizontal: 12,
  },
  descBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EEE9',
    padding: 12,
    marginBottom: 10,
  },
  descText: {
    fontSize: 13,
    color: '#234138',
    lineHeight: 19,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditText: {
    fontSize: 10,
    color: '#8A9992',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EEE9',
    padding: 18,
    gap: 10,
  },
  resolveButton: {
    height: 44,
    borderRadius: 9,
    backgroundColor: '#2B8263',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resolveButtonDisabled: {
    opacity: 0.6,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EAF5F0',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  resolvedBannerText: {
    color: '#2B8263',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE7E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dismissButtonText: {
    color: '#53655D',
    fontSize: 12,
    fontWeight: '700',
  },
});
