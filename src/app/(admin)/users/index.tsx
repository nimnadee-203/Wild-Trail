import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/colors';
import { userService } from '../../../services/api/users';
import { StaffUser, RangerProfileDoc, UserRole, AccountStatus } from '../../../types/user';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');

  // Edit Park/Zone Modal State
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editPark, setEditPark] = useState('');
  const [editZone, setEditZone] = useState('');

  // View Ranger Profile Modal State
  const [selectedRangerProfile, setSelectedRangerProfile] = useState<RangerProfileDoc | null>(null);
  const [rangerModalVisible, setRangerModalVisible] = useState(false);

  const loadStaffAccounts = async () => {
    const data = await userService.getStaffAccounts();
    setStaffList(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadStaffAccounts();
    }, [])
  );

  const filteredStaff = staffList.filter((item) => {
    if (filterRole === 'ALL') return true;
    return item.role === filterRole;
  });

  const handleToggleStatus = async (user: StaffUser) => {
    const newStatus: AccountStatus = user.accountStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const actionLabel = newStatus === 'DISABLED' ? 'Disable' : 'Reactivate';

    const confirmAction = async () => {
      await userService.updateAccountStatus(user.uid, newStatus);
      await loadStaffAccounts();
      const msg = `Account for ${user.name} is now ${newStatus}.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Account Status Updated', msg);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${actionLabel} staff account for ${user.name} (${user.email})?`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        `${actionLabel} Staff Account`,
        `Are you sure you want to ${actionLabel.toLowerCase()} ${user.name}'s account?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: actionLabel, style: newStatus === 'DISABLED' ? 'destructive' : 'default', onPress: confirmAction },
        ]
      );
    }
  };

  const handleOpenEditParkZone = (user: StaffUser) => {
    setEditUser(user);
    setEditPark(user.parkId || 'yala');
    setEditZone(user.zoneId || 'block-01');
  };

  const handleSaveParkZone = async () => {
    if (!editUser) return;
    await userService.updateRangerParkZone(editUser.profileId || editUser.uid, editUser.uid, editPark.trim(), editZone.trim());
    setEditUser(null);
    await loadStaffAccounts();
    const msg = `Updated assigned Park/Zone for ${editUser.name}.`;
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Park/Zone Updated', msg);
  };

  const handleViewRangerProfile = async (user: StaffUser) => {
    const profile = await userService.getRangerProfile(user.profileId || user.uid);
    if (profile) {
      setSelectedRangerProfile(profile);
    } else {
      setSelectedRangerProfile({
        id: user.profileId || `ranger-${user.staffId || '204'}`,
        userId: user.uid,
        name: user.name,
        badge: user.staffId || user.badge || 'RG-204',
        parkId: user.parkId || 'yala',
        zoneId: user.zoneId || 'block-01',
        status: 'AVAILABLE',
        currentPatrolId: null,
        currentAlertId: null,
      });
    }
    setRangerModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>System Admin Panel</Text>
            <Text style={styles.headerSubtitle}>Role-Based Staff Account Management</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addStaffBtnHeader}
          onPress={() => router.push('/(admin)/users/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addStaffBtnHeaderText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        {(['ALL', 'ranger', 'manager', 'liaison', 'admin'] as const).map((rl) => (
          <TouchableOpacity
            key={rl}
            style={[styles.chip, filterRole === rl && styles.chipActive]}
            onPress={() => setFilterRole(rl)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, filterRole === rl && styles.chipTextActive]}>
              {rl === 'ALL' ? 'All Roles' : rl.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* System Summary Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{staffList.length}</Text>
            <Text style={styles.metricLabel}>Total Staff</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#059669' }]}>
              {staffList.filter((u) => u.accountStatus === 'ACTIVE').length}
            </Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#DC2626' }]}>
              {staffList.filter((u) => u.accountStatus === 'DISABLED').length}
            </Text>
            <Text style={styles.metricLabel}>Disabled</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#0284C7' }]}>
              {staffList.filter((u) => u.role === 'ranger').length}
            </Text>
            <Text style={styles.metricLabel}>Rangers</Text>
          </View>
        </View>

        {/* Staff Account List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Staff Accounts ({filteredStaff.length})</Text>
          <TouchableOpacity
            style={styles.createBtnInline}
            onPress={() => router.push('/(admin)/users/create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createBtnInlineText}>Add Staff Member</Text>
          </TouchableOpacity>
        </View>

        {filteredStaff.map((user) => (
          <View key={user.uid} style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View style={styles.userInfoLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.phone ? <Text style={styles.userPhone}>📞 {user.phone}</Text> : null}
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  user.accountStatus === 'ACTIVE' ? styles.statusActive : styles.statusDisabled,
                ]}
              >
                <Text style={styles.statusBadgeText}>{user.accountStatus}</Text>
              </View>
            </View>

            {/* Account Metadata Row */}
            <View style={styles.metaRow}>
              <View style={styles.roleBadge}>
                <Ionicons
                  name={
                    user.role === 'admin'
                      ? 'key'
                      : user.role === 'manager'
                      ? 'briefcase'
                      : user.role === 'liaison'
                      ? 'people'
                      : 'shield'
                  }
                  size={12}
                  color={Colors.light.primaryDark}
                />
                <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
              </View>

              <Text style={styles.metaText}>
                ID: {user.staffId || user.badge || 'N/A'} • Park: {user.parkId} • Zone: {user.zoneId}
              </Text>
            </View>

            {/* Admin Action Buttons Row */}
            <View style={styles.actionsRow}>
              {user.role === 'ranger' && (
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => handleViewRangerProfile(user)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person" size={14} color="#0284C7" />
                  <Text style={styles.viewProfileBtnText}>View Ranger Profile</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.editParkBtn}
                onPress={() => handleOpenEditParkZone(user)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={14} color="#4B5563" />
                <Text style={styles.editParkBtnText}>Edit Park/Zone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleStatusBtn,
                  user.accountStatus === 'ACTIVE' ? styles.btnDisable : styles.btnReactivate,
                ]}
                onPress={() => handleToggleStatus(user)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={user.accountStatus === 'ACTIVE' ? 'ban-outline' : 'checkmark-circle-outline'}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.toggleStatusBtnText}>
                  {user.accountStatus === 'ACTIVE' ? 'Disable' : 'Reactivate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Park/Zone Modal */}
      <Modal visible={editUser !== null} transparent animationType="fade" onRequestClose={() => setEditUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Park & Zone Assignment</Text>
            <Text style={styles.modalSub}>{editUser?.name} ({editUser?.role.toUpperCase()})</Text>

            <Text style={styles.fieldLabel}>PARK ID</Text>
            <TextInput style={styles.input} value={editPark} onChangeText={setEditPark} placeholder="e.g. yala" />

            <Text style={styles.fieldLabel}>ZONE ID</Text>
            <TextInput style={styles.input} value={editZone} onChangeText={setEditZone} placeholder="e.g. block-01" />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveParkZone} activeOpacity={0.85}>
                <Text style={styles.saveModalBtnText}>Save Assignment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setEditUser(null)} activeOpacity={0.8}>
                <Text style={styles.closeModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Ranger Profile Modal */}
      <Modal visible={rangerModalVisible} transparent animationType="slide" onRequestClose={() => setRangerModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.rangerProfileHeader}>
              <Ionicons name="shield-checkmark" size={36} color="#059669" />
              <View>
                <Text style={styles.rangerProfileTitle}>{selectedRangerProfile?.name}</Text>
                <Text style={styles.rangerProfileBadge}>Badge: {selectedRangerProfile?.badge}</Text>
              </View>
            </View>

            <View style={styles.rangerDetailCard}>
              <View style={styles.rangerDetailRow}>
                <Text style={styles.rangerDetailLabel}>Ranger ID (rangers/{'{id}'}):</Text>
                <Text style={styles.rangerDetailVal}>{selectedRangerProfile?.id}</Text>
              </View>

              <View style={styles.rangerDetailRow}>
                <Text style={styles.rangerDetailLabel}>User Auth UID:</Text>
                <Text style={styles.rangerDetailVal}>{selectedRangerProfile?.userId}</Text>
              </View>

              <View style={styles.rangerDetailRow}>
                <Text style={styles.rangerDetailLabel}>Operational Status:</Text>
                <View style={styles.statusPillRanger}>
                  <Text style={styles.statusPillRangerText}>{selectedRangerProfile?.status}</Text>
                </View>
              </View>

              <View style={styles.rangerDetailRow}>
                <Text style={styles.rangerDetailLabel}>Park ID & Zone ID:</Text>
                <Text style={styles.rangerDetailVal}>{selectedRangerProfile?.parkId} / {selectedRangerProfile?.zoneId}</Text>
              </View>

              <View style={styles.rangerDetailRow}>
                <Text style={styles.rangerDetailLabel}>Current Patrol ID:</Text>
                <Text style={styles.rangerDetailVal}>{selectedRangerProfile?.currentPatrolId || 'None'}</Text>
              </View>

              <View style={styles.rangerDetailRow}>
                <Text style={styles.rangerDetailLabel}>Current Conflict Alert ID:</Text>
                <Text style={styles.rangerDetailVal}>{selectedRangerProfile?.currentAlertId || 'None'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeModalBtnFull} onPress={() => setRangerModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.closeModalBtnText}>Close Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  addStaffBtnHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, gap: 6 },
  addStaffBtnHeaderText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
  chipActive: { backgroundColor: Colors.light.primaryDark },
  chipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 30 },
  metricsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  metricVal: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  createBtnInline: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.primaryDark, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, gap: 4 },
  createBtnInlineText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  userCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  userCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfoLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.primaryDark, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  userName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  userEmail: { fontSize: 12, color: '#64748B', marginTop: 1 },
  userPhone: { fontSize: 11, color: '#475569', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusDisabled: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: '#0F172A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.light.primaryDark },
  metaText: { fontSize: 11, color: '#64748B' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', gap: 4 },
  viewProfileBtnText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
  editParkBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', gap: 4 },
  editParkBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  toggleStatusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, gap: 4, marginLeft: 'auto' },
  btnDisable: { backgroundColor: '#DC2626' },
  btnReactivate: { backgroundColor: '#059669' },
  toggleStatusBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, fontSize: 14, color: '#0F172A' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  saveModalBtn: { flex: 1, backgroundColor: Colors.light.primaryDark, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveModalBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  closeModalBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  closeModalBtnText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  closeModalBtnFull: { width: '100%', backgroundColor: Colors.light.primaryDark, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  rangerProfileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rangerProfileTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  rangerProfileBadge: { fontSize: 12, color: '#059669', fontWeight: '700', marginTop: 2 },
  rangerDetailCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  rangerDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rangerDetailLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  rangerDetailVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  statusPillRanger: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' },
  statusPillRangerText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
});
