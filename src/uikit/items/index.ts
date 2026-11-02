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
import {
  calendar, datePicker, emailDialog, fileUpload, heatmap, lineChart, notificationBadge, photoUpload, pieChart, screenSplash, topMenu,
} from './extra';

export const KIT_ITEMS: KitItem[] = [
  appHeader, sidebar, topMenu, tabs, breadcrumbs, stepper, pagination, bottomNav,
  button, textField, searchBox, filterChips, toggleSwitch, segmented, calendar, datePicker, fileUpload, photoUpload, fab,
  confirmDialog, emailDialog, banner, notificationBadge, loadingOverlay, emptyState, progressBar, sideDrawer,
  statusPill, kpiCard, listRow, dataTable, cardGrid, accordion, timeline, detailsPanel, barChart, lineChart, pieChart, progressRing, heatmap,
  layoutAppShell, layoutDashboard, layoutMasterDetail, layoutForm, layoutMobile,
  screenRequests, screenApproval, screenHome, screenSettings, screenSplash,
];

export const kitItem = (slug: string) => KIT_ITEMS.find((i) => i.slug === slug);
