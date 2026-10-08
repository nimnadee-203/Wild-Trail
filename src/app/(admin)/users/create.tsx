import { goBackOrReplace } from '../../../utils/navigation';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../../../components/ui';
import Colors from '../../../constants/colors';
import { userService } from '../../../services/api/users';
import { UserRole, AccountStatus } from '../../../types/user';

export default function CreateStaffScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState<UserRole>('ranger');
  const [parkId, setParkId] = useState('yala');
  const [zoneId, setZoneId] = useState('block-01');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('WildGuard2026!');
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !staffId.trim()) {
      const msg = 'Please enter Full Name, Email, and Staff/Badge ID.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Fields', msg);
      return;
    }

    setIsLoading(true);

    try {
      const newAccount = await userService.createStaffAccount({
        name: name.trim(),
        email: email.trim(),
        staffId: staffId.trim(),
        role,
        parkId: parkId.trim() || 'yala',
        zoneId: zoneId.trim() || 'block-01',
        phone: phone.trim() || undefined,
        password: password.trim() || 'WildGuard2026!',
        accountStatus,
      });

      setIsLoading(false);

      const successMsg =
        role === 'ranger'
          ? `Staff user ${newAccount.name} created successfully!\nCreated users/${newAccount.uid} and rangers/${newAccount.profileId}.`
          : `Staff user ${newAccount.name} created successfully in users/${newAccount.uid}!`;

      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert('Account Created', successMsg);
      }

      router.push('/(admin)/users' as any);
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err?.message || 'Failed to create staff account.';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Error', errMsg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => goBackOrReplace('/(admin)/users')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Staff Member</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.formSectionTitle}>STAFF ACCOUNT INFORMATION</Text>

          <Input
            label="Full Name *"
            placeholder="e.g. Nimal Perera"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Email Address *"
            placeholder="e.g. nimal@wildguard.org"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Staff ID / Badge ID *"
            placeholder="e.g. RG-204 or MGR-101"
            value={staffId}
            onChangeText={setStaffId}
          />

          {/* Role Picker Buttons */}
          <Text style={styles.fieldLabel}>ASSIGN ROLE *</Text>
          <View style={styles.roleGrid}>
            {(['ranger', 'manager', 'liaison', 'admin'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    r === 'admin'
                      ? 'key'
                      : r === 'manager'
                      ? 'briefcase'
                      : r === 'liaison'
                      ? 'people'
                      : 'shield'
                  }
                  size={16}
                  color={role === r ? '#FFFFFF' : Colors.light.primaryDark}
                />
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Park & Zone */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Park ID"
                placeholder="e.g. yala"
                value={parkId}
                onChangeText={setParkId}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Zone ID"
                placeholder="e.g. block-01"
                value={zoneId}
                onChangeText={setZoneId}
              />
            </View>
          </View>

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. +94 77 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Temporary Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Account Status Switcher */}
          <Text style={styles.fieldLabel}>ACCOUNT STATUS</Text>
          <View style={styles.statusRow}>
            {(['ACTIVE', 'DISABLED'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusBtn,
                  accountStatus === st &&
                    (st === 'ACTIVE' ? styles.statusBtnActive : styles.statusBtnDisabled),
                ]}
                onPress={() => setAccountStatus(st)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={st === 'ACTIVE' ? 'checkmark-circle' : 'ban'}
                  size={16}
                  color={accountStatus === st ? '#FFFFFF' : '#475569'}
                />
                <Text
                  style={[
                    styles.statusBtnText,
                    accountStatus === st && styles.statusBtnTextActive,
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ranger Document Creation Note */}
          {role === 'ranger' && (
            <View style={styles.rangerInfoNote}>
              <Ionicons name="information-circle" size={20} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rangerInfoTitle}>Ranger Profile Document Creation</Text>
                <Text style={styles.rangerInfoDesc}>
                  Creating a Ranger account will automatically generate a <Text style={{ fontWeight: '800' }}>rangers/{`ranger-${staffId || 'ID'}`}</Text> document with status <Text style={{ fontWeight: '800' }}>AVAILABLE</Text>.
                </Text>
              </View>
            </View>
          )}

          <Button
            title={`Create ${role.toUpperCase()} Account`}
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { padding: 20 },
  formSectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.light.primaryDark, letterSpacing: 0.8, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8, marginTop: 12 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleBtn: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', gap: 6 },
  roleBtnActive: { backgroundColor: Colors.light.primaryDark, borderColor: Colors.light.primaryDark },
  roleBtnText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  roleBtnTextActive: { color: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 12 },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', gap: 6 },
  statusBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  statusBtnDisabled: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  statusBtnText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  statusBtnTextActive: { color: '#FFFFFF' },
  rangerInfoNote: { flexDirection: 'row', backgroundColor: '#E0F2FE', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#BAE6FD', gap: 10, marginBottom: 20 },
  rangerInfoTitle: { fontSize: 12, fontWeight: '800', color: '#0369A1' },
  rangerInfoDesc: { fontSize: 11, color: '#0284C7', marginTop: 2 },
  submitBtn: { marginTop: 8 },
});
