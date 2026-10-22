"use client"
import { useState } from 'react';
import { Card, Col, Container, Row, Table, Badge, ProgressBar, Nav } from 'react-bootstrap';
import Image from 'next/image';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import ptpIcon from '@/assets/img/ptp-icon.svg';

const PRIORITY = {
    now:   { label: 'Now',   color: 'success', desc: 'Launch sprint — included in $8K setup' },
    next:  { label: 'Next',  color: 'primary', desc: 'Month 2-3 — covered by $3K/mo retainer' },
    later: { label: 'Later', color: 'secondary', desc: 'Month 4+ — unlocked as results come in' },
};

const deliverables = [
    { deliverable: 'Corporate Website', desc: 'Modern responsive site — services, steel catalog, contact forms, SEO foundation', priority: 'now', category: 'digital', est: '$3,000' },
    { deliverable: 'Google Business Profile', desc: 'Claim, optimize, photos, messaging, reviews — free listing, massive local SEO value', priority: 'now', category: 'digital', est: '$0' },
    { deliverable: 'LinkedIn Company Page', desc: 'Brand profile with banner, description, employee connections', priority: 'now', category: 'digital', est: '$0' },
    { deliverable: 'Brand Photography', desc: 'Facility photography session — equipment, process shots, team portraits', priority: 'now', category: 'content', est: '$800' },
    { deliverable: 'Industry Directory Listings', desc: 'IQS, MetalMiner, ThomasNet, MacRAE\'S — 6+ directories', priority: 'now', category: 'digital', est: '$400' },
    { deliverable: 'Email Welcome Sequence', desc: '4-email drip for new contacts (welcome, capabilities, facility, CTA)', priority: 'now', category: 'email', est: '$300' },
    { deliverable: 'Post Card Mailer — Wave 1', desc: '500 pieces to top Automotive & Battery targets with QR tracking', priority: 'now', category: 'direct', est: '$375' },
    { deliverable: 'Analytics & Reporting Setup', desc: 'Vercel Analytics, Google Analytics, dashboard, tracking codes', priority: 'now', category: 'analytics', est: '$200' },

    { deliverable: 'SEO Optimization Program', desc: 'Technical audit, keyword targeting, content pages, local SEO', priority: 'next', category: 'digital', est: '$800/mo' },
    { deliverable: 'Google Ads — Steel Processing', desc: 'Keyword campaigns for toll processing + steel sales queries', priority: 'next', category: 'paid', est: '$500/mo + ad spend' },
    { deliverable: 'LinkedIn Organic Content', desc: '2-3 posts/week — facility content, industry insights, team highlights', priority: 'next', category: 'social', est: '$400/mo' },
    { deliverable: 'Post Card Mailer — Wave 2', desc: '750 pieces to Data Center & Solar targets', priority: 'next', category: 'direct', est: '$562' },
    { deliverable: 'ASMR Factory Videos', desc: 'Satisfying steel processing videos — leveling, slitting, blanking. Organic reach play', priority: 'next', category: 'content', est: '$200/mo' },
    { deliverable: 'Email Nurture Campaigns', desc: 'Sector-specific sequences for engaged leads', priority: 'next', category: 'email', est: '$250/mo' },
    { deliverable: 'Competitive Monitoring', desc: 'Monthly tracking of 8 competitors\' digital presence and positioning', priority: 'next', category: 'analytics', est: 'included' },

    { deliverable: 'Steel Sales Microsite', desc: 'Product catalog with specs, inventory display, quote request flow', priority: 'later', category: 'digital', est: '$2,500' },
    { deliverable: 'LinkedIn Sponsored Content', desc: 'Paid ads targeting manufacturing decision-makers', priority: 'later', category: 'paid', est: '$1,500/mo + spend' },
    { deliverable: 'Facebook / Instagram Ads', desc: 'Awareness + retargeting campaigns for broader reach', priority: 'later', category: 'paid', est: '$1,000/mo + spend' },
    { deliverable: 'Post Card Mailer — Wave 3', desc: '1,000 pieces to Construction & Industrial targets', priority: 'later', category: 'direct', est: '$750' },
    { deliverable: 'METALCON Trade Show', desc: 'Booth materials, pre-show outreach, badge scanning, follow-up', priority: 'later', category: 'event', est: '$8,500' },
    { deliverable: 'Facility Open House Event', desc: 'Invite top 50 prospects for facility tour + lunch', priority: 'later', category: 'event', est: '$2,000' },
    { deliverable: 'Content Calendar (3x/week)', desc: 'Full social calendar across LinkedIn, Facebook, Instagram', priority: 'later', category: 'social', est: '$600/mo' },
];

