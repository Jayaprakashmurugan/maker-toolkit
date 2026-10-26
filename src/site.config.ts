// Edit these values to rebrand the site. The public URL lives in astro.config.mjs (`site`).
export const siteConfig = {
  // Shown as "Maker/Toolkit" in the header (words joined with a slash).
  name: 'Maker Toolkit',
  tagline: 'Free tools for Power Platform makers',
  description:
    'Free, browser-based tools, guides and videos for Power Apps, Power Automate and Dataverse makers. No sign-up, no cookies.',
  // Where people can report a mistake or suggest a formula. Replace with your GitHub repo's issues page.
  feedbackUrl: 'https://github.com/Jayaprakashmurugan/maker-toolkit/issues',
  author: 'Jayaprakash Murugan',
  authorRole: 'Microsoft Power Platform Developer',
  authorLocation: 'Chennai, India',
  /** One or two sentences, shown on the homepage and About page. */
  authorBio:
    'I build Power Apps and Power Automate solutions, and the free tools on this site that make them easier. With a background in mathematics, formulas are where I feel at home.',
  /** Your photo: put the file in public/images/ and set its path, e.g. '/images/jayaprakash.jpg'. Empty shows your initials. */
  authorPhoto: '/images/jayaprakash.jpg',
  authorCerts: [
    { code: 'PL-900', name: 'Power Platform Fundamentals' },
    { code: 'PL-100', name: 'Power Platform App Maker' },
    { code: 'PL-200', name: 'Power Platform Functional Consultant' },
  ],
  authorLinks: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jayaprakash-murugan-472016159/', icon: 'linkedin' },
    { label: 'GitHub', href: 'https://github.com/Jayaprakashmurugan', icon: 'github' },
  ],
  /** Your YouTube channel URL. When set, a YouTube link and Subscribe buttons appear. */
  youtubeUrl: '',
  // Cloudflare Web Analytics token (cookie-free visit counts). Leave empty to turn it off.
  cfAnalyticsToken: '',
  // Google Search Console "HTML tag" code: paste only the content="..." value.
  googleSiteVerification: 'GOf4XS8q19iUeJeqqMfqvAa6CY6ZuKPtOY3VwmgPNd4',
};
