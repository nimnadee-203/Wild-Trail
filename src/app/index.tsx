import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function LaunchScreen() {
  const router = useRouter();
  const [imageReady, setImageReady] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    const minimum = setTimeout(() => setMinimumElapsed(true), 1600);
    // A failed image must never prevent entry into the app.
    const fallback = setTimeout(() => setImageReady(true), 3000);
    return () => { clearTimeout(minimum); clearTimeout(fallback); };
  }, []);

  useEffect(() => {
    if (imageReady && minimumElapsed) router.replace('/(auth)/login');
  }, [imageReady, minimumElapsed, router]);

  return <View style={s.screen}>
    <StatusBar style="light" />
    <Image source={require('../../assets/images/wildlife/elephant.jpg')} style={s.background} resizeMode="cover" onLoadEnd={() => setImageReady(true)} accessible={false} />
    <View style={s.shade} />
    <SafeAreaView style={s.safe}>
      <View style={s.top}><View style={s.rule} /><Text style={s.eyebrow}>SRI LANKA · WILDLIFE CONSERVATION</Text><View style={s.rule} /></View>
      <View style={s.center}>
        <View style={s.logoFrame}><Image source={require('../../assets/images/WildTrailLogo.jpg')} style={s.logo} resizeMode="contain" accessibilityLabel="WildTrail logo" /></View>
        <Text style={s.name}>WildTrail</Text>
        <Text style={s.tagline}>Protecting wildlife. Connecting people.</Text>
        <View style={s.accent} />
        <Text style={s.department}>Department of{ '\n' }Wildlife Conservation</Text>
        <Text style={s.country}>SRI LANKA</Text>
      </View>
      <View style={s.footer}>
        <ActivityIndicator color="#E2EBDD" size="small" accessibilityLabel="Opening WildTrail" />
        <Text style={s.loading}>Welcome to your field workspace</Text>
        <Text style={s.caption}>For our wildlife. For generations to come.</Text>
      </View>
    </SafeAreaView>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#173D2D' },
  background: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%' },
  shade: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10, 37, 24, 0.73)' },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 24 },
  rule: { height: 1, backgroundColor: 'rgba(213,229,192,0.35)', flex: 1 },
  eyebrow: { color: '#D0DFD4', fontSize: 8, fontWeight: '600', letterSpacing: 1.4, textAlign: 'center', flexShrink: 1 },
  center: { alignItems: 'center', paddingVertical: 24 },
  logoFrame: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 24, borderWidth: 1, borderColor: '#E2EBDD' },
  logo: { width: 94, height: 106, borderRadius: 12 },
  name: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', letterSpacing: -0.7, marginTop: 24 },
  tagline: { color: '#D0DFD4', fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  accent: { width: 34, height: 2, backgroundColor: '#D5E5C0', marginVertical: 26 },
  department: { color: '#FFFFFF', fontSize: 21, lineHeight: 29, fontWeight: '600', textAlign: 'center' },
  country: { color: '#D5E5C0', fontSize: 10, letterSpacing: 3, fontWeight: '700', marginTop: 12 },
  footer: { alignItems: 'center', gap: 12, paddingBottom: 24 },
  loading: { color: '#E2EBDD', fontSize: 12 },
  caption: { color: '#BBCFBD', fontSize: 10, textAlign: 'center', marginTop: 8 },
});