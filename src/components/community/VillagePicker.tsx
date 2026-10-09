import { useCommunityLanguage } from './CommunityLanguage';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PARK_VILLAGES = [
  'Kataragama',
  'Tissamaharama',
  'Lunugamvehera',
  'Thanamalwila',
  'Buttala',
  'Palatupana',
  'Kirinda',
  'Wellawaya',
  'Maji Moto',
  'Kiboko',
  'Other',
] as const;

export type VillageOption = (typeof PARK_VILLAGES)[number];

interface VillagePickerProps {
  value: string;
  onChange: (village: string) => void;
  customVillage: string;
  onCustomChange: (custom: string) => void;
}

export function VillagePicker({
  value,
  onChange,
  customVillage,
  onCustomChange,
}: VillagePickerProps) {
  const { t } = useCommunityLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredVillages = PARK_VILLAGES.filter((v) =>
    [v, t(v)].some(label => label.toLowerCase().includes(search.toLowerCase()))
  );

  const isOther = value === 'Other';
  const displayLabel = value
    ? isOther && customVillage.trim()
      ? `${t("Other")}: ${customVillage.trim()}`
      : t(value)
    : t('Select your village');

  const handleSelect = (selected: VillageOption) => {
    onChange(selected);
    setModalOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {t("Village")}{' '}<Text style={styles.required}>*</Text>
      </Text>

      {/* Trigger Button */}
      <Pressable
        style={[styles.trigger, !!value && styles.triggerActive]}
        onPress={() => setModalOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("Select your village")}
      >
        <View style={styles.triggerLeft}>
          <Ionicons
            name="business-outline"
            size={18}
            color={value ? '#166534' : "#6B7280"}
          />
          <Text
            style={[styles.triggerText, !value && styles.placeholderText]}
            numberOfLines={1}
          >
            {displayLabel}
          </Text>
        </View>
        <Ionicons
          name={modalOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={value ? '#166534' : "#6B7280"}
        />
      </Pressable>

      {/* Custom input when "Other" is selected */}
      {isOther && (
        <View style={styles.customContainer}>
          <Text style={styles.subLabel}>{t("Specify your village name:")}</Text>
          <TextInput
            style={styles.customInput}
            value={customVillage}
            onChangeText={onCustomChange}
            placeholder={t("Type your village name...")}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel={t("Specify your village name")}
          />
        </View>
      )}

      {/* Village Selection Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="location" size={20} color="#166534" />
                <Text style={styles.modalTitle}>{t("Select your village")}</Text>
              </View>
              <Pressable
                onPress={() => setModalOpen(false)}
                hitSlop={8}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#4B5563" />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={t("Search village name...")}
                placeholderTextColor="#9CA3AF"
                autoFocus={false}
              />
              {!!search && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Options List */}
            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {filteredVillages.map((item) => {
                const selected = value === item;
                return (
                  <Pressable
                    key={item}
                    style={[styles.optionItem, selected && styles.optionSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={item === 'Other' ? "create-outline" : "home-outline"}
                        size={17}
                        color={selected ? '#166534' : "#4B5563"}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {item === 'Other' ? t("Other (type custom name)") : t(item)}
                      </Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={18} color="#166534" />
                    )}
                  </Pressable>
                );
              })}
              {filteredVillages.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {`${t('No village matches')}: ${search}`}
                  </Text>
                  <Pressable
                    style={styles.selectOtherBtn}
                    onPress={() => handleSelect('Other')}
                  >
                    <Text style={styles.selectOtherBtnText}>
                      {t("Use \"Other\" & type custom name")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  required: {
    color: '#DC2626',
  },
  trigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerActive: {
    borderColor: '#166534',
    backgroundColor: '#F0FDF4',
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  triggerText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#6B7280',
    fontWeight: '400',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  list: {
    maxHeight: 320,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  optionSelected: {
    backgroundColor: '#DCFCE7',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectOtherBtn: {
    backgroundColor: '#166534',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectOtherBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
