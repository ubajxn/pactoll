export const CAMPAIGN_CATEGORIES = {
    website: { label: 'Website & SEO', icon: 'ri-global-line', color: 'primary' },
    social: { label: 'Social Media', icon: 'ri-share-line', color: 'info' },
    content: { label: 'Content & Video', icon: 'ri-video-line', color: 'warning' },
    directories: { label: 'Directory Listings', icon: 'ri-book-open-line', color: 'success' },
    events: { label: 'Events & Trade Shows', icon: 'ri-calendar-event-line', color: 'danger' },
    email: { label: 'Email Marketing', icon: 'ri-mail-send-line', color: 'violet' },
    publications: { label: 'Publications & PR', icon: 'ri-newspaper-line', color: 'dark' },
};

export const CAMPAIGN_STATUSES = {
    active: { label: 'Active', color: 'success' },
    planned: { label: 'Planned', color: 'primary' },
    draft: { label: 'Draft', color: 'secondary' },
    completed: { label: 'Completed', color: 'dark' },
    paused: { label: 'Paused', color: 'warning' },
};

export const CAMPAIGNS = [
    {
        slug: "website-redesign-launch",
        number: 1,
        name: "Website Redesign + Launch",
        category: "website",
        timeline: "Oct-Dec 2026",
        budget: "$8-12K",
        status: "active",
        deliverables: [
            "New information architecture",
            "RFQ form with gauge/width/grade fields",
            "Steel sales landing pages",
            "Equipment and capability pages",
            "Mobile-first responsive design",
            "SEO foundation (meta, sitemap, schema)"
        ],
        kpis: "2,000+ monthly visitors by Q1 2027, 5% RFQ conversion rate, sub-2s load time",
        actions: "Session 1 (Oct 22): Content audit + IA wireframes. Session 2: RFQ form build + sales page drafts. Session 3: Equipment/capability pages. Session 4: Mobile pass + SEO setup. Session 5: Review + launch prep. Target live by mid-December.",
    },
    {
        slug: "steel-sales-microsite",
        number: 2,
        name: "PTP Steel Sales Microsite",
        category: "website",
        timeline: "Jan 2027",
        budget: "$3-5K",
        status: "planned",
        deliverables: [
            "Dedicated steel sales experience",
            "Product catalog with specs",
            "Real-time inventory display concept",
            "Quote request flow",
            "Delivery calculator"
        ],
        kpis: "500+ monthly visitors, 8% quote request rate",
        actions: "Build as subdomain or section of main site after website launches. Focus on what buyers search for: gauge, width, grade, availability.",
    },
    {
        slug: "seo-optimization-program",
        number: 3,
        name: "SEO Optimization Program",
        category: "website",
        timeline: "Ongoing from Dec 2026",
        budget: "$1-2K/mo",
        status: "planned",
        deliverables: [
            "Keyword research (steel service center, flat rolled, toll processing CA)",
            "On-page optimization",
            "Google Business Profile optimization",
            "Local SEO for Carson/LA/SoCal",
            "Monthly ranking reports"
        ],
        kpis: "Page 1 for 'steel service center Carson CA', 'toll processing California', 'flat rolled steel SoCal'",
        actions: "Start SEO groundwork during website build. Hire SEO specialist by December. Monthly reporting cadence once site is live.",
    },
    {
        slug: "linkedin-company-page",
        number: 4,
        name: "LinkedIn Company Page Launch",
        category: "social",
        timeline: "Oct-Nov 2026",
        budget: "$500 setup",
        status: "active",
        deliverables: [
            "Company page with facility banner",
            "About section with capabilities",
            "First 10 posts (facility, equipment, team)",
            "Employee advocacy program",
            "Posting calendar (3x/week)"
        ],
        kpis: "500 followers by Jan 2027, 5% engagement rate, 50+ purchasing manager connections",
        actions: "Session 1 (Oct 22): Create page, write about section, upload banner. Session 2: Draft first 10 posts. Session 3: Start posting cadence + invite contacts.",
    },
    {
        slug: "linkedin-ads-automotive",
        number: 5,
        name: "LinkedIn Ad Campaign — Automotive",
        category: "social",
        timeline: "Jan-Mar 2027",
        budget: "$2-3K/mo",
        status: "planned",
        deliverables: [
            "Sponsored content targeting purchasing managers",
            "InMail campaign to 200 decision-makers",
            "Retargeting pixel on website",
            "Lead gen form ads"
        ],
        kpis: "200+ qualified impressions/day, 15+ leads/month, $50 cost per lead",
        actions: "Build audience: automotive OEMs and Tier 1 suppliers in CA/AZ. Create content series showing Braner line capabilities. Launch once website has retargeting pixel.",
    },
    {
        slug: "linkedin-ads-datacenters",
        number: 6,
        name: "LinkedIn Ad Campaign — Data Centers",
        category: "social",
        timeline: "Feb-Apr 2027",
        budget: "$2-3K/mo",
        status: "planned",
        deliverables: [
            "Targeted ads to data center construction managers",
            "Content on enclosure and rack steel supply",
            "Case studies from relevant projects",
            "Lead gen form integration"
        ],
        kpis: "150+ qualified impressions/day, 10+ leads/month",
        actions: "Build audience: data center builders, enclosure manufacturers, IT infrastructure companies in West Coast.",
    },
    {
        slug: "instagram-launch",
        number: 7,
        name: "Instagram Launch + Content",
        category: "social",
        timeline: "Nov-Dec 2026",
        budget: "$300/mo",
        status: "active",
        deliverables: [
            "Business profile with facility photos",
            "ASMR steel processing Reels",
            "Behind-the-scenes stories",
            "Equipment showcase posts",
            "Team spotlights"
        ],
        kpis: "300 followers by Q1 2027, 2 Reels/week, 1000+ views per Reel",
        actions: "Session 2-3: Create profile, upload existing facility photos. Start ASMR content after first on-site video session.",
    },
    {
        slug: "facebook-business-page",
        number: 8,
        name: "Facebook Business Page",
        category: "social",
        timeline: "Dec 2026",
        budget: "$200 setup",
        status: "draft",
        deliverables: [
            "Business page with facility info",
            "Cross-posted content from LinkedIn",
            "Review collection from existing clients",
            "Local community engagement"
        ],
        kpis: "100 followers, 10+ reviews",
        actions: "Lower priority. Set up once LinkedIn + Instagram are running. Cross-post content.",
    },
    {
        slug: "drone-ground-video-shoot",
        number: 9,
        name: "Drone + Ground Video Shoot",
        category: "content",
        timeline: "Nov 2026",
        budget: "$3-5K",
        status: "active",
        deliverables: [
            "Aerial facility footage (11-acre site)",
            "Production floor walkthroughs",
            "Braner line operation close-ups",
            "Rail spur and crane operations",
            "Team at work footage",
            "ASMR-style processing videos"
        ],
        kpis: "15+ video assets, 5+ social edits, 1 hero facility video (2 min)",
        actions: "Book drone operator (Brainerd or similar) for early November. Full-day shoot. Shot list from marketing calendar. Edit for web, social, and presentations.",
    },
    {
        slug: "photography-library",
        number: 10,
        name: "Photography Library Build",
        category: "content",
        timeline: "Oct-Nov 2026",
        budget: "$1-2K",
        status: "active",
        deliverables: [
            "Equipment photos (each crane, Braner line, slitters)",
            "Product photos (coil, slit coil, blanks)",
            "Facility exterior (scale, solar panels, signage)",
            "Team portraits and candids",
            "Before/after processing shots"
        ],
        kpis: "100+ photos, organized library, web-optimized versions",
        actions: "Start phone/camera shots immediately during Oct visits. Professional shoot aligned with drone day in November.",
    },
    {
        slug: "customer-spotlight-series",
        number: 11,
        name: "Customer Spotlight Series",
        category: "content",
        timeline: "Jan-Apr 2027",
        budget: "$500/video",
        status: "planned",
        deliverables: [
            "Video testimonials from long-term toll clients",
            "Written case studies for website",
            "Social media cut-downs",
            "Quote graphics for LinkedIn"
        ],
        kpis: "4 spotlights in first 6 months, 1 per quarter ongoing",
        actions: "Identify willing clients by December. Start scheduling visits in January once video gear and process is proven.",
    },
    {
        slug: "asmr-steel-content",
        number: 12,
        name: "ASMR Steel Content Series",
        category: "content",
        timeline: "Ongoing from Nov 2026",
        budget: "$200/mo",
        status: "active",
        deliverables: [
            "Slitting coil close-up videos",
            "Blanking operation sounds",
            "Crane movement footage",
            "Coil unwinding sequences",
            "Steel stacking and inventory shots"
        ],
        kpis: "2 videos/week, 5K+ views on top performers",
        actions: "Start capturing during any facility visit. Minimal editing — raw sound, close-up angles. Post to Instagram Reels, LinkedIn, YouTube Shorts.",
    },
    {
        slug: "iqs-directory",
        number: 13,
        name: "IQS Directory Listing",
        category: "directories",
        timeline: "Oct 2026",
        budget: "Free",
        status: "active",
        deliverables: [
            "Company profile with capabilities",
            "Facility photos",
            "Equipment list",
            "Contact information",
            "Service area definition"
        ],
        kpis: "Listing live by end of October, indexed by Google within 30 days",
        actions: "Session 1 (Oct 22): Submit listing with existing photos. Quick win — free and immediate SEO value.",
    },
    {
        slug: "steelorbis-listing",
        number: 14,
        name: "SteelOrbis Listing",
        category: "directories",
        timeline: "Nov 2026",
        budget: "$1-2K/yr",
        status: "planned",
        deliverables: [
            "Full company profile",
            "Product catalog listing",
            "Capability matrix",
            "Company news feed"
        ],
        kpis: "Listing live by mid-November, 50+ profile views/month",
        actions: "Contact SteelOrbis sales week 2. Submit company profile. Choose listing tier.",
    },
    {
        slug: "mcn-buyers-guide",
        number: 15,
        name: "Metal Center News Buyer's Guide",
        category: "directories",
        timeline: "Nov 2026",
        budget: "$1-3K/yr",
        status: "planned",
        deliverables: [
            "Annual Buyer's Guide listing",
            "Company profile in directory",
            "Category listings (flat-rolled, toll processing)",
            "Ad placement inquiry"
        ],
        kpis: "Listed in 2027 Buyer's Guide, ad placement consideration",
        actions: "Contact MCN advertising ASAP — Buyer's Guide deadlines may be approaching. Submit company data before deadline.",
    },
    {
        slug: "thomasnet-listing",
        number: 16,
        name: "ThomasNet Listing",
        category: "directories",
        timeline: "Dec 2026",
        budget: "$2-4K/yr",
        status: "planned",
        deliverables: [
            "Company profile",
            "Capability pages",
            "Product categories",
            "RFQ integration"
        ],
        kpis: "Listing live by December, 30+ RFQs/quarter from directory",
        actions: "Contact ThomasNet. Evaluate listing tiers. Focus on steel processing and distribution categories.",
    },
    {
        slug: "google-business-profile",
        number: 17,
        name: "Google Business Profile",
        category: "directories",
        timeline: "Oct 2026",
        budget: "Free",
        status: "active",
        deliverables: [
            "Claimed and verified profile",
            "Facility photos (exterior, interior, aerial)",
            "Complete service listing",
            "Hours, contact, directions",
            "Review collection system"
        ],
        kpis: "5-star rating with 10+ reviews by Jan 2027, appearing in 'steel near me' searches",
        actions: "Session 1 (Oct 22): Claim/verify profile, upload photos. Quick win — free, immediate local SEO impact.",
    },
    {
        slug: "yelp-business-profile",
        number: 18,
        name: "Yelp Business Profile",
        category: "directories",
        timeline: "Jan 2027",
        budget: "Free",
        status: "draft",
        deliverables: [
            "Claimed business profile",
            "Facility photos",
            "Service descriptions",
            "Review collection from clients"
        ],
        kpis: "Profile live, 5+ reviews",
        actions: "Claim profile. Upload photos. Request reviews from long-term toll clients.",
    },
    {
        slug: "msci-steel-conference",
        number: 19,
        name: "MSCI Steel Conference",
        category: "events",
        timeline: "March 2027",
        budget: "$8-12K",
        status: "planned",
        deliverables: [
            "Conference registration",
            "Networking strategy and target list",
            "Business card design",
            "Capability one-pager for distribution",
            "Post-event follow-up campaign",
            "Benchmarking data access"
        ],
        kpis: "25+ meaningful conversations, 10+ follow-up meetings, 5+ qualified leads",
        actions: "Register by November. Build target attendee list Dec-Jan. Business cards + capability sheet designed by February. Schedule meetings in advance.",
    },
    {
        slug: "ptp-open-house",
        number: 20,
        name: "PTP Open House",
        category: "events",
        timeline: "Feb 2027",
        budget: "$5-8K",
        status: "planned",
        deliverables: [
            "Event planning and logistics",
            "Invitation design and distribution (100+ invitations)",
            "Facility prep (signage, stations)",
            "Braner line live demo",
            "Catering",
            "Video crew for recap content",
            "Follow-up campaign for attendees"
        ],
        kpis: "50-100 attendees, 20+ new leads, 5+ deals initiated",
        actions: "Lock date by end of December. Start invitation design in January. Build invitation list from existing clients + target accounts. Hire caterer. Prep facility tour stations.",
    },
    {
        slug: "smu-steel-summit",
        number: 21,
        name: "SMU Steel Summit Evaluation",
        category: "events",
        timeline: "Aug 2027",
        budget: "$6-10K",
        status: "draft",
        deliverables: [
            "Conference evaluation",
            "Attendance decision by April",
            "Booth/sponsorship evaluation",
            "Travel arrangements"
        ],
        kpis: "Evaluate ROI potential, decision by April 2027",
        actions: "Research 2027 agenda and attendee profile. Compare cost vs. expected leads. Decision point: April 2027.",
    },
    {
        slug: "metalcon-evaluation",
        number: 22,
        name: "METALCON Evaluation",
        category: "events",
        timeline: "Oct 2027",
        budget: "$5-8K",
        status: "draft",
        deliverables: [
            "Conference evaluation for construction-focused leads",
            "Attendance decision by June"
        ],
        kpis: "Evaluate alignment with construction sector targets",
        actions: "Research 2027 agenda. Evaluate overlap with construction target accounts. Decision point: June 2027.",
    },
    {
        slug: "constant-contact-setup",
        number: 23,
        name: "Constant Contact Setup",
        category: "email",
        timeline: "Dec 2026",
        budget: "$100/mo",
        status: "planned",
        deliverables: [
            "Account setup",
            "Contact list import (existing clients + captured leads)",
            "Template design (branded to PTP)",
            "Welcome sequence (3 emails)",
            "Monthly newsletter template"
        ],
        kpis: "500+ contacts, 25%+ open rate, 5%+ click rate",
        actions: "Session 4-5: Sign up, import client list, design templates. Ready to send by website launch.",
    },
    {
        slug: "toll-client-cross-sell",
        number: 24,
        name: "Toll Client Cross-Sell Campaign",
        category: "email",
        timeline: "Jan 2027",
        budget: "$500",
        status: "planned",
        deliverables: [
            "'Did you know PTP sells steel?' email series",
            "Capability comparison one-pager",
            "Bundle pricing offer (toll + supply)",
            "Direct mail piece for top 20 accounts"
        ],
        kpis: "15% response rate from toll clients, 5+ new supply accounts from existing toll base",
        actions: "Segment toll client list. Identify clients buying steel from competitors. Build targeted messaging. Follow up by phone.",
    },
    {
        slug: "lead-nurture-sequence",
        number: 25,
        name: "Lead Nurture Email Sequence",
        category: "email",
        timeline: "Jan 2027",
        budget: "$200",
        status: "draft",
        deliverables: [
            "5-touch automated sequence for new leads",
            "Touch 1: Capability overview",
            "Touch 2: Facility showcase video",
            "Touch 3: Customer spotlight",
            "Touch 4: Competitive advantages",
            "Touch 5: RFQ invitation"
        ],
        kpis: "20% conversion to quote request, 10% conversion to meeting",
        actions: "Build in Constant Contact automation. Trigger on RFQ form submission or trade show lead capture. Test and optimize.",
    },
    {
        slug: "monthly-newsletter",
        number: 26,
        name: "Monthly Industry Newsletter",
        category: "email",
        timeline: "Feb 2027+",
        budget: "$100/mo",
        status: "draft",
        deliverables: [
            "Steel market commentary",
            "PTP news and updates",
            "New capability announcements",
            "Customer spotlight features",
            "Event invitations"
        ],
        kpis: "Monthly send, 25%+ open rate, growing subscriber list",
        actions: "Monthly cadence starting February. Content sourced from social media posts, market data, and company news.",
    },
    {
        slug: "modern-metals-ad",
        number: 27,
        name: "Modern Metals Ad Placement",
        category: "publications",
        timeline: "Q1 2027",
        budget: "$2-4K/issue",
        status: "draft",
        deliverables: [
            "Quarter-page ad in Metal Service Centers section",
            "Company spotlight copy",
            "Facility photo for ad",
            "Digital companion ad"
        ],
        kpis: "20K+ circulation reach, brand awareness in industry",
        actions: "Contact Modern Metals ad sales by November. Discuss Q1 placement. Design ad creative using new photography.",
    },
    {
        slug: "mcn-feature",
        number: 28,
        name: "Metal Center News Feature",
        category: "publications",
        timeline: "Q1-Q2 2027",
        budget: "$1-3K",
        status: "draft",
        deliverables: [
            "Buyer's Guide listing (already planned)",
            "Editorial pitch: 'Solar-powered steel service center'",
            "Annual Top 50 Service Center data submission"
        ],
        kpis: "Feature placement, Top 50 listing consideration",
        actions: "Pitch solar-powered facility angle to editor. Unique story: fully solar steel service center. Submit Top 50 data.",
    },
    {
        slug: "steel-times-international",
        number: 29,
        name: "Steel Times International Digital",
        category: "publications",
        timeline: "Q2 2027",
        budget: "$1-2K",
        status: "draft",
        deliverables: [
            "Digital banner ad",
            "Company profile in online directory",
            "Content partnership evaluation"
        ],
        kpis: "International visibility, 5K+ impressions/month",
        actions: "Evaluate digital ad options. Lower priority than domestic publications. Consider for Q2 if budget allows.",
    },
    {
        slug: "grand-tour-series",
        number: 30,
        name: "The Grand Tour — West Coast Road Trip Series",
        category: "content",
        timeline: "Jan-Apr 2027",
        budget: "$3-5K per episode",
        status: "planned",
        deliverables: [
            "Camera-equipped truck fleet capturing highway journey footage",
            "Episode routes: Carson to Phoenix, I-5 Carson to Portland, Carson to Denver via I-15/I-70",
            "Drone + dashcam + GoPro multi-angle production",
            "Road trip narrative — scenic West Coast footage paired with steel industry stops",
            "Destination arrival content — facility tours, loading dock footage, product in action",
            "6-8 episode series covering PTP's entire delivery territory",
            "YouTube series + social media cut-downs (30s/60s/90s reels)",
            "Behind-the-scenes crew content for Instagram Stories"
        ],
        kpis: "100K+ views across series, 10K+ YouTube subscribers, 500+ leads from territory visibility",
        actions: "Outfit 2 trucks with mounted cameras by December. Map routes to align with key customer/prospect visits. First episode: Carson to Phoenix corridor in January — hit Solar, Data Center, and Construction targets en route. Edit each episode to 8-12 minutes with social cuts.",
    },
    {
        slug: "vendor-spotlight-series",
        number: 31,
        name: "Vendor Spotlight — Customer Story Series",
        category: "content",
        timeline: "Dec 2026-May 2027",
        budget: "$1-2K per episode",
        status: "planned",
        deliverables: [
            "Customer testimonial video series — 'The Journey to...' format",
            "Full road trip capture from PTP Carson to customer facility",
            "Customer interview — their story, their craft, what they build with PTP steel",
            "In-facility footage — manufacturing floor, PTP steel being processed into finished products",
            "Association content — viewer sees the journey AND the destination",
            "Customer co-promotion — they share the video with their audience too",
            "Podcast-style audio version for long-form consumption",
            "Photo gallery from each visit for website case studies"
        ],
        kpis: "Build trust through authenticity, 5K+ views per episode, 3-5 new inbound leads per feature",
        actions: "Identify 6-8 willing customers by November. First episode in December — local SoCal customer for a quick proof-of-concept. Schedule remaining visits aligned with Grand Tour routes.",
    },
    {
        slug: "asmr-steel-social",
        number: 32,
        name: "ASMR Steel Processing Content",
        category: "social",
        timeline: "Nov 2026-Mar 2027",
        budget: "$500-1K/month",
        status: "active",
        deliverables: [
            "ASMR-style videos of PTP steel processing operations",
            "Close-up footage: coil unwinding, slitting blades cutting, shearing action, blanking presses",
            "Satisfying process content — steel peeling, stacking, banding",
            "TikTok/Instagram Reels format (15s-60s)",
            "Longer YouTube Shorts for full process captures",
            "Sound design: raw facility audio enhanced for ASMR effect",
            "Weekly posting schedule across platforms"
        ],
        kpis: "500K+ total impressions across platforms, viral potential, brand awareness beyond industry",
        actions: "Schedule monthly on-site filming sessions at PTP facility. Use high-quality lavalier + shotgun mic setup for rich audio capture. Focus on most visually satisfying operations: coil unwinding, precision slitting, stacking. Post 3-4x/week across TikTok, Instagram Reels, YouTube Shorts. Monitor engagement and double down on highest-performing content types.",
    },
];

export const CATEGORY_COUNTS = Object.keys(CAMPAIGN_CATEGORIES).reduce((acc, key) => {
    acc[key] = CAMPAIGNS.filter(c => c.category === key).length;
    return acc;
}, {});

export const STATUS_COUNTS = Object.keys(CAMPAIGN_STATUSES).reduce((acc, key) => {
    acc[key] = CAMPAIGNS.filter(c => c.status === key).length;
    return acc;
}, {});

export function getCampaignBySlug(slug) {
    return CAMPAIGNS.find(c => c.slug === slug);
}

export function getCampaignsByCategory(category) {
    return CAMPAIGNS.filter(c => c.category === category);
}

export function getCampaignsByStatus(status) {
    return CAMPAIGNS.filter(c => c.status === status);
}

export function getActiveCampaignCount() {
    return CAMPAIGNS.filter(c => c.status === 'active').length;
}
