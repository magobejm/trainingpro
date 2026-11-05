import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { glossary, glossaryLocale } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';

/** Shared glossary sections. The client screen scrolls this; the coach page already scrolls. */
export function GlossaryList(): React.JSX.Element {
  const { i18n } = useTranslation();
  const page = glossary(glossaryLocale(i18n.language));
  return (
    <View style={styles.page}>
      <Text style={styles.intro}>{page.intro}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: LIGHT.text, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  group: { gap: 8 },
  groupTitle: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
  intro: { color: LIGHT.textMuted, fontSize: 14, lineHeight: 20 },
  page: { gap: 16 },
  short: { color: LIGHT.textMuted, fontSize: 14, lineHeight: 20 },
  term: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800' },
});
