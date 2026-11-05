import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { glossary, glossaryLocale } from '@trainerpro/shared';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import '../../i18n';

export function GlossaryScreen(): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const page = glossary(glossaryLocale(i18n.language));
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{t('app.nav.coach.glossary')}</Text>
      <Text style={styles.subtitle}>{page.intro}</Text>
      {page.groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.entries.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <Text style={styles.term}>{entry.term}</Text>
              <Text style={styles.short}>{entry.short}</Text>
              <Text style={styles.body}>{entry.body}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.xs,
    padding: space.md,
  },
  group: { gap: space.sm },
  groupTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  page: { backgroundColor: colors.background, gap: space.md, padding: space.lg },
  short: { color: colors.textMuted, fontSize: fontSize.sm },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
  term: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
});
