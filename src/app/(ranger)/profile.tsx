import { WildTrailBrand } from '../../components/WildTrailBrand';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/colors';
import { storageService } from '../../storage/asyncStorage';
import { STORAGE_KEYS } from '../../storage/keys';
import { userService } from '../../services/api/users';
import { StaffUser } from '../../types/user';

const PRESET_AVATARS = [
  {
    id: '1',
    label: 'Senior Officer',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    label: 'Field Ranger',
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    label: 'Wildlife Warden',
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '4',
    label: 'Conservation Lead',
    uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [criticalPushAlerts, setCriticalPushAlerts] = useState(true);
  const [offlineMapCache, setOfflineMapCache] = useState(true);

  // Avatar & Profile State
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<StaffUser | null>(null);

  React.useEffect(() => {
    async function loadProfileData() {
      const savedAvatar = await storageService.getItem<string>(STORAGE_KEYS.RANGER_AVATAR);
      if (savedAvatar) {
        setAvatarUri(savedAvatar);
      } else {
        setAvatarUri(PRESET_AVATARS[0].uri);
      }

      const profile = await storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE);
      if (profile) {
        setUserProfile(profile);
      }
    }
    loadProfileData();
  }, []);

  const saveNewAvatar = async (uri: string) => {
    setAvatarUri(uri);
    await storageService.setItem(STORAGE_KEYS.RANGER_AVATAR, uri);
    setAvatarModalVisible(false);
    if (Platform.OS === 'web') {
      window.alert('Profile photo updated successfully!');
    } else {
      Alert.alert('Profile Photo Updated', 'Your ranger profile picture has been saved.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        await saveNewAvatar(selectedUri);
      }
    } catch {
      Alert.alert('Error', 'Unable to access photo library.');
    }
  };

  const handleTakeCameraPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take a new profile photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedUri = result.assets[0].uri;
        await saveNewAvatar(capturedUri);
      }
    } catch {
      Alert.alert('Error', 'Unable to open camera.');
    }
  };

  // Change Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordModalVisible(true);
  };

  const handleChangePasswordSubmit = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordModalVisible(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await storageService.removeItem(STORAGE_KEYS.USER_PROFILE);
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to end your patrol shift and log out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to end your patrol shift and log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <WildTrailBrand light title="Ranger Profile" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Settings', 'App version: v1.0.0 (Expo SDK 57)')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Officer Credentials Card */}
        <View style={styles.officerCard}>
          <View style={styles.officerTop}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setAvatarModalVisible(true)}
              activeOpacity={0.85}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarWrap}>
                  <Ionicons name="person" size={36} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.officerInfo}>
              <View style={styles.officerNameRow}>
                <Text style={styles.officerName}>
                  {userProfile?.name ? `Officer ${userProfile.name}` : 'Officer Nimal Perera'}
                </Text>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{userProfile?.accountStatus || 'ACTIVE'}</Text>
                </View>
              </View>
              <Text style={styles.officerRole}>
                Senior Field Ranger • {userProfile?.zoneId ? userProfile.zoneId.toUpperCase() : 'BLOCK-01'} Lead
              </Text>
              <Text style={styles.badgeNum}>
                Badge: {userProfile?.badge || userProfile?.staffId || 'RG-204'} • {userProfile?.email || 'nimal@wildguard.org'}
              </Text>
            </View>
          </View>

          <View style={styles.stationRow}>
            <Ionicons name="business-outline" size={15} color="#4B5563" />
            <Text style={styles.stationText}>
              {userProfile?.parkId ? userProfile.parkId.toUpperCase() : 'YALA'} NP Conservation Post, {userProfile?.zoneId ? userProfile.zoneId.toUpperCase() : 'BLOCK-01'}
            </Text>
          </View>
        </View>

        {/* Ranger Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>164</Text>
            <Text style={styles.statLabel}>Patrol Hours</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>28</Text>
            <Text style={styles.statLabel}>Alerts Solved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>14</Text>
            <Text style={styles.statLabel}>Tracked Wildlife</Text>
          </View>
        </View>

        {/* Quick Operations Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Field Capabilities</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/patrol')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="footsteps" size={20} color="#15803D" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>GPS Patrol Tracker</Text>
              <Text style={styles.menuSub}>View current session & log breadcrumbs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/report-incident')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="camera" size={20} color="#B45309" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>File Incident Report</Text>
              <Text style={styles.menuSub}>Document poaching, traps or crop damage</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Operational Hardware & Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Device & Telemetry Preferences</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>High-Accuracy GPS</Text>
              <Text style={styles.toggleDesc}>Sub-meter satellite tracking for patrol route</Text>
            </View>
            <Switch
              value={highAccuracyGps}
              onValueChange={setHighAccuracyGps}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Critical Geofence Push Alarms</Text>
              <Text style={styles.toggleDesc}>Audible sirens for high-risk animal incursions</Text>
            </View>
            <Switch
              value={criticalPushAlerts}
              onValueChange={setCriticalPushAlerts}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Offline Map Topography Cache</Text>
              <Text style={styles.toggleDesc}>Downloaded Sector 4 offline GIS tiles</Text>
            </View>
            <Switch
              value={offlineMapCache}
              onValueChange={setOfflineMapCache}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Account & Shift Management</Text>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={handleOpenPasswordModal}
            activeOpacity={0.7}
          >
            <Ionicons name="key-outline" size={18} color={Colors.light.primaryDark} />
            <Text style={styles.actionBtnOutlineText}>Change Security Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => router.push('/login')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={18} color={Colors.light.primaryDark} />
            <Text style={styles.actionBtnOutlineText}>Switch Role / Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDanger}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.actionBtnDangerText}>End Shift & Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="key" size={22} color={Colors.light.primaryDark} />
                <Text style={styles.modalTitleText}>Change Security Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {passwordError && (
                <View style={styles.errorAlertBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorAlertText}>{passwordError}</Text>
                </View>
              )}

              {passwordSuccess && (
                <View style={styles.successAlertBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                  <Text style={styles.successAlertText}>{passwordSuccess}</Text>
                </View>
              )}

              {/* Current Password Field */}
              <Text style={styles.inputFieldLabel}>CURRENT PASSWORD</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordTextInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* New Password Field */}
              <Text style={styles.inputFieldLabel}>NEW PASSWORD</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordTextInput}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm New Password Field */}
              <Text style={styles.inputFieldLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordTextInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.savePasswordBtn}
                onPress={handleChangePasswordSubmit}
                disabled={passwordLoading}
                activeOpacity={0.85}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.savePasswordBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelPasswordBtn}
                onPress={() => setPasswordModalVisible(false)}
                disabled={passwordLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelPasswordBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Picture Change Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="camera" size={22} color={Colors.light.primaryDark} />
                <Text style={styles.modalTitleText}>Update Profile Photo</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {/* Image Source Options Grid */}
              <Text style={styles.inputFieldLabel}>CHOOSE PHOTO SOURCE</Text>
              <View style={styles.photoSourceRow}>
                <TouchableOpacity
                  style={styles.photoSourceCard}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                >
                  <View style={[styles.photoSourceIconWrap, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="images" size={22} color="#15803D" />
                  </View>
                  <Text style={styles.photoSourceTitle}>Choose Photo</Text>
                  <Text style={styles.photoSourceSub}>From Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoSourceCard}
                  onPress={handleTakeCameraPhoto}
                  activeOpacity={0.8}
                >
                  <View style={[styles.photoSourceIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="camera" size={22} color="#B45309" />
                  </View>
                  <Text style={styles.photoSourceTitle}>Take Photo</Text>
                  <Text style={styles.photoSourceSub}>Using Camera</Text>
                </TouchableOpacity>
              </View>

              {/* Preset Ranger Avatars Selector */}
              <Text style={styles.inputFieldLabel}>OR CHOOSE PRESET RANGER AVATAR</Text>
              <View style={styles.presetAvatarGrid}>
                {PRESET_AVATARS.map((item) => {
                  const isSelected = avatarUri === item.uri;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.presetAvatarCard,
                        isSelected && styles.presetAvatarCardSelected,
                      ]}
                      onPress={() => saveNewAvatar(item.uri)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.uri }} style={styles.presetAvatarImg} />
                      <Text style={styles.presetAvatarLabel}>{item.label}</Text>
                      {isSelected && (
                        <View style={styles.presetSelectedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelPasswordBtn}
                onPress={() => setAvatarModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelPasswordBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    padding: 16,
    paddingBottom: 32,
  },

  // Officer Card
  officerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  officerTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.light.primaryDark,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  officerInfo: {
    flex: 1,
  },
  officerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  officerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  badgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  officerRole: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  badgeNum: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primaryDark,
    marginTop: 3,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  stationText: {
    fontSize: 12,
    color: '#4B5563',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.primaryDark,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '600',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  menuSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleText: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 6,
  },
  actionBtnOutlineText: {
    color: Colors.light.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  actionBtnDangerText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  successAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  successAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 4,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passwordTextInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  eyeIconBtn: {
    padding: 8,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  savePasswordBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  savePasswordBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelPasswordBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelPasswordBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
  },

  // Photo Source Cards & Preset Avatars Grid
  photoSourceRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  photoSourceCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  photoSourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoSourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  photoSourceSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  presetAvatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  presetAvatarCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  presetAvatarCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#ECFDF5',
  },
  presetAvatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 6,
  },
  presetAvatarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  presetSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