const investmentStructure = {
    setup: {
        label: 'Launch Package (one-time)',
        amount: '$8,000',
        includes: [
            'Corporate website design + development',
            'Google Business Profile setup',
            'LinkedIn company page',
            'Brand photography session',
            'Directory listings (6+)',
            'Email welcome sequence',
            'Post card mailer — Wave 1 (500 pcs)',
            'Analytics + reporting infrastructure',
        ],
    },
    monthly: {
        label: 'Monthly Retainer',
        amount: '$3,000/mo',
        includes: [
            'SEO optimization + content',
            'Google Ads management (ad spend separate)',
            'LinkedIn organic content (2-3 posts/week)',
            'Email campaigns + list management',
            'ASMR video production',
            'Competitive monitoring',
            'Monthly performance reporting',
            'Strategy + campaign management',
        ],
    },
};

const projectedResults = [
    { metric: 'Website Monthly Visitors', month3: '1,200', month6: '3,500', note: 'From 0 today' },
    { metric: 'LinkedIn Followers', month3: '400', month6: '1,200', note: 'From 0 today' },
    { metric: 'Qualified Leads / Month', month3: '10', month6: '25', note: 'Form fills, calls, quote requests' },
    { metric: 'Pipeline Value Influenced', month3: '$800K', month6: '$2.5M', note: 'Across 205 target accounts' },
    { metric: 'Search Rankings', month3: 'Top 30', month6: 'Top 10', note: '"steel toll processing" + related' },
    { metric: 'Email List Size', month3: '500', month6: '1,800', note: 'Opted-in industry contacts' },
    { metric: 'Google Business Reviews', month3: '8', month6: '20+', note: 'Customer review program' },
];

