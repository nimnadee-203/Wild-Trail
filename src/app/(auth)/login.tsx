import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Card } from '../../components/ui';
import Colors from '../../constants/colors';
import { userService } from '../../services/api/users';
import { UserRole } from '../../types/user';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const routeByUserRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        router.replace('/(admin)/users' as any);
        break;
      case 'manager':
        router.replace('/(manager)/overview' as any);
        break;
      case 'liaison':
        router.replace('/(liaison)/dashboard' as any);
        break;
      case 'ranger':
      default:
        router.replace('/(ranger)/dashboard' as any);
        break;
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter your email and password.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Fields', msg);
      return;
    }

    setIsLoading(true);
    try {
      const staffUser = await userService.loginWithEmailPassword(email, password);
      setIsLoading(false);
      routeByUserRole(staffUser.role);
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err?.message || 'Login failed. Please check credentials.';
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Login Error', errMsg);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Button title="Community: Report Wildlife Incident" onPress={() => router.push('/community-report')} />
        <Text style={styles.heading}>Wildlife Protection System</Text>
        <Text style={styles.subheading}>Staff & Operations Portal Login</Text>

        <Card style={styles.card}>
          <Input
            label="Email"
            placeholder="e.g. admin@wildguard.org or nimal@wildguard.org"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Login"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginBtn}
          />

          {/* Quick Demo Credentials Assistant */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>DEMO QUICK LOGIN TEST ACCOUNTS:</Text>
            <Text style={styles.demoText} onPress={() => { setEmail('admin@wildguard.org'); setPassword('WildGuard2026!'); }}>
              🔑 Admin: admin@wildguard.org
            </Text>
            <Text style={styles.demoText} onPress={() => { setEmail('nimal@wildguard.org'); setPassword('WildGuard2026!'); }}>
              🔑 Ranger: nimal@wildguard.org
            </Text>
            <Text style={styles.demoText} onPress={() => { setEmail('manager@wildguard.org'); setPassword('WildGuard2026!'); }}>
              🔑 Manager: manager@wildguard.org
            </Text>
            <Text style={styles.demoText} onPress={() => { setEmail('liaison@wildguard.org'); setPassword('WildGuard2026!'); }}>
              🔑 Liaison: liaison@wildguard.org
            </Text>
          </View>
        </Card>
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
    padding: 20,
    justifyContent: 'center',
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primaryDark,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  card: {
    padding: 20,
  },
  loginBtn: {
    marginTop: 16,
  },
  demoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  demoText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primaryDark,
  },
});
