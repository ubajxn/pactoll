"use client"
import { Card, Col, Container, ProgressBar, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';

const CAMPAIGNS = [
    { name: 'Website Redesign', cat: 'website', timeline: 'Oct-Dec 2026', status: 'active', progress: 15,
      deliverables: 'New IA, RFQ form, steel sales pages, mobile responsive, SEO foundation',
      kpi: 'Launch by Dec 2; 500 monthly visitors by Jan; 10 RFQs/month' },
    { name: 'Google Business Profile', cat: 'listing', timeline: 'Oct 2026', status: 'ready', progress: 0,
      deliverables: 'Claim/verify profile, facility photos, service categories, hours',
      kpi: 'Profile live within 48 hrs; 5-star review campaign started' },
    { name: 'IQS Directory Listing', cat: 'listing', timeline: 'Oct 2026', status: 'ready', progress: 0,
      deliverables: 'Free listing with equipment specs, capabilities, certifications',
      kpi: 'Listing live; first inbound lead within 30 days' },
    { name: 'LinkedIn Company Page', cat: 'social', timeline: 'Oct-Nov 2026', status: 'active', progress: 5,
      deliverables: 'Page created, banner/about, 10 posts drafted, 3x/week cadence',
      kpi: '100 followers month 1; 500 by month 3; 2% engagement rate' },
    { name: 'Photography Library', cat: 'content', timeline: 'Oct-Nov 2026', status: 'planned', progress: 0,
      deliverables: '100+ web-optimized facility, equipment, team, product photos',
      kpi: 'Complete library by Nov 15; photos on website, social, directories' },
    { name: 'Drone Video Shoot', cat: 'content', timeline: 'Nov 2026', status: 'planned', progress: 0,
      deliverables: 'Aerial facility footage, production floor walkthroughs, Braner close-ups',
      kpi: 'Hero video (2 min); 10 short clips; website + social deployment' },
    { name: 'Instagram Launch', cat: 'social', timeline: 'Nov-Dec 2026', status: 'planned', progress: 0,
      deliverables: 'Profile, Reels from facility footage, ASMR steel content, 2x/week',
      kpi: '200 followers month 1; ASMR videos >1K views each' },
    { name: 'SteelOrbis Listing', cat: 'listing', timeline: 'Nov 2026', status: 'planned', progress: 0,
      deliverables: 'Paid listing with company profile, capabilities, certifications',
      kpi: 'Listing live; 5 profile views/week within 60 days' },
    { name: 'MSCI Membership', cat: 'event', timeline: 'Nov 2026', status: 'planned', progress: 0,
      deliverables: 'Membership application, conference registration for March',
      kpi: 'Application submitted; conference registered; networking list built' },
    { name: 'Constant Contact', cat: 'social', timeline: 'Dec 2026', status: 'planned', progress: 0,
      deliverables: 'Account setup, template design, contact list import, welcome sequence',
      kpi: 'First newsletter Dec; 25% open rate; 300 subscribers by Feb' },
    { name: 'ThomasNet Listing', cat: 'listing', timeline: 'Dec 2026', status: 'planned', progress: 0,
      deliverables: 'Company profile, capabilities, certifications, product categories',
      kpi: 'Listing live; 3 inbound leads within 90 days' },
    { name: 'LinkedIn Ad Campaign', cat: 'paid', timeline: 'Jan 2027', status: 'planned', progress: 0,
      deliverables: 'Targeted ads to purchasing managers at automotive/data center companies',
      kpi: '50K impressions; 500 clicks; 10 qualified leads; <$50 CPL' },
    { name: 'PTP Steel Sales Microsite', cat: 'website', timeline: 'Jan 2027', status: 'planned', progress: 0,
      deliverables: 'Dedicated product catalog, quote request flow, delivery calculator',
      kpi: '200 monthly visitors; 15 quote requests/month' },
    { name: 'Open House Event', cat: 'event', timeline: 'Feb 2027', status: 'planned', progress: 0,
      deliverables: 'Facility tours, Braner line demos, catered, 50-100 attendees, video recap',
      kpi: '75 attendees; 20 qualified prospects; 5 proposals within 30 days' },
    { name: 'Grand Tour Series', cat: 'content', timeline: 'Feb-Apr 2027', status: 'planned', progress: 0,
      deliverables: 'Truck camera road series, 3-4 episodes, customer stops along routes',
      kpi: '5K total views; 50 new followers; 3 customer spotlights' },
    { name: 'MSCI Steel Conference', cat: 'event', timeline: 'Mar 2027', status: 'planned', progress: 0,
      deliverables: 'Attend, network, collect competitor intel, distribute capability one-pagers',
      kpi: '25 business cards collected; 10 follow-up meetings; 3 proposals' },
    { name: 'FFJournal Outreach', cat: 'publication', timeline: 'Nov 2026', status: 'planned', progress: 0,
      deliverables: 'Editor intro, pitch 2 articles: solar-powered operations piece + West Coast capacity guide',
      kpi: 'Editorial contact established; 1 article accepted for Q1 2027 issue' },
    { name: 'Modern Metals Feature', cat: 'publication', timeline: 'Nov-Dec 2026', status: 'planned', progress: 0,
      deliverables: 'Pitch solar/green steel angle, supply facility photos, executive interview',
      kpi: 'Feature article or company profile in Q1-Q2 2027 issue' },
    { name: 'The Metals Directory Listing', cat: 'publication', timeline: 'Nov 2026', status: 'planned', progress: 0,
      deliverables: 'Complete company profile, capabilities matrix, equipment list, certifications',
      kpi: 'Full listing live; profile views tracked; inbound leads within 60 days' },
    { name: 'MSCI Metals Activity Report', cat: 'publication', timeline: 'Dec 2026', status: 'planned', progress: 0,
      deliverables: 'Submit data for industry report, build relationship with MSCI editorial',
      kpi: 'PTP cited in annual industry report; speaking opportunity at conference' },
    { name: 'Content Syndication Pipeline', cat: 'publication', timeline: 'Jan-Jun 2027', status: 'planned', progress: 0,
      deliverables: 'Monthly article published on PTP site, pitched to FFJournal/Modern Metals for republication',
      kpi: '6 articles written; 3 accepted for syndication; 2 published in trade pubs' },
];

const STATUS_COLORS = { active: 'success', ready: 'primary', planned: 'warning', complete: 'info' };
const CAT_LABELS = { website: 'Website', listing: 'Listing', social: 'Social', content: 'Content', paid: 'Paid Media', event: 'Event', publication: 'Trade Pub' };
const CAT_COLORS = { website: 'primary', listing: 'info', social: 'violet', content: 'pumpkin', paid: 'danger', event: 'success', publication: 'teal' };

const CampaignsPage = () => {
    const byCat = Object.keys(CAT_LABELS).map(k => ({
        key: k,
        label: CAT_LABELS[k],
        count: CAMPAIGNS.filter(c => c.cat === k).length,
        color: CAT_COLORS[k],
    }));

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">Campaign Manager</h1>
                        <p>{CAMPAIGNS.length} campaigns across {Object.keys(CAT_LABELS).length} channels &middot; Oct 2026 &ndash; Apr 2027</p>
                    </div>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* Channel Summary */}
                <Row className="mb-4">
                    {byCat.map(c => (
                        <Col xl={2} sm={4} xs={6} key={c.key} className="mb-3">
                            <Card className="card-border mb-0">
                                <Card.Body className="text-center py-3">
                                    <div className={`fs-3 fw-bold text-${c.color}`}>{c.count}</div>
                                    <div className="fs-8 text-muted">{c.label}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Campaign Cards */}
                <Row>
                    {CAMPAIGNS.map((c, i) => (
                        <Col xl={4} md={6} key={i} className="mb-4">
                            <Card className="card-border mb-0 h-100">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0">{c.name}</h6>
                                    <HkBadge bg={STATUS_COLORS[c.status] || 'secondary'} soft size="sm" className="text-capitalize">{c.status}</HkBadge>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-2">
                                        <HkBadge bg={CAT_COLORS[c.cat] || 'secondary'} soft size="sm">{CAT_LABELS[c.cat] || c.cat}</HkBadge>
                                        <span className="fs-8 text-muted">{c.timeline}</span>
                                    </div>
                                    {c.progress > 0 && (
                                        <ProgressBar variant="primary" now={c.progress} className="mb-3" style={{ height: '4px' }} />
                                    )}
                                    <div className="mb-2">
                                        <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Deliverables</div>
                                        <div className="fs-7">{c.deliverables}</div>
                                    </div>
                                    <div>
                                        <div className="fw-medium fs-8 text-uppercase text-muted mb-1">KPIs</div>
                                        <div className="fs-7">{c.kpi}</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </Container>
    );
};

export default CampaignsPage;
