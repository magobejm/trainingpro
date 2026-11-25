import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState } from '../../components/AsyncStatus';

/** Subpantallas del cliente: se descargan al abrirlas, no con la lista de clientes. */
const NutritionLazy = React.lazy(() =>
  import('./ClientNutritionPlanScreen').then((m) => ({ default: m.ClientNutritionPlanScreen })),
);
const ProfileLazy = React.lazy(() => import('./ClientProfileScreen').then((m) => ({ default: m.ClientProfileScreen })));
const ProfileEditLazy = React.lazy(() =>
  import('./ClientProfileEditScreen').then((m) => ({ default: m.ClientProfileEditScreen })),
);
const CompareLazy = React.lazy(() => import('./ClientCompareScreen').then((m) => ({ default: m.ClientCompareScreen })));
const MeasuresLazy = React.lazy(() => import('./ClientMeasuresScreen').then((m) => ({ default: m.ClientMeasuresScreen })));
const PlanningLazy = React.lazy(() => import('./ClientPlanningScreen').then((m) => ({ default: m.ClientPlanningScreen })));
const VolumeLazy = React.lazy(() => import('./ClientVolumeScreen').then((m) => ({ default: m.ClientVolumeScreen })));
const RoutineLazy = React.lazy(() =>
  import('./client-routine/ClientRoutineScreen').then((m) => ({ default: m.ClientRoutineScreen })),
);
const TestsLazy = React.lazy(() => import('./ClientTestsScreen').then((m) => ({ default: m.ClientTestsScreen })));
const MoodLazy = React.lazy(() => import('./ClientMoodScreen').then((m) => ({ default: m.ClientMoodScreen })));

function Loading(): React.JSX.Element {
  const { t } = useTranslation();
  return <LoadingState label={t('common.loading')} />;
}

function withSuspense<P extends object>(Lazy: React.ComponentType<P>): (props: P) => React.JSX.Element {
  return function Wrapped(props: P): React.JSX.Element {
    return (
      <Suspense fallback={<Loading />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

export const ClientNutritionPlanScreen = withSuspense(NutritionLazy);
export const ClientProfileScreen = withSuspense(ProfileLazy);
export const ClientProfileEditScreen = withSuspense(ProfileEditLazy);
export const ClientCompareScreen = withSuspense(CompareLazy);
export const ClientMeasuresScreen = withSuspense(MeasuresLazy);
export const ClientPlanningScreen = withSuspense(PlanningLazy);
export const ClientVolumeScreen = withSuspense(VolumeLazy);
export const ClientRoutineScreen = withSuspense(RoutineLazy);
export const ClientTestsScreen = withSuspense(TestsLazy);
export const ClientMoodScreen = withSuspense(MoodLazy);
