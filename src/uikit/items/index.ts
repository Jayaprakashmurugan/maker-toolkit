// Every UI Kit item, in catalog order.

import type { KitItem } from '../types';
import { button, filterChips, searchBox, textField } from './inputs';
import { appHeader, breadcrumbs, pagination, sidebar, stepper, tabs } from './navigation';
import { banner, confirmDialog, emptyState, loadingOverlay } from './feedback';
import { dataTable, kpiCard, listRow, statusPill } from './data';
import {
  accordion, barChart, bottomNav, cardGrid, detailsPanel, fab, progressBar, progressRing, segmented, sideDrawer, timeline, toggleSwitch,
} from './more';
import { layoutAppShell, layoutDashboard, layoutForm, layoutMasterDetail, layoutMobile } from './layouts';
import { screenApproval, screenHome, screenRequests, screenSettings } from './screens';

export const KIT_ITEMS: KitItem[] = [
  appHeader, sidebar, tabs, breadcrumbs, stepper, pagination, bottomNav,
  button, textField, searchBox, filterChips, toggleSwitch, segmented, fab,
  confirmDialog, banner, loadingOverlay, emptyState, progressBar, sideDrawer,
  statusPill, kpiCard, listRow, dataTable, cardGrid, accordion, timeline, detailsPanel, barChart, progressRing,
  layoutAppShell, layoutDashboard, layoutMasterDetail, layoutForm, layoutMobile,
  screenRequests, screenApproval, screenHome, screenSettings,
];

export const kitItem = (slug: string) => KIT_ITEMS.find((i) => i.slug === slug);
