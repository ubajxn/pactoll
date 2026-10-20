"use client"
import Link from 'next/link';
import { Card, Col, Container, Nav, ProgressBar, Row, Tab, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { Target, Speakerphone, TrendingUp, Calendar, ExternalLink } from 'tabler-icons-react';
import { TARGET_ACCOUNTS, PIPELINE_STAGES, getAccountsByStage } from '@/data/targets/target-data';

const STATS = [
    { label: 'Target Accounts', value: '203', change: '+12', icon: <Target size={20} />, color: 'primary', href: '/apps/targets' },
    { label: 'Active Campaigns', value: '32', change: '+5', icon: <Speakerphone size={20} />, color: 'success', href: '/apps/campaigns/all' },
    { label: 'Pipeline Value', value: '$4.2M', change: '+18%', icon: <TrendingUp size={20} />, color: 'warning', href: '/apps/pipeline' },
    { label: 'Days to Launch', value: '3', change: 'Oct 22', icon: <Calendar size={20} />, color: 'info', href: null },
];

const PIPELINE = [
    { stage: 'Awareness', key: 'awareness', accounts: 82, pct: 40, color: 'primary' },
    { stage: 'Engagement', key: 'engagement', accounts: 54, pct: 27, color: 'info' },
    { stage: 'Consideration', key: 'consideration', accounts: 38, pct: 19, color: 'warning' },
    { stage: 'Proposal', key: 'proposal', accounts: 18, pct: 9, color: 'success' },
    { stage: 'Closed', key: 'closed', accounts: 11, pct: 5, color: 'danger' },
];

const CAMPAIGNS = [
    { name: 'Website Redesign', status: 'In Progress', timeline: 'Oct-Dec 2026', progress: 15, color: 'primary' },
    { name: 'LinkedIn Launch', status: 'Starting', timeline: 'Oct-Nov 2026', progress: 5, color: 'info' },
    { name: 'Google Business Profile', status: 'Quick Win', timeline: 'Oct 2026', progress: 0, color: 'success' },
    { name: 'IQS Directory', status: 'Quick Win', timeline: 'Oct 2026', progress: 0, color: 'success' },
    { name: 'Photography Library', status: 'Planned', timeline: 'Oct-Nov 2026', progress: 0, color: 'warning' },
    { name: 'Drone Video Shoot', status: 'Planned', timeline: 'Nov 2026', progress: 0, color: 'warning' },
    { name: 'Instagram Launch', status: 'Planned', timeline: 'Nov-Dec 2026', progress: 0, color: 'violet' },
    { name: 'Open House Event', status: 'Planning', timeline: 'Feb 2027', progress: 0, color: 'pumpkin' },
];

const TOP_TARGETS = TARGET_ACCOUNTS
    .filter(t => t.pri === 'high' && t.estDealValue)
    .sort((a, b) => {
        const valA = parseFloat(a.estDealValue.replace(/[$K,M]/g, '')) * (a.estDealValue.includes('M') ? 1000 : 1);
        const valB = parseFloat(b.estDealValue.replace(/[$K,M]/g, '')) * (b.estDealValue.includes('M') ? 1000 : 1);
        return valB - valA;
    })
    .slice(0, 8);

const PRIORITY_COLORS = { critical: 'danger', high: 'danger', med: 'warning', low: 'info' };
const STAGE_COLORS = { awareness: 'primary', engagement: 'info', consideration: 'warning', proposal: 'success', closed: 'danger' };

const Dashboard = () => {
    return (
        <Container fluid="xxl">
            <Tab.Container defaultActiveKey="overview">
                <div className="hk-pg-header pg-header-wth-tab pt-7">
                    <div className="d-flex">
                        <div className="d-flex flex-wrap justify-content-between flex-1">
                            <div className="mb-lg-0 mb-2 me-8">
                                <h1 className="pg-title">PTP Operations Suite</h1>
                                <p className="text-muted mb-0">Pacific Toll Processing &middot; Command Center</p>
                            </div>
                        </div>
                    </div>
                    <Nav variant="tabs" className="nav-light nav-line">
                        <Nav.Item>
                            <Nav.Link eventKey="overview">
                                <span className="nav-link-text">Overview</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="pipeline">
                                <span className="nav-link-text">Pipeline</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="campaigns">
                                <span className="nav-link-text">Campaigns</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>

                <div className="hk-pg-body">
                    <Tab.Content>
                        {/* OVERVIEW TAB */}
                        <Tab.Pane eventKey="overview">
                            {/* KPI Cards */}
                            <Row className="mb-4">
                                {STATS.map((s, i) => {
                                    const cardContent = (
                                        <Card className={`card-border mb-0 h-100 ${s.href ? 'cursor-pointer' : ''}`} style={s.href ? { transition: 'box-shadow .15s' } : {}}>
                                            <Card.Body className="d-flex align-items-center">
                                                <div className={`avatar avatar-icon avatar-md avatar-soft-${s.color} avatar-rounded me-3`}>
                                                    <span className="initial-wrap">{s.icon}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="d-block fw-medium fs-7">{s.label}</span>
                                                    <div className="d-flex align-items-center">
                                                        <span className="d-block fs-3 fw-medium text-dark mb-0">{s.value}</span>
                                                        <HkBadge bg="success" size="sm" soft className="ms-2">{s.change}</HkBadge>
                                                    </div>
                                                </div>
                                                {s.href && <ExternalLink size={16} className="text-muted" />}
                                            </Card.Body>
                                        </Card>
                                    );
                                    return (
                                        <Col xl={3} sm={6} key={i} className="mb-md-4 mb-3">
                                            {s.href ? (
                                                <Link href={s.href} className="text-decoration-none">{cardContent}</Link>
                                            ) : cardContent}
                                        </Col>
                                    );
                                })}
                            </Row>

                            {/* Pipeline + Campaign Status */}
                            <Row className="mb-4">
                                <Col lg={6} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0 h-100">
                                        <Card.Header className="card-header-action">
                                            <h6>Sales Pipeline</h6>
                                            <Link href="/apps/pipeline" className="btn btn-sm btn-soft-primary">View All</Link>
                                        </Card.Header>
                                        <Card.Body>
                                            {PIPELINE.map((p, i) => (
                                                <Link href={`/apps/pipeline?stage=${p.key}`} key={i} className="d-block text-decoration-none mb-3" style={{ transition: 'opacity .15s' }}>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fs-7 fw-medium text-dark">{p.stage}</span>
                                                        <span className="fs-8 text-muted">{p.accounts} accounts ({p.pct}%)</span>
                                                    </div>
                                                    <ProgressBar variant={p.color} now={p.pct} style={{ height: '8px' }} />
                                                </Link>
                                            ))}
                                            <div className="separator-full mt-4 mb-3" />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-medium">Total Pipeline</span>
                                                <span className="fw-medium text-dark">203 accounts &middot; $4.2M potential</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={6} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0 h-100">
                                        <Card.Header className="card-header-action">
                                            <h6>Campaign Status</h6>
                                            <Link href="/apps/campaigns/all" className="btn btn-sm btn-soft-primary">View All</Link>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table responsive size="sm" className="mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Campaign</th>
                                                        <th>Status</th>
                                                        <th>Timeline</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CAMPAIGNS.map((c, i) => (
                                                        <tr key={i} className="cursor-pointer" onClick={() => window.location.href = '/apps/campaigns/all'}>
                                                            <td className="fw-medium">{c.name}</td>
                                                            <td><HkBadge bg={c.color} soft size="sm">{c.status}</HkBadge></td>
                                                            <td className="text-muted fs-8">{c.timeline}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Top Target Accounts */}
                            <Row className="mb-4">
                                <Col md={12} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0">
                                        <Card.Header className="card-header-action">
                                            <h6>Priority Target Accounts</h6>
                                            <Link href="/apps/targets" className="btn btn-sm btn-soft-primary">View All 203</Link>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table responsive hover className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Company</th>
                                                        <th>Location</th>
                                                        <th>Sector</th>
                                                        <th>Stage</th>
                                                        <th className="text-end">Est. Deal Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {TOP_TARGETS.map((t, i) => (
                                                        <tr key={i} className="cursor-pointer" onClick={() => window.location.href = `/apps/targets/${t.slug}`} style={{ cursor: 'pointer' }}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="fw-medium">{t.n}</span>
                                                                    {t.ticker && <HkBadge bg="smoke" size="sm" soft>{t.ticker}</HkBadge>}
                                                                </div>
                                                            </td>
                                                            <td className="text-muted">{t.loc}</td>
                                                            <td><HkBadge bg="smoke" soft size="sm">{t.cat}</HkBadge></td>
                                                            <td>
                                                                <HkBadge bg={STAGE_COLORS[t.pipelineStage] || 'secondary'} soft size="sm" className="text-capitalize">
                                                                    {PIPELINE_STAGES[t.pipelineStage]?.label || t.pipelineStage}
                                                                </HkBadge>
                                                            </td>
                                                            <td className="text-end fw-medium">{t.estDealValue}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Recent Activity Feed */}
                            <Row>
                                <Col lg={6} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0 h-100">
                                        <Card.Header>
                                            <h6>Recent Activity</h6>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <div className="list-group list-group-flush">
                                                {TARGET_ACCOUNTS
                                                    .flatMap(a => a.touchLog.map(t => ({ ...t, company: a.n, slug: a.slug })))
                                                    .sort((a, b) => b.date.localeCompare(a.date))
                                                    .slice(0, 8)
                                                    .map((t, i) => (
                                                        <Link href={`/apps/targets/${t.slug}`} key={i} className="list-group-item list-group-item-action border-0 px-4 py-3">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                                        <ActivityIcon type={t.type} />
                                                                        <span className="fw-medium fs-7">{t.company}</span>
                                                                    </div>
                                                                    <p className="mb-0 fs-8 text-muted">{t.note}</p>
                                                                </div>
                                                                <div className="text-end flex-shrink-0 ms-3">
                                                                    <span className="fs-9 text-muted">{formatDate(t.date)}</span>
                                                                    <div className="fs-9 text-muted">{t.who}</div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))
                                                }
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={6} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0 h-100">
                                        <Card.Header className="card-header-action">
                                            <h6>Competitive Intel</h6>
                                            <Link href="/apps/competitors" className="btn btn-sm btn-soft-primary">Full Report</Link>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table responsive size="sm" className="mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th className="ps-4">Competitor</th>
                                                        <th>Type</th>
                                                        <th>Threat</th>
                                                        <th>Overlap</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { name: 'Feralloy Corp', slug: 'feralloy-corp', type: 'Toll Processing', threat: 'high', overlap: 4 },
                                                        { name: 'Metals USA / Reliance', slug: 'metals-usa-reliance', type: 'Distribution', threat: 'high', overlap: 4 },
                                                        { name: 'Alliance Steel', slug: 'alliance-steel', type: 'Service Center', threat: 'high', overlap: 4 },
                                                        { name: 'California Steel Industries', slug: 'california-steel-industries-comp', type: 'Steel Mill', threat: 'medium', overlap: 3 },
                                                        { name: 'Steel Technologies', slug: 'steel-technologies', type: 'Toll Processing', threat: 'medium', overlap: 2 },
                                                    ].map((c, i) => (
                                                        <tr key={i} className="cursor-pointer" onClick={() => window.location.href = `/apps/competitors/${c.slug}`} style={{ cursor: 'pointer' }}>
                                                            <td className="ps-4 fw-medium">{c.name}</td>
                                                            <td className="text-muted fs-8">{c.type}</td>
                                                            <td><HkBadge bg={THREAT_COLORS[c.threat] || 'secondary'} soft size="sm">{c.threat}</HkBadge></td>
                                                            <td className="text-muted fs-8">{c.overlap} shared targets</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Pane>

                        {/* PIPELINE TAB */}
                        <Tab.Pane eventKey="pipeline">
                            <Row className="mb-4">
                                {Object.entries(PIPELINE_STAGES).map(([key, stage]) => {
                                    const accounts = getAccountsByStage(key);
                                    const totalValue = accounts.reduce((sum, a) => {
                                        if (!a.estDealValue) return sum;
                                        const num = parseFloat(a.estDealValue.replace(/[$K,M]/g, ''));
                                        return sum + (a.estDealValue.includes('M') ? num * 1000000 : num * 1000);
                                    }, 0);
                                    return (
                                        <Col key={key} className="mb-3">
                                            <Card className={`card-border mb-0 border-top border-${stage.color} border-3`}>
                                                <Card.Body className="text-center py-3">
                                                    <div className={`fs-2 fw-bold text-${stage.color}`}>{accounts.length}</div>
                                                    <div className="fw-medium fs-7">{stage.label}</div>
                                                    <div className="fs-8 text-muted">{formatCurrency(totalValue)}</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                            {Object.entries(PIPELINE_STAGES).map(([key, stage]) => {
                                const accounts = getAccountsByStage(key);
                                if (accounts.length === 0) return null;
                                return (
                                    <Card className="card-border mb-4" key={key}>
                                        <Card.Header className="card-header-action">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className={`w-3 h-3 rounded-circle bg-${stage.color}`} style={{ width: 10, height: 10 }} />
                                                <h6 className="mb-0">{stage.label}</h6>
                                                <HkBadge bg={stage.color} soft size="sm">{accounts.length}</HkBadge>
                                            </div>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table responsive hover className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Company</th>
                                                        <th>Sector</th>
                                                        <th>Location</th>
                                                        <th>Last Touch</th>
                                                        <th className="text-end">Deal Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {accounts.map((a, i) => {
                                                        const lastTouch = a.touchLog?.[0];
                                                        return (
                                                            <tr key={i} className="cursor-pointer" onClick={() => window.location.href = `/apps/targets/${a.slug}`} style={{ cursor: 'pointer' }}>
                                                                <td className="fw-medium">{a.n}</td>
                                                                <td><HkBadge bg="smoke" soft size="sm">{a.cat}</HkBadge></td>
                                                                <td className="text-muted">{a.loc}</td>
                                                                <td className="fs-8 text-muted">{lastTouch ? `${formatDate(lastTouch.date)} — ${lastTouch.type}` : 'No activity'}</td>
                                                                <td className="text-end fw-medium">{a.estDealValue || '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </Tab.Pane>

                        {/* CAMPAIGNS TAB */}
                        <Tab.Pane eventKey="campaigns">
                            <Row className="mb-4">
                                {[
                                    { label: 'Total Campaigns', value: '32', color: 'primary' },
                                    { label: 'In Progress', value: '2', color: 'info' },
                                    { label: 'Quick Wins', value: '2', color: 'success' },
                                    { label: 'Planned', value: '28', color: 'warning' },
                                ].map((s, i) => (
                                    <Col xl={3} sm={6} key={i} className="mb-3">
                                        <Card className="card-border mb-0">
                                            <Card.Body className="text-center py-3">
                                                <div className={`fs-2 fw-bold text-${s.color}`}>{s.value}</div>
                                                <div className="fs-7 text-muted">{s.label}</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                            <Card className="card-border mb-0">
                                <Card.Header className="card-header-action">
                                    <h6>All Campaigns</h6>
                                    <Link href="/apps/campaigns/all" className="btn btn-sm btn-soft-primary">Full View</Link>
                                </Card.Header>
                                <Card.Body>
                                    <Table responsive hover className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>Campaign</th>
                                                <th>Status</th>
                                                <th>Timeline</th>
                                                <th>Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {CAMPAIGNS.map((c, i) => (
                                                <tr key={i} className="cursor-pointer" onClick={() => window.location.href = '/apps/campaigns/all'} style={{ cursor: 'pointer' }}>
                                                    <td className="fw-medium">{c.name}</td>
                                                    <td><HkBadge bg={c.color} soft size="sm">{c.status}</HkBadge></td>
                                                    <td className="text-muted fs-8">{c.timeline}</td>
                                                    <td style={{ width: 120 }}>
                                                        <ProgressBar variant={c.color} now={c.progress || 1} style={{ height: 6 }} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Tab.Pane>
                    </Tab.Content>
                </div>
            </Tab.Container>
        </Container>
    )
}

function ActivityIcon({ type }) {
    const icons = {
        call: { icon: 'ri-phone-line', color: 'success' },
        email: { icon: 'ri-mail-line', color: 'info' },
        linkedin: { icon: 'ri-linkedin-box-fill', color: 'primary' },
        meeting: { icon: 'ri-calendar-check-line', color: 'warning' },
        research: { icon: 'ri-search-line', color: 'secondary' },
    };
    const cfg = icons[type] || icons.research;
    return <i className={`${cfg.icon} fs-7 text-${cfg.color}`} />;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(value) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
}

const THREAT_COLORS = { high: 'danger', medium: 'warning', low: 'success' };

export default Dashboard
