export const SITE_TRAFFIC_WEEKLY = {
    categories: ['Oct 22', 'Oct 29', 'Nov 5', 'Nov 12', 'Nov 19', 'Nov 26', 'Dec 3', 'Dec 10', 'Dec 17', 'Dec 24', 'Dec 31', 'Jan 7'],
    series: [
        { name: 'Website', data: [0, 42, 187, 310, 485, 620, 890, 1120, 1340, 980, 1150, 1480] },
        { name: 'LinkedIn', data: [0, 18, 65, 140, 210, 340, 410, 520, 680, 590, 710, 830] },
        { name: 'Google (Organic)', data: [0, 0, 12, 38, 85, 145, 220, 310, 460, 380, 520, 690] },
        { name: 'Paid Media', data: [0, 0, 0, 0, 85, 210, 340, 480, 620, 510, 680, 890] },
    ],
};

export const TRAFFIC_SOURCES = [
    { source: 'Direct / Typed URL', sessions: 2840, pct: 28, trend: '+12%' },
    { source: 'LinkedIn (Organic)', sessions: 2180, pct: 22, trend: '+34%' },
    { source: 'Google Search', sessions: 1650, pct: 17, trend: '+48%' },
    { source: 'Google Ads', sessions: 1420, pct: 14, trend: 'new' },
    { source: 'Industry Directories', sessions: 980, pct: 10, trend: '+22%' },
    { source: 'Email Campaigns', sessions: 540, pct: 5, trend: '+8%' },
    { source: 'Social (Facebook/IG)', sessions: 390, pct: 4, trend: '+15%' },
];

export const CAMPAIGN_PERFORMANCE = [
    { name: 'Website Redesign + Launch', channel: 'website', impressions: 18400, clicks: 2840, ctr: '15.4%', conversions: 142, cost: '$0', cpa: '$0', status: 'active' },
    { name: 'PTP Steel Sales Microsite', channel: 'website', impressions: 8200, clicks: 1640, ctr: '20.0%', conversions: 82, cost: '$0', cpa: '$0', status: 'planned' },
    { name: 'Google Ads — Steel Processing', channel: 'paid', impressions: 124000, clicks: 3720, ctr: '3.0%', conversions: 186, cost: '$4,650', cpa: '$25', status: 'active' },
    { name: 'LinkedIn Sponsored Content', channel: 'paid', impressions: 86000, clicks: 2580, ctr: '3.0%', conversions: 103, cost: '$5,160', cpa: '$50', status: 'active' },
    { name: 'LinkedIn Company Page Launch', channel: 'social', impressions: 42000, clicks: 1890, ctr: '4.5%', conversions: 95, cost: '$0', cpa: '$0', status: 'active' },
    { name: 'SEO Optimization Program', channel: 'content', impressions: 34000, clicks: 1360, ctr: '4.0%', conversions: 68, cost: '$2,500', cpa: '$37', status: 'active' },
    { name: 'LinkedIn Ad — Automotive', channel: 'paid', impressions: 62000, clicks: 1860, ctr: '3.0%', conversions: 74, cost: '$3,720', cpa: '$50', status: 'active' },
    { name: 'Email Nurture Sequence', channel: 'email', impressions: 4200, clicks: 840, ctr: '20.0%', conversions: 42, cost: '$0', cpa: '$0', status: 'active' },
    { name: 'Industry Directory Listings', channel: 'listing', impressions: 28000, clicks: 980, ctr: '3.5%', conversions: 49, cost: '$1,200', cpa: '$24', status: 'active' },
    { name: 'ASMR Factory Video Series', channel: 'content', impressions: 156000, clicks: 7800, ctr: '5.0%', conversions: 312, cost: '$800', cpa: '$2.56', status: 'active' },
    { name: 'Post Card Mailers — Wave 1', channel: 'direct', impressions: 500, clicks: 85, ctr: '17.0%', conversions: 12, cost: '$375', cpa: '$31', status: 'complete' },
    { name: 'Post Card Mailers — Wave 2', channel: 'direct', impressions: 750, clicks: 128, ctr: '17.1%', conversions: 18, cost: '$562', cpa: '$31', status: 'active' },
    { name: 'Trade Show — METALCON 2027', channel: 'event', impressions: 5000, clicks: 250, ctr: '5.0%', conversions: 38, cost: '$8,500', cpa: '$224', status: 'planned' },
    { name: 'Facility Open House', channel: 'event', impressions: 200, clicks: 120, ctr: '60.0%', conversions: 45, cost: '$2,000', cpa: '$44', status: 'planned' },
    { name: 'Facebook / Instagram Ads', channel: 'paid', impressions: 95000, clicks: 2850, ctr: '3.0%', conversions: 114, cost: '$2,850', cpa: '$25', status: 'planned' },
    { name: 'Google Business Profile', channel: 'listing', impressions: 12000, clicks: 960, ctr: '8.0%', conversions: 48, cost: '$0', cpa: '$0', status: 'active' },
];

