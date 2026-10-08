import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export function RangerAvatar({ name, uri, size = 60 }: { name: string; uri?: string; size?: number }) {
  const [failedUri, setFailedUri] = useState<string>();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri && failedUri !== uri) {
    return <Image source={{ uri }} style={shape} onError={() => setFailedUri(uri)} accessibilityLabel={name + ' profile photo'} />;
  }
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <View style={[styles.fallback, shape]} accessibilityLabel={name + ' profile'}><Text style={styles.initials}>{initials}</Text></View>;
}
const styles = StyleSheet.create({
  fallback: { backgroundColor: '#245747', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});
