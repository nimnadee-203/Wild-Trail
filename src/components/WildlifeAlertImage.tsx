import React, { useState } from 'react';
import { Image, ImageProps } from 'react-native';

interface Props {
  uri?: string;
  species?: string;
  animalId?: string;
  style: ImageProps['style'];
}

export function WildlifeAlertImage({ uri, species = '', animalId = '', style }: Props) {
  const [failedUri, setFailedUri] = useState<string>();
  const animal = `${species} ${animalId}`.toLowerCase();
  const fallback = animal.includes('elephant')
    ? require('../../assets/images/wildlife/elephant.jpg')
    : animal.includes('leopard')
      ? require('../../assets/images/wildlife/leopard.jpg')
      : require('../../assets/images/WildTrailLogo.jpg');
  const remote = !!uri?.trim() && failedUri !== uri;

  return <Image
    source={remote ? { uri } : fallback}
    style={style}
    resizeMode="cover"
    onError={remote ? () => setFailedUri(uri) : undefined}
    accessibilityLabel={remote ? `${animalId || species || 'Wildlife'} alert photo` : `${species || animalId || 'WildTrail'} reference image`}
  />;
}
