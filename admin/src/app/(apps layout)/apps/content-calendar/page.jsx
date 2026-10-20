"use client"
import { Card, Col, Container, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';

const PUBLICATIONS = [
    {
        name: 'FFJournal',
        type: 'Trade Magazine',
        focus: 'Fabricating, forming, stamping, finishing',
        url: 'ffjournal.net',
        frequency: 'Monthly',
        audience: 'Metal fabrication decision-makers, purchasing managers',
        pitchAngle: 'Solar-powered processing, Braner equipment showcase, West Coast capacity',
        contact: 'Editorial dept — submit via website',
        status: 'research',
    },
    {
        name: 'Modern Metals',
        type: 'Trade Magazine',
        focus: 'Service centers, metal processing, distribution',
        url: 'modernmetals.com',
        frequency: 'Monthly',
        audience: 'Service center executives, steel buyers, processors',
        pitchAngle: 'Green steel processing, solar operations, toll processing model advantages',
        contact: 'Editorial dept — submit via website',
        status: 'research',
    },
    {
        name: 'The Metals Directory',
        type: 'Industry Directory',
        focus: 'Steel & metals company listings and capabilities',
        url: 'themetalsdirectory.com',
        frequency: 'Ongoing',
        audience: 'Steel buyers searching for processors and distributors',
        pitchAngle: 'Complete capabilities listing, equipment specs, certifications',
        contact: 'Self-service listing submission',
        status: 'ready',
    },
    {
        name: 'Metal Center News',
        type: 'Trade Publication',
        focus: 'Service center industry news and trends',
        url: 'metalcenternews.com',
        frequency: 'Monthly',
        audience: 'Service center leadership, metals industry executives',
        pitchAngle: 'Company profile, solar investment, diversity-owned advantage',
        contact: 'Editorial submissions',
        status: 'research',
    },
    {
        name: 'MSCI Magazine',
        type: 'Association Publication',
        focus: 'Metals Service Center Institute members',
        url: 'msci.org',
        frequency: 'Quarterly',
        audience: 'MSCI members, service center executives',
        pitchAngle: 'Member spotlight, sustainability in steel processing',
        contact: 'Available through MSCI membership',
        status: 'planned',
    },
];

const CONTENT_CALENDAR = [
    {
        month: 'November 2026',
        articles: [
            {
                title: 'Solar-Powered Steel: How PTP Runs a 100K Sq Ft Facility on Sunshine',
                type: 'feature',
                target: 'PTP Blog → FFJournal pitch',
                angle: 'Sustainability story — solar panels powering heavy industrial operations, cost savings, environmental impact, how it differentiates PTP from competitors',
                status: 'draft',
                words: 1500,
            },
            {
                title: 'The Complete Guide to Steel Toll Processing on the West Coast',
                type: 'guide',
                target: 'PTP Blog → Modern Metals pitch',
                angle: 'Educational/SEO — what toll processing is, when to use it vs. buying from a service center, how to evaluate a toll processor, PTP capabilities woven in',
                status: 'planned',
                words: 2000,
            },
        ]
    },
    {
        month: 'December 2026',
        articles: [
            {
                title: '5 Things to Look for in a Multi-Blanking Operation',
                type: 'listicle',
                target: 'PTP Blog → FFJournal pitch',
                angle: 'Technical authority — blanking accuracy, edge quality, material handling, throughput, Braner equipment advantages. Positions PTP as the expert.',
                status: 'planned',
                words: 1200,
            },
            {
                title: 'Year in Review: Steel Processing Trends That Shaped 2026',
                type: 'analysis',
                target: 'PTP Blog → LinkedIn → Modern Metals',
                angle: 'Industry thought leadership — nearshoring, EV demand, data center boom, solar/green steel, tariff impacts. PTP perspective on each trend.',
                status: 'planned',
                words: 1800,
            },
        ]
    },
    {
        month: 'January 2027',
        articles: [
            {
                title: 'Why Data Center Builders Need a Local Steel Partner',
                type: 'feature',
                target: 'PTP Blog → Modern Metals → LinkedIn Ads',
                angle: 'Sector-specific — data center construction boom in the West, server rack steel specs, speed-to-market with local processing, PTP proximity advantage',
                status: 'planned',
                words: 1500,
            },
            {
                title: 'Precision Leveling: When Flatness Matters More Than You Think',
                type: 'technical',
                target: 'PTP Blog → FFJournal pitch',
                angle: 'Technical deep-dive — why flatness tolerance matters for downstream operations (laser cutting, press braking), how leveling works, PTP equipment specs',
                status: 'planned',
                words: 1400,
            },
        ]
    },
    {
        month: 'February 2027',
        articles: [
            {
                title: 'Inside the Facility: A Photo Tour of Pacific Toll Processing',
                type: 'visual',
                target: 'PTP Blog → Instagram → LinkedIn → Trade pub sidebars',
                angle: 'Visual storytelling — drone shots, production floor, Braner lines running, coils being processed, team at work. Supports all other content.',
                status: 'planned',
                words: 800,
            },
            {
                title: 'The EV Supply Chain Needs More Steel Processors — Here\'s Why',
                type: 'analysis',
                target: 'PTP Blog → Modern Metals → Metal Center News',
                angle: 'Market positioning — battery enclosures, EV body panels, charging infrastructure all need processed steel. West Coast demand vs. processor capacity.',
                status: 'planned',
                words: 1600,
            },
        ]
    },
    {
        month: 'March 2027',
        articles: [
            {
                title: 'MSCI Conference Recap: What We Learned About the Future of Service Centers',
                type: 'recap',
                target: 'PTP Blog → LinkedIn → MSCI Magazine pitch',
                angle: 'Event content — key takeaways, industry conversations, PTP presence, new connections. Timely and sharable.',
                status: 'planned',
                words: 1200,
            },
            {
                title: 'Steel Slitting 101: Tolerances, Equipment, and What Buyers Should Know',
                type: 'guide',
                target: 'PTP Blog → FFJournal pitch',
                angle: 'Evergreen SEO — comprehensive guide to slitting, how width tolerances work, edge conditions, Braner equipment capabilities. AI-findable.',
                status: 'planned',
                words: 2000,
            },
        ]
    },
    {
        month: 'April 2027',
        articles: [
            {
                title: 'Diversity in Steel: How Minority-Owned Processors Are Changing the Industry',
                type: 'feature',
                target: 'PTP Blog → Modern Metals → Metal Center News',
                angle: 'Diversity story — Rose\'s leadership, minority-owned certification advantage, supplier diversity programs at major OEMs, PTP positioned as the choice for companies with DEI procurement goals.',
                status: 'planned',
                words: 1800,
            },
            {
                title: 'Choosing Between Hot-Rolled and Cold-Rolled: A Buyer\'s Decision Guide',
                type: 'guide',
                target: 'PTP Blog → The Metals Directory → LinkedIn',
                angle: 'Educational/SEO — when to use HR vs CR, cost differences, surface finish, formability, common applications. Drives search traffic and AI discoverability.',
                status: 'planned',
                words: 1500,
            },
        ]
    },
];

const TYPE_COLORS = {
    feature: 'primary', guide: 'success', listicle: 'info', analysis: 'violet',
    technical: 'warning', visual: 'pumpkin', recap: 'teal',
};

const STATUS_LABELS = {
    draft: { label: 'Drafting', color: 'success' },
    planned: { label: 'Planned', color: 'warning' },
    pitched: { label: 'Pitched', color: 'info' },
    accepted: { label: 'Accepted', color: 'primary' },
    published: { label: 'Published', color: 'violet' },
    research: { label: 'Research', color: 'secondary' },
    ready: { label: 'Ready', color: 'success' },
};

const ContentCalendarPage = () => {
    const totalArticles = CONTENT_CALENDAR.reduce((sum, m) => sum + m.articles.length, 0);
    const totalWords = CONTENT_CALENDAR.reduce((sum, m) =>
        sum + m.articles.reduce((s, a) => s + a.words, 0), 0);

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div>
                    <h1 className="pg-title">Content Calendar &amp; Trade Publications</h1>
                    <p>{totalArticles} articles planned &middot; ~{(totalWords / 1000).toFixed(0)}K words &middot; Nov 2026 &ndash; Apr 2027</p>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* Publication Targets */}
                <h5 className="mb-3">Publication Targets</h5>
                <Row className="mb-5">
                    {PUBLICATIONS.map((pub, i) => (
                        <Col xl={4} md={6} key={i} className="mb-3">
                            <Card className="card-border mb-0 h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{pub.name}</h6>
                                        <HkBadge bg={STATUS_LABELS[pub.status]?.color || 'secondary'} soft size="sm">
                                            {STATUS_LABELS[pub.status]?.label || pub.status}
                                        </HkBadge>
                                    </div>
                                    <div className="fs-8 text-muted mb-2">{pub.type} &middot; {pub.frequency}</div>
                                    <div className="mb-2">
                                        <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Focus</div>
                                        <div className="fs-7">{pub.focus}</div>
                                    </div>
                                    <div className="mb-2">
                                        <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Audience</div>
                                        <div className="fs-7">{pub.audience}</div>
                                    </div>
                                    <div className="mb-2">
                                        <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Our Pitch Angle</div>
                                        <div className="fs-7">{pub.pitchAngle}</div>
                                    </div>
                                    <div className="fs-8 text-muted mt-2">{pub.url}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Content Calendar */}
                <h5 className="mb-3">Article Pipeline</h5>
                {CONTENT_CALENDAR.map((month, mi) => (
                    <div key={mi} className="mb-4">
                        <h6 className="text-primary mb-3">{month.month}</h6>
                        <Row>
                            {month.articles.map((article, ai) => (
                                <Col xl={6} key={ai} className="mb-3">
                                    <Card className="card-border mb-0 h-100">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <HkBadge bg={TYPE_COLORS[article.type] || 'secondary'} soft size="sm" className="text-capitalize">
                                                    {article.type}
                                                </HkBadge>
                                                <HkBadge bg={STATUS_LABELS[article.status]?.color || 'secondary'} soft size="sm">
                                                    {STATUS_LABELS[article.status]?.label || article.status}
                                                </HkBadge>
                                            </div>
                                            <h6 className="mb-2" style={{ fontSize: '.95rem', lineHeight: 1.4 }}>{article.title}</h6>
                                            <div className="mb-2">
                                                <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Distribution</div>
                                                <div className="fs-7">{article.target}</div>
                                            </div>
                                            <div className="mb-2">
                                                <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Angle</div>
                                                <div className="fs-7 text-muted">{article.angle}</div>
                                            </div>
                                            <div className="fs-8 text-muted">~{article.words.toLocaleString()} words</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}

                {/* Syndication Strategy */}
                <Card className="card-border mt-3 mb-4">
                    <Card.Header>
                        <h6 className="mb-0">Syndication Strategy</h6>
                    </Card.Header>
                    <Card.Body>
                        <Table responsive className="fs-7">
                            <thead>
                                <tr>
                                    <th>Step</th>
                                    <th>Action</th>
                                    <th>Timeline</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>1. Write</strong></td>
                                    <td>Publish full article on PTP website blog first (establishes canonical URL for SEO)</td>
                                    <td>Week 1</td>
                                </tr>
                                <tr>
                                    <td><strong>2. Pitch</strong></td>
                                    <td>Send article summary + link to trade pub editors with republication offer</td>
                                    <td>Week 2</td>
                                </tr>
                                <tr>
                                    <td><strong>3. Adapt</strong></td>
                                    <td>If accepted, adapt article to publication format/style guide, add their required elements</td>
                                    <td>Week 3</td>
                                </tr>
                                <tr>
                                    <td><strong>4. Amplify</strong></td>
                                    <td>Share published article on LinkedIn, email newsletter, link back from PTP site</td>
                                    <td>On publication</td>
                                </tr>
                                <tr>
                                    <td><strong>5. Repurpose</strong></td>
                                    <td>Pull stats, quotes, visuals into social posts, email content, sales collateral</td>
                                    <td>Ongoing</td>
                                </tr>
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default ContentCalendarPage;
