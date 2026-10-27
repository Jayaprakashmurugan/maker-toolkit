// The About page's "What I do", "Core expertise" and "Methods & tools", from the LinkedIn About section
// (updated 2026-10-28). Edit the words here; the page lays them out.

import type { IconName } from '../components/Icon.astro';

/** "What I do": paragraphs in order. `focus` is pulled out and highlighted after the paragraph it follows. */
export const about: { text: string; focus?: string }[] = [
  {
    text: 'I build enterprise applications on the Microsoft Power Platform: Canvas Apps, Model-Driven Apps, Code Apps, Power Automate flows, and Dataverse data models. My work covers the full stack – from schema design and security roles through UI, integration, and deployment pipelines.',
  },
  {
    text: 'I care about how solutions are built, not just that they work. That means proper ALM with Azure DevOps and PAC CLI, solution-aware components, and performance-conscious Power Fx and flow design. I also work with SharePoint and XrmToolBox for integration, customization, and data operations.',
  },
  {
    text: 'Alongside delivery, I train and enable teams – walking developers through architecture decisions, code, and ALM practices so they can own and extend what we’ve built.',
    focus: 'My current focus is Code Apps, Copilot Studio, and agent development on Dataverse.',
  },
  {
    text: 'I share hands-on tutorials and real code examples with the Power Platform community on LinkedIn.',
  },
];

/** "Core expertise". Each `detail` is a phrase from the paragraphs above. */
export const expertise: { title: string; detail: string; icon: IconName; color: string }[] = [
  { title: 'Power Apps', detail: 'Canvas, Model-Driven & Code Apps', icon: 'apps', color: 'var(--pp-apps)' },
  { title: 'Power Automate', detail: 'Performance-conscious flow design', icon: 'flow', color: 'var(--pp-automate)' },
  { title: 'Dataverse & Data Modeling', detail: 'Schema design and security roles', icon: 'database', color: 'var(--pp-data)' },
  { title: 'Power Platform ALM & Governance', detail: 'Azure DevOps, PAC CLI, solution-aware components', icon: 'branch', color: 'var(--pp-bi)' },
  { title: 'Copilot Studio & AI Agent Development', detail: 'Agent development on Dataverse', icon: 'bot', color: 'color-mix(in srgb, var(--pp-apps) 50%, var(--pp-automate))' },
  { title: 'Training & Enablement', detail: 'Architecture decisions, code and ALM practices', icon: 'cap', color: 'var(--accent-ink)' },
];

/** "Methods & tools", grouped. */
export const toolbox: { group: string; items: string[] }[] = [
  { group: 'Microsoft Power Platform', items: ['Power Apps', 'Power Automate', 'Dataverse', 'Copilot Studio'] },
  { group: 'Development', items: ['Power Fx', 'React', 'TypeScript'] },
  { group: 'ALM & DevOps', items: ['Azure DevOps', 'PAC CLI', 'XrmToolBox'] },
  { group: 'Microsoft 365', items: ['SharePoint', 'Teams'] },
  { group: 'AI & Productivity', items: ['Agentic AI & Coding Workflows', 'Prototyping'] },
];
