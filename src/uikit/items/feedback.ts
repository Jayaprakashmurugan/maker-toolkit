// Feedback: dialogs, banners, loading and empty states.

import { spinnerSvg } from '../icons';
import { btn, fx, hCon, img, lbl, nCon, vCon } from '../model';
import { reader, type KitItem } from '../types';
import { icon } from './shared';

export const confirmDialog: KitItem = {
  slug: 'confirm-dialog',
  name: 'Confirm dialog',
  category: 'Feedback',
  summary: 'A centered dialog over a dimmed screen, for “are you sure?” moments. One variable opens and closes it.',
  keywords: ['dialog', 'modal', 'popup', 'confirm', 'delete', 'overlay'],
  canvas: { w: 640, h: 380, bg: 'page' },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Delete this request?' },
    { id: 'message', label: 'Message', type: 'text', default: 'The request and its attachments will be removed. This can’t be undone.' },
    { id: 'confirm', label: 'Confirm button', type: 'text', default: 'Delete' },
    { id: 'danger', label: 'Destructive action', type: 'toggle', default: true },
  ],
  build(o) {
    const r = reader(o);
    const danger = r.b('danger');
    return {
      root: nCon('nConConfirmOverlay', { w: fx('App.Width', 640), h: fx('App.Height', 380), fill: { rgba: [20, 28, 38, 0.45] }, visible: fx('lclShowConfirm', true) }, [
        vCon(
          'vConConfirmDialog',
          {
            w: 380,
            h: 200,
            x: fx('(Parent.Width - Self.Width) / 2', 130),
            y: fx('(Parent.Height - Self.Height) / 2', 90),
            fill: 'Fill',
            radius: 'Medium',
            pad: 'Large',
            gap: 'Small',
            alignItems: 'Stretch',
            shadow: 'Semilight',
          },
          [
            lbl('lblConfirmTitle', { text: r.s('title'), w: 'fill', h: 30, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
            lbl('lblConfirmMessage', { text: r.s('message'), w: 'fill', h: 'fill', size: 'Small', color: 'Primary3', vAlign: 'Top', pad: 0 }),
            hCon('hConConfirmActions', { w: 'fill', h: 36, gap: 'Small', justify: 'End', alignItems: 'Center' }, [
              btn('btnConfirmCancel', {
                text: 'Cancel',
                w: 100,
                h: 34,
                fill: 'Fill',
                color: 'TextColor',
                border: { color: 'BorderColor', thickness: 'Thin' },
                hoverFill: 'HoverFill',
                radius: 'Medium',
                size: 'Small',
                onSelect: 'UpdateContext({ lclShowConfirm: false })',
              }),
              btn('btnConfirmOk', {
                text: r.s('confirm'),
                w: 110,
                h: 34,
                fill: danger ? 'ErrorColor' : 'Primary1',
                hoverFill: { fade: danger ? 'ErrorColor' : 'Primary1', by: -15 },
                radius: 'Medium',
                size: 'Small',
                onSelect: '// do the action, e.g. Remove(colRequests, gblSelectedItem);\nUpdateContext({ lclShowConfirm: false })',
              }),
            ]),
          ],
        ),
      ]),
      onVisible: 'UpdateContext({ lclShowConfirm: false })',
      notes: [
        'Open it from any button with UpdateContext({ lclShowConfirm: true }).',
        'Paste it last, or move it to the top of the tree view, so it sits above everything on the screen.',
      ],
      uses: [{ name: 'lclShowConfirm', what: 'Local variable: true while the dialog is open' }],
    };
  },
};

const BANNERS = {
  info: { slot: 1, icon: 'info', hex: 'Primary1', title: 'Heads up' },
  success: { slot: 5, icon: 'success', hex: 'SuccessColor', title: 'Saved' },
  warning: { slot: 3, icon: 'warning', hex: 'WarningColor', title: 'Check this' },
  error: { slot: 2, icon: 'error', hex: 'ErrorColor', title: 'Something went wrong' },
} as const;

export const banner: KitItem = {
  slug: 'notification-banner',
  name: 'Notification banner',
  category: 'Feedback',
  summary: 'An inline message in four tones (info, success, warning, error) with a close button.',
  keywords: ['banner', 'alert', 'toast', 'message', 'notification', 'snackbar'],
  canvas: { w: 520, h: 120 },
  options: [
    {
      id: 'tone',
      label: 'Tone',
      type: 'select',
      default: 'success',
      choices: [
        { value: 'info', label: 'Info' },
        { value: 'success', label: 'Success' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' },
      ],
    },
    { id: 'message', label: 'Message', type: 'text', default: 'Your request was submitted for approval.' },
  ],
  build(o) {
    const r = reader(o);
    const tone = BANNERS[r.s('tone') as keyof typeof BANNERS] ?? BANNERS.info;
    return {
      root: hCon(
        'hConBanner',
        {
          w: 460,
          h: 56,
          fill: { status: tone.slot },
          radius: 'Medium',
          pad: { l: 'Regular', r: 'Small' },
          gap: 'Small',
          alignItems: 'Center',
          visible: fx('lclShowBanner', true),
        },
        [
          icon('imgBannerIcon', tone.icon, tone.hex, { w: 22, h: 22 }),
          vCon('vConBannerText', { w: 'fill', h: 'fill', justify: 'Center', alignItems: 'Stretch' }, [
            lbl('lblBannerTitle', { text: tone.title, w: 'fill', h: 20, size: 'Small', weight: 'Semibold', color: { statusFont: tone.slot }, pad: 0, wrap: false }),
            lbl('lblBannerMessage', { text: r.s('message'), w: 'fill', h: 18, size: 'Tiny', color: 'TextColor', pad: 0, wrap: false }),
          ]),
          icon('imgBannerClose', 'close', 'TextColor', { w: 28, h: 28, pad: 6, tooltip: 'Close', onSelect: 'UpdateContext({ lclShowBanner: false })' }),
        ],
      ),
      notes: [
        'Show it after a save: UpdateContext({ lclShowBanner: true }). It stays until closed.',
        'To hide it after a few seconds, add a Timer with Duration 4000, Start set to lclShowBanner and OnTimerEnd set to UpdateContext({ lclShowBanner: false }).',
      ],
      uses: [{ name: 'lclShowBanner', what: 'Local variable: true while the banner shows' }],
    };
  },
};

export const loadingOverlay: KitItem = {
  slug: 'loading-overlay',
  name: 'Loading overlay',
  category: 'Feedback',
  summary: 'A soft overlay with a turning spinner, shown while data loads or saves. Blocks clicks until it’s done.',
  keywords: ['loading', 'spinner', 'busy', 'overlay', 'progress', 'wait'],
  canvas: { w: 640, h: 360, bg: 'page' },
  options: [{ id: 'text', label: 'Message', type: 'text', default: 'Loading requests…' }],
  build(o) {
    const r = reader(o);
    return {
      root: nCon('nConLoading', { w: fx('App.Width', 640), h: fx('App.Height', 360), fill: { rgba: [255, 255, 255, 0.72] }, visible: fx('gblLoading', true) }, [
        vCon(
          'vConLoadingCard',
          {
            w: 220,
            h: 130,
            x: fx('(Parent.Width - Self.Width) / 2', 210),
            y: fx('(Parent.Height - Self.Height) / 2', 115),
            fill: 'Fill',
            radius: 'Medium',
            shadow: 'Semilight',
            gap: 'Small',
            alignItems: 'Center',
            justify: 'Center',
          },
          [
            img('imgLoadingSpinner', { w: 44, h: 44, label: 'Loading', svg: (hex) => spinnerSvg(hex('Primary1'), hex('GrayMediumLight')) }),
            lbl('lblLoadingText', { text: r.s('text'), w: 'fill', h: 24, size: 'Small', textAlign: 'Center', color: 'Primary3', pad: 0 }),
          ],
        ),
      ]),
      notes: [
        'Wrap the slow part: Set(gblLoading, true); ClearCollect(colRequests, Requests); Set(gblLoading, false).',
        'The spinner is an animated SVG, so it turns without a timer.',
      ],
      uses: [{ name: 'gblLoading', what: 'Global variable: true while something loads' }],
    };
  },
};

export const emptyState: KitItem = {
  slug: 'empty-state',
  name: 'Empty state',
  category: 'Feedback',
  summary: 'What a gallery shows when there’s nothing in it yet: an icon, a short message and the next step.',
  keywords: ['empty', 'no data', 'no results', 'placeholder', 'zero state'],
  canvas: { w: 420, h: 320 },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'No requests yet' },
    { id: 'text', label: 'Message', type: 'text', default: 'Requests you create show up here. Start with your first one.' },
    { id: 'action', label: 'Button', type: 'text', default: 'Create a request' },
  ],
  build(o) {
    const r = reader(o);
    return {
      root: vCon('vConEmpty', { w: 360, h: 280, gap: 'Small', alignItems: 'Center', justify: 'Center', visible: fx('IsEmpty(colRequests)', true) }, [
        icon('imgEmptyIcon', 'inbox', 'Primary1', { w: 64, h: 64, pad: 16, fill: 'Primary2', radius: 32 }),
        lbl('lblEmptyTitle', { text: r.s('title'), w: 'fill', h: 28, size: 'Subtitle', weight: 'Semibold', textAlign: 'Center', pad: 0 }),
        lbl('lblEmptyText', { text: r.s('text'), w: 280, h: 44, size: 'Small', color: 'Primary3', textAlign: 'Center', vAlign: 'Top', pad: 0, align: 'Center' }),
        btn('btnEmptyAction', { text: r.s('action'), w: 170, h: 36, fill: 'Primary1', hoverFill: { fade: 'Primary1', by: -15 }, radius: 'Medium', size: 'Small', onSelect: '// Navigate(scrNewRequest)' }),
      ]),
      notes: ['Place it where the gallery is. It shows only when colRequests is empty, so set the gallery’s Visible to !IsEmpty(colRequests).'],
    };
  },
};
