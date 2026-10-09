import { localizeCommunityDescription, useCommunityLanguage } from './CommunityLanguage';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityReportKind } from '../../types/community';

export interface DynamicIncidentData {
  // Crop Raiding
  cropsAffected: string[];
  customCrop: string;
  cropDamageLevel: 'Small' | 'Moderate' | 'Severe' | 'Not sure' | '';

  // Elephant Sighting
  elephantCount: string;
  elephantBehavior: string;
  elephantDirection: string;

  // Livestock Attack
  livestockType: string;
  customLivestock: string;
  livestockPredator: string;
  livestockOutcome: string;

  // Property Damage
  propertyType: string;
  customProperty: string;
  propertyDamageLevel: string;
  propertyWildlife: string;

  // Human Injury
  injuryCount: string;
  injurySeverity: string;
  injuryMedicalStatus: string;
  injuryWildlife: string;

  // Other Conflict
  otherNature: string;
  customOtherNature: string;
  otherWildlife: string;
  otherUrgency: string;

  // Additional freeform notes
  notes: string;
}

export const initialDynamicData: DynamicIncidentData = {
  cropsAffected: [],
  customCrop: '',
  cropDamageLevel: '',

  elephantCount: '',
  elephantBehavior: '',
  elephantDirection: '',

  livestockType: '',
  customLivestock: '',
  livestockPredator: '',
  livestockOutcome: '',

  propertyType: '',
  customProperty: '',
  propertyDamageLevel: '',
  propertyWildlife: '',

  injuryCount: '',
  injurySeverity: '',
  injuryMedicalStatus: '',
  injuryWildlife: '',

  otherNature: '',
  customOtherNature: '',
  otherWildlife: '',
  otherUrgency: '',

  notes: '',
};

export function compileDescription(
  kind: CommunityReportKind,
  data: DynamicIncidentData
): string {
  const parts: string[] = [];

  switch (kind) {
    case 'crop_raiding': {
      const crops = [...data.cropsAffected];
      if (crops.includes('Other') && data.customCrop.trim()) {
        const idx = crops.indexOf('Other');
        crops[idx] = `Other (${data.customCrop.trim()})`;
      }
      if (crops.length > 0) {
        parts.push(`Affected: ${crops.join(', ')}`);
      }
      if (data.cropDamageLevel) {
        parts.push(`Damage: ${data.cropDamageLevel}`);
      }
      break;
    }

    case 'elephant_sighting': {
      if (data.elephantCount) {
        parts.push(`Count: ${data.elephantCount}`);
      }
      if (data.elephantBehavior) {
        parts.push(`Behavior: ${data.elephantBehavior}`);
      }
      if (data.elephantDirection) {
        parts.push(`Moving: ${data.elephantDirection}`);
      }
      break;
    }

    case 'livestock_attack': {
      const type =
        data.livestockType === 'Other' && data.customLivestock.trim()
          ? `Other (${data.customLivestock.trim()})`
          : data.livestockType;
      if (type) parts.push(`Livestock: ${type}`);
      if (data.livestockPredator) parts.push(`Predator: ${data.livestockPredator}`);
      if (data.livestockOutcome) parts.push(`Status: ${data.livestockOutcome}`);
      break;
    }

    case 'property_damage': {
      const prop =
        data.propertyType === 'Other' && data.customProperty.trim()
          ? `Other (${data.customProperty.trim()})`
          : data.propertyType;
      if (prop) parts.push(`Property: ${prop}`);
      if (data.propertyDamageLevel) parts.push(`Severity: ${data.propertyDamageLevel}`);
      if (data.propertyWildlife) parts.push(`Wildlife: ${data.propertyWildlife}`);
      break;
    }

    case 'human_injury': {
      if (data.injuryCount) parts.push(`Injured: ${data.injuryCount}`);
      if (data.injurySeverity) parts.push(`Severity: ${data.injurySeverity}`);
      if (data.injuryMedicalStatus) parts.push(`Medical: ${data.injuryMedicalStatus}`);
      if (data.injuryWildlife) parts.push(`Wildlife: ${data.injuryWildlife}`);
      break;
    }

    case 'other_wildlife_conflict': {
      const nature =
        data.otherNature === 'Other' && data.customOtherNature.trim()
          ? `Other (${data.customOtherNature.trim()})`
          : data.otherNature;
      if (nature) parts.push(`Incident: ${nature}`);
      if (data.otherWildlife) parts.push(`Species: ${data.otherWildlife}`);
      if (data.otherUrgency) parts.push(`Urgency: ${data.otherUrgency}`);
      break;
    }
  }

  if (data.notes.trim()) {
    parts.push(`Details: ${data.notes.trim()}`);
  }

  return parts.join(' | ');
}

