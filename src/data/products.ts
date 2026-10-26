// The Microsoft products each tool works with.
//
// Icons are Microsoft's official Power Platform icons (learn.microsoft.com/power-platform/guidance/icons),
// used unmodified, always next to the product's full name, and only to show which Microsoft product a tool
// works with, as Microsoft's terms require. They are never used as this site's own branding.
// Microsoft doesn't publish SharePoint, Teams or Outlook logos under those terms, so those show as names only.

export type ProductId = 'power-apps' | 'power-automate' | 'dataverse' | 'power-platform' | 'sharepoint' | 'teams' | 'outlook';

export interface Product {
  name: string;
  /** Path to the official icon, if Microsoft allows using it here. */
  icon?: string;
}

export const PRODUCTS: Record<ProductId, Product> = {
  'power-apps': { name: 'Power Apps', icon: '/products/power-apps.svg' },
  'power-automate': { name: 'Power Automate', icon: '/products/power-automate.svg' },
  dataverse: { name: 'Dataverse', icon: '/products/dataverse.svg' },
  'power-platform': { name: 'Power Platform', icon: '/products/power-platform.svg' },
  sharepoint: { name: 'SharePoint' },
  teams: { name: 'Teams' },
  outlook: { name: 'Outlook' },
};
