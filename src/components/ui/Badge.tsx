import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

interface BadgeProps {
  label: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#DCFCE7', text: Colors.light.primary };
      case 'warning':
        return { bg: '#FEF3C7', text: Colors.light.warning };
      case 'danger':
        return { bg: '#FEE2E2', text: Colors.light.danger };
      case 'info':
      default:
        return { bg: '#E0F2FE', text: Colors.light.accent };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default Badge;
