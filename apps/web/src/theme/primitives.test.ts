import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Badge } from '../../../../packages/ui/src/primitives/Badge';
import { Button } from '../../../../packages/ui/src/primitives/Button';
import {
  isButtonInactive,
  resolveButtonTone,
  resolveIconButtonColors,
} from '../../../../packages/ui/src/primitives/button.logic';
import { EmptyState } from '../../../../packages/ui/src/primitives/EmptyState';
import { findSelectLabel, nextSelectValue, resolveFieldBorder } from '../../../../packages/ui/src/primitives/field.logic';
import { IconButton } from '../../../../packages/ui/src/primitives/IconButton';
import { MODAL_WIDTHS } from '../../../../packages/ui/src/primitives/modal.logic';
import { SegmentedControl } from '../../../../packages/ui/src/primitives/SegmentedControl';
import { TextField } from '../../../../packages/ui/src/primitives/TextField';
import { ToastProvider, useToast } from '../../../../packages/ui/src/primitives/Toast';
import {
  addToast,
  removeToast,
  TOAST_DURATION_MS,
  TOAST_MAX_VISIBLE,
  toastDuration,
  type ToastItem,
} from '../../../../packages/ui/src/primitives/toast.logic';
import { colors } from '../../../../packages/ui/src/theme/tokens';

const h = React.createElement;
const noop = () => undefined;

describe('button tones', () => {
  it('uses the primary blue and darkens it on hover', () => {
    expect(resolveButtonTone('primary').background).toBe(colors.primary);
    expect(resolveButtonTone('primary', { hovered: true }).background).toBe(colors.primaryHover);
  });

  it('makes the secondary button discreet and the danger button red', () => {
    expect(resolveButtonTone('secondary').background).toBe(colors.surface);
    expect(resolveButtonTone('danger').background).toBe(colors.danger);
    expect(resolveButtonTone('danger', { pressed: true }).background).toBe(colors.dangerHover);
    expect(resolveButtonTone('ghost').background).toBe('transparent');
  });

  it('does not react to hover when disabled', () => {
    expect(resolveButtonTone('primary', { disabled: true, hovered: true }).background).toBe(colors.primary);
  });

  it('treats loading and disabled buttons as inactive so they cannot be double submitted', () => {
    expect(isButtonInactive({ loading: true })).toBe(true);
    expect(isButtonInactive({ disabled: true })).toBe(true);
    expect(isButtonInactive({})).toBe(false);
  });

  it('turns the danger icon button solid red on hover', () => {
    expect(resolveIconButtonColors('danger').background).toBe(colors.dangerSoft);
    expect(resolveIconButtonColors('danger', { hovered: true })).toEqual({
      background: colors.danger,
      icon: colors.onPrimary,
    });
  });

  it('keeps white text readable on each filled variant', () => {
    expect(resolveButtonTone('danger').text).toBe(colors.onPrimary);
    expect(resolveButtonTone('primary').text).toBe(colors.onPrimary);
  });
});

describe('field helpers', () => {
  it('shows red for errors, blue when focused and neutral otherwise', () => {
    expect(resolveFieldBorder({ error: 'El email no es válido', focused: true })).toBe(colors.danger);
    expect(resolveFieldBorder({ focused: true })).toBe(colors.primary);
    expect(resolveFieldBorder({})).toBe(colors.borderStrong);
    expect(resolveFieldBorder({ disabled: true, focused: true })).toBe(colors.borderStrong);
  });

  it('cycles native select options and finds the label of the current value', () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];
    expect(nextSelectValue(options, 'a')).toBe('b');
    expect(nextSelectValue(options, 'b')).toBe('a');
    expect(nextSelectValue([], 'x')).toBe('x');
    expect(findSelectLabel(options, 'b')).toBe('B');
    expect(findSelectLabel(options, 'zzz', 'Elige')).toBe('Elige');
  });
});

