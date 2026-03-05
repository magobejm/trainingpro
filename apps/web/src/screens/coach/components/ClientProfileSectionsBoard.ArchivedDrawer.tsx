import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { backdropStyle, drawerStyle, styles } from './ClientProfileSectionsBoard.styles';
import type { SectionId, SectionItem } from './ClientProfileSectionsBoard.types';

type Props = {
  archived: SectionItem[];
  onClose: () => void;
  onRestore: (id: SectionId) => void;
  t: (key: string, params?: Record<string, number | string>) => string;
  visible: boolean;
};

export function ClientProfileArchivedDrawer(props: Props): React.JSX.Element {
  return (
    <>
      <div style={drawerStyle(props.visible)}>
        <DrawerHeader onClose={props.onClose} t={props.t} />
        <DrawerBody archived={props.archived} onRestore={props.onRestore} t={props.t} />
      </div>
      {props.visible ? <div onClick={props.onClose} style={backdropStyle} /> : null}
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
          <Text style={styles.drawerTitle}>
            {props.t('coach.clientProfile.sections.archiveTitle')}
          </Text>
          <Text style={styles.drawerSubtitle}>
            {props.t('coach.clientProfile.sections.archivedLabel')}
          </Text>
        </View>
      </View>
      <Pressable onPress={props.onClose}>
        <Text style={styles.drawerClose}>{'×'}</Text>
      </Pressable>
    </View>
  );
}

function DrawerBody(props: {
  archived: SectionItem[];
  onRestore: (id: SectionId) => void;
  t: Props['t'];
}): React.JSX.Element {
  if (props.archived.length === 0) {
    return (
      <Text style={styles.archivedEmpty}>
        {props.t('coach.clientProfile.sections.archivedEmpty')}
      </Text>
    );
  }
  return (
    <View style={styles.drawerList}>{props.archived.map((item) => renderRow(item, props))}</View>
  );
}

function renderRow(
  item: SectionItem,
  props: { onRestore: (id: SectionId) => void; t: Props['t'] },
): React.JSX.Element {
  return (
    <View key={item.id} style={styles.archivedRow}>
      <View style={styles.archivedLeft}>
        <View style={styles.iconShell}>
          <Text style={styles.iconLabel}>{item.icon}</Text>
        </View>
        <View>
          <Text style={styles.archivedItemTitle}>{props.t(item.titleKey)}</Text>
          <Text style={styles.archivedItemSubtitle}>
            {props.t('coach.clientProfile.sections.archivedItemSubtitle')}
          </Text>
        </View>
      </View>
      <Pressable onPress={() => props.onRestore(item.id)} style={styles.restoreButton}>
        <Text style={styles.restoreLabel}>
          {props.t('coach.clientProfile.sections.actions.restore')}
        </Text>
      </Pressable>
    </View>
  );
}
