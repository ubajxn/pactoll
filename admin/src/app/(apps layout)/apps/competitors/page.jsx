"use client"
import { Card, Col, Container, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';

const COMPETITORS = [
    {
        name: 'Metals USA / Reliance Steel', loc: 'Los Angeles, CA', type: 'Steel Distribution',
        website: 'metalsusa.com', linkedin: true, social: 'Active',
        strengths: 'National scale, deep inventory, Reliance backing',
        weaknesses: 'No toll processing, long lead times on specialty, corporate pricing',
        threat: 'high',
    },
    {
        name: 'Alliance Steel', loc: 'South Gate, CA', type: 'Service Center',
        website: 'alliancesteel.com', linkedin: true, social: 'Moderate',
        strengths: 'Local presence, toll + sales, similar footprint',
        weaknesses: 'Smaller facility, less equipment, weaker online presence',
        threat: 'high',
    },
    {
        name: 'California Steel Industries', loc: 'Fontana, CA', type: 'Steel Mill',
        website: 'californiasteel.com', linkedin: true, social: 'Active',
        strengths: 'Primary mill — source pricing advantage, massive volume',
        weaknesses: 'Not a service center, no custom slitting/blanking, min orders high',
        threat: 'medium',
    },
    {
        name: 'Feralloy Corp', loc: 'City of Commerce, CA', type: 'Toll Processing',
        website: 'feralloy.com', linkedin: true, social: 'Active',
        strengths: 'National toll network, ISO certified, strong digital presence',
        weaknesses: 'Multiple locations = less focus on SoCal, corporate overhead',
        threat: 'high',
    },
    {
        name: 'Steel Technologies', loc: 'Louisville, KY (West Coast ops)', type: 'Toll Processing',
        website: 'steeltechnologies.com', linkedin: true, social: 'Moderate',
        strengths: 'National scale, Nucor subsidiary, automotive certified',
        weaknesses: 'No West Coast facility, shipping disadvantage for SoCal customers',
        threat: 'medium',
    },
    {
        name: 'National Material (NMLP)', loc: 'Elk Grove Village, IL', type: 'Service Center + Toll',
        website: 'nationalmaterial.com', linkedin: true, social: 'Active',
        strengths: 'Full service: processing, trading, distribution, manufacturing',
        weaknesses: 'Midwest-focused, West Coast is secondary market',
        threat: 'low',
    },
    {
        name: 'Mid-States Steel', loc: 'Los Angeles, CA', type: 'Steel Distribution',
        website: 'mid-statessteel.com', linkedin: false, social: 'Minimal',
        strengths: 'Local LA presence, long-standing relationships',
        weaknesses: 'No digital presence, aging brand, limited processing capability',
        threat: 'low',
    },
    {
        name: 'Brown Metals', loc: 'Santa Fe Springs, CA', type: 'Service Center',
        website: 'brownmetals.com', linkedin: false, social: 'None',
        strengths: 'SoCal local, diverse inventory, quick delivery',
        weaknesses: 'Small operation, no toll processing, no online marketing',
        threat: 'low',
    },
];

const THREAT_COLORS = { high: 'danger', medium: 'warning', low: 'success' };

const DIGITAL_AUDIT = [
    { metric: 'Has Modern Website', ptp: false, avg: '75%', note: 'PTP site is outdated — redesign launching Oct 2026' },
    { metric: 'Google Business Profile', ptp: false, avg: '80%', note: 'Not claimed — quick win, launching Session 1' },
    { metric: 'LinkedIn Company Page', ptp: false, avg: '70%', note: 'No page — creating Session 1' },
    { metric: 'Industry Directory Listings', ptp: false, avg: '60%', note: 'Zero listings — IQS, SteelOrbis, ThomasNet planned' },
    { metric: 'Social Media Posting', ptp: false, avg: '50%', note: 'No social presence — LinkedIn + Instagram launching' },
    { metric: 'Email Marketing', ptp: false, avg: '40%', note: 'No newsletter — Constant Contact launching Dec' },
    { metric: 'Trade Show Presence', ptp: false, avg: '55%', note: 'No shows attended — MSCI Conference March 2027' },
    { metric: 'Video Content', ptp: false, avg: '25%', note: 'No video — drone + ASMR series planned Nov 2026' },
];

const CompetitorsPage = () => {
    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <h1 className="pg-title">Competitive Intelligence</h1>
                <p>Market landscape analysis &middot; {COMPETITORS.length} competitors tracked &middot; Digital presence audit</p>
            </div>

            <div className="hk-pg-body">
                {/* PTP Digital Gap */}
                <Card className="card-border mb-4">
                    <Card.Header>
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
                            <Card className="card-border mb-0 h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{c.name}</h6>
                                        <HkBadge bg={THREAT_COLORS[c.threat]} soft size="sm">{c.threat}</HkBadge>
                                    </div>
                                    <div className="fs-8 text-muted mb-3">{c.loc} &middot; {c.type}</div>

                                    <div className="d-flex gap-2 mb-3">
                                        <HkBadge bg={c.website ? 'success' : 'secondary'} soft size="sm">Website</HkBadge>
                                        <HkBadge bg={c.linkedin ? 'info' : 'secondary'} soft size="sm">LinkedIn</HkBadge>
                                        <HkBadge bg={c.social !== 'None' ? 'violet' : 'secondary'} soft size="sm">Social: {c.social}</HkBadge>
                                    </div>

                                    <div className="mb-2">
                                        <div className="fw-medium fs-8 text-success mb-1">Strengths</div>
                                        <div className="fs-8">{c.strengths}</div>
                                    </div>
                                    <div>
                                        <div className="fw-medium fs-8 text-danger mb-1">Weaknesses</div>
                                        <div className="fs-8">{c.weaknesses}</div>
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

export default CompetitorsPage;
