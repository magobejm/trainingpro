import React from 'react';
import { View } from 'react-native';
import { useBreakpoint } from '@trainerpro/ui';
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
    </View>
  );
}
