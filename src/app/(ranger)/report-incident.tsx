import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../../components/ui';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import Colors from '../../constants/colors';

export default function ReportIncidentScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { location } = useLocation();
  const { photos, takePhotoWithCamera, pickImageFromGallery, removePhoto } =
    useCameraPermission();

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter an incident title.');
      return;
    }
    Alert.alert(
      'Incident Logged',
      'Field incident report submitted successfully. HQ operations team notified.',
      [
        {
          text: 'Return to Home',
          onPress: () => router.push('/dashboard'),
        },
      ]
    );
    setTitle('');
    setDescription('');
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerTitle}>Report Incident</Text>
            <Text style={styles.headerSubtitle}>Poaching, Snares & Human-Wildlife Conflicts</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.formTitle}>Field Incident Details</Text>

          <Input
            label="Incident Title"
            placeholder="e.g. Wire Snare Found near Sector 4 Buffer"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Description & Details"
            placeholder="Describe evidence, animal condition, vehicle tracks or poacher sign..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            style={styles.textArea}
          />

          <View style={styles.section}>
            <Text style={styles.label}>GPS Location</Text>
            <Text style={styles.locationText}>
              {formatCoordinates(location?.latitude, location?.longitude)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Incident Photo Evidence</Text>

            <View style={styles.photoActions}>
              <Button
                title="Camera"
                variant="outline"
                onPress={takePhotoWithCamera}
                style={styles.photoBtn}
              />
              <Button
                title="Gallery"
                variant="outline"
                onPress={pickImageFromGallery}
                style={styles.photoBtn}
              />
            </View>

            <ScrollView horizontal style={styles.photoList}>
              {photos.map((photoUri, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                  <Button
                    title="X"
                    variant="danger"
                    onPress={() => removePhoto(index)}
                    style={styles.removePhotoBtn}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <Button
            title="Submit Incident Report"
            variant="primary"
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  section: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.muted,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  photoBtn: {
    flex: 1,
  },
  photoList: {
    marginTop: 8,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 12,
  },
  submitBtn: {
    marginTop: 16,
  },
});
