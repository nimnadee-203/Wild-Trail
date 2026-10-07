import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export function WildTrailBrand({ title, light = false }: { title?: React.ReactNode; light?: boolean }) {
  return <View style={styles.brand}>
    <Image source={require('../../assets/images/WildTrailLogo.jpg')} style={styles.logo} resizeMode="contain" accessibilityLabel="WildTrail logo" />
    <View style={styles.copy}>
      <Text style={[styles.name, light && styles.lightName]}>WildTrail</Text>
      {!!title && <Text style={[styles.title, light && styles.lightTitle]}>{title}</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  logo: { width: 36, height: 40, borderRadius: 7 },
  copy: { flexShrink: 1, gap: 3 },
  name: { fontSize: 17, fontWeight: '800', color: '#245747', letterSpacing: 0.2 },
  title: { fontSize: 11, fontWeight: '500', color: '#61716A' },
  lightName: { color: '#FFFFFF' },
  lightTitle: { color: '#D0DFD4' },
});
