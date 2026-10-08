import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { FilterButton, StatusPill } from '../../components/manager/ManagerUI';
import { AlertDetailSideBox } from '../../components/manager/AlertDetailSideBox';
import { alerts as mockAlerts } from '../../components/manager/data';
import {
  ManagerAlert,
  resolveManagerAlert,
  subscribeToManagerAlerts,
} from '../../services/managerAlerts';

export default function AlertsResponse() {
  const { id, alertId } = useLocalSearchParams<{ id?: string; alertId?: string }>();
  const [filter, setFilter] = useState('All alerts');
  const [items, setItems] = useState<ManagerAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const initialParamId = (alertId || id) as string | undefined;
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(initialParamId ?? null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToManagerAlerts(
      (alerts) => {
        setItems(alerts);
        setError(null);
      },
      (subscriptionError) => {
        setError(subscriptionError.message || 'Unable to load alerts from Firestore.');
      }
    );
  }, []);

  const displayItems: ManagerAlert[] = items.length > 0 ? items : (mockAlerts as ManagerAlert[]);

  const filtered = useMemo(() => {
    if (filter === 'All alerts') return displayItems;
    return displayItems.filter((item) => item.status === filter || item.severity === filter);
  }, [filter, displayItems]);

  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return (
      displayItems.find(
        (item) => item.firestoreId === selectedAlertId || item.id === selectedAlertId
      ) ?? null
    );
  }, [displayItems, selectedAlertId]);

  const handleResolve = async (firestoreId: string) => {
    try {
      setResolvingId(firestoreId);
      if (firestoreId.startsWith('mock-')) {
        setItems((prev) =>
          prev.map((item) =>
            item.firestoreId === firestoreId ? { ...item, status: 'Resolved' } : item
          )
        );
        return;
      }
      await resolveManagerAlert(firestoreId);
    } catch (resolveError) {
      Alert.alert(
        'Unable to resolve alert',
        resolveError instanceof Error ? resolveError.message : 'Please try again.'
      );
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <ManagerShell active="alerts">
      <Text style={managerStyles.pageTitle}>Alerts &amp; response</Text>
      <Text style={managerStyles.pageSubtitle}>
        Review, coordinate responses, and inspect full telemetry details across the park.
      </Text>

      <View style={styles.filters}>
        <FilterButton
          label="All alerts"
          selected={filter === 'All alerts'}
          onPress={() => setFilter('All alerts')}
        />
        <FilterButton
          label="Active"
          selected={filter === 'Active'}
          onPress={() => setFilter('Active')}
        />
        <FilterButton
          label="High priority"
          selected={filter === 'High'}
          onPress={() => setFilter('High')}
        />
        <FilterButton
          label="Resolved"
          selected={filter === 'Resolved'}
          onPress={() => setFilter('Resolved')}
        />
      </View>

      <View style={managerStyles.card}>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.tableHead}>
          <Text style={[styles.head, { flex: 2 }]}>Alert</Text>
          <Text style={[styles.head, { flex: 1.2 }]}>Location</Text>
          <Text style={styles.head}>Severity</Text>
          <Text style={styles.head}>Status</Text>
          <Text style={[styles.head, { textAlign: 'right' }]}>Action</Text>
        </View>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>
            {error ? 'Alerts are unavailable.' : 'No alerts found for this filter.'}
          </Text>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedAlertId === item.firestoreId;
            return (
              <Pressable
                style={[styles.row, isSelected && styles.rowSelected]}
                key={item.firestoreId}
                onPress={() => setSelectedAlertId(item.firestoreId)}
                accessibilityRole="button"
                accessibilityLabel={`View full details for ${item.title}`}
              >
                <View style={{ flex: 2 }}>
                  <View style={styles.titleWithIndicator}>
                    {isSelected && <View style={styles.activeDot} />}
                    <Text style={[styles.title, isSelected && styles.titleSelected]}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={managerStyles.cardMuted}>
                    {item.id} · {item.time}
                  </Text>
                </View>

                <Text style={[styles.cell, { flex: 1.2 }]}>{item.zone}</Text>

                <View style={{ flex: 1 }}>
                  <StatusPill value={item.severity} />
                </View>

                <View style={{ flex: 1 }}>
                  <StatusPill value={item.status} />
                </View>

                <View style={styles.actionCell}>
                  <Pressable
                    style={[styles.detailsBtn, isSelected && styles.detailsBtnActive]}
                    onPress={() => setSelectedAlertId(item.firestoreId)}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={15}
                      color={isSelected ? '#FFFFFF' : '#2B8263'}
                    />
                    <Text
                      style={[
                        styles.detailsBtnText,
                        isSelected && styles.detailsBtnTextActive,
                      ]}
                    >
                      Details
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Slide-over Side Box with full alert details */}
      <AlertDetailSideBox
        alert={selectedAlert}
        onClose={() => setSelectedAlertId(null)}
        onResolve={handleResolve}
        isResolving={resolvingId === selectedAlert?.firestoreId}
      />
    </ManagerShell>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  tableHead: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFEB',
    paddingBottom: 11,
    paddingHorizontal: 10,
  },
  head: {
    flex: 1,
    color: '#8A9992',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3F0',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      },
    }),
  },
  rowSelected: {
    backgroundColor: '#F0F7F4',
    borderLeftWidth: 3,
    borderLeftColor: '#2B8263',
  },
  titleWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2B8263',
  },
  title: {
    color: '#234138',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  titleSelected: {
    color: '#164B3B',
    fontWeight: '800',
  },
  cell: {
    flex: 1,
    color: '#53655D',
    fontSize: 12,
  },
  actionCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  detailsBtnActive: {
    backgroundColor: '#2B8263',
  },
  detailsBtnText: {
    color: '#2B8263',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBtnTextActive: {
    color: '#FFFFFF',
  },
  error: {
    color: '#B33F32',
    marginBottom: 12,
    fontSize: 12,
  },
  empty: {
    color: '#71817A',
    paddingVertical: 28,
    textAlign: 'center',
  },
});