export const CHANNEL_SUMMARY = {
    website:  { label: 'Website',      icon: 'ri-global-line',     color: 'primary' },
    paid:     { label: 'Paid Media',    icon: 'ri-advertisement-line', color: 'danger' },
    social:   { label: 'Social',        icon: 'ri-share-line',      color: 'info' },
    content:  { label: 'Content',       icon: 'ri-article-line',    color: 'success' },
    email:    { label: 'Email',         icon: 'ri-mail-line',       color: 'warning' },
    listing:  { label: 'Listings',      icon: 'ri-map-pin-line',    color: 'violet' },
    direct:   { label: 'Direct Mail',   icon: 'ri-mail-send-line',  color: 'teal' },
    event:    { label: 'Events',        icon: 'ri-calendar-event-line', color: 'orange' },
};

export const POSTCARD_METRICS = {
    waves: [
        { name: 'Wave 1 — Automotive & Battery', sent: 500, delivered: 488, responseRate: '17.0%', responses: 85, qualified: 12, cost: '$375', cpm: '$0.75', timeline: 'Oct 28 – Nov 8' },
        { name: 'Wave 2 — Data Centers & Solar', sent: 750, delivered: 731, responseRate: '17.1%', responses: 128, qualified: 18, cost: '$562', cpm: '$0.75', timeline: 'Nov 15 – Nov 30' },
        { name: 'Wave 3 — Construction & Industrial', sent: 1000, delivered: 0, responseRate: '—', responses: 0, qualified: 0, cost: '$750', cpm: '$0.75', timeline: 'Dec 10 – Dec 22' },
    ],
    trackingCodes: [
        { code: 'PTP-PC-W1', url: 'pacifictoll.com/steel?ref=pc1', scans: 62, webVisits: 85, conversions: 12 },
        { code: 'PTP-PC-W2', url: 'pacifictoll.com/steel?ref=pc2', scans: 94, webVisits: 128, conversions: 18 },
        { code: 'PTP-PC-W3', url: 'pacifictoll.com/steel?ref=pc3', scans: 0, webVisits: 0, conversions: 0 },
    ],
};

export const PAID_MEDIA_DETAIL = [
    { platform: 'Google Ads', spend: '$4,650', impressions: '124K', clicks: 3720, ctr: '3.0%', cpc: '$1.25', conversions: 186, roas: '4.2x' },
    { platform: 'LinkedIn Ads', spend: '$8,880', impressions: '148K', clicks: 4440, ctr: '3.0%', cpc: '$2.00', conversions: 177, roas: '2.1x' },
    { platform: 'Facebook/IG Ads', spend: '$2,850', impressions: '95K', clicks: 2850, ctr: '3.0%', cpc: '$1.00', conversions: 114, roas: '3.5x' },
];

export const SOCIAL_ENGAGEMENT = {
    linkedin: { followers: 342, posts: 24, impressions: 42000, engagement: '4.5%', clicks: 1890, profileViews: 2840 },
    facebook: { followers: 128, posts: 12, impressions: 18000, engagement: '2.8%', clicks: 504, profileViews: 920 },
    instagram: { followers: 86, posts: 8, impressions: 12000, engagement: '3.2%', clicks: 384, profileViews: 640 },
};

export const EMAIL_METRICS = {
    campaigns: [
        { name: 'Welcome Sequence', sent: 420, opened: 252, openRate: '60.0%', clicked: 84, clickRate: '20.0%', unsubscribed: 2 },
        { name: 'Steel Capabilities', sent: 380, opened: 190, openRate: '50.0%', clicked: 57, clickRate: '15.0%', unsubscribed: 4 },
        { name: 'Toll Processing Intro', sent: 350, opened: 175, openRate: '50.0%', clicked: 52, clickRate: '15.0%', unsubscribed: 3 },
        { name: 'Facility Tour Invite', sent: 280, opened: 168, openRate: '60.0%', clicked: 56, clickRate: '20.0%', unsubscribed: 1 },
    ],
    totals: { sent: 4200, opened: 2520, openRate: '60.0%', clicked: 840, clickRate: '20.0%', unsubscribed: 14, unsubRate: '0.33%' },
};

export const KPI_SUMMARY = {
    totalSessions: 9800,
    uniqueVisitors: 6420,
    avgSessionDuration: '2:34',
    bounceRate: '38%',
    pagesPerSession: 3.8,
    conversionRate: '4.2%',
    totalConversions: 412,
    totalSpend: '$18,030',
    costPerConversion: '$43.76',
    pipelineInfluenced: '$3.9M',
};
