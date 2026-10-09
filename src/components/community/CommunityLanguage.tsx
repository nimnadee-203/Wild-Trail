import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityLanguage, communityTranslations, translateCommunity } from '../../constants/communityTranslations';

const STORAGE_KEY = 'wild-trail:community-report-language';
const LanguageContext = createContext({
  language: 'en' as CommunityLanguage,
  setLanguage: (_language: CommunityLanguage) => { void _language; },
  t: (text: string) => text,
  translateError: (text: string) => text,
});

export function CommunityLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<CommunityLanguage>('en');
  const selected = useRef(false);
  useEffect(() => {
    let active = true;
    void Promise.resolve(AsyncStorage.getItem(STORAGE_KEY)).then(value => {
      if (active && !selected.current && (value === 'en' || value === 'si' || value === 'ta')) setLanguageState(value);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const setLanguage = useCallback((value: CommunityLanguage) => {
    selected.current = true;
    setLanguageState(value);
    void AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  }, []);
  const t = useCallback((text: string) => translateCommunity(language, text), [language]);
  const translateError = useCallback((text: string) => language === 'en' || communityTranslations[text]
    ? t(text) : t('Please try again. Check your connection and permissions.'), [language, t]);
  return <LanguageContext.Provider value={{ language, setLanguage, t, translateError }}>{children}</LanguageContext.Provider>;
}

export const useCommunityLanguage = () => useContext(LanguageContext);

export function CommunityLanguageSelector() {
  const { language, setLanguage } = useCommunityLanguage();
  return <View style={{ gap: 8, marginBottom: 12 }}>
    <Text style={{ color: '#245747', fontSize: 14 }}>Language / භාෂාව / மொழி</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {([['en', 'English'], ['si', 'සිංහල'], ['ta', 'தமிழ்']] as const).map(([value, label]) =>
        <Pressable key={value} onPress={() => setLanguage(value)} accessibilityRole="button"
          accessibilityLabel={label} accessibilityState={{ selected: language === value }}
          style={{ minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
            borderColor: '#245747', backgroundColor: language === value ? '#245747' : '#FFFFFF', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: language === value ? '#FFFFFF' : '#245747' }}>{label}</Text>
        </Pressable>,
      )}
    </View>
  </View>;
}

// Translate generated labels and selected options, preserving residents' free text.
export function localizeCommunityDescription(description: string, t: (text: string) => string) {
  const urgent = description.match(/^(.*) moving (toward village|away from village|crossing road|unknown)\.$/);
  if (urgent) {
    const direction = urgent[2].charAt(0).toUpperCase() + urgent[2].slice(1);
    return `${t(urgent[1])} · ${t('moving')} · ${t(direction)}`;
  }
  return description.split(' | ').map(part => {
    const separator = part.indexOf(': ');
    if (separator < 0) return part;
    const label = part.slice(0, separator + 1);
    const value = part.slice(separator + 2);
    return `${t(label)} ${label === 'Details:' ? value : value.split(', ').map(option => {
      if (option.startsWith('Other (')) return `${t('Other')} ${option.slice(6)}`;
      return t(option);
    }).join(', ')}`;
  }).join(' | ');
}
