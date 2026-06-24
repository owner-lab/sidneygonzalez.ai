export const SITE = {
  title: 'Sidney Gonzalez | Financial Intelligence Systems',
  description:
    'Portfolio demonstrating financial intelligence systems with live Python computation.',
  url: 'https://sidneygonzalez.ai',
}

// Anchor entries scroll within the Home one-pager (href = '#section'). Route
// entries navigate to a separate page (to = '/path', route: true) and have NO
// href — the Navbar branches render-vs-route on the `route` flag. About and the
// Build Log are dedicated pages so the homepage stays a single guided story;
// only Home / Projects / Contact remain in-page anchors.
export const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Projects', href: '#projects' },
  { label: 'AI Value', to: '/ai', route: true },
  { label: 'About', to: '/about', route: true },
  { label: 'Build Log', to: '/build-log', route: true },
  { label: 'Contact', href: '#contact' },
]

export const SOCIAL = {
  github: 'https://github.com/owner-lab/sidneygonzalez.ai',
  linkedin: 'https://www.linkedin.com/in/sidney-gonzalez-784034158/',
  resume: '/SidneyG_Resume_2026.pdf',
  email: 'mailto:sidneygonzalez.177@gmail.com',
}

export const HERO = {
  title: 'Corporate Financial Analyst',
  subtitle:
    'I build the intelligence layer between raw corporate data and executive decision-making.',
  supporting:
    'Python \u00B7 Data Pipelines \u00B7 AI-Driven Reporting \u00B7 Cross-Functional Analytics',
}
