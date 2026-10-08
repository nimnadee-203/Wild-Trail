import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const BOUNDARY_OPTIONS = [
  'East Gate',
  'West Gate',
  'North Gate',
  'South Gate',
  'Other',
] as const;

export type BoundaryOption = (typeof BOUNDARY_OPTIONS)[number];

interface BoundarySelectorProps {
  selectedOption: BoundaryOption | '';
  customBoundary: string;
  onSelectOption: (option: BoundaryOption) => void;
  onChangeCustom: (custom: string) => void;
}

export function BoundarySelector({
  selectedOption,
  customBoundary,
  onSelectOption,
  onChangeCustom,
}: BoundarySelectorProps) {
  const isOther = selectedOption === 'Other';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Boundary Section <Text style={styles.required}>*</Text>
      </Text>

      {/* Selections for East Gate, West Gate, North Gate, South Gate, Other */}
      <View style={styles.chipRow}>
        {BOUNDARY_OPTIONS.map((option) => {
          const isSelected = selectedOption === option;
          return (
            <Pressable
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectOption(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Boundary section: ${option}`}
            >
              <Ionicons
                name={
                  option === 'Other'
                    ? 'ellipsis-horizontal-circle-outline'
                    : 'shield-checkmark-outline'
                }
                size={16}
                color={isSelected ? '#FFFFFF' : '#166534'}
              />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Allow custom value ONLY when Other is selected */}
      {isOther && (
        <View style={styles.customContainer}>
          <Text style={styles.subLabel}>
            Specify custom boundary section: <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.customInput}
            value={customBoundary}
            onChangeText={onChangeCustom}
            placeholder="e.g. North-West Fence Sector 3, River Crossing"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Specify custom boundary section"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  required: {
    color: '#DC2626',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    minHeight: 42,
  },
  chipSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  customContainer: {
    marginTop: 4,
    gap: 4,
  },
  subLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 44,
  },
});
