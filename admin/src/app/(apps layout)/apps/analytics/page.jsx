"use client"
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, Col, Container, Row, Table, Nav, Badge, ProgressBar } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import {
    SITE_TRAFFIC_WEEKLY, TRAFFIC_SOURCES, CAMPAIGN_PERFORMANCE,
    CHANNEL_SUMMARY, POSTCARD_METRICS, PAID_MEDIA_DETAIL,
    SOCIAL_ENGAGEMENT, EMAIL_METRICS, KPI_SUMMARY,
} from '@/data/analytics/analytics-data';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const kpiCards = [
    { label: 'Total Sessions', value: KPI_SUMMARY.totalSessions.toLocaleString(), icon: 'ri-line-chart-line', color: 'primary' },
    { label: 'Unique Visitors', value: KPI_SUMMARY.uniqueVisitors.toLocaleString(), icon: 'ri-user-line', color: 'info' },
    { label: 'Conversions', value: KPI_SUMMARY.totalConversions, icon: 'ri-checkbox-circle-line', color: 'success' },
    { label: 'Conversion Rate', value: KPI_SUMMARY.conversionRate, icon: 'ri-percent-line', color: 'warning' },
    { label: 'Total Spend', value: KPI_SUMMARY.totalSpend, icon: 'ri-money-dollar-circle-line', color: 'danger' },
    { label: 'Pipeline Influenced', value: KPI_SUMMARY.pipelineInfluenced, icon: 'ri-funds-line', color: 'teal' },
];