const ProposalPage = () => {
    const [viewFilter, setViewFilter] = useState('all');

    const filtered = viewFilter === 'all' ? deliverables : deliverables.filter(d => d.priority === viewFilter);
    const nowCount = deliverables.filter(d => d.priority === 'now').length;
    const nextCount = deliverables.filter(d => d.priority === 'next').length;
    const laterCount = deliverables.filter(d => d.priority === 'later').length;

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <Image src={ptpIcon} alt="PTP" width={48} height={48} className="rounded" />
                    <div>
                        <h1 className="pg-title mb-0">Marketing Services Proposal</h1>
                        <p className="text-muted mb-0">Pacific Toll Processing &middot; Go-to-Market Program &middot; Starting Oct 22, 2026</p>
                    </div>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* Deal Structure */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="card-border mb-0 h-100 border-top border-success border-3">
                            <Card.Body className="text-center py-4">
                                <div className="fs-1 fw-bold text-success">$8,000</div>
                                <div className="fw-medium mb-1">Launch Package</div>
                                <div className="fs-8 text-muted">One-time setup &middot; Everything to go live</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="card-border mb-0 h-100 border-top border-primary border-3">
                            <Card.Body className="text-center py-4">
                                <div className="fs-1 fw-bold text-primary">$3,000</div>
                                <div className="fw-medium mb-1">Monthly Retainer</div>
                                <div className="fs-8 text-muted">Ongoing growth &middot; SEO, ads, content, reporting</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="card-border mb-0 h-100 border-top border-warning border-3">
                            <Card.Body className="text-center py-4">
                                <div className="fs-1 fw-bold text-warning">$2.5M</div>
                                <div className="fw-medium mb-1">Pipeline Target</div>
                                <div className="fs-8 text-muted">6-month goal &middot; 205 accounts &middot; 9 sectors</div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Executive Summary */}
                <Card className="card-border mb-4">
                    <Card.Body className="py-4">
                        <h5 className="mb-3">The Situation</h5>
                        <p className="mb-3">
                            PTP has zero digital presence today — no website, no social media, no search visibility, no online lead generation.
                            Competitors like Metals USA, Alliance Steel, and Reliance Steel are already out there with websites, LinkedIn pages, and paid ads.
                        </p>
                        <p className="mb-0">
                            This program gets PTP online fast, starts generating leads immediately, and scales up as results prove out.
                            Everything is prioritized into <Badge bg="success">Now</Badge> <Badge bg="primary">Next</Badge> <Badge bg="secondary">Later</Badge> —
                            nothing gets dropped, it just gets scheduled when the time is right.
                        </p>
                    </Card.Body>
                </Card>

                {/* The Problem — compact */}
                <Card className="card-border mb-4 border-top border-danger border-3">
                    <Card.Body>
                        <h5 className="mb-3">PTP vs. Competitors: The Digital Gap</h5>
                        <Row>
                            <Col md={6}>
                                <h6 className="text-danger mb-2">PTP Today (0 of 8 channels)</h6>
                                <ul className="list-unstyled">
                                    {['No website', 'No Google Business listing', 'No LinkedIn page', 'No social media', 'No directory listings', 'No email marketing', 'No paid advertising', 'No content marketing'].map((item, i) => (
                                        <li key={i} className="d-flex align-items-center gap-2 mb-1">
                                            <i className="ri-close-circle-fill text-danger" /> <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Col>
                            <Col md={6}>
                                <h6 className="text-success mb-2">Competitor Average</h6>
                                <ul className="list-unstyled">
                                    {[
                                        { item: '75% have websites', pct: 75 },
                                        { item: '80% on Google Business', pct: 80 },
                                        { item: '70% on LinkedIn', pct: 70 },
                                        { item: '50% active on social', pct: 50 },
                                        { item: '82% in directories', pct: 82 },
                                        { item: '40% doing email', pct: 40 },
                                        { item: '55% at trade shows', pct: 55 },
                                        { item: '25% creating content', pct: 25 },
                                    ].map((c, i) => (
                                        <li key={i} className="mb-2">
                                            <div className="d-flex justify-content-between fs-8 mb-1">
                                                <span>{c.item}</span>
                                                <span className="fw-medium">{c.pct}%</span>
                                            </div>
                                            <ProgressBar variant="success" now={c.pct} style={{ height: 4 }} />
                                        </li>
                                    ))}
                                </ul>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Deliverables with Priority Filter */}
                <Card className="card-border mb-4">
                    <Card.Header className="card-header-action">
                        <h5 className="mb-0">Full Scope of Work</h5>
                        <div className="d-flex gap-2">
                            <Badge
                                bg={viewFilter === 'all' ? 'dark' : 'soft-dark'}
                                className={`cursor-pointer px-3 py-2 ${viewFilter === 'all' ? '' : 'text-dark'}`}
                                onClick={() => setViewFilter('all')}
                            >All ({deliverables.length})</Badge>
                            {Object.entries(PRIORITY).map(([key, p]) => {
                                const count = deliverables.filter(d => d.priority === key).length;
                                return (
                                    <Badge
                                        key={key}
                                        bg={viewFilter === key ? p.color : `soft-${p.color}`}
                                        className={`cursor-pointer px-3 py-2 ${viewFilter === key ? '' : `text-${p.color}`}`}
                                        onClick={() => setViewFilter(viewFilter === key ? 'all' : key)}
                                    >{p.label} ({count})</Badge>
                                );
                            })}
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th style={{ width: '5%' }} className="text-center">#</th>
                                    <th style={{ width: '25%' }}>Deliverable</th>
                                    <th>Description</th>
                                    <th style={{ width: '12%' }} className="text-end">Est. Cost</th>
                                    <th style={{ width: '10%' }} className="text-center">When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((d, i) => {
                                    const p = PRIORITY[d.priority];
                                    return (
                                        <tr key={i} className={d.priority === 'later' ? 'opacity-75' : ''}>
                                            <td className="text-center text-muted">{i + 1}</td>
                                            <td className="fw-medium">{d.deliverable}</td>
                                            <td className="text-muted fs-8">{d.desc}</td>
                                            <td className="text-end fs-8">{d.est}</td>
                                            <td className="text-center">
                                                <HkBadge bg={p.color} soft size="sm">{p.label}</HkBadge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Card.Body>
                    <Card.Footer className="fs-8 text-muted">
                        <i className="ri-information-line me-1" />
                        <strong>Now</strong> = included in $8K launch &nbsp;|&nbsp;
                        <strong>Next</strong> = covered by $3K/mo retainer &nbsp;|&nbsp;
                        <strong>Later</strong> = unlocked as results come in, or tabled until ready
                    </Card.Footer>
                </Card>

                {/* Investment Breakdown */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="card-border mb-0 h-100 border-top border-success border-3">
                            <Card.Header><h6 className="mb-0">{investmentStructure.setup.label}</h6></Card.Header>
                            <Card.Body>
                                <div className="fs-2 fw-bold text-success mb-3">{investmentStructure.setup.amount}</div>
                                <ul className="list-unstyled mb-0">
                                    {investmentStructure.setup.includes.map((item, i) => (
                                        <li key={i} className="d-flex align-items-start gap-2 mb-2 fs-7">
                                            <i className="ri-checkbox-circle-fill text-success mt-1 fs-8" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="card-border mb-0 h-100 border-top border-primary border-3">
                            <Card.Header><h6 className="mb-0">{investmentStructure.monthly.label}</h6></Card.Header>
                            <Card.Body>
                                <div className="fs-2 fw-bold text-primary mb-3">{investmentStructure.monthly.amount}</div>
                                <ul className="list-unstyled mb-0">
                                    {investmentStructure.monthly.includes.map((item, i) => (
                                        <li key={i} className="d-flex align-items-start gap-2 mb-2 fs-7">
                                            <i className="ri-checkbox-circle-fill text-primary mt-1 fs-8" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 6-Month Cost at a Glance */}
                <Card className="card-border mb-4">
                    <Card.Body className="py-3">
                        <Row className="align-items-center text-center">
                            <Col md={3}>
                                <div className="fs-8 text-muted">Launch</div>
                                <div className="fs-4 fw-bold">$8,000</div>
                            </Col>
                            <Col md={1} className="fs-4 text-muted d-none d-md-block">+</Col>
                            <Col md={3}>
                                <div className="fs-8 text-muted">5 months &times; $3,000</div>
                                <div className="fs-4 fw-bold">$15,000</div>
                            </Col>
                            <Col md={1} className="fs-4 text-muted d-none d-md-block">=</Col>
                            <Col md={4}>
                                <div className="fs-8 text-muted">6-Month Total</div>
                                <div className="fs-3 fw-bold text-primary">$23,000</div>
                                <div className="fs-8 text-muted">Ad spend additional at cost, no markup</div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Projected Results */}
                <Card className="card-border mb-4 border-top border-success border-3">
                    <Card.Header><h5 className="mb-0">Projected Results</h5></Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive className="mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Metric</th>
                                    <th className="text-end">Month 3</th>
                                    <th className="text-end">Month 6</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectedResults.map((r, i) => (
                                    <tr key={i}>
                                        <td className="fw-medium">{r.metric}</td>
                                        <td className="text-end">{r.month3}</td>
                                        <td className="text-end fw-bold text-success">{r.month6}</td>
                                        <td className="text-muted fs-8">{r.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* What PTP Gets */}
                <Card className="card-border mb-4">
                    <Card.Header><h5 className="mb-0">What PTP Gets</h5></Card.Header>
                    <Card.Body>
                        <Row>
                            {[
                                { icon: 'ri-global-line', color: 'primary', title: 'Complete Digital Presence', desc: 'Professional website, Google Business, LinkedIn, directories — all from zero' },
                                { icon: 'ri-line-chart-line', color: 'success', title: 'Full Analytics Dashboard', desc: 'Real-time tracking of every channel — visible from this admin suite' },
                                { icon: 'ri-target-line', color: 'info', title: '205 Target Accounts', desc: 'Systematic outreach across 9 industrial sectors' },
                                { icon: 'ri-spy-line', color: 'danger', title: 'Competitive Intelligence', desc: 'Ongoing monitoring of 8 competitors\' digital presence' },
                                { icon: 'ri-mail-send-line', color: 'warning', title: 'Multi-Channel Outreach', desc: 'Post cards, email, ads, social, SEO — all tracked' },
                                { icon: 'ri-shield-check-line', color: 'teal', title: 'Owned Infrastructure', desc: 'PTP owns everything built. No vendor lock-in.' },
                            ].map((item, i) => (
                                <Col xl={4} md={6} key={i} className="mb-4">
                                    <div className="d-flex gap-3">
                                        <i className={`${item.icon} fs-2 text-${item.color}`} />
                                        <div>
                                            <h6 className="mb-1">{item.title}</h6>
                                            <p className="fs-8 text-muted mb-0">{item.desc}</p>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>

                {/* Terms */}
                <Card className="card-border mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <h6>Terms</h6>
                                <ul className="fs-8 text-muted">
                                    <li>$8,000 launch package, then $3,000/month</li>
                                    <li>Ad spend billed at cost, no markup</li>
                                    <li>Monthly performance review and optimization</li>
                                    <li>All assets owned by PTP upon creation</li>
                                    <li>30-day notice to adjust scope or pause</li>
                                    <li>&quot;Later&quot; items move to &quot;Next&quot; when ready — nothing gets lost</li>
                                </ul>
                            </Col>
                            <Col md={6}>
                                <h6>Next Steps</h6>
                                <ol className="fs-8 text-muted">
                                    <li>Approve this proposal</li>
                                    <li>Sign engagement agreement</li>
                                    <li>Kick-off — Oct 22, 2026</li>
                                    <li>Website goes live — Week 2</li>
                                    <li>First post cards mailed — Week 3</li>
                                    <li>Google Ads live — Month 2</li>
                                </ol>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="text-center py-5">
                    <p className="text-muted fs-8 mb-1">Prepared for Pacific Toll Processing</p>
                    <p className="text-muted fs-8 mb-0">Proposal #PTP-2026-001 &middot; Valid through November 15, 2026</p>
                </div>
            </div>
        </Container>
    );
};

export default ProposalPage;
