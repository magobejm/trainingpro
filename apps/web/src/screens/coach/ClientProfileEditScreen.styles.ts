import { StyleSheet } from 'react-native';

import { avatarStyles } from './ClientProfileEditScreen.styles.avatar';
import { formStyles } from './ClientProfileEditScreen.styles.forms';
import { layoutStyles } from './ClientProfileEditScreen.styles.layout';
import { metricStyles } from './ClientProfileEditScreen.styles.metrics';
import { photoStyles } from './ClientProfileEditScreen.styles.photos';

export const styles = StyleSheet.create({
  ...layoutStyles,
  ...metricStyles,
  ...avatarStyles,
  ...formStyles,
  ...photoStyles,
});
