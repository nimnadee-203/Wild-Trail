import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Colors from '../../constants/colors';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Map Tracking Implementation Pending...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: Colors.light.muted,
  }
});
