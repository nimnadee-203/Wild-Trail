import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ManagerSection, managerSections } from './data';

const green = '#164B3B';
const ink = '#17342B';
const muted = '#71817A';
const pale = '#F5F8F6';

export function ManagerShell({
  active,
  children,
}: {
  active: ManagerSection;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const navigate = (section: ManagerSection) => {
    router.replace(`/(manager)/${section}` as never);
  };

  return (
    <View style={styles.root}>
      {!compact && (
        <View style={styles.sidebar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><Ionicons name="leaf" size={22} color="#FFFFFF" /></View>
            <View><Text style={styles.brandTitle}>WildTrail</Text><Text style={styles.brandSub}>PARK MANAGEMENT</Text></View>
          </View>
          <Text style={styles.menuLabel}>MAIN MENU</Text>
          <View style={styles.menu}>
            {managerSections.map((item) => (
              <Pressable key={item.key} onPress={() => navigate(item.key)} style={[styles.menuItem, active === item.key && styles.menuItemActive]}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={active === item.key ? '#FFFFFF' : '#A7BDB3'} />
                <Text style={[styles.menuText, active === item.key && styles.menuTextActive]}>{item.label}</Text>
                {item.key === 'alerts' && <View style={styles.alertDot}><Text style={styles.alertDotText}>3</Text></View>}
              </Pressable>
            ))}
          </View>
          <View style={styles.sidebarBottom}>
            <View style={styles.managerAvatar}><Text style={styles.avatarText}>SK</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.managerName}>Sarah Kimani</Text><Text style={styles.managerRole}>Park Manager</Text></View>
            <Ionicons name="settings-outline" size={19} color="#A7BDB3" />
          </View>
        </View>
      )}
      <View style={styles.main}>
        <View style={styles.topbar}>
          <View><Text style={styles.mobileBrand}>{compact ? 'WildTrail' : 'Good morning, Sarah'}</Text>{!compact && <Text style={styles.topSub}>Here&apos;s what&apos;s happening in your park today.</Text>}</View>
          <View style={styles.topActions}><Pressable style={styles.iconButton}><Ionicons name="search-outline" size={20} color={ink} /></Pressable><Pressable style={styles.iconButton} onPress={() => navigate('alerts')}><Ionicons name="notifications-outline" size={20} color={ink} /><View style={styles.notificationDot} /></Pressable><View style={styles.topAvatar}><Text style={styles.avatarText}>SK</Text></View></View>
        </View>
        <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        {compact && <View style={styles.bottomNav}>{managerSections.slice(0, 5).map((item) => <Pressable key={item.key} onPress={() => navigate(item.key)} style={styles.bottomItem}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={21} color={active === item.key ? green : muted} /><Text style={[styles.bottomLabel, active === item.key && { color: green }]}>{item.key === 'monitoring' ? 'Monitor' : item.label.split(' ')[0]}</Text></Pressable>)}</View>}
      </View>
    </View>
  );
}

export const managerStyles = StyleSheet.create({
  pageTitle: { fontSize: 27, fontWeight: '800', color: ink, marginBottom: 5 },
  pageSubtitle: { fontSize: 14, color: muted, marginBottom: 23 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E4ECE7', padding: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: ink },
  cardMuted: { color: muted, fontSize: 13 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  link: { color: '#2B8263', fontWeight: '700', fontSize: 13 },
});

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: pale },
  sidebar: { width: 244, backgroundColor: green, paddingHorizontal: 18, paddingTop: 28, paddingBottom: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48, paddingHorizontal: 7 },
  brandMark: { backgroundColor: '#2C785F', width: 39, height: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 }, brandSub: { color: '#A7BDB3', fontSize: 8, letterSpacing: 1.1, marginTop: 3 },
  menuLabel: { color: '#87A79A', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginLeft: 12, marginBottom: 11 },
  menu: { gap: 5 }, menuItem: { height: 46, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 13 },
  menuItemActive: { backgroundColor: '#2C785F' }, menuText: { color: '#A7BDB3', fontSize: 13, fontWeight: '600', flex: 1 }, menuTextActive: { color: '#FFFFFF' },
  alertDot: { backgroundColor: '#E86A56', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, alertDotText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  sidebarBottom: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#32614F', paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 9 },
  managerAvatar: { width: 33, height: 33, borderRadius: 17, backgroundColor: '#D3A06B', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  managerName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }, managerRole: { color: '#A7BDB3', fontSize: 10, marginTop: 2 },
  main: { flex: 1 }, topbar: { height: 88, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6EEE9', paddingHorizontal: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mobileBrand: { color: ink, fontSize: 20, fontWeight: '800' }, topSub: { color: muted, fontSize: 12, marginTop: 4 }, topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 }, iconButton: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#E4ECE7', alignItems: 'center', justifyContent: 'center', position: 'relative' }, notificationDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#E86A56', right: 8, top: 7 }, topAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D3A06B', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 32, maxWidth: 1400, width: '100%', alignSelf: 'center', paddingBottom: 50 }, contentCompact: { padding: 18, paddingBottom: 90 }, bottomNav: { height: 69, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E4ECE7', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 }, bottomItem: { alignItems: 'center', gap: 3 }, bottomLabel: { fontSize: 9, color: muted, fontWeight: '600' },
});
