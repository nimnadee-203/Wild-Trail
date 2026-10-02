import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="paw" size={28} color="#FFFFFF" style={styles.pawIcon} />
          <View>
            <Text style={styles.headerTitle}>Wildlife Monitoring</Text>
            <Text style={styles.headerSubtitle}>Map View</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Ionicons name="map-outline" size={60} color={Colors.light.muted} />
        <Text style={styles.text}>Map coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.primaryDark },
  header: {
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  pawIcon: { marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: { fontSize: 16, color: Colors.light.muted },
});
