import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Card } from '../../components/ui';
import { USER_ROLES } from '../../constants/roles';
import { UserRole } from '../../types/user';
import Colors from '../../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('ranger');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Auth logic stub to be implemented in future phase
    if (selectedRole === 'ranger') {
      router.replace('/(ranger)/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Wildlife Protection Portal</Text>
        <Text style={styles.subheading}>Select your role to sign in</Text>

        <Card style={styles.card}>
          <View style={styles.roleContainer}>
            <Button
              title={USER_ROLES.ranger.title}
              variant={selectedRole === 'ranger' ? 'primary' : 'outline'}
              onPress={() => setSelectedRole('ranger')}
              style={styles.roleButton}
            />
            <Button
              title={USER_ROLES.community.title}
              variant={selectedRole === 'community' ? 'secondary' : 'outline'}
              onPress={() => setSelectedRole('community')}
              style={styles.roleButton}
            />
          </View>

          <Input
            label={selectedRole === 'ranger' ? 'Ranger Badge Number' : 'Village Phone / Reporter ID'}
            placeholder={selectedRole === 'ranger' ? 'e.g. RANGER-409' : 'e.g. +254 700 000 000'}
            value={identifier}
            onChangeText={setIdentifier}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title={`Sign In as ${selectedRole === 'ranger' ? 'Ranger' : 'Community Reporter'}`}
            onPress={handleLogin}
            style={styles.loginBtn}
          />
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    marginVertical: 0,
  },
  loginBtn: {
    marginTop: 16,
  },
});
