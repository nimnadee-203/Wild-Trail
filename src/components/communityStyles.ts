import { StyleSheet } from 'react-native';
export const communityStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8F5' },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '700', color: '#166534' },
  title: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  text: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
  label: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5CD', borderRadius: 8, padding: 12, minHeight: 46, color: '#1F2937' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7DC', borderRadius: 12, padding: 16, gap: 10 },
  button: { backgroundColor: '#166534', borderRadius: 8, padding: 14, alignItems: 'center', minHeight: 46 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  outline: { borderWidth: 1, borderColor: '#166534', borderRadius: 8, padding: 12, minHeight: 46 },
  link: { color: '#166534', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photo: { width: '100%', height: 180, borderRadius: 8 },
  error: { color: '#B91C1C', lineHeight: 20 },
  disabled: { opacity: 0.5 },
});
