import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;
export const BARCODE_PATTERN = /^\d{6,14}$/;

/** Camera barcode scanner with a manual-entry fallback (also used when the camera is unavailable, e.g. web). */
export function BarcodeScannerModal(props: {
  busy: boolean;
  message: string;
  onClose: () => void;
  onCode: (code: string) => void;
  onLabel?: () => void;
  t: Translate;
  visible: boolean;
}): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const handled = useRef('');
  const onScanned = (code: string) => {
    if (props.busy || handled.current === code || !BARCODE_PATTERN.test(code)) return;
    handled.current = code;
    props.onCode(code);
  };
  const close = () => {
    handled.current = '';
    props.onClose();
  };
  const submitManual = () => {
    const code = manual.trim();
    if (BARCODE_PATTERN.test(code)) props.onCode(code);
  };
  return (
    <Modal animationType={'slide'} onRequestClose={close} visible={props.visible}>
      <View style={local.root}>
        {permission?.granted ? (
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={(event) => onScanned(event.data)}
            style={local.camera}
          />
        ) : (
          <View style={local.camera}>
            <Text style={[local.text, { color: '#fff' }]}>{props.t('client.nutrition.scanPermission')}</Text>
            <Pressable accessibilityRole="button" onPress={() => void requestPermission()} style={local.button}>
              <Text style={local.buttonText}>{props.t('client.nutrition.scanGrant')}</Text>
            </Pressable>
          </View>
        )}
        <View style={local.panel}>
          <Text style={local.text}>{props.busy ? props.t('client.nutrition.scanLooking') : props.message}</Text>
          <TextInput
            accessibilityLabel={props.t('client.nutrition.scanManual')}
            keyboardType={'number-pad'}
            onChangeText={setManual}
            onSubmitEditing={submitManual}
            placeholder={props.t('client.nutrition.scanManual')}
            style={local.input}
            value={manual}
          />
          <View style={local.row}>
            <Pressable accessibilityRole="button" disabled={props.busy} onPress={submitManual} style={local.button}>
              <Text style={local.buttonText}>{props.t('client.nutrition.scanSearch')}</Text>
            </Pressable>
            {props.onLabel ? (
              <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onLabel} style={local.button}>
                <Text style={local.buttonText}>{props.t('client.nutrition.scanLabel')}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={close} style={local.button}>
              <Text style={local.buttonText}>{props.t('client.nutrition.scanClose')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const local = StyleSheet.create({
  button: { backgroundColor: '#1c74e9', borderRadius: 10, flex: 1, padding: 12 },
  buttonText: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  camera: { alignItems: 'center', backgroundColor: '#0f172a', flex: 1, justifyContent: 'center', padding: 16 },
  input: { backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: 10, borderWidth: 1, padding: 10 },
  panel: { backgroundColor: '#fff', gap: 10, padding: 16 },
  root: { backgroundColor: '#000', flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  text: { color: '#0f172a', fontWeight: '600', textAlign: 'center' },
});
