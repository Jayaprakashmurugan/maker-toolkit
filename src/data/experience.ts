// Work history, taken from the LinkedIn profile (checked 2026-10-26).
// Newest first. Dates are 'YYYY-MM'; a role with no `end` is the current one.
// Durations are counted the way LinkedIn counts them (both months included), at build time.

export interface Role {
  title: string;
  start: string;
  end?: string;
  skills: string[];
  /** Color of this role on the career bar (Power Platform palette). */
  color: string;
}

export interface Job {
  company: string;
  url?: string;
  /** e.g. "Full-time · Hybrid" */
  terms: string;
  about?: string;
  roles: Role[];
}

export const experience: Job[] = [
  {
    company: 'Power Doc 365',
    url: 'https://www.linkedin.com/company/74514102/',
    terms: 'Full-time · Hybrid',
    roles: [
      {
        title: 'Lead Power Platform Developer',
        start: '2023-10',
        color: 'var(--pp-apps)',
        skills: ['Power Apps', 'Power Automate', 'Dataverse', 'Model-driven apps', 'Data modeling', 'SharePoint', 'Power BI', 'DevOps', 'Jira'],
      },
      {
        title: 'Power Platform Developer',
        start: '2022-09',
        end: '2023-10',
        color: 'var(--pp-automate)',
        skills: ['Canvas apps', 'Model-driven apps', 'Power Automate', 'Dataverse', 'SharePoint', 'Adaptive Cards', 'Power BI', 'GitHub'],
      },
      {
        title: 'Junior Power Platform Developer',
        start: '2022-07',
        end: '2022-09',
        color: 'var(--pp-data)',
        skills: ['Power Apps', 'Power Automate', 'SharePoint workflows', 'Power BI'],
      },
    ],
  },
  {
    company: 'Panuval Book Store',
    url: 'https://www.linkedin.com/company/7820265/',
    terms: 'Part-time · On-site',
    about: 'One of the largest bookstores in South India.',
    roles: [
      {
        title: 'Social Media Coordinator',
        start: '2016-08',
        end: '2022-07',
        color: 'var(--pp-bi)',
        skills: ['Social media', 'SEO', 'Web design', 'Data visualization', 'Photoshop', 'Communication'],
      },
    ],
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Months since year 0, so two dates can be subtracted. */
function toMonths(ym?: string): number {
  if (!ym) {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

/** "Oct 2023" or "Present". */
export const monthLabel = (ym?: string) => (ym ? `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}` : 'Present');

/** "3 yrs 1 mo", counting both the first and last month. */
export function duration(start: string, end?: string): string {
  const total = toMonths(end) - toMonths(start) + 1;
  const y = Math.floor(total / 12);
  const m = total % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
}

/** First and last month of a job across all its roles. */
export const jobSpan = (job: Job) => ({
  start: job.roles.at(-1)!.start,
  end: job.roles[0].end,
});

/** The current role, for the profile card. */
export const current = (() => {
  const job = experience.find((j) => !j.roles[0].end);
  return job && { company: job.company, title: job.roles[0].title, since: job.roles[0].start };
})();

/** Where a stretch of time sits on a bar running from January of `from` to now, in percent. */
export function barSpan(from: number, start: string, end?: string) {
  const origin = from * 12;
  const span = toMonths() + 1 - origin;
  const a = toMonths(start) - origin;
  const b = toMonths(end) + 1 - origin;
  return { left: (a / span) * 100, width: ((b - a) / span) * 100 };
}
