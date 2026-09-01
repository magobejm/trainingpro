import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useAuthStore } from '../../store/auth.store';
import { useClientMeQuery, type ClientMe } from '../../data/hooks/useClientMeQuery';
import { LIGHT } from '../../theme/light';
import { InfoButton, StatSquare } from '../../theme/primitives';
import { AvatarImage, OverlayBackHeader } from './client-shell.primitives';
import { s } from './client-shell.styles';

export function ProfilePanel(props: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { data: client, isLoading } = useClientMeQuery();
  const clearSession = useAuthStore((state) => state.clearSession);
  if (isLoading || !client) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={props.onClose} />
        <View style={s.centered}>
          <ActivityIndicator color={LIGHT.accent} />
        </View>
      </View>
    );
  }
  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <ProfileHero client={client} t={t} />
        <ProfileFields client={client} />
        <View style={s.statGrid}>
          <StatSquare label={t('mobile.client.profile.waist')} value={client.waistCm} />
          <StatSquare label={t('mobile.client.profile.hip')} value={client.hipCm} />
          <StatSquare label={'FC Max'} value={client.fcMax} />
          <StatSquare label={'FC Res'} value={client.fcRest} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
          <View style={{ flex: 1, gap: 16 }}>
            <ObjectivesSection client={client} t={t} />
            <Pressable style={s.photoBtn}>
              <Text style={{ fontSize: 24 }}>{'🖼️'}</Text>
              <Text style={s.photoBtnText}>{t('mobile.client.profile.photos')}</Text>
            </Pressable>
            <ProgressPhotosSection photos={client.progressPhotos} />
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            {client.fitnessLevel ? (
              <View>
                <Text style={s.sectionLabel}>{t('mobile.client.profile.fitnessLevel')}</Text>
                <View style={[s.fieldCard, { alignItems: 'center', marginTop: 6 }]}>
                  <Text style={s.fieldValue}>{client.fitnessLevel}</Text>
                </View>
              </View>
            ) : null}
            {client.considerations ? (
              <InfoButton label={t('mobile.client.profile.considerations')} onPress={() => {}} />
            ) : null}
            {client.allergies ? <InfoButton label={t('mobile.client.profile.allergies')} onPress={() => {}} /> : null}
            {client.injuries ? <InfoButton label={t('mobile.client.profile.injuries')} onPress={() => {}} /> : null}
          </View>
        </View>
        <MedicalSection client={client} />
        {client.notes ? <NotesSection notes={client.notes} t={t} /> : null}
        <Pressable onPress={clearSession} style={s.logoutBtn}>
          <Text style={s.logoutBtnText}>{t('mobile.shell.logout')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ProfileHero(props: { client: ClientMe; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.profileHero}>
      <View style={s.heroAvatarWrap}>
        <AvatarImage avatarUrl={props.client.avatarUrl} size={64} />
      </View>
      <View style={s.heroInfo}>
        <Text style={s.heroName}>{`${props.client.firstName} ${props.client.lastName}`}</Text>
        <View style={s.heroStatusRow}>
          <View style={s.heroStatusDot} />
          <Text style={s.heroStatusText}>{props.t('mobile.client.profile.active')}</Text>
        </View>
      </View>
      <View style={s.profileStatsRow}>
        <View style={s.profileStatCol}>
          <Text style={s.profileStatValue}>{props.client.heightCm ?? '–'}</Text>
          <Text style={s.profileStatLabel}>{props.t('mobile.client.profile.height')}</Text>
        </View>
        <View style={s.profileStatCol}>
          <Text style={s.profileStatValue}>{props.client.weightKg ?? '–'}</Text>
          <Text style={s.profileStatLabel}>{props.t('mobile.client.profile.weight')}</Text>
        </View>
      </View>
    </View>
  );
}

function ProfileFields(props: { client: ClientMe }): React.JSX.Element {
  return (
    <View style={{ gap: 12 }}>
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{'Nombre completo'}</Text>
        <Text style={s.fieldValue}>{`${props.client.firstName} ${props.client.lastName}`}</Text>
      </View>
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{'Email'}</Text>
        <Text style={s.fieldValue}>{props.client.email ?? '–'}</Text>
      </View>
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{'Teléfono'}</Text>
        <Text style={s.fieldValue}>{props.client.phone ?? '–'}</Text>
      </View>
    </View>
  );
}

function ObjectivesSection(props: { client: ClientMe; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionLabel}>{props.t('mobile.client.profile.objective')}</Text>
      <View style={s.objectivePill}>
        <Text style={s.objectivePillText}>{props.client.objective ?? '–'}</Text>
      </View>
      {props.client.secondaryObjectives.length > 0 && (
        <View style={s.chipRow}>
          {props.client.secondaryObjectives.map((obj) => (
            <View key={obj} style={s.chip}>
              <Text style={s.chipText}>{obj}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ProgressPhotosSection(props: { photos: ClientMe['progressPhotos'] }): React.JSX.Element {
  if (!props.photos || props.photos.length === 0) return <View />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photosRow}>
      {props.photos
        .filter((p) => !p.archived)
        .map((photo) => (
          <Image key={photo.id} source={{ uri: photo.imageUrl }} style={s.photoThumb} />
        ))}
    </ScrollView>
  );
}

function MedicalSection(props: { client: ClientMe }): React.JSX.Element {
  const hasAny = props.client.injuries || props.client.allergies || props.client.considerations;
  if (!hasAny) return <View />;
  return (
    <View style={s.sectionCard}>
      {props.client.injuries ? <MedicalRow color={LIGHT.red} label={'Lesiones'} value={props.client.injuries} /> : null}
      {props.client.allergies ? <MedicalRow color={LIGHT.orange} label={'Alergias'} value={props.client.allergies} /> : null}
      {props.client.considerations ? (
        <MedicalRow color={LIGHT.accent} label={'A tener en cuenta'} value={props.client.considerations} />
      ) : null}
    </View>
  );
}

function MedicalRow(props: { color: string; label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.medicalRow}>
      <View style={[s.medicalDot, { backgroundColor: props.color }]} />
      <View style={s.medicalInfo}>
        <Text style={s.medicalLabel}>{props.label}</Text>
        <Text style={s.medicalValue}>{props.value}</Text>
      </View>
    </View>
  );
}

function NotesSection(props: { notes: string; t: (k: string) => string }): React.JSX.Element {
  return (
    <View style={s.notesCard}>
      <Text style={s.sectionLabel}>{props.t('mobile.client.profile.notes')}</Text>
      <Text style={s.notesText}>{props.notes}</Text>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  iconBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});

void panelStyles;
