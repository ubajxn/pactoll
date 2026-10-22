export const CAMPAIGN_CATEGORIES: Record<
  string,
  { label: string; color: string }
> = {
  website: { label: "Website & SEO", color: "text-blue-600 dark:text-blue-400" },
  social: { label: "Social Media", color: "text-sky-600 dark:text-sky-400" },
  content: { label: "Content & Video", color: "text-emerald-600 dark:text-emerald-400" },
  directories: { label: "Directory Listings", color: "text-violet-600 dark:text-violet-400" },
  events: { label: "Events & Trade Shows", color: "text-orange-600 dark:text-orange-400" },
  email: { label: "Email Marketing", color: "text-amber-600 dark:text-amber-400" },
  publications: { label: "Publications & PR", color: "text-rose-600 dark:text-rose-400" },
};

export interface Campaign {
  slug: string;
  number: number;
  name: string;
  category: string;
  timeline: string;
  budget: string;
  status: string;
  deliverables: string[];
  kpis: string;
  actions: string;
}

export const CAMPAIGN_STATUSES: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  planned: { label: "Planned", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  completed: { label: "Completed", color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400" },
  paused: { label: "Paused", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
};

export const CAMPAIGNS: Campaign[] = [
  { slug: "website-redesign-launch", number: 1, name: "Website Redesign + Launch", category: "website", timeline: "Oct-Dec 2026", budget: "$8-12K", status: "active", deliverables: ["New information architecture", "RFQ form with gauge/width/grade fields", "Steel sales landing pages", "Equipment and capability pages", "Mobile-first responsive design", "SEO foundation (meta, sitemap, schema)"], kpis: "2,000+ monthly visitors by Q1 2027, 5% RFQ conversion rate, sub-2s load time", actions: "Session 1 (Oct 22): Content audit + IA wireframes. Target live by mid-December." },
  { slug: "steel-sales-microsite", number: 2, name: "PTP Steel Sales Microsite", category: "website", timeline: "Jan 2027", budget: "$3-5K", status: "planned", deliverables: ["Dedicated steel sales experience", "Product catalog with specs", "Real-time inventory display concept", "Quote request flow", "Delivery calculator"], kpis: "500+ monthly visitors, 8% quote request rate", actions: "Build as subdomain or section of main site after website launches." },
  { slug: "seo-optimization-program", number: 3, name: "SEO Optimization Program", category: "website", timeline: "Ongoing from Dec 2026", budget: "$1-2K/mo", status: "planned", deliverables: ["Keyword research", "On-page optimization", "Google Business Profile optimization", "Local SEO for Carson/LA/SoCal", "Monthly ranking reports"], kpis: "Page 1 for 'steel service center Carson CA', 'toll processing California'", actions: "Start SEO groundwork during website build. Hire SEO specialist by December." },
  { slug: "linkedin-company-page", number: 4, name: "LinkedIn Company Page Launch", category: "social", timeline: "Oct-Nov 2026", budget: "$500 setup", status: "active", deliverables: ["Company page with facility banner", "About section with capabilities", "First 10 posts", "Employee advocacy program", "Posting calendar (3x/week)"], kpis: "500 followers by Jan 2027, 5% engagement rate", actions: "Create page, write about section, upload banner. Draft first 10 posts." },
  { slug: "linkedin-ads-automotive", number: 5, name: "LinkedIn Ad Campaign — Automotive", category: "social", timeline: "Jan-Mar 2027", budget: "$2-3K/mo", status: "planned", deliverables: ["Sponsored content targeting purchasing managers", "InMail campaign to 200 decision-makers", "Retargeting pixel on website", "Lead gen form ads"], kpis: "200+ qualified impressions/day, 15+ leads/month, $50 cost per lead", actions: "Build audience: automotive OEMs and Tier 1 suppliers in CA/AZ." },
  { slug: "linkedin-ads-datacenters", number: 6, name: "LinkedIn Ad Campaign — Data Centers", category: "social", timeline: "Feb-Apr 2027", budget: "$2-3K/mo", status: "planned", deliverables: ["Targeted ads to data center construction managers", "Content on enclosure and rack steel supply", "Case studies", "Lead gen form integration"], kpis: "150+ qualified impressions/day, 10+ leads/month", actions: "Build audience: data center builders, enclosure manufacturers." },
  { slug: "instagram-launch", number: 7, name: "Instagram Launch + Content", category: "social", timeline: "Nov-Dec 2026", budget: "$300/mo", status: "active", deliverables: ["Business profile with facility photos", "ASMR steel processing Reels", "Behind-the-scenes stories", "Equipment showcase posts", "Team spotlights"], kpis: "300 followers by Q1 2027, 2 Reels/week, 1000+ views per Reel", actions: "Create profile, upload existing facility photos. Start ASMR content." },
  { slug: "facebook-business-page", number: 8, name: "Facebook Business Page", category: "social", timeline: "Dec 2026", budget: "$200 setup", status: "draft", deliverables: ["Business page with facility info", "Cross-posted content from LinkedIn", "Review collection", "Local community engagement"], kpis: "100 followers, 10+ reviews", actions: "Lower priority. Set up once LinkedIn + Instagram are running." },
  { slug: "drone-ground-video-shoot", number: 9, name: "Drone + Ground Video Shoot", category: "content", timeline: "Nov 2026", budget: "$3-5K", status: "active", deliverables: ["Aerial facility footage (11-acre site)", "Production floor walkthroughs", "Braner line operation close-ups", "Rail spur and crane operations", "ASMR-style processing videos"], kpis: "15+ video assets, 5+ social edits, 1 hero facility video (2 min)", actions: "Book drone operator for early November. Full-day shoot." },
  { slug: "photography-library", number: 10, name: "Photography Library Build", category: "content", timeline: "Oct-Nov 2026", budget: "$1-2K", status: "active", deliverables: ["Equipment photos", "Product photos (coil, slit coil, blanks)", "Facility exterior", "Team portraits and candids", "Before/after processing shots"], kpis: "100+ photos, organized library, web-optimized versions", actions: "Start phone/camera shots during Oct visits. Professional shoot with drone day." },
  { slug: "customer-spotlight-series", number: 11, name: "Customer Spotlight Series", category: "content", timeline: "Jan-Apr 2027", budget: "$500/video", status: "planned", deliverables: ["Video testimonials from long-term toll clients", "Written case studies for website", "Social media cut-downs", "Quote graphics for LinkedIn"], kpis: "4 spotlights in first 6 months", actions: "Identify willing clients by December. Start scheduling visits in January." },
  { slug: "asmr-steel-content", number: 12, name: "ASMR Steel Content Series", category: "content", timeline: "Ongoing from Nov 2026", budget: "$200/mo", status: "active", deliverables: ["Slitting coil close-up videos", "Blanking operation sounds", "Crane movement footage", "Coil unwinding sequences", "Steel stacking and inventory shots"], kpis: "2 videos/week, 5K+ views on top performers", actions: "Start capturing during any facility visit. Minimal editing." },
  { slug: "iqs-directory", number: 13, name: "IQS Directory Listing", category: "directories", timeline: "Oct 2026", budget: "Free", status: "active", deliverables: ["Company profile with capabilities", "Facility photos", "Equipment list", "Contact information", "Service area definition"], kpis: "Listing live by end of October, indexed by Google within 30 days", actions: "Submit listing with existing photos. Quick win." },
  { slug: "steelorbis-listing", number: 14, name: "SteelOrbis Listing", category: "directories", timeline: "Nov 2026", budget: "$1-2K/yr", status: "planned", deliverables: ["Full company profile", "Product catalog listing", "Capability matrix", "Company news feed"], kpis: "Listing live by mid-November, 50+ profile views/month", actions: "Contact SteelOrbis sales week 2." },
  { slug: "mcn-buyers-guide", number: 15, name: "Metal Center News Buyer's Guide", category: "directories", timeline: "Nov 2026", budget: "$1-3K/yr", status: "planned", deliverables: ["Annual Buyer's Guide listing", "Company profile in directory", "Category listings", "Ad placement inquiry"], kpis: "Listed in 2027 Buyer's Guide", actions: "Contact MCN advertising ASAP." },
  { slug: "thomasnet-listing", number: 16, name: "ThomasNet Listing", category: "directories", timeline: "Dec 2026", budget: "$2-4K/yr", status: "planned", deliverables: ["Company profile", "Capability pages", "Product categories", "RFQ integration"], kpis: "Listing live by December, 30+ RFQs/quarter", actions: "Contact ThomasNet. Evaluate listing tiers." },
  { slug: "google-business-profile", number: 17, name: "Google Business Profile", category: "directories", timeline: "Oct 2026", budget: "Free", status: "active", deliverables: ["Claimed and verified profile", "Facility photos", "Complete service listing", "Hours, contact, directions", "Review collection system"], kpis: "5-star rating with 10+ reviews by Jan 2027", actions: "Claim/verify profile, upload photos. Quick win." },
  { slug: "yelp-business-profile", number: 18, name: "Yelp Business Profile", category: "directories", timeline: "Jan 2027", budget: "Free", status: "draft", deliverables: ["Claimed business profile", "Facility photos", "Service descriptions", "Review collection"], kpis: "Profile live, 5+ reviews", actions: "Claim profile. Upload photos." },
  { slug: "msci-steel-conference", number: 19, name: "MSCI Steel Conference", category: "events", timeline: "March 2027", budget: "$8-12K", status: "planned", deliverables: ["Conference registration", "Networking strategy and target list", "Business card design", "Capability one-pager", "Post-event follow-up campaign"], kpis: "25+ conversations, 10+ follow-up meetings, 5+ qualified leads", actions: "Register by November. Build target attendee list Dec-Jan." },
  { slug: "ptp-open-house", number: 20, name: "PTP Open House", category: "events", timeline: "Feb 2027", budget: "$5-8K", status: "planned", deliverables: ["Event planning and logistics", "Invitation design (100+ invitations)", "Facility prep", "Braner line live demo", "Catering", "Video crew for recap", "Follow-up campaign"], kpis: "50-100 attendees, 20+ new leads, 5+ deals initiated", actions: "Lock date by end of December. Start invitation design in January." },
  { slug: "smu-steel-summit", number: 21, name: "SMU Steel Summit Evaluation", category: "events", timeline: "Aug 2027", budget: "$6-10K", status: "draft", deliverables: ["Conference evaluation", "Attendance decision by April", "Booth/sponsorship evaluation"], kpis: "Evaluate ROI potential, decision by April 2027", actions: "Research 2027 agenda and attendee profile." },
  { slug: "metalcon-evaluation", number: 22, name: "METALCON Evaluation", category: "events", timeline: "Oct 2027", budget: "$5-8K", status: "draft", deliverables: ["Conference evaluation for construction-focused leads", "Attendance decision by June"], kpis: "Evaluate alignment with construction sector targets", actions: "Research 2027 agenda. Decision point: June 2027." },
  { slug: "constant-contact-setup", number: 23, name: "Constant Contact Setup", category: "email", timeline: "Dec 2026", budget: "$100/mo", status: "planned", deliverables: ["Account setup", "Contact list import", "Template design (branded to PTP)", "Welcome sequence (3 emails)", "Monthly newsletter template"], kpis: "500+ contacts, 25%+ open rate, 5%+ click rate", actions: "Sign up, import client list, design templates." },
  { slug: "toll-client-cross-sell", number: 24, name: "Toll Client Cross-Sell Campaign", category: "email", timeline: "Jan 2027", budget: "$500", status: "planned", deliverables: ["'Did you know PTP sells steel?' email series", "Capability comparison one-pager", "Bundle pricing offer", "Direct mail piece for top 20 accounts"], kpis: "15% response rate, 5+ new supply accounts", actions: "Segment toll client list. Identify clients buying steel from competitors." },
  { slug: "lead-nurture-sequence", number: 25, name: "Lead Nurture Email Sequence", category: "email", timeline: "Jan 2027", budget: "$200", status: "draft", deliverables: ["5-touch automated sequence for new leads"], kpis: "20% conversion to quote request, 10% conversion to meeting", actions: "Build in Constant Contact automation." },
  { slug: "monthly-newsletter", number: 26, name: "Monthly Industry Newsletter", category: "email", timeline: "Feb 2027+", budget: "$100/mo", status: "draft", deliverables: ["Steel market commentary", "PTP news and updates", "New capability announcements", "Customer spotlight features", "Event invitations"], kpis: "Monthly send, 25%+ open rate", actions: "Monthly cadence starting February." },
  { slug: "modern-metals-ad", number: 27, name: "Modern Metals Ad Placement", category: "publications", timeline: "Q1 2027", budget: "$2-4K/issue", status: "draft", deliverables: ["Quarter-page ad in Metal Service Centers section", "Company spotlight copy", "Facility photo for ad", "Digital companion ad"], kpis: "20K+ circulation reach", actions: "Contact Modern Metals ad sales by November." },
  { slug: "mcn-feature", number: 28, name: "Metal Center News Feature", category: "publications", timeline: "Q1-Q2 2027", budget: "$1-3K", status: "draft", deliverables: ["Buyer's Guide listing", "Editorial pitch: 'Solar-powered steel service center'", "Annual Top 50 Service Center data submission"], kpis: "Feature placement, Top 50 listing consideration", actions: "Pitch solar-powered facility angle to editor." },
  { slug: "steel-times-international", number: 29, name: "Steel Times International Digital", category: "publications", timeline: "Q2 2027", budget: "$1-2K", status: "draft", deliverables: ["Digital banner ad", "Company profile in online directory", "Content partnership evaluation"], kpis: "International visibility, 5K+ impressions/month", actions: "Evaluate digital ad options. Lower priority." },
  { slug: "grand-tour-series", number: 30, name: "The Grand Tour — West Coast Road Trip Series", category: "content", timeline: "Jan-Apr 2027", budget: "$3-5K per episode", status: "planned", deliverables: ["Camera-equipped truck fleet footage", "6-8 episode series covering PTP delivery territory", "YouTube series + social media cut-downs", "Behind-the-scenes crew content"], kpis: "100K+ views across series, 10K+ YouTube subscribers, 500+ leads", actions: "Outfit 2 trucks with mounted cameras by December. First episode: Carson to Phoenix corridor in January." },
  { slug: "vendor-spotlight-series", number: 31, name: "Vendor Spotlight — Customer Story Series", category: "content", timeline: "Dec 2026-May 2027", budget: "$1-2K per episode", status: "planned", deliverables: ["Customer testimonial video series", "Full road trip capture from PTP to customer facility", "Customer interview", "Podcast-style audio version", "Photo gallery for website case studies"], kpis: "Build trust through authenticity, 5K+ views per episode, 3-5 new inbound leads per feature", actions: "Identify 6-8 willing customers by November. First episode in December." },
  { slug: "asmr-steel-social", number: 32, name: "ASMR Steel Processing Content", category: "social", timeline: "Nov 2026-Mar 2027", budget: "$500-1K/month", status: "active", deliverables: ["ASMR-style videos of PTP steel processing", "TikTok/Instagram Reels format", "YouTube Shorts for full process captures", "Weekly posting schedule"], kpis: "500K+ total impressions, viral potential, brand awareness beyond industry", actions: "Schedule monthly on-site filming. Post 3-4x/week across platforms." },
];

export function getCampaignsByCategory(cat: string) {
  return CAMPAIGNS.filter((c) => c.category === cat);
}

export function getCampaignsByStatus(status: string) {
  return CAMPAIGNS.filter((c) => c.status === status);
}

export function getStatusCounts() {
  const counts: Record<string, number> = {};
  for (const c of CAMPAIGNS) {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  }
  return counts;
}

export function getCategoryCounts() {
  const counts: Record<string, number> = {};
  for (const c of CAMPAIGNS) {
    counts[c.category] = (counts[c.category] ?? 0) + 1;
  }
  return counts;
}