interface DynamicDescriptionFieldsProps {
  kind: CommunityReportKind;
  onDescriptionChange: (compiled: string) => void;
}

export function DynamicDescriptionFields({
  kind,
  onDescriptionChange,
}: DynamicDescriptionFieldsProps) {
  const { t } = useCommunityLanguage();
  const [data, setData] = useState<DynamicIncidentData>(initialDynamicData);

  // Sync compiled description whenever data or kind changes
  useEffect(() => {
    const compiled = compileDescription(kind, data);
    onDescriptionChange(compiled);
  }, [kind, data, onDescriptionChange]);

  // Helpers
  const toggleCrop = (crop: string) => {
    setData((prev) => {
      const exists = prev.cropsAffected.includes(crop);
      const nextCrops = exists
        ? prev.cropsAffected.filter((c) => c !== crop)
        : [...prev.cropsAffected, crop];
      return { ...prev, cropsAffected: nextCrops };
    });
  };

  const compiledPreview = compileDescription(kind, data);

  return (
    <View style={styles.container}>
      <Text style={styles.mainLabel}>
        {t("Incident Details & Description")}{' '}<Text style={styles.required}>*</Text>
      </Text>

      {/* CROP RAIDING FIELDS */}
      {kind === 'crop_raiding' && (
        <View style={styles.groupCard}>
          {/* What was affected */}
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>
              {t("What was affected?")}{' '}<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipsRow}>
              {['Paddy', 'Vegetable field', 'Coconut', 'Other'].map((crop) => {
                const selected = data.cropsAffected.includes(crop);
                return (
                  <Pressable
                    key={crop}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleCrop(crop)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={16}
                      color={selected ? "#FFFFFF" : '#166534'}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {t(crop)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {data.cropsAffected.includes('Other') && (
              <TextInput
                style={styles.customTextInput}
                placeholder={t("Specify other crop (e.g. Banana, Sugarcane)...")}
                placeholderTextColor="#9CA3AF"
                value={data.customCrop}
                onChangeText={(text) =>
                  setData((prev) => ({ ...prev, customCrop: text }))
                }
              />
            )}
          </View>

          {/* Approximately damage */}
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>
              {t("Approximate damage:")}{' '}<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipsRow}>
              {['Small', 'Moderate', 'Severe', 'Not sure'].map((lvl) => {
                const selected = data.cropDamageLevel === lvl;
                return (
                  <Pressable
                    key={lvl}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({
                        ...prev,
                        cropDamageLevel: lvl as any,
                      }))
                    }
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={
                        selected
                          ? "radio-button-on"
                          : "radio-button-off-outline"
                      }
                      size={16}
                      color={selected ? "#FFFFFF" : '#166534'}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {t(lvl)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ELEPHANT SIGHTING FIELDS */}
      {kind === 'elephant_sighting' && (
        <View style={styles.groupCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Elephant Herd Size / Count:")}</Text>
            <View style={styles.chipsRow}>
              {['Single Bull', 'Mother & Calf', 'Small Group (2-5)', 'Large Herd (6+)'].map(
                (opt) => {
                  const sel = data.elephantCount === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() =>
                        setData((prev) => ({ ...prev, elephantCount: opt }))
                      }
                    >
                      <Text
                        style={[styles.chipText, sel && styles.chipTextSelected]}
                      >
                        {t(opt)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Observed Behavior:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'Grazing peacefully',
                'Approaching farmland/village',
                'Aggressive / Trumpeting',
                'Near water source',
                'Crossing road/fence',
              ].map((opt) => {
                const sel = data.elephantBehavior === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, elephantBehavior: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Direction of Movement:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'Towards village',
                'Towards park/forest',
                'Stationary',
                'Along boundary fence',
              ].map((opt) => {
                const sel = data.elephantDirection === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, elephantDirection: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* LIVESTOCK ATTACK FIELDS */}
      {kind === 'livestock_attack' && (
        <View style={styles.groupCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Livestock Affected:")}</Text>
            <View style={styles.chipsRow}>
              {['Cattle / Cows', 'Goats / Sheep', 'Poultry', 'Other'].map(
                (opt) => {
                  const sel = data.livestockType === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() =>
                        setData((prev) => ({ ...prev, livestockType: opt }))
                      }
                    >
                      <Text
                        style={[styles.chipText, sel && styles.chipTextSelected]}
                      >
                        {t(opt)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
            {data.livestockType === 'Other' && (
              <TextInput
                style={styles.customTextInput}
                placeholder={t("Specify livestock...")}
                placeholderTextColor="#9CA3AF"
                value={data.customLivestock}
                onChangeText={(text) =>
                  setData((prev) => ({ ...prev, customLivestock: text }))
                }
              />
            )}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Suspected Predator:")}</Text>
            <View style={styles.chipsRow}>
              {['Leopard', 'Elephant', 'Crocodile', 'Wild Boar', 'Not sure'].map(
                (opt) => {
                  const sel = data.livestockPredator === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() =>
                        setData((prev) => ({ ...prev, livestockPredator: opt }))
                      }
                    >
                      <Text
                        style={[styles.chipText, sel && styles.chipTextSelected]}
                      >
                        {t(opt)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Outcome / Condition:")}</Text>
            <View style={styles.chipsRow}>
              {['Injured', 'Killed', 'Chased away / Safe'].map((opt) => {
                const sel = data.livestockOutcome === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, livestockOutcome: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* PROPERTY DAMAGE FIELDS */}
      {kind === 'property_damage' && (
        <View style={styles.groupCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Property Affected:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'House / Dwelling',
                'Boundary fence / Gate',
                'Storage shed / Granary',
                'Water tank / Well',
                'Vehicle / Tractor',
                'Other',
              ].map((opt) => {
                const sel = data.propertyType === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, propertyType: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {data.propertyType === 'Other' && (
              <TextInput
                style={styles.customTextInput}
                placeholder={t("Specify property...")}
                placeholderTextColor="#9CA3AF"
                value={data.customProperty}
                onChangeText={(text) =>
                  setData((prev) => ({ ...prev, customProperty: text }))
                }
              />
            )}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Damage Severity:")}</Text>
            <View style={styles.chipsRow}>
              {['Small / Minor', 'Moderate', 'Severe / Destroyed'].map((opt) => {
                const sel = data.propertyDamageLevel === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, propertyDamageLevel: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Wildlife Involved:")}</Text>
            <View style={styles.chipsRow}>
              {['Elephant', 'Wild Boar', 'Monkey / Langur', 'Other'].map(
                (opt) => {
                  const sel = data.propertyWildlife === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() =>
                        setData((prev) => ({ ...prev, propertyWildlife: opt }))
                      }
                    >
                      <Text
                        style={[styles.chipText, sel && styles.chipTextSelected]}
                      >
                        {t(opt)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>
        </View>
      )}

      {/* HUMAN INJURY FIELDS */}
      {kind === 'human_injury' && (
        <View style={styles.groupCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Number of Persons Injured:")}</Text>
            <View style={styles.chipsRow}>
              {['1 person', '2 people', '3 or more people'].map((opt) => {
                const sel = data.injuryCount === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, injuryCount: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Injury Severity:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'Minor cuts / Bruises',
                'Serious (hospital needed)',
                'Critical condition',
              ].map((opt) => {
                const sel = data.injurySeverity === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, injurySeverity: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Medical Assistance Status:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'First aid received',
                'Transported to hospital',
                'Urgent ambulance needed',
              ].map((opt) => {
                const sel = data.injuryMedicalStatus === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({
                        ...prev,
                        injuryMedicalStatus: opt,
                      }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Wildlife Involved:")}</Text>
            <View style={styles.chipsRow}>
              {['Elephant', 'Leopard', 'Snake', 'Wild Boar', 'Other'].map(
                (opt) => {
                  const sel = data.injuryWildlife === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() =>
                        setData((prev) => ({ ...prev, injuryWildlife: opt }))
                      }
                    >
                      <Text
                        style={[styles.chipText, sel && styles.chipTextSelected]}
                      >
                        {t(opt)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>
        </View>
      )}

      {/* OTHER CONFLICT FIELDS */}
      {kind === 'other_wildlife_conflict' && (
        <View style={styles.groupCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Nature of Conflict:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'Animal trapped / Snared',
                'Electric fence fault',
                'Aggressive animal near road',
                'Dead wildlife / Carcass',
                'Other',
              ].map((opt) => {
                const sel = data.otherNature === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, otherNature: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {data.otherNature === 'Other' && (
              <TextInput
                style={styles.customTextInput}
                placeholder={t("Specify incident nature...")}
                placeholderTextColor="#9CA3AF"
                value={data.customOtherNature}
                onChangeText={(text) =>
                  setData((prev) => ({ ...prev, customOtherNature: text }))
                }
              />
            )}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Wildlife Involved:")}</Text>
            <View style={styles.chipsRow}>
              {['Elephant', 'Leopard', 'Deer / Sambhur', 'Crocodile', 'Other'].map(
                (opt) => {
                  const sel = data.otherWildlife === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() =>
                        setData((prev) => ({ ...prev, otherWildlife: opt }))
                      }
                    >
                      <Text
                        style={[styles.chipText, sel && styles.chipTextSelected]}
                      >
                        {t(opt)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.subLabel}>{t("Urgency Level:")}</Text>
            <View style={styles.chipsRow}>
              {[
                'Low (Monitor)',
                'Medium (Ranger inspection)',
                'High (Immediate response)',
              ].map((opt) => {
                const sel = data.otherUrgency === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() =>
                      setData((prev) => ({ ...prev, otherUrgency: opt }))
                    }
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {t(opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Freeform Notes Input */}
      <View style={styles.notesBlock}>
        <Text style={styles.subLabel}>
          {t("Additional details & notes:")}{' '}<Text style={styles.optional}>{t("(optional)")}</Text>
        </Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={3}
          placeholder={t("Any extra details, animal movements, warnings, or specific damage...")}
          placeholderTextColor="#9CA3AF"
          value={data.notes}
          onChangeText={(text) =>
            setData((prev) => ({ ...prev, notes: text }))
          }
          accessibilityLabel={t("Additional details and notes")}
        />
      </View>

      {/* Live Description Summary Preview */}
      {!!compiledPreview && (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="document-text-outline" size={16} color="#166534" />
            <Text style={styles.previewTitle}>{t("Formatted Description Summary:")}</Text>
          </View>
          <Text style={styles.previewText}>{localizeCommunityDescription(compiledPreview, t)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  mainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  required: {
    color: '#DC2626',
  },
  optional: {
    fontWeight: '400',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7DC',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  fieldBlock: {
    gap: 6,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    minHeight: 38,
  },
  chipSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  customTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  notesBlock: {
    gap: 6,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5CD',
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
    color: '#1F2937',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
});
