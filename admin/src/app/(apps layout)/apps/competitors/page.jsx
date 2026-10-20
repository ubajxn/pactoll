"use client"
import Link from 'next/link';
import { Card, Col, Container, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { COMPETITORS, DIGITAL_AUDIT, THREAT_COLORS } from '@/data/competitors/competitor-data';

const CompetitorsPage = () => {
    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <h1 className="pg-title">Competitive Intelligence</h1>
                <p className="text-muted mb-0">Market landscape analysis &middot; {COMPETITORS.length} competitors tracked &middot; Digital presence audit</p>
            </div>

            <div className="hk-pg-body">
                {/* PTP Digital Gap */}
                <Card className="card-border mb-4">
                    <Card.Header className="card-header-action">
                        <h6>PTP Digital Presence Audit</h6>
                        <HkBadge bg="danger" soft>0 of 8 channels active</HkBadge>
                    </Card.Header>
                    <Card.Body>
                        <Table responsive size="sm" className="mb-0">
                            <thead>
                                <tr>
                                    <th>Channel</th>
                                    <th className="text-center">PTP Today</th>
                                    <th className="text-center">Competitor Avg</th>
                                    <th>Plan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DIGITAL_AUDIT.map((d, i) => (
                                    <tr key={i}>
                                        <td className="fw-medium">{d.metric}</td>
                                        <td className="text-center">
                                            {d.ptp
                                                ? <i className="ri-checkbox-circle-fill text-success fs-5" />
                                                : <i className="ri-close-circle-fill text-danger fs-5" />
                                            }
                                        </td>
                                        <td className="text-center text-muted">{d.avg}</td>
                                        <td className="fs-8 text-muted">{d.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Competitor Cards */}
                <Row>
                    {COMPETITORS.map((c, i) => (
                        <Col xl={3} md={6} key={i} className="mb-4">
                            <Link href={`/apps/competitors/${c.slug}`} className="text-decoration-none">
                                <Card className="card-border mb-0 h-100" style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0 text-dark">{c.name}</h6>
                                            <HkBadge bg={THREAT_COLORS[c.threat]} soft size="sm">{c.threat}</HkBadge>
                                        </div>
                                        <div className="fs-8 text-muted mb-2">{c.loc} &middot; {c.type}</div>
                                        {c.revenue && <div className="fs-8 text-muted mb-3">Revenue: {c.revenue} &middot; {c.employees}</div>}

                                        <div className="d-flex gap-2 mb-3">
                                            <HkBadge bg={c.website ? 'success' : 'secondary'} soft size="sm">Website</HkBadge>
                                            <HkBadge bg={c.linkedin ? 'info' : 'secondary'} soft size="sm">LinkedIn</HkBadge>
                                            <HkBadge bg={c.socialLinks?.twitter || c.socialLinks?.facebook ? 'violet' : 'secondary'} soft size="sm">
                                                Social: {c.digitalPresence?.socialActivity || 'Unknown'}
                                            </HkBadge>
                                        </div>

                                        <div className="mb-2">
                                            <div className="fw-medium fs-8 text-success mb-1">Strengths</div>
                                            <div className="fs-8 text-body">{c.strengths}</div>
                                        </div>
                                        <div>
                                            <div className="fw-medium fs-8 text-danger mb-1">Weaknesses</div>
                                            <div className="fs-8 text-body">{c.weaknesses}</div>
                                        </div>

                                        {c.overlapAccounts?.length > 0 && (
                                            <div className="mt-3 pt-2 border-top">
                                                <div className="fs-8 text-muted">
                                                    <i className="ri-crosshair-2-line me-1" />
                                                    {c.overlapAccounts.length} shared targets
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
            </div>
        </Container>
    );
};

export default CompetitorsPage;
