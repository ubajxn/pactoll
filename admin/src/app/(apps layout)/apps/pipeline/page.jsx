"use client"
import { Card, Col, Container, ProgressBar, Row } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';

const STAGES = [
    {
        name: 'Awareness', color: 'primary', count: 82, value: '$1.6M',
        description: 'Accounts identified but not yet contacted. Ready for outreach.',
        actions: ['LinkedIn connection requests', 'Directory listings go live', 'Email introduction campaigns', 'Trade show networking list'],
    },
    {
        name: 'Engagement', color: 'info', count: 54, value: '$1.1M',
        description: 'Initial contact made. Responding to outreach or viewing content.',
        actions: ['Follow-up calls from LinkedIn', 'Content sharing (ASMR videos, facility tours)', 'Open house invitations', 'Capability one-pager distribution'],
    },
    {
        name: 'Consideration', color: 'warning', count: 38, value: '$780K',
        description: 'Active conversations. Evaluating PTP capabilities and pricing.',
        actions: ['Facility tour scheduling', 'Sample material delivery', 'Competitive pricing analysis', 'Technical capability presentations'],
    },
    {
        name: 'Proposal', color: 'success', count: 18, value: '$450K',
        description: 'Formal quotes submitted. Decision pending.',
        actions: ['Follow-up on submitted quotes', 'Trial order negotiation', 'Volume pricing discussions', 'Supply agreement drafting'],
    },
    {
        name: 'Closed Won', color: 'danger', count: 11, value: '$280K',
        description: 'Active customers from outreach efforts.',
        actions: ['Onboarding and first order fulfillment', 'Relationship building', 'Cross-sell opportunities (toll + sales)', 'Referral requests'],
    },
];

const TOTAL_ACCOUNTS = STAGES.reduce((s, st) => s + st.count, 0);

const PipelinePage = () => {
    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <h1 className="pg-title">Sales Pipeline</h1>
                <p>{TOTAL_ACCOUNTS} accounts &middot; $4.2M total pipeline value &middot; 5-stage funnel</p>
            </div>

            <div className="hk-pg-body">
                {/* Funnel Visualization */}
                <Card className="card-border mb-4">
                    <Card.Header><h6>Pipeline Funnel</h6></Card.Header>
                    <Card.Body>
                        {STAGES.map((s, i) => {
                            const pct = Math.round((s.count / TOTAL_ACCOUNTS) * 100);
                            const barWidth = 100 - (i * 15);
                            return (
                                <div key={i} className="d-flex align-items-center mb-3" style={{ paddingLeft: `${i * 3}%`, paddingRight: `${i * 3}%` }}>
                                    <div style={{ width: '120px', flexShrink: 0 }}>
                                        <span className="fw-medium">{s.name}</span>
                                    </div>
                                    <div className="flex-grow-1 mx-3">
                                        <ProgressBar variant={s.color} now={pct} style={{ height: `${32 - i * 4}px`, borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ width: '160px', flexShrink: 0 }} className="text-end">
                                        <span className="fw-medium">{s.count}</span>
                                        <span className="text-muted ms-2 fs-8">({pct}%) &middot; {s.value}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </Card.Body>
                </Card>

                {/* Stage Detail Cards */}
                <Row>
                    {STAGES.map((s, i) => (
                        <Col xl={4} md={6} key={i} className="mb-4">
                            <Card className={`card-border mb-0 h-100 border-top border-${s.color} border-3`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 className="mb-1">{s.name}</h6>
                                            <p className="fs-8 text-muted mb-0">{s.description}</p>
                                        </div>
                                        <div className="text-end">
                                            <div className="fs-3 fw-bold">{s.count}</div>
                                            <div className="fs-8 text-muted">{s.value}</div>
                                        </div>
                                    </div>
                                    <div className="fw-medium fs-8 text-uppercase text-muted mb-2">Key Actions</div>
                                    <ul className="list-unstyled mb-0">
                                        {s.actions.map((a, j) => (
                                            <li key={j} className="d-flex align-items-start gap-2 mb-1 fs-7">
                                                <i className={`ri-checkbox-blank-circle-fill fs-9 text-${s.color} mt-1`} />
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </Container>
    );
};

export default PipelinePage;
