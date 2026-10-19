"use client"
import { Card, Col, Container, Nav, ProgressBar, Row, Tab, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { ArrowUp, Target, Speakerphone, BuildingFactory2, TrendingUp, Users, Calendar, ChartBar } from 'tabler-icons-react';
import Image from 'next/image';

const STATS = [
    { label: 'Target Accounts', value: '203', change: '+12', icon: <Target size={20} />, color: 'primary' },
    { label: 'Active Campaigns', value: '32', change: '+5', icon: <Speakerphone size={20} />, color: 'success' },
    { label: 'Pipeline Value', value: '$4.2M', change: '+18%', icon: <TrendingUp size={20} />, color: 'warning' },
    { label: 'Days to Launch', value: '3', change: 'Oct 22', icon: <Calendar size={20} />, color: 'info' },
];

const PIPELINE = [
    { stage: 'Awareness', accounts: 82, pct: 40, color: 'primary' },
    { stage: 'Engagement', accounts: 54, pct: 27, color: 'info' },
    { stage: 'Consideration', accounts: 38, pct: 19, color: 'warning' },
    { stage: 'Proposal', accounts: 18, pct: 9, color: 'success' },
    { stage: 'Closed', accounts: 11, pct: 5, color: 'danger' },
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

const TOP_TARGETS = [
    { company: 'Tesla, Inc.', city: 'Fremont, CA', sector: 'Automotive / EV', priority: 'critical', revenue: '$12M' },
    { company: 'Rivian Automotive', city: 'Normal, IL', sector: 'Automotive / EV', priority: 'critical', revenue: '$8M' },
    { company: 'Nucor Steel', city: 'Charlotte, NC', sector: 'Steel Distribution', priority: 'high', revenue: '$6M' },
    { company: 'Samsung SDI', city: 'Ontario, CA', sector: 'Battery / Energy', priority: 'high', revenue: '$4M' },
    { company: 'QTS Data Centers', city: 'Phoenix, AZ', sector: 'Data Center', priority: 'high', revenue: '$3.5M' },
    { company: 'Panasonic Energy', city: 'Sparks, NV', sector: 'Battery / Energy', priority: 'medium', revenue: '$3M' },
    { company: 'Switch Data Centers', city: 'Las Vegas, NV', sector: 'Data Center', priority: 'medium', revenue: '$2.8M' },
    { company: 'Redwood Materials', city: 'Carson City, NV', sector: 'Recycling', priority: 'medium', revenue: '$2.5M' },
];

const PRIORITY_COLORS = { critical: 'danger', high: 'warning', medium: 'info', low: 'secondary' };

const Dashboard = () => {
    return (
        <Container fluid="xxl">
            <Tab.Container activeKey="overview">
                <div className="hk-pg-header pg-header-wth-tab pt-7">
                    <div className="d-flex">
                        <div className="d-flex flex-wrap justify-content-between flex-1">
                            <div className="mb-lg-0 mb-2 me-8">
                                <h1 className="pg-title">PTP CMO Operations</h1>
                                <p>Pacific Toll Processing &middot; Marketing Command Center &middot; Launch: Oct 22, 2026</p>
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
                        <Tab.Pane eventKey="overview">
                            {/* KPI Cards */}
                            <Row className="mb-4">
                                {STATS.map((s, i) => (
                                    <Col xl={3} sm={6} key={i} className="mb-md-4 mb-3">
                                        <Card className="card-border mb-0 h-100">
                                            <Card.Body className="d-flex align-items-center">
                                                <div className={`avatar avatar-icon avatar-md avatar-soft-${s.color} avatar-rounded me-3`}>
                                                    <span className="initial-wrap">{s.icon}</span>
                                                </div>
                                                <div>
                                                    <span className="d-block fw-medium fs-7">{s.label}</span>
                                                    <div className="d-flex align-items-center">
                                                        <span className="d-block fs-3 fw-medium text-dark mb-0">{s.value}</span>
                                                        <HkBadge bg="success" size="sm" soft className="ms-2">{s.change}</HkBadge>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {/* Pipeline + Campaign Status */}
                            <Row className="mb-4">
                                <Col lg={6} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0 h-100">
                                        <Card.Header>
                                            <h6>Sales Pipeline</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            {PIPELINE.map((p, i) => (
                                                <div key={i} className="mb-3">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fs-7 fw-medium">{p.stage}</span>
                                                        <span className="fs-8 text-muted">{p.accounts} accounts ({p.pct}%)</span>
                                                    </div>
                                                    <ProgressBar variant={p.color} now={p.pct} style={{ height: '8px' }} />
                                                </div>
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
                                        <Card.Header>
                                            <h6>Campaign Status</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table responsive size="sm" className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Campaign</th>
                                                        <th>Status</th>
                                                        <th>Timeline</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CAMPAIGNS.map((c, i) => (
                                                        <tr key={i}>
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
                            <Row>
                                <Col md={12} className="mb-md-4 mb-3">
                                    <Card className="card-border mb-0">
                                        <Card.Header className="card-header-action">
                                            <h6>Priority Target Accounts</h6>
                                            <HkBadge bg="primary" soft>Top 8 of 203</HkBadge>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table responsive hover className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Company</th>
                                                        <th>Location</th>
                                                        <th>Sector</th>
                                                        <th>Priority</th>
                                                        <th className="text-end">Est. Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {TOP_TARGETS.map((t, i) => (
                                                        <tr key={i}>
                                                            <td className="fw-medium">{t.company}</td>
                                                            <td className="text-muted">{t.city}</td>
                                                            <td><HkBadge bg="smoke" soft size="sm">{t.sector}</HkBadge></td>
                                                            <td><HkBadge bg={PRIORITY_COLORS[t.priority]} soft size="sm" className="text-capitalize">{t.priority}</HkBadge></td>
                                                            <td className="text-end fw-medium">{t.revenue}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey="pipeline" />
                        <Tab.Pane eventKey="campaigns" />
                    </Tab.Content>
                </div>
            </Tab.Container>
        </Container>
    )
}

export default Dashboard
