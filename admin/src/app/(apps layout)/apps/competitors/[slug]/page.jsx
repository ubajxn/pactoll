"use client"
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Col, Container, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { ArrowLeft, ExternalLink as ExternalLinkIcon } from 'react-feather';
import { getCompetitorBySlug, THREAT_COLORS } from '@/data/competitors/competitor-data';
import { TARGET_ACCOUNTS } from '@/data/targets/target-data';

export default function CompetitorDetailPage() {
    const { slug } = useParams();
    const competitor = getCompetitorBySlug(slug);

    if (!competitor) {
        return (
            <Container fluid="xxl" className="py-7">
                <div className="text-center py-5">
                    <i className="ri-bar-chart-grouped-line fs-1 text-muted d-block mb-3" />
                    <h3>Competitor Not Found</h3>
                    <p className="text-muted mb-4">No competitor matches this URL.</p>
                    <Link href="/apps/competitors" className="btn btn-primary">Back to Competitive Intel</Link>
                </div>
            </Container>
        );
    }

    const sharedAccounts = (competitor.overlapAccounts || [])
        .map(name => TARGET_ACCOUNTS.find(t => t.n === name))
        .filter(Boolean);

    return (
        <Container fluid="xxl">
            {/* Header */}
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Link href="/apps/competitors" className="btn btn-sm btn-flush-dark btn-icon btn-rounded flush-soft-hover">
                                <ArrowLeft size={16} />
                            </Link>
                            <span className="fs-8 text-muted">Competitive Intelligence</span>
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <h1 className="pg-title mb-0">{competitor.name}</h1>
                            {competitor.ticker && (
                                <HkBadge bg="dark" size="sm" className="font-monospace">{competitor.ticker}</HkBadge>
                            )}
                            <HkBadge bg={THREAT_COLORS[competitor.threat]} soft>{competitor.threat} threat</HkBadge>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="d-inline-flex align-items-center gap-1 text-muted fs-7">
                                <i className="ri-map-pin-line" /> {competitor.loc}
                            </span>
                            <HkBadge bg="smoke" soft size="sm">{competitor.type}</HkBadge>
                        </div>
                    </div>
                </div>

                {/* External Links */}
                <div className="d-flex gap-2 mt-3 flex-wrap">
                    {competitor.website && (
                        <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                            <i className="ri-global-line" /> Website <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {competitor.linkedin && (
                        <a href={competitor.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1">
                            <i className="ri-linkedin-box-fill" /> LinkedIn <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {competitor.socialLinks?.twitter && (
                        <a href={competitor.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1">
                            <i className="ri-twitter-x-line" /> Twitter <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {competitor.socialLinks?.facebook && (
                        <a href={competitor.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1">
                            <i className="ri-facebook-circle-fill" /> Facebook <ExternalLinkIcon size={12} />
                        </a>
                    )}
                </div>
            </div>

            <div className="hk-pg-body">
                <Row>
                    {/* Left Column */}
                    <Col lg={8}>
                        {/* Company Profile */}
                        <Card className="card-border mb-4">
                            <Card.Header><h6 className="mb-0">Company Profile</h6></Card.Header>
                            <Card.Body>
                                {competitor.description && <p className="mb-3">{competitor.description}</p>}
                                <Row>
                                    {competitor.founded && (
                                        <Col sm={3} xs={6} className="mb-3">
                                            <div className="fs-8 text-uppercase text-muted mb-1">Founded</div>
                                            <div className="fw-medium">{competitor.founded}</div>
                                        </Col>
                                    )}
                                    {competitor.revenue && (
                                        <Col sm={3} xs={6} className="mb-3">
                                            <div className="fs-8 text-uppercase text-muted mb-1">Revenue</div>
                                            <div className="fw-medium">{competitor.revenue}</div>
                                        </Col>
                                    )}
                                    {competitor.employees && (
                                        <Col sm={3} xs={6} className="mb-3">
                                            <div className="fs-8 text-uppercase text-muted mb-1">Employees</div>
                                            <div className="fw-medium">{competitor.employees}</div>
                                        </Col>
                                    )}
                                    <Col sm={3} xs={6} className="mb-3">
                                        <div className="fs-8 text-uppercase text-muted mb-1">Type</div>
                                        <div className="fw-medium">{competitor.type}</div>
                                    </Col>
                                </Row>
                                {competitor.services?.length > 0 && (
                                    <div className="mt-2">
                                        <div className="fs-8 text-uppercase text-muted mb-2">Services</div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {competitor.services.map((s, i) => (
                                                <HkBadge key={i} bg="smoke" soft size="sm">{s}</HkBadge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Threat Assessment */}
                        <Card className={`card-border mb-4 border-top border-${THREAT_COLORS[competitor.threat]} border-3`}>
                            <Card.Header><h6 className="mb-0">Threat Assessment</h6></Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6} className="mb-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <i className="ri-shield-check-line text-success fs-5" />
                                            <span className="fw-medium text-success">Their Strengths</span>
                                        </div>
                                        <p className="fs-7 mb-0">{competitor.strengths}</p>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <i className="ri-shield-cross-line text-danger fs-5" />
                                            <span className="fw-medium text-danger">Their Weaknesses</span>
                                        </div>
                                        <p className="fs-7 mb-0">{competitor.weaknesses}</p>
                                    </Col>
                                </Row>
                                {competitor.keyDifferentiator && (
                                    <div className="mt-2 p-3 bg-light rounded">
                                        <div className="fs-8 text-uppercase text-muted mb-1">Key Differentiator</div>
                                        <div className="fw-medium">{competitor.keyDifferentiator}</div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Shared Target Accounts */}
                        {sharedAccounts.length > 0 && (
                            <Card className="card-border mb-4">
                                <Card.Header className="card-header-action">
                                    <h6 className="mb-0">Shared Target Accounts</h6>
                                    <HkBadge bg="warning" soft size="sm">{sharedAccounts.length} overlapping</HkBadge>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>Company</th>
                                                <th>Location</th>
                                                <th>Sector</th>
                                                <th>Priority</th>
                                                <th className="text-end">Est. Deal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sharedAccounts.map((a, i) => (
                                                <tr key={i} className="cursor-pointer" onClick={() => window.location.href = `/apps/targets/${a.slug}`} style={{ cursor: 'pointer' }}>
                                                    <td className="fw-medium">{a.n}</td>
                                                    <td className="text-muted">{a.loc}</td>
                                                    <td><HkBadge bg="smoke" soft size="sm">{a.cat}</HkBadge></td>
                                                    <td><HkBadge bg={a.pri === 'high' ? 'danger' : a.pri === 'med' ? 'warning' : 'info'} soft size="sm">{a.pri}</HkBadge></td>
                                                    <td className="text-end fw-medium">{a.estDealValue || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        )}

                        {/* News & Headlines */}
                        {competitor.news?.length > 0 && (
                            <Card className="card-border mb-4">
                                <Card.Header><h6 className="mb-0">News & Headlines</h6></Card.Header>
                                <Card.Body className="p-0">
                                    <div className="list-group list-group-flush">
                                        {competitor.news.map((n, i) => (
                                            <div key={i} className="list-group-item px-4 py-3">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <i className="ri-newspaper-line text-muted me-2" />
                                                        <span className="fw-medium">{n.title}</span>
                                                    </div>
                                                    <div className="text-end flex-shrink-0 ms-3">
                                                        <div className="fs-8 text-muted">{n.source}</div>
                                                        <div className="fs-9 text-muted">{formatDate(n.date)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>

                    {/* Right Column */}
                    <Col lg={4}>
                        {/* Digital Presence */}
                        {competitor.digitalPresence && (
                            <Card className="card-border mb-4">
                                <Card.Header><h6 className="mb-0">Digital Presence</h6></Card.Header>
                                <Card.Body>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between">
                                            <span className="fs-7 text-muted">Website Quality</span>
                                            <PresenceBadge value={competitor.digitalPresence.websiteQuality} />
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="fs-7 text-muted">Social Activity</span>
                                            <PresenceBadge value={competitor.digitalPresence.socialActivity} />
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="fs-7 text-muted">Content Output</span>
                                            <PresenceBadge value={competitor.digitalPresence.contentOutput} />
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="fs-7 text-muted">SEO Strength</span>
                                            <PresenceBadge value={competitor.digitalPresence.seoStrength} />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Key Contacts */}
                        {competitor.contacts?.length > 0 && (
                            <Card className="card-border mb-4">
                                <Card.Header><h6 className="mb-0">Key Personnel</h6></Card.Header>
                                <Card.Body className="p-0">
                                    <div className="list-group list-group-flush">
                                        {competitor.contacts.map((c, i) => (
                                            <div key={i} className="list-group-item px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="avatar avatar-xs avatar-soft-secondary avatar-rounded">
                                                        <span className="initial-wrap" style={{ fontSize: '0.65rem' }}>
                                                            {c.name.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-medium fs-7">{c.name}</div>
                                                        <div className="fs-8 text-muted">{c.title}</div>
                                                    </div>
                                                    {c.linkedin && (
                                                        <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="ms-auto">
                                                            <i className="ri-linkedin-box-fill text-primary fs-5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* PTP Advantages */}
                        <Card className="card-border mb-4 border-top border-success border-3">
                            <Card.Header><h6 className="mb-0">PTP Advantages vs. {competitor.name.split('/')[0].trim()}</h6></Card.Header>
                            <Card.Body>
                                <ul className="list-unstyled mb-0">
                                    {getPTPAdvantages(competitor).map((adv, i) => (
                                        <li key={i} className="d-flex align-items-start gap-2 mb-2 fs-7">
                                            <i className="ri-checkbox-circle-fill text-success flex-shrink-0 mt-1" />
                                            {adv}
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

function PresenceBadge({ value }) {
    if (!value) return null;
    const lower = value.toLowerCase();
    let color = 'secondary';
    if (lower.includes('strong') || lower.includes('professional') || lower.includes('active') || lower.includes('dominant') || lower.includes('weekly') || lower.includes('monthly')) color = 'success';
    else if (lower.includes('moderate') || lower.includes('corporate') || lower.includes('quarterly')) color = 'warning';
    else if (lower.includes('weak') || lower.includes('none') || lower.includes('minimal') || lower.includes('basic') || lower.includes('outdated') || lower.includes('low')) color = 'danger';
    return <HkBadge bg={color} soft size="sm">{value}</HkBadge>;
}

function getPTPAdvantages(competitor) {
    const advantages = [];
    if (competitor.loc && !competitor.loc.includes('CA')) {
        advantages.push('PTP is local to SoCal — faster turnaround, lower shipping');
    } else if (competitor.loc && !competitor.loc.includes('Carson') && !competitor.loc.includes('South Gate')) {
        advantages.push('PTP Carson location — closer to major SoCal customers');
    }
    if (competitor.weaknesses?.toLowerCase().includes('no toll')) {
        advantages.push('PTP offers full toll processing — they do not');
    }
    if (competitor.weaknesses?.toLowerCase().includes('digital') || competitor.weaknesses?.toLowerCase().includes('online') || competitor.weaknesses?.toLowerCase().includes('marketing')) {
        advantages.push('PTP is building a modern digital presence — they are not');
    }
    if (competitor.weaknesses?.toLowerCase().includes('corporate') || competitor.weaknesses?.toLowerCase().includes('overhead')) {
        advantages.push('PTP is owner-operated — faster decisions, personal relationships');
    }
    if (competitor.weaknesses?.toLowerCase().includes('small') || competitor.weaknesses?.toLowerCase().includes('limited')) {
        advantages.push('PTP has broader equipment and processing capability');
    }
    if (competitor.weaknesses?.toLowerCase().includes('minimum') || competitor.weaknesses?.toLowerCase().includes('min order')) {
        advantages.push('PTP handles smaller orders with flexibility');
    }
    if (advantages.length === 0) {
        advantages.push('Local SoCal presence with personal service');
        advantages.push('Modern digital marketing and brand presence');
        advantages.push('Owner-operated — fast, flexible, relationship-first');
    }
    return advantages;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
