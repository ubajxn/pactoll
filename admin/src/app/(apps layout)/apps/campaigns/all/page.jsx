"use client"
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, Col, Container, Row, Badge } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { CAMPAIGNS, CAMPAIGN_CATEGORIES, CAMPAIGN_STATUSES, CATEGORY_COUNTS } from '@/data/campaigns/campaign-data';

const CampaignsPage = () => {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = useMemo(() => {
        return CAMPAIGNS.filter(c => {
            const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
            const matchStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchCat && matchStatus;
        });
    }, [categoryFilter, statusFilter]);

    const activeCount = CAMPAIGNS.filter(c => c.status === 'active').length;
    const plannedCount = CAMPAIGNS.filter(c => c.status === 'planned').length;
    const draftCount = CAMPAIGNS.filter(c => c.status === 'draft').length;

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">Campaign Manager</h1>
                        <p className="text-muted mb-0">
                            {CAMPAIGNS.length} campaigns across {Object.keys(CAMPAIGN_CATEGORIES).length} channels &middot; Oct 2026 &ndash; Q2 2027
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Badge bg="success" className="px-3 py-2">{activeCount} Active</Badge>
                        <Badge bg="primary" className="px-3 py-2">{plannedCount} Planned</Badge>
                        <Badge bg="secondary" className="px-3 py-2">{draftCount} Draft</Badge>
                    </div>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* Category Filter Cards */}
                <Row className="mb-4">
                    {Object.entries(CAMPAIGN_CATEGORIES).map(([key, cat]) => (
                        <Col key={key} className="mb-3">
                            <Card
                                className={`card-border mb-0 cursor-pointer ${categoryFilter === key ? 'border-primary' : ''}`}
                                onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
                            >
                                <Card.Body className="text-center py-3">
                                    <i className={`${cat.icon} fs-3 text-${cat.color} d-block mb-1`} />
                                    <div className="fs-4 fw-bold">{CATEGORY_COUNTS[key]}</div>
                                    <div className="fs-8 text-muted">{cat.label}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Status Filter */}
                <div className="d-flex gap-2 mb-4">
                    <Badge
                        bg={statusFilter === 'all' ? 'dark' : 'soft-dark'}
                        className={`cursor-pointer px-3 py-2 ${statusFilter === 'all' ? '' : 'text-dark'}`}
                        onClick={() => setStatusFilter('all')}
                    >All ({CAMPAIGNS.length})</Badge>
                    {Object.entries(CAMPAIGN_STATUSES).map(([key, s]) => {
                        const count = CAMPAIGNS.filter(c => c.status === key).length;
                        if (count === 0) return null;
                        return (
                            <Badge
                                key={key}
                                bg={statusFilter === key ? s.color : `soft-${s.color}`}
                                className={`cursor-pointer px-3 py-2 ${statusFilter === key ? '' : `text-${s.color}`}`}
                                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                            >{s.label} ({count})</Badge>
                        );
                    })}
                </div>

                {/* Campaign Cards */}
                <Row>
                    {filtered.map((c) => {
                        const cat = CAMPAIGN_CATEGORIES[c.category] || {};
                        const status = CAMPAIGN_STATUSES[c.status] || {};
                        return (
                            <Col xl={4} md={6} key={c.slug} className="mb-4">
                                <Link href={`/apps/campaigns/${c.slug}`} className="text-decoration-none">
                                    <Card className="card-border mb-0 h-100 campaign-card" style={{ transition: 'box-shadow 0.2s' }}>
                                        <Card.Header className="d-flex justify-content-between align-items-center bg-transparent">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="text-muted fs-8">#{c.number}</span>
                                                <h6 className="mb-0 text-dark">{c.name}</h6>
                                            </div>
                                            <HkBadge bg={status.color || 'secondary'} soft size="sm">{status.label || c.status}</HkBadge>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="d-flex justify-content-between mb-3">
                                                <HkBadge bg={cat.color || 'secondary'} soft size="sm">
                                                    <i className={`${cat.icon} me-1`} />{cat.label || c.category}
                                                </HkBadge>
                                                <span className="fs-8 text-muted">{c.timeline}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                                <span className="fs-8 text-muted">Budget: <span className="fw-semibold text-dark">{c.budget}</span></span>
                                                <span className="fs-8 text-muted">{c.deliverables.length} deliverables</span>
                                            </div>
                                            <div className="mb-2">
                                                <div className="fw-medium fs-8 text-uppercase text-muted mb-1">Deliverables</div>
                                                <ul className="list-unstyled mb-0">
                                                    {c.deliverables.slice(0, 3).map((d, j) => (
                                                        <li key={j} className="fs-7 text-muted">
                                                            <i className="ri-checkbox-blank-circle-fill fs-9 me-1 text-primary" />{d}
                                                        </li>
                                                    ))}
                                                    {c.deliverables.length > 3 && (
                                                        <li className="fs-8 text-primary fw-medium">+{c.deliverables.length - 3} more</li>
                                                    )}
                                                </ul>
                                            </div>
                                            <div>
                                                <div className="fw-medium fs-8 text-uppercase text-muted mb-1">KPIs</div>
                                                <div className="fs-7 text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.kpis}</div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        );
                    })}
                </Row>

                {filtered.length === 0 && (
                    <Card className="border-0 shadow-sm text-center py-5">
                        <p className="text-muted mb-0">No campaigns match the selected filters.</p>
                    </Card>
                )}
            </div>
        </Container>
    );
};

export default CampaignsPage;
