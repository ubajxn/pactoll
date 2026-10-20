'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { ArrowLeft, Calendar, DollarSign, CheckCircle, Target, TrendingUp, Clipboard, ArrowRight } from 'react-feather';
import { getCampaignBySlug, CAMPAIGNS, CAMPAIGN_CATEGORIES, CAMPAIGN_STATUSES } from '@/data/campaigns/campaign-data';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const campaign = getCampaignBySlug(params.slug);

    if (!campaign) {
        return (
            <Container fluid className="p-4">
                <Card className="border-0 shadow-sm text-center py-5">
                    <h5 className="text-muted">Campaign not found</h5>
                    <p className="text-muted">Campaign &quot;{params.slug}&quot; doesn&apos;t exist.</p>
                    <div><Link href="/apps/campaigns/all" className="btn btn-primary btn-sm">Back to Campaigns</Link></div>
                </Card>
            </Container>
        );
    }

    const cat = CAMPAIGN_CATEGORIES[campaign.category] || {};
    const status = CAMPAIGN_STATUSES[campaign.status] || {};
    const currentIdx = CAMPAIGNS.findIndex(c => c.slug === campaign.slug);
    const prevCampaign = currentIdx > 0 ? CAMPAIGNS[currentIdx - 1] : null;
    const nextCampaign = currentIdx < CAMPAIGNS.length - 1 ? CAMPAIGNS[currentIdx + 1] : null;

    return (
        <Container fluid className="p-4">
            {/* Breadcrumb + Navigation */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                    <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded" onClick={() => router.push('/apps/campaigns/all')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <Link href="/apps/campaigns/all" className="text-muted fs-7 text-decoration-none">Campaigns</Link>
                    <span className="text-muted fs-7">/</span>
                    <span className="fw-semibold fs-7">#{campaign.number}</span>
                </div>
                <div className="d-flex gap-2">
                    {prevCampaign && (
                        <Link href={`/apps/campaigns/${prevCampaign.slug}`} className="btn btn-sm btn-outline-secondary">
                            <ArrowLeft size={14} className="me-1" />Prev
                        </Link>
                    )}
                    {nextCampaign && (
                        <Link href={`/apps/campaigns/${nextCampaign.slug}`} className="btn btn-sm btn-outline-secondary">
                            Next<ArrowRight size={14} className="ms-1" />
                        </Link>
                    )}
                </div>
            </div>

            <Row className="g-4">
                {/* Main Content */}
                <Col lg={8}>
                    {/* Header Card */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <div className="d-flex align-items-start justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg={`soft-${cat.color}`} className={`text-${cat.color}`}>
                                        <i className={`${cat.icon} me-1`} />{cat.label}
                                    </Badge>
                                    <Badge bg={status.color}>{status.label}</Badge>
                                </div>
                                <span className="text-muted fs-7">Campaign #{campaign.number}</span>
                            </div>

                            <h3 className="fw-bold mb-2">{campaign.name}</h3>

                            <div className="d-flex flex-wrap gap-3 text-muted fs-7">
                                <span><Calendar size={14} className="me-1" />{campaign.timeline}</span>
                                <span><DollarSign size={14} className="me-1" />{campaign.budget}</span>
                                <span><CheckCircle size={14} className="me-1" />{campaign.deliverables.length} deliverables</span>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Deliverables */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">
                                <Clipboard size={16} className="me-2" />
                                Deliverables ({campaign.deliverables.length})
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex flex-column gap-2">
                                {campaign.deliverables.map((d, i) => (
                                    <div key={i} className="d-flex align-items-start gap-2">
                                        <div className="mt-1">
                                            <i className="ri-checkbox-blank-circle-line text-muted fs-8" />
                                        </div>
                                        <span className="fs-7">{d}</span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Actions / Next Steps */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">
                                <ArrowRight size={16} className="me-2" />
                                Next Steps &amp; Actions
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <p className="fs-7 mb-0" style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                {campaign.actions.split('. ').join('.\n')}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    {/* KPIs */}
                    <Card className="border-0 shadow-sm mb-4 border-start border-success border-3">
                        <Card.Header className="bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">
                                <TrendingUp size={16} className="me-2" />
                                Key Performance Indicators
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <p className="fs-7 mb-0" style={{ lineHeight: 1.8 }}>{campaign.kpis}</p>
                        </Card.Body>
                    </Card>

                    {/* Details */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Details</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted fs-7">Category</span>
                                    <Badge bg={`soft-${cat.color}`} className={`text-${cat.color}`}>
                                        <i className={`${cat.icon} me-1`} />{cat.label}
                                    </Badge>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted fs-7">Status</span>
                                    <Badge bg={status.color}>{status.label}</Badge>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted fs-7">Timeline</span>
                                    <span className="fs-7 fw-semibold">{campaign.timeline}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted fs-7">Budget</span>
                                    <span className="fs-7 fw-semibold">{campaign.budget}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted fs-7">Deliverables</span>
                                    <span className="fs-7 fw-semibold">{campaign.deliverables.length} items</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Quick Links */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Quick Links</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex flex-column gap-2">
                                <Link href="/apps/campaigns/all" className="fs-7 text-decoration-none">
                                    <i className="ri-arrow-left-line me-1" />All Campaigns
                                </Link>
                                <Link href="/apps/campaigns/calendar" className="fs-7 text-decoration-none">
                                    <i className="ri-calendar-line me-1" />Campaign Calendar
                                </Link>
                                <Link href="/dashboard" className="fs-7 text-decoration-none">
                                    <i className="ri-dashboard-line me-1" />Dashboard
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
