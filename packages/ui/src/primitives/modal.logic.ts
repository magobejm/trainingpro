export type ModalSize = 'lg' | 'md' | 'sm' | 'xl';

/** Ancho máximo (px) de cada tamaño de ventana; en pantallas pequeñas ocupa todo el ancho disponible. */
export const MODAL_WIDTHS: Record<ModalSize, number> = {
  lg: 720,
  md: 520,
  sm: 400,
  xl: 960,
};
