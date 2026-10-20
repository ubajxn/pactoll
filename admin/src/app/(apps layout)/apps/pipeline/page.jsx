"use client"
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, Col, Container, ProgressBar, Row, Badge } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { TARGET_ACCOUNTS, PIPELINE_STAGES, SECTORS, PRIORITY_MAP } from '@/data/targets/target-data';

const STAGE_ACTIONS = {
    awareness: ['LinkedIn connection requests', 'Directory listings go live', 'Email introduction campaigns', 'Trade show networking list'],
    engagement: ['Follow-up calls from LinkedIn', 'Content sharing (ASMR videos, facility tours)', 'Open house invitations', 'Capability one-pager distribution'],
    consideration: ['Facility tour scheduling', 'Sample material delivery', 'Competitive pricing analysis', 'Technical capability presentations'],
    proposal: ['Follow-up on submitted quotes', 'Trial order negotiation', 'Volume pricing discussions', 'Supply agreement drafting'],
    closed: ['Onboarding and first order fulfillment', 'Relationship building', 'Cross-sell opportunities (toll + sales)', 'Referral requests'],
};

const STAGE_DESCRIPTIONS = {
    awareness: 'Accounts identified but not yet contacted. Ready for outreach.',
    engagement: 'Initial contact made. Responding to outreach or viewing content.',
    consideration: 'Active conversations. Evaluating PTP capabilities and pricing.',
    proposal: 'Formal quotes submitted. Decision pending.',
    closed: 'Active customers from outreach efforts.',
};

const STAGE_VALUES = {
    awareness: 20000,
    engagement: 20000,
    consideration: 20000,
    proposal: 25000,
    closed: 25000,
};

const PipelinePage = () => {
    const [expandedStage, setExpandedStage] = useState(null);

    const stageData = useMemo(() => {
        const grouped = {};
        Object.keys(PIPELINE_STAGES).forEach(key => {
            grouped[key] = TARGET_ACCOUNTS.filter(a => (a.pipelineStage || 'awareness') === key);
        });
        return grouped;
    }, []);

    const totalAccounts = TARGET_ACCOUNTS.length;
    const totalValue = Object.entries(stageData).reduce((sum, [key, accounts]) => {
        return sum + accounts.reduce((s, a) => {
            if (a.estDealValue) {
                const num = parseInt(a.estDealValue.replace(/[^0-9]/g, ''));
                return s + (isNaN(num) ? STAGE_VALUES[key] : num);
            }
            return s + STAGE_VALUES[key];
        }, 0);
    }, 0);

    const formatValue = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <h1 className="pg-title">Sales Pipeline</h1>
                <p>{totalAccounts} accounts &middot; {formatValue(totalValue)} total pipeline value &middot; 5-stage funnel</p>
            </div>

            <div className="hk-pg-body">
                <Card className="card-border mb-4">
                    <Card.Header><h6>Pipeline Funnel</h6></Card.Header>
                    <Card.Body>
                        {Object.entries(PIPELINE_STAGES).map(([key, stage], i) => {
                            const accounts = stageData[key] || [];
                            const count = accounts.length;
                            const pct = totalAccounts > 0 ? Math.round((count / totalAccounts) * 100) : 0;
                            const stageVal = accounts.reduce((s, a) => {
                                if (a.estDealValue) {
                                    const num = parseInt(a.estDealValue.replace(/[^0-9]/g, ''));
                                    return s + (isNaN(num) ? STAGE_VALUES[key] : num);
                                }
                                return s + STAGE_VALUES[key];
                            }, 0);
                            return (
                                <div
                                    key={key}
                                    className="d-flex align-items-center mb-3 cursor-pointer"
                                    style={{ paddingLeft: `${i * 3}%`, paddingRight: `${i * 3}%` }}
                                    onClick={() => setExpandedStage(expandedStage === key ? null : key)}
                                >
                                    <div style={{ width: '120px', flexShrink: 0 }}>
                                        <span className="fw-medium">{stage.label}</span>
                                    </div>
                                    <div className="flex-grow-1 mx-3">
                                        <ProgressBar variant={stage.color} now={pct} style={{ height: `${32 - i * 4}px`, borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ width: '160px', flexShrink: 0 }} className="text-end">
                                        <span className="fw-medium">{count}</span>
                                        <span className="text-muted ms-2 fs-8">({pct}%) &middot; {formatValue(stageVal)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </Card.Body>
                </Card>

                {/* Stage Detail Cards */}
                <Row>
                    {Object.entries(PIPELINE_STAGES).map(([key, stage], i) => {
                        const accounts = stageData[key] || [];
                        const count = accounts.length;
                        const isExpanded = expandedStage === key;
                        const stageVal = accounts.reduce((s, a) => {
                            if (a.estDealValue) {
                                const num = parseInt(a.estDealValue.replace(/[^0-9]/g, ''));
                                return s + (isNaN(num) ? STAGE_VALUES[key] : num);
                            }
                            return s + STAGE_VALUES[key];
                        }, 0);
                        return (
                            <Col xl={4} md={6} key={key} className="mb-4">
                                <Card
                                    className={`card-border mb-0 h-100 border-top border-${stage.color} border-3 cursor-pointer`}
                                    onClick={() => setExpandedStage(isExpanded ? null : key)}
                                >
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 className="mb-1">{stage.label}</h6>
                                                <p className="fs-8 text-muted mb-0">{STAGE_DESCRIPTIONS[key]}</p>
                                            </div>
                                            <div className="text-end">
                                                <div className="fs-3 fw-bold">{count}</div>
                                                <div className="fs-8 text-muted">{formatValue(stageVal)}</div>
                                            </div>
                                        </div>
                                        <div className="fw-medium fs-8 text-uppercase text-muted mb-2">Key Actions</div>
                                        <ul className="list-unstyled mb-0">
                                            {(STAGE_ACTIONS[key] || []).map((a, j) => (
                                                <li key={j} className="d-flex align-items-start gap-2 mb-1 fs-7">
                                                    <i className={`ri-checkbox-blank-circle-fill fs-9 text-${stage.color} mt-1`} />
                                                    {a}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Expanded Stage — Show Accounts */}
                {expandedStage && (
                    <Card className="card-border mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                                <HkBadge bg={PIPELINE_STAGES[expandedStage].color} className="me-2">{(stageData[expandedStage] || []).length}</HkBadge>
                                {PIPELINE_STAGES[expandedStage].label} Accounts
                            </h6>
                            <button className="btn btn-sm btn-flush-dark" onClick={() => setExpandedStage(null)}>
                                <i className="ri-close-line" />
                            </button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Company</th>
                                            <th>Sector</th>
                                            <th>Location</th>
                                            <th>Priority</th>
                                            <th>Steel Needs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(stageData[expandedStage] || []).map(a => {
                                            const sector = SECTORS[a.cat] || {};
                                            const pri = PRIORITY_MAP[a.pri] || {};
                                            return (
                                                <tr key={a.slug}>
                                                    <td>
                                                        <Link href={`/apps/targets/${a.slug}`} className="fw-semibold text-decoration-none">
                                                            {a.n}
                                                        </Link>
                                                    </td>
                                                    <td><HkBadge bg={sector.color || 'secondary'} soft size="sm">{sector.label || a.cat}</HkBadge></td>
                                                    <td className="fs-7 text-muted">{a.loc}</td>
                                                    <td><HkBadge bg={pri.color || 'secondary'} soft size="sm">{pri.label || a.pri}</HkBadge></td>
                                                    <td className="fs-7 text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.steel}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </div>
        </Container>
    );
};

export default PipelinePage;
