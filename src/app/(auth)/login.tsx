import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SignInForm } from '../../components/auth/SignInForm';

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

  return <SignInForm email={email} password={password} busy={isLoading} onEmail={setEmail} onPassword={setPassword} onSignIn={handleLogin} onCommunity={() => router.push('/community-report')} />;
}
