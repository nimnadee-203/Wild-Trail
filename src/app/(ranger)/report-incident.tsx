import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { Button, Input, Card } from '../../components/ui';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import Colors from '../../constants/colors';

export default function ReportIncidentScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { location } = useLocation();
  const { photos, takePhotoWithCamera, pickImageFromGallery, removePhoto } =
    useCameraPermission();

  const handleSubmit = () => {
    // Incident reporting stub for future API submission
    alert('Incident Report Created successfully (Stub)');
    setTitle('');
    setDescription('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.formTitle}>Report Wildlife / Poaching Incident</Text>

          <Input
            label="Incident Title"
            placeholder="e.g. Wire Snare Found near Sector B"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Description & Details"
            placeholder="Describe evidence, animal condition, vehicle footprints..."
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
                style={styles.actionBtn}
              />
              <Button
                title="Gallery"
                variant="outline"
                onPress={pickImageFromGallery}
                style={styles.actionBtn}
              />
            </View>

            {photos.length > 0 && (
              <ScrollView horizontal style={styles.photoContainer}>
                {photos.map((uri, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri }} style={styles.photo} />
                    <Text style={styles.removeText} onPress={() => removePhoto(index)}>
                      ✕ Remove
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <Button title="Submit Incident Report" onPress={handleSubmit} style={styles.submitBtn} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: 16,
  },
  card: {
    padding: 16,
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
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.primaryDark,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
  photoContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  photoWrapper: {
    marginRight: 10,
    alignItems: 'center',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeText: {
    fontSize: 12,
    color: Colors.light.danger,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 16,
  },
});
