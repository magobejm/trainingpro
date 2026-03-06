import React from 'react';
import { PhotoGalleryModal } from './ClientProfileEditScreen.components';
import { buildGalleryCounter } from './ClientProfileEditScreen.sections';
import {
  ICON_CLOSE,
  ICON_NEXT,
  ICON_PREV,
  type ProgressPhoto,
} from './ClientProfileEditScreen.utils';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ProgressGallery(props: {
  activeIndex: null | number;
  photos: ProgressPhoto[];
  t: Translate;
  setGalleryIndex: React.Dispatch<React.SetStateAction<null | number>>;
}): null | React.JSX.Element {
  if (props.activeIndex === null || props.photos.length === 0) return null;
  const counter = buildGalleryCounter(
    props.t('coach.clientProfile.editPage.galleryCounter'),
    props.activeIndex,
    props.photos.length,
  );
  return (
    <PhotoGalleryModal
      closeIcon={ICON_CLOSE}
      counter={counter}
      index={props.activeIndex}
      navNextIcon={ICON_NEXT}
      navPrevIcon={ICON_PREV}
      onClose={() => props.setGalleryIndex(null)}
      onNext={() => rotateGalleryNext(props.photos.length, props.setGalleryIndex)}
      onPrev={() => rotateGalleryPrev(props.photos.length, props.setGalleryIndex)}
      photos={props.photos}
    />
  );
}

function rotateGalleryNext(
  size: number,
  setIndex: React.Dispatch<React.SetStateAction<null | number>>,
): void {
  setIndex((prev) => ((prev ?? 0) + 1) % size);
}

function rotateGalleryPrev(
  size: number,
  setIndex: React.Dispatch<React.SetStateAction<null | number>>,
): void {
  setIndex((prev) => {
    const current = prev ?? 0;
    return (current - 1 + size) % size;
  });
}
