import React from 'react';
import { Text, View } from 'react-native';
import { backdropStyle, drawerStyle, styles } from './ClientProfileSectionsBoard.styles';
import type { SectionId, SectionItem } from './ClientProfileSectionsBoard.types';
import { Button, EmptyState, IconButton, colors } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

type Props = {
  archived: SectionItem[];
  onClose: () => void;
  onRestore: (id: SectionId) => void;
  t: (key: string, params?: Record<string, number | string>) => string;
  visible: boolean;
};

export function ClientProfileArchivedDrawer(props: Props): React.JSX.Element | null {
  if (!props.visible) return null;
  return (
    <>
      <div style={drawerStyle(props.visible)}>
        <DrawerHeader onClose={props.onClose} t={props.t} />
        <DrawerBody archived={props.archived} onRestore={props.onRestore} t={props.t} />
      </div>
      <div onClick={props.onClose} style={backdropStyle} />
    </>
  );
}

function DrawerHeader(props: { onClose: () => void; t: Props['t'] }): React.JSX.Element {
  return (
    <View style={styles.drawerHeader}>
      <View style={styles.drawerHeaderStart}>
        <View style={styles.drawerIconShell}>
          <Text style={styles.drawerIcon}>{'✉'}</Text>
        </View>
        <View>
          <Text style={styles.drawerTitle}>{props.t('coach.clientProfile.sections.archiveTitle')}</Text>
          <Text style={styles.drawerSubtitle}>{props.t('coach.clientProfile.sections.archivedLabel')}</Text>
        </View>
      </View>
      <IconButton
        accessibilityLabel={props.t('common.close')}
        icon={(color) => <Text style={[styles.drawerClose, { color }]}>{'×'}</Text>}
        onPress={props.onClose}
      />
    </View>
  );
}

function DrawerBody(props: {
  archived: SectionItem[];
  onRestore: (id: SectionId) => void;
  t: Props['t'];
}): React.JSX.Element {
  if (props.archived.length === 0) {
    return <EmptyState title={props.t('coach.clientProfile.sections.archivedEmpty')} />;
  }
  return <View style={styles.drawerList}>{props.archived.map((item) => renderRow(item, props))}</View>;
}

function renderRow(item: SectionItem, props: { onRestore: (id: SectionId) => void; t: Props['t'] }): React.JSX.Element {
  return (
    <View key={item.id} style={styles.archivedRow}>
      <View style={styles.archivedLeft}>
        <View style={[styles.iconShell, { backgroundColor: item.badgeColor }]}>
          {item.icon({ color: item.iconColor || colors.textMuted, size: 18 })}
        </View>
        <View>
          <Text style={styles.archivedItemTitle}>{props.t(item.titleKey)}</Text>
          <Text style={styles.archivedItemSubtitle}>{props.t('coach.clientProfile.sections.archivedItemSubtitle')}</Text>
        </View>
      </View>
      <Button
        label={props.t('coach.clientProfile.sections.actions.restore')}
        onPress={() => props.onRestore(item.id)}
        size={SIZE_SM}
        variant={VARIANT_SECONDARY}
      />
    </View>
  );
}
