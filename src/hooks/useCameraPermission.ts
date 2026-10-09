import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';

export function useCameraPermission() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]);

  const pickImageFromGallery = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      return uri;
    }
    return null;
  };

  const takePhotoWithCamera = async (): Promise<string | null> => {
    if (!cameraPermission?.granted) {
      const permissionResponse = await requestCameraPermission();
      if (!permissionResponse.granted) {
        throw new Error('Allow camera access to take a photo, or choose one from your gallery.');
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      return uri;
    }
    return null;
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addPhoto = (uri: string) => {
    setPhotos((prev) => [...prev, uri]);
  };

  const clearPhotos = () => {
    setPhotos([]);
  };

  return {
    cameraPermissionStatus: cameraPermission?.status,
    hasCameraPermission: !!cameraPermission?.granted,
    requestCameraPermission,
    pickImageFromGallery,
    takePhotoWithCamera,
    photos,
    addPhoto,
    removePhoto,
    clearPhotos,
  };
}
