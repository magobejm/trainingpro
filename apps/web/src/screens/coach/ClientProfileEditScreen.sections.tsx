import React from 'react';
import {
  photoThumbImageHoverStyle,
  photoThumbImageStyle,
  ICON_ARCHIVE,
} from './ClientProfileEditScreen.utils';

export function buildArchiveBadgeText(label: string, count: number): string {
  return `${ICON_ARCHIVE} ${label} (${count})`;
}

export function buildGalleryCounter(text: string, index: number, total: number): string {
  return `${text} ${index + 1}/${total}`;
}

export function photoThumbStyle(isHovered: boolean): React.CSSProperties {
  return {
    ...photoThumbImageStyle,
    ...(isHovered ? photoThumbImageHoverStyle : {}),
  };
}