describe('toast queue', () => {
  const item = (id: number): ToastItem => ({ id, message: `m${id}`, tone: 'success' });

  it('keeps only the most recent toasts', () => {
    let list: ToastItem[] = [];
    for (let id = 1; id <= TOAST_MAX_VISIBLE + 2; id += 1) list = addToast(list, item(id));
    expect(list.map((entry) => entry.id)).toEqual([3, 4, 5]);
  });

  it('removes a toast by id', () => {
    expect(removeToast([item(1), item(2)], 1).map((entry) => entry.id)).toEqual([2]);
  });

  it('keeps errors on screen longer than confirmations', () => {
    expect(toastDuration('success')).toBe(TOAST_DURATION_MS);
    expect(toastDuration('error')).toBeGreaterThan(TOAST_DURATION_MS);
  });
});

describe('modal sizes', () => {
  it('grows from small to extra large', () => {
    expect(MODAL_WIDTHS.sm).toBeLessThan(MODAL_WIDTHS.md);
    expect(MODAL_WIDTHS.md).toBeLessThan(MODAL_WIDTHS.lg);
    expect(MODAL_WIDTHS.lg).toBeLessThan(MODAL_WIDTHS.xl);
  });
});

describe('rendered primitives', () => {
  it('marks a loading button as busy and disabled', () => {
    const html = renderToStaticMarkup(h(Button, { label: 'Guardar', loading: true, onPress: noop }));
    expect(html).toContain('Guardar');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
  });

  it('renders an idle button as enabled', () => {
    const html = renderToStaticMarkup(h(Button, { label: 'Guardar', onPress: noop }));
    expect(html).not.toContain('aria-busy="true"');
    expect(html).not.toContain('aria-disabled="true"');
  });

  it('labels an icon-only button for screen readers', () => {
    const html = renderToStaticMarkup(
      h(IconButton, { accessibilityLabel: 'Cerrar', icon: () => h('span', null, 'x'), onPress: noop }),
    );
    expect(html).toContain('aria-label="Cerrar"');
  });

  it('shows the error next to the field as an alert, and the help text otherwise', () => {
    const withError = renderToStaticMarkup(
      h(TextField, { error: 'El email no es válido', help: 'Ayuda', label: 'Email', value: '' }),
    );
    expect(withError).toContain('El email no es válido');
    expect(withError).toContain('role="alert"');
    expect(withError).not.toContain('Ayuda');
    const withHelp = renderToStaticMarkup(h(TextField, { help: 'Ayuda', label: 'Email', value: '' }));
    expect(withHelp).toContain('Ayuda');
    expect(withHelp).not.toContain('role="alert"');
  });

  it('shows an empty state with an action to get started', () => {
    const html = renderToStaticMarkup(
      h(EmptyState, {
        actionLabel: 'Crear la primera',
        message: 'Aún no tienes notas.',
        onAction: noop,
        title: 'Sin notas',
      }),
    );
    expect(html).toContain('Sin notas');
    expect(html).toContain('Aún no tienes notas.');
    expect(html).toContain('Crear la primera');
  });

  it('does not show an action button without a handler', () => {
    const html = renderToStaticMarkup(h(EmptyState, { actionLabel: 'Crear', title: 'Sin notas' }));
    expect(html).not.toContain('Crear');
  });

  it('marks the selected segment', () => {
    const html = renderToStaticMarkup(
      h(SegmentedControl, {
        onChange: noop,
        options: [
          { label: 'Semana', value: 'week' },
          { label: 'Mes', value: 'month' },
        ],
        value: 'month',
      }),
    );
    expect(html).toContain('Semana');
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
  });

  it('renders a badge label', () => {
    expect(renderToStaticMarkup(h(Badge, { label: 'Activo', tone: 'success' }))).toContain('Activo');
  });

  it('renders children inside the toast provider and gives no-op functions without it', () => {
    function Probe(): React.ReactElement {
      const toast = useToast();
      return h('span', null, String(toast.success('x')));
    }
    expect(renderToStaticMarkup(h(Probe))).toBe('<span>0</span>');
    expect(
      renderToStaticMarkup(h(ToastProvider, { children: h('span', null, 'contenido'), dismissLabel: 'Cerrar' })),
    ).toContain('contenido');
  });
});
