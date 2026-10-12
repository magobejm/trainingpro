import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigate } from 'react-router';
import { colors, fontSize, space } from '@trainerpro/ui';
import type { Crumb } from './crumbs';

const SEPARATOR = '›';
const CURRENT_PAGE = 'page' as const;
const NAVIGATION = 'navigation' as const;

/** Migas de pan: cada miga con enlace lleva a su pantalla; la última marca dónde estás. */
export function Breadcrumbs(props: { accessibilityLabel: string; crumbs: Crumb[] }): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <View accessibilityLabel={props.accessibilityLabel} role={NAVIGATION} style={styles.row}>
      {props.crumbs.map((crumb, index) => {
        const target = crumb.to;
        return (
          <View key={`${index}-${crumb.label}`} style={styles.item}>
            {index > 0 ? <Text style={styles.separator}>{SEPARATOR}</Text> : null}
            {target ? (
              <Pressable accessibilityRole="link" onPress={() => navigate(target)}>
                <Text style={styles.link}>{crumb.label}</Text>
              </Pressable>
            ) : (
              <Text aria-current={CURRENT_PAGE} style={styles.current}>
                {crumb.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  current: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  link: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  separator: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
