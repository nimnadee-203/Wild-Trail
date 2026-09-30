import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import Colors from '../../constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  disabled,
  style,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#9CA3AF';
    switch (variant) {
      case 'secondary':
        return Colors.light.secondary;
      case 'danger':
        return Colors.light.danger;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return Colors.light.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return Colors.light.primary;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;
