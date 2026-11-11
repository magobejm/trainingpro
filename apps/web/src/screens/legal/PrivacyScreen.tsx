import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { PRIVACY_SECTIONS, PRIVACY_TITLE, PRIVACY_UPDATED } from './privacy-policy.copy';

export function PrivacyScreen(): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page} style={styles.scroll}>
      <View style={styles.sheet}>
        <Text style={styles.title}>{PRIVACY_TITLE}</Text>
        <Text style={styles.updated}>{PRIVACY_UPDATED}</Text>
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.heading}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: space.sm,
  },
  page: {
    alignItems: 'center',
    padding: space.xl,
  },
  paragraph: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
    marginBottom: space.sm,
  },
  scroll: {
    backgroundColor: colors.surfaceMuted,
    flex: 1,
  },
  section: {
    marginTop: space.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxWidth: 720,
    padding: space.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  updated: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.sm,
  },
});
