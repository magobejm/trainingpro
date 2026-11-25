import React from 'react';
import { View } from 'react-native';
import { useBreakpoint } from '@trainerpro/ui';
import { DeleteItemModal } from './components/DeleteItemModal';
import { useLibraryScreenState } from './useLibraryScreenState';
import { styles } from './UnifiedExerciseLibraryScreen.styles';
import { LibraryHeader, LibrarySidebar, LibraryMainGrid, LibraryModals } from './UnifiedExerciseLibraryScreen.components';

export function UnifiedExerciseLibraryScreen(): React.JSX.Element {
  const st = useLibraryScreenState();
  const breakpoint = useBreakpoint();
  const compact = breakpoint !== 'lg';
  const stacked = breakpoint === 'sm';

  return (
    <View style={[styles.root, stacked && styles.rootStacked]}>
      <LibraryHeader
        search={st.search}
        setSearch={st.setSearch}
        t={st.t}
        onNew={() => {
          st.setItemToEdit(null);
          st.setIsModalVisible(true);
        }}
      />
      <View style={[styles.body, compact && styles.bodyCompact, stacked && styles.bodyStacked]}>
        <LibrarySidebar st={st} />
        <LibraryMainGrid st={st} />
      </View>
      <LibraryModals st={st} />
      <DeleteItemModal
        error={st.deleteError}
        isLoading={st.isDeleting}
        name={st.pendingDeleteName}
        onCancel={() => st.setPendingDelete(null)}
        onConfirm={() => void st.confirmDelete()}
        visible={Boolean(st.pendingDelete)}
      />
    </View>
  );
}