const AnalyticsPage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const trafficChartOptions = {
        chart: { type: 'area', height: 320, toolbar: { show: false }, fontFamily: 'DM Sans', foreColor: '#646A71' },
        grid: { borderColor: 'var(--bs-gray-200)' },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: SITE_TRAFFIC_WEEKLY.categories, labels: { style: { fontSize: '11px' } } },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        colors: ['#c85a1a', '#25cba1', '#3862e0', '#ffc107'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
        legend: { position: 'top', fontSize: '13px', markers: { size: 5 }, itemMargin: { vertical: 4 } },
        dataLabels: { enabled: false },
        tooltip: { shared: true },
    };

    const channelDonutOptions = {
        chart: { type: 'donut', height: 280, fontFamily: 'DM Sans' },
        labels: TRAFFIC_SOURCES.map(s => s.source),
        colors: ['#c85a1a', '#0077b5', '#4285f4', '#ff9800', '#6c757d', '#25cba1', '#e91e63'],
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '60%' } } },
    };

    const channelStats = useMemo(() => {
        const stats = {};
        Object.keys(CHANNEL_SUMMARY).forEach(ch => { stats[ch] = { impressions: 0, clicks: 0, conversions: 0, cost: 0 }; });
        CAMPAIGN_PERFORMANCE.forEach(c => {
            const ch = c.channel;
            if (!stats[ch]) return;
            stats[ch].impressions += c.impressions;
            stats[ch].clicks += c.clicks;
            stats[ch].conversions += c.conversions;
            const costNum = parseInt((c.cost || '').replace(/[^0-9]/g, '')) || 0;
            stats[ch].cost += costNum;
        });
        return stats;
    }, []);

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="pg-title">Analytics &amp; Performance</h1>
                        <p className="text-muted mb-0">
                            Oct 22, 2026 – Jan 2027 &middot; All channels &middot; {KPI_SUMMARY.totalConversions} conversions
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Badge bg="primary" className="px-3 py-2">{KPI_SUMMARY.totalSessions.toLocaleString()} Sessions</Badge>
                        <Badge bg="success" className="px-3 py-2">{KPI_SUMMARY.conversionRate} CVR</Badge>
                    </div>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* KPI Cards */}
                <Row className="mb-4">
                    {kpiCards.map((k, i) => (
                        <Col xl={2} md={4} sm={6} key={i} className="mb-3">
                            <Card className="card-border mb-0 h-100">
                                <Card.Body className="text-center py-3">
                                    <i className={`${k.icon} fs-3 text-${k.color} d-block mb-1`} />
                                    <div className="fs-3 fw-bold">{k.value}</div>
                                    <div className="fs-8 text-muted">{k.label}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Tabs */}
                <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav.Item><Nav.Link eventKey="overview">Overview</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="campaigns">Campaign Performance</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="postcards">Post Cards &amp; Direct Mail</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="paid">Paid Media</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="social">Social &amp; Email</Nav.Link></Nav.Item>
                </Nav>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        <Row className="mb-4">
                            <Col xl={8}>
                                <Card className="card-border mb-4">
                                    <Card.Header><h6>Site Traffic — Weekly Sessions</h6></Card.Header>
                                    <Card.Body>
                                        <ReactApexChart options={trafficChartOptions} series={SITE_TRAFFIC_WEEKLY.series} type="area" height={320} />
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xl={4}>
                                <Card className="card-border mb-4 h-100">
                                    <Card.Header><h6>Traffic Sources</h6></Card.Header>
                                    <Card.Body>
                                        <ReactApexChart options={channelDonutOptions} series={TRAFFIC_SOURCES.map(s => s.sessions)} type="donut" height={280} />
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Card className="card-border mb-4">
                            <Card.Header><h6>Traffic Breakdown</h6></Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Source</th>
                                            <th className="text-end">Sessions</th>
                                            <th style={{ width: '30%' }}>Share</th>
                                            <th className="text-end">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TRAFFIC_SOURCES.map((s, i) => (
                                            <tr key={i}>
                                                <td className="fw-medium">{s.source}</td>
                                                <td className="text-end">{s.sessions.toLocaleString()}</td>
                                                <td><ProgressBar variant="primary" now={s.pct} style={{ height: 6 }} /><span className="fs-8 text-muted">{s.pct}%</span></td>
                                                <td className="text-end"><HkBadge bg={s.trend === 'new' ? 'info' : 'success'} soft size="sm">{s.trend}</HkBadge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>

                        {/* Channel Performance Summary */}
                        <Row>
                            {Object.entries(CHANNEL_SUMMARY).map(([key, ch]) => {
                                const s = channelStats[key];
                                if (!s) return null;
                                return (
                                    <Col xl={3} md={6} key={key} className="mb-4">
                                        <Card className={`card-border mb-0 h-100 border-top border-${ch.color} border-3`}>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <i className={`${ch.icon} fs-4 text-${ch.color} me-2`} />
                                                        <span className="fw-medium">{ch.label}</span>
                                                    </div>
                                                    <HkBadge bg={ch.color} soft size="sm">{s.conversions} CVs</HkBadge>
                                                </div>
                                                <div className="d-flex justify-content-between fs-8 text-muted mt-3">
                                                    <span>{s.impressions.toLocaleString()} impr.</span>
                                                    <span>{s.clicks.toLocaleString()} clicks</span>
                                                    <span>{s.cost > 0 ? `$${s.cost.toLocaleString()}` : 'Free'}</span>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>

                        <Row className="mb-4">
                            <Col md={4}>
                                <Card className="card-border mb-0 h-100">
                                    <Card.Body className="text-center py-4">
                                        <div className="fs-8 text-muted text-uppercase mb-1">Avg Session Duration</div>
                                        <div className="fs-2 fw-bold">{KPI_SUMMARY.avgSessionDuration}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="card-border mb-0 h-100">
                                    <Card.Body className="text-center py-4">
                                        <div className="fs-8 text-muted text-uppercase mb-1">Bounce Rate</div>
                                        <div className="fs-2 fw-bold">{KPI_SUMMARY.bounceRate}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="card-border mb-0 h-100">
                                    <Card.Body className="text-center py-4">
                                        <div className="fs-8 text-muted text-uppercase mb-1">Pages / Session</div>
                                        <div className="fs-2 fw-bold">{KPI_SUMMARY.pagesPerSession}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}

                {/* Campaign Performance Tab */}
                {activeTab === 'campaigns' && (
                    <Card className="card-border mb-4">
                        <Card.Header className="card-header-action">
                            <h6>All Campaign Performance</h6>
                            <HkBadge bg="primary" soft>{CAMPAIGN_PERFORMANCE.length} campaigns</HkBadge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0" size="sm">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Campaign</th>
                                            <th>Channel</th>
                                            <th className="text-end">Impressions</th>
                                            <th className="text-end">Clicks</th>
                                            <th className="text-end">CTR</th>
                                            <th className="text-end">Conversions</th>
                                            <th className="text-end">Cost</th>
                                            <th className="text-end">CPA</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CAMPAIGN_PERFORMANCE.map((c, i) => {
                                            const ch = CHANNEL_SUMMARY[c.channel] || {};
                                            return (
                                                <tr key={i}>
                                                    <td className="fw-medium">{c.name}</td>
                                                    <td><HkBadge bg={ch.color || 'secondary'} soft size="sm">{ch.label || c.channel}</HkBadge></td>
                                                    <td className="text-end text-muted">{c.impressions.toLocaleString()}</td>
                                                    <td className="text-end">{c.clicks.toLocaleString()}</td>
                                                    <td className="text-end">{c.ctr}</td>
                                                    <td className="text-end fw-medium">{c.conversions}</td>
                                                    <td className="text-end text-muted">{c.cost}</td>
                                                    <td className="text-end">{c.cpa}</td>
                                                    <td>
                                                        <HkBadge bg={c.status === 'active' ? 'success' : c.status === 'planned' ? 'primary' : 'secondary'} soft size="sm">
                                                            {c.status}
                                                        </HkBadge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="fw-bold">
                                        <tr>
                                            <td>Totals</td>
                                            <td />
                                            <td className="text-end">{CAMPAIGN_PERFORMANCE.reduce((s, c) => s + c.impressions, 0).toLocaleString()}</td>
                                            <td className="text-end">{CAMPAIGN_PERFORMANCE.reduce((s, c) => s + c.clicks, 0).toLocaleString()}</td>
                                            <td />
                                            <td className="text-end">{CAMPAIGN_PERFORMANCE.reduce((s, c) => s + c.conversions, 0).toLocaleString()}</td>
                                            <td className="text-end">{KPI_SUMMARY.totalSpend}</td>
                                            <td className="text-end">{KPI_SUMMARY.costPerConversion}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                )}

                {/* Post Cards & Direct Mail Tab */}
                {activeTab === 'postcards' && (
                    <>
                        <Row className="mb-4">
                            {POSTCARD_METRICS.waves.map((w, i) => (
                                <Col xl={4} key={i} className="mb-4">
                                    <Card className={`card-border mb-0 h-100 border-top border-3 ${w.delivered > 0 ? 'border-success' : 'border-secondary'}`}>
                                        <Card.Body>
                                            <h6 className="mb-1">{w.name}</h6>
                                            <div className="fs-8 text-muted mb-3">{w.timeline}</div>
                                            <Row>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Sent</div>
                                                    <div className="fw-bold">{w.sent}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Delivered</div>
                                                    <div className="fw-bold">{w.delivered}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Response Rate</div>
                                                    <div className="fw-bold">{w.responseRate}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Qualified Leads</div>
                                                    <div className="fw-bold text-success">{w.qualified}</div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="fs-8 text-muted">Total Cost</div>
                                                    <div className="fw-bold">{w.cost}</div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="fs-8 text-muted">Cost / Piece</div>
                                                    <div className="fw-bold">{w.cpm}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Card className="card-border mb-4">
                            <Card.Header><h6>QR Code &amp; URL Tracking</h6></Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Tracking Code</th>
                                            <th>Landing URL</th>
                                            <th className="text-end">QR Scans</th>
                                            <th className="text-end">Web Visits</th>
                                            <th className="text-end">Conversions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {POSTCARD_METRICS.trackingCodes.map((t, i) => (
                                            <tr key={i}>
                                                <td className="fw-medium font-monospace">{t.code}</td>
                                                <td className="text-muted fs-8">{t.url}</td>
                                                <td className="text-end">{t.scans}</td>
                                                <td className="text-end">{t.webVisits}</td>
                                                <td className="text-end fw-bold text-success">{t.conversions}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                )}

                {/* Paid Media Tab */}
                {activeTab === 'paid' && (
                    <>
                        <Row className="mb-4">
                            {PAID_MEDIA_DETAIL.map((p, i) => (
                                <Col xl={4} key={i} className="mb-4">
                                    <Card className="card-border mb-0 h-100 border-top border-danger border-3">
                                        <Card.Body>
                                            <h6 className="mb-3">{p.platform}</h6>
                                            <Row>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Spend</div>
                                                    <div className="fs-4 fw-bold">{p.spend}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">ROAS</div>
                                                    <div className="fs-4 fw-bold text-success">{p.roas}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Impressions</div>
                                                    <div className="fw-medium">{p.impressions}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Clicks</div>
                                                    <div className="fw-medium">{p.clicks.toLocaleString()}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">CTR</div>
                                                    <div className="fw-medium">{p.ctr}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">CPC</div>
                                                    <div className="fw-medium">{p.cpc}</div>
                                                </Col>
                                                <Col xs={12}>
                                                    <div className="fs-8 text-muted">Conversions</div>
                                                    <div className="fw-bold text-success">{p.conversions}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Card className="card-border mb-4">
                            <Card.Header><h6>Paid Campaign Breakdown</h6></Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Campaign</th>
                                            <th className="text-end">Impressions</th>
                                            <th className="text-end">Clicks</th>
                                            <th className="text-end">CTR</th>
                                            <th className="text-end">Conversions</th>
                                            <th className="text-end">Cost</th>
                                            <th className="text-end">CPA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CAMPAIGN_PERFORMANCE.filter(c => c.channel === 'paid').map((c, i) => (
                                            <tr key={i}>
                                                <td className="fw-medium">{c.name}</td>
                                                <td className="text-end text-muted">{c.impressions.toLocaleString()}</td>
                                                <td className="text-end">{c.clicks.toLocaleString()}</td>
                                                <td className="text-end">{c.ctr}</td>
                                                <td className="text-end fw-bold">{c.conversions}</td>
                                                <td className="text-end">{c.cost}</td>
                                                <td className="text-end">{c.cpa}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                )}

                {/* Social & Email Tab */}
                {activeTab === 'social' && (
                    <>
                        <Row className="mb-4">
                            {Object.entries(SOCIAL_ENGAGEMENT).map(([platform, s]) => (
                                <Col xl={4} key={platform} className="mb-4">
                                    <Card className="card-border mb-0 h-100 border-top border-info border-3">
                                        <Card.Body>
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <i className={`ri-${platform}-fill fs-3 text-info`} />
                                                <h6 className="mb-0 text-capitalize">{platform}</h6>
                                            </div>
                                            <Row>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Followers</div>
                                                    <div className="fw-bold">{s.followers}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Posts</div>
                                                    <div className="fw-bold">{s.posts}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Impressions</div>
                                                    <div className="fw-bold">{s.impressions.toLocaleString()}</div>
                                                </Col>
                                                <Col xs={6} className="mb-2">
                                                    <div className="fs-8 text-muted">Engagement</div>
                                                    <div className="fw-bold">{s.engagement}</div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="fs-8 text-muted">Link Clicks</div>
                                                    <div className="fw-bold text-primary">{s.clicks.toLocaleString()}</div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="fs-8 text-muted">Profile Views</div>
                                                    <div className="fw-bold">{s.profileViews.toLocaleString()}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Card className="card-border mb-4">
                            <Card.Header className="card-header-action">
                                <h6>Email Campaign Performance</h6>
                                <div className="d-flex gap-2">
                                    <HkBadge bg="success" soft>{EMAIL_METRICS.totals.openRate} open rate</HkBadge>
                                    <HkBadge bg="primary" soft>{EMAIL_METRICS.totals.clickRate} click rate</HkBadge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Campaign</th>
                                            <th className="text-end">Sent</th>
                                            <th className="text-end">Opened</th>
                                            <th className="text-end">Open Rate</th>
                                            <th className="text-end">Clicked</th>
                                            <th className="text-end">Click Rate</th>
                                            <th className="text-end">Unsubs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {EMAIL_METRICS.campaigns.map((e, i) => (
                                            <tr key={i}>
                                                <td className="fw-medium">{e.name}</td>
                                                <td className="text-end text-muted">{e.sent}</td>
                                                <td className="text-end">{e.opened}</td>
                                                <td className="text-end">{e.openRate}</td>
                                                <td className="text-end fw-medium">{e.clicked}</td>
                                                <td className="text-end">{e.clickRate}</td>
                                                <td className="text-end text-muted">{e.unsubscribed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="fw-bold">
                                        <tr>
                                            <td>Totals</td>
                                            <td className="text-end">{EMAIL_METRICS.totals.sent.toLocaleString()}</td>
                                            <td className="text-end">{EMAIL_METRICS.totals.opened.toLocaleString()}</td>
                                            <td className="text-end">{EMAIL_METRICS.totals.openRate}</td>
                                            <td className="text-end">{EMAIL_METRICS.totals.clicked}</td>
                                            <td className="text-end">{EMAIL_METRICS.totals.clickRate}</td>
                                            <td className="text-end">{EMAIL_METRICS.totals.unsubscribed} ({EMAIL_METRICS.totals.unsubRate})</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                )}
            </div>
        </Container>
    );
};

export default AnalyticsPage;
