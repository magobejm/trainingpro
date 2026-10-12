import { useEffect } from 'react';
import { useToast } from '@trainerpro/ui';

interface SuccessBannerProps {
  t: (k: string) => string;
}

/** Ya no pinta un banner: avisa con un toast al montarse (mientras `saveSuccess` es verdadero). */
export function SuccessBanner({ t }: SuccessBannerProps): null {
  const toast = useToast();
  useEffect(() => {
    toast.success(t('coach.routine.saved'));
  }, []);
  return null;
}
