import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = {
  imageUrl: string;
  isUploading: boolean;
  onUpload: () => void;
  setYoutubeUrl: (value: string) => void;
  t: (key: string) => string;
  youtubeUrl: string;
};

export function LibraryMediaFields(props: Props): React.JSX.Element {
  const autoCapitalize: TextInputProps['autoCapitalize'] = 'none';
  const keyboardType: TextInputProps['keyboardType'] = 'url';
  return (
    <View style={styles.wrap}>
      <Pressable onPress={props.onUpload} style={styles.uploadButton}>
        <Text style={styles.uploadButtonLabel}>
          {props.isUploading
            ? props.t('coach.library.media.uploading')
            : props.t('coach.library.media.uploadImage')}
        </Text>
      </Pressable>
      <Text style={styles.uploadState}>
        {props.imageUrl
          ? props.t('coach.library.media.uploaded')
          : props.t('coach.library.media.noImage')}
      </Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={props.setYoutubeUrl}
        placeholder={props.t('coach.library.media.youtubePlaceholder')}
        style={styles.input}
        value={props.youtubeUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f3f7fd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  uploadButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  uploadState: {
    color: '#52657f',
    fontSize: 12,
    fontWeight: '700',
  },
  wrap: {
    gap: 8,
  },
});
