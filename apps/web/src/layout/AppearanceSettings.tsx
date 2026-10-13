import React, { useRef } from 'react';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { brandAccents, Button, colors, SegmentedControl, space, type BrandAccent } from '@trainerpro/ui';
import { useAppearance } from '../theme/AppearanceProvider';
import { useAuthStore } from '../store/auth.store';
import { useBranding, useBrandLogo, useSaveBranding } from '../data/hooks/useBranding';
import { LoadingState } from '../components/AsyncStatus';

export function AppearanceSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { mode, density, setAppearance } = useAppearance();
  const role = useAuthStore((state) => state.activeRole);
  return (
    <View style={{ gap: space.md, paddingTop: space.lg, borderTopWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{t('app.appearance.title')}</Text>
      <Text style={{ color: colors.textMuted }}>{t('app.appearance.theme')}</Text>
      <SegmentedControl
        options={[
          { value: 'system', label: t('app.appearance.system') },
          { value: 'light', label: t('app.appearance.light') },
          { value: 'dark', label: t('app.appearance.dark') },
        ]}
        value={mode}
        onChange={(value) => setAppearance({ mode: value as typeof mode })}
      />
      <Text style={{ color: colors.textMuted }}>{t('app.appearance.density')}</Text>
      <SegmentedControl
        options={[
          { value: 'comfortable', label: t('app.appearance.comfortable') },
          { value: 'compact', label: t('app.appearance.compact') },
        ]}
        value={density}
        onChange={(value) => setAppearance({ density: value as typeof density })}
      />
      {role === 'coach' ? <BrandingSettings /> : null}
    </View>
  );
}

function BrandingSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const branding = useBranding();
  const save = useSaveBranding();
  const logo = useBrandLogo();
  const input = useRef<HTMLInputElement>(null);
  const [invalidLogo, setInvalidLogo] = React.useState(false);
  const busy = save.isPending || logo.isPending;
  const upload = (file: File | undefined) => {
    if (!file) return;
    const invalid = file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg'].includes(file.type);
    setInvalidLogo(invalid);
    if (!invalid) logo.mutate(file);
  };
  return (
    <View style={{ gap: space.md, paddingTop: space.md }}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{t('app.branding.title')}</Text>
      {branding.isLoading ? <LoadingState label={t('common.loading')} variant="rows" /> : null}
      {branding.isError ? (
        <Button label={t('common.retry')} onPress={() => void branding.refetch()} variant="secondary" />
      ) : null}
      {branding.data ? (
        <>
          {branding.data.brandLogoUrl ? (
            <Image
              accessibilityLabel={t('app.branding.logo')}
              source={{ uri: branding.data.brandLogoUrl }}
              style={{ height: 64, width: 160 }}
              resizeMode={'contain'}
            />
          ) : null}
          <input
            ref={input}
            type={'file'}
            accept={'image/png,image/jpeg'}
            hidden
            onChange={(event) => {
              upload(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            <Button
              disabled={busy}
              label={t('app.branding.upload')}
              onPress={() => input.current?.click()}
              variant="secondary"
              size="sm"
            />
            {branding.data.brandLogoUrl ? (
              <Button
                disabled={busy}
                label={t('app.branding.remove')}
                onPress={() => logo.mutate(null)}
                variant="secondary"
                size="sm"
              />
            ) : null}
          </View>
          <Text style={{ color: colors.textMuted }}>{t('app.branding.logoHelp')}</Text>
          <AccentPicker
            selected={branding.data.brandAccent ?? 'blue'}
            busy={busy}
            onChange={(accent) => save.mutate(accent)}
          />
          <Button
            disabled={busy}
            size="sm"
            variant="ghost"
            label={t('app.branding.reset')}
            onPress={() => save.mutate(null)}
          />
        </>
      ) : null}
      {busy ? (
        <Text role={'status'} style={{ color: colors.textMuted }}>
          {t('app.branding.saving')}
        </Text>
      ) : null}
      {invalidLogo || save.isError || logo.isError ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {t(invalidLogo ? 'app.branding.invalidLogo' : 'app.branding.error')}
        </Text>
      ) : null}
    </View>
  );
}

function AccentPicker(props: {
  selected: BrandAccent;
  busy: boolean;
  onChange: (accent: BrandAccent) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {(Object.keys(brandAccents) as BrandAccent[]).map((accent) => (
        <Button
          key={accent}
          disabled={props.busy}
          size="sm"
          selected={props.selected === accent}
          variant={props.selected === accent ? 'primary' : 'secondary'}
          label={t(`app.branding.accent.${accent}`)}
          onPress={() => props.onChange(accent)}
          icon={
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: brandAccents[accent].light.primary,
                borderWidth: 1,
                borderColor: colors.borderStrong,
              }}
            />
          }
        />
      ))}
    </View>
  );
}
