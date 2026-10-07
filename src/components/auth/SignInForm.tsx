import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../ui';

interface Props {
  email: string;
  password: string;
  busy: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSignIn: () => void;
  onCommunity: () => void;
}

export function SignInForm({ email, password, busy, onEmail, onPassword, onSignIn, onCommunity }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  return <SafeAreaView style={s.screen}>
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.content}>
          <View style={s.brand}>
            <Image source={require('../../../assets/images/WildTrailLogo.jpg')} style={s.logo} resizeMode="contain" accessibilityLabel="WildTrail, Department of Wildlife Conservation" />
            <Text style={s.eyebrow}>WILDLIFE PROTECTION & CONSERVATION</Text>
          </View>
          <View style={s.card}>
            <View style={s.header}>
              <View style={s.badge}><Ionicons name="shield-checkmark-outline" size={22} color="#245747" /></View>
              <View style={{ flex: 1 }}><Text style={s.heading}>Welcome back</Text><Text style={s.subtitle}>Sign in to your staff account</Text></View>
            </View>
            <Input label="Email address" accessibilityLabel="Email address" placeholder="you@wildguard.org" value={email} onChangeText={onEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} style={s.input} />
            <View>
              <Input label="Password" accessibilityLabel="Password" placeholder="Enter your password" secureTextEntry={!showPassword} value={password} onChangeText={onPassword} autoCapitalize="none" autoComplete="current-password" editable={!busy} style={[s.input, { paddingRight: 52 }]} returnKeyType="go" onSubmitEditing={onSignIn} />
              <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} style={s.eye} onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#61716A" /></Pressable>
            </View>
            <Button title="Sign in" onPress={onSignIn} isLoading={busy} style={s.signIn} />
            <Text style={s.help}>Need an account? Contact your park administrator.</Text>
            <View style={s.divider} />
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDemo }} onPress={() => setShowDemo((value) => !value)} style={s.toggle}>
              <Text style={s.demoTitle}>Try a demo account</Text><Ionicons name={showDemo ? 'chevron-up' : 'chevron-down'} size={18} color="#61716A" />
            </Pressable>
            {showDemo && <View style={s.demoSection}>
              <Text style={s.hint}>Choose a role to fill in the demo credentials.</Text>
              <View style={s.grid}>{[
                { label: 'Ranger', email: 'nimal@wildguard.org' },
                { label: 'Liaison', email: 'liaison@wildguard.org' },
                { label: 'Manager', email: 'manager@wildguard.org' },
                { label: 'Admin', email: 'admin@wildguard.org' },
              ].map((account) => <Pressable key={account.label} disabled={busy} accessibilityRole="button" accessibilityLabel={`Use ${account.label} demo account`} style={({ pressed }) => [s.demoAccount, pressed && s.pressed]} onPress={() => { onEmail(account.email); onPassword('WildGuard2026!'); }}><Text style={s.demoLabel}>{account.label}</Text></Pressable>)}</View>
            </View>}
          </View>
          <Pressable accessibilityRole="button" style={({ pressed }) => [s.community, pressed && s.pressed]} onPress={onCommunity}>
            <Ionicons name="megaphone-outline" size={24} color="#245747" />
            <View style={s.communityCopy}><Text style={s.communityTitle}>Report a wildlife incident</Text><Text style={s.communitySubtitle}>Community reporting · No staff account needed</Text></View>
            <Ionicons name="arrow-forward" size={19} color="#245747" />
          </Pressable>
          <Text style={s.footer}>Protecting wildlife. Supporting communities.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F0' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 20 },
  brand: { alignItems: 'center', gap: 12 },
  logo: { width: 158, height: 174, borderRadius: 18 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.7, color: '#61716A', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#E2E8DF', boxShadow: '0px 8px 28px rgba(30, 65, 49, 0.06)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  badge: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#EDF3EC', alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 25, fontWeight: '700', color: '#193D30', letterSpacing: -0.6 },
  subtitle: { fontSize: 14, color: '#748078', marginTop: 5 },
  input: { height: 52, borderRadius: 12, borderColor: '#DDE5DD', backgroundColor: '#FAFCF9' },
  eye: { position: 'absolute', right: 3, bottom: 11, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  signIn: { height: 54, backgroundColor: '#245747', borderRadius: 12, marginTop: 16 },
  help: { fontSize: 12, lineHeight: 19, textAlign: 'center', color: '#748078', marginTop: 12 },
  divider: { height: 1, backgroundColor: '#EDF0E9', marginTop: 24, marginBottom: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 },
  demoTitle: { fontSize: 13, fontWeight: '600', color: '#61716A' },
  demoSection: { gap: 12, paddingTop: 4 },
  hint: { fontSize: 12, color: '#748078', lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  demoAccount: { flexGrow: 1, flexBasis: '45%', minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#DDE5DD', backgroundColor: '#F7FAF5', alignItems: 'center', justifyContent: 'center', padding: 10 },
  demoLabel: { fontSize: 13, fontWeight: '600', color: '#245747' },
  community: { padding: 16, borderWidth: 1, borderColor: '#DDE5D8', borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EEF2E8' },
  communityCopy: { flex: 1, gap: 5 },
  communityTitle: { fontSize: 14, fontWeight: '700', color: '#245747' },
  communitySubtitle: { fontSize: 12, lineHeight: 18, color: '#61716A' },
  footer: { fontSize: 12, color: '#879087', textAlign: 'center', paddingBottom: 4 },
  pressed: { opacity: 0.7 },
});
