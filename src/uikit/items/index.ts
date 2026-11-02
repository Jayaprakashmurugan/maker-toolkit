// Every UI Kit item, in catalog order.

import type { KitItem } from '../types';
import { button, filterChips, searchBox, textField } from './inputs';
import { appHeader, breadcrumbs, pagination, sidebar, stepper, tabs } from './navigation';
import { banner, confirmDialog, emptyState, loadingOverlay } from './feedback';
import { dataTable, kpiCard, listRow, statusPill } from './data';

export const KIT_ITEMS: KitItem[] = [
  appHeader, sidebar, tabs, breadcrumbs, stepper, pagination,
  button, textField, searchBox, filterChips,
  confirmDialog, banner, loadingOverlay, emptyState,
  statusPill, kpiCard, listRow, dataTable,
];

export const kitItem = (slug: string) => KIT_ITEMS.find((i) => i.slug === slug);
