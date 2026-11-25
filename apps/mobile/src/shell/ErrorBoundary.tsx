import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import i18n from '../i18n';

type State = { failed: boolean };

/** Evita la pantalla en blanco si un componente lanza durante el render. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{i18n.t('mobile.error.title')}</Text>
        <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false })} style={styles.button}>
          <Text style={styles.label}>{i18n.t('mobile.error.retry')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#ec4899', borderRadius: 10, minHeight: 44, paddingHorizontal: 20, justifyContent: 'center' },
  label: { color: '#fff', fontWeight: '600' },
  title: { color: '#fff', fontSize: 16 },
  wrap: { alignItems: 'center', backgroundColor: '#07000f', flex: 1, gap: 16, justifyContent: 'center' },
});
