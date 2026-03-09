import React from 'react';
import { View } from 'react-native';
import { useLibraryScreenState } from './useLibraryScreenState';
import { styles } from './UnifiedExerciseLibraryScreen.styles';
import { LibraryHeader, LibrarySidebar, LibraryMainGrid, LibraryModals } from './UnifiedExerciseLibraryScreen.components';

export function UnifiedExerciseLibraryScreen(): React.JSX.Element {
  const st = useLibraryScreenState();

  return (
    <View style={styles.root}>
      <LibraryHeader
        search={st.search}
        setSearch={st.setSearch}
        t={st.t}
        onNew={() => {
          st.setItemToEdit(null);
          st.setIsModalVisible(true);
        }}
      />
      <View style={styles.body}>
        <LibrarySidebar st={st} />
        <LibraryMainGrid st={st} />
      </View>
      <LibraryModals st={st} />
    </View>
  );
}
