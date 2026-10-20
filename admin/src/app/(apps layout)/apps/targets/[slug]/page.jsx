"use client"
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge, Card, Col, Container, Nav, OverlayTrigger, Row, Tab, Table, Tooltip } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { ArrowLeft, ArrowRight, ExternalLink as ExternalLinkIcon } from 'react-feather';
import { getAccountBySlug, TARGET_ACCOUNTS, SECTORS, PRIORITY_MAP, PIPELINE_STAGES } from '@/data/targets/target-data';
import { COMPETITORS } from '@/data/competitors/competitor-data';

const WEATHER_DATA = {
    'Paramount, CA': { temp: '72°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'South Gate, CA': { temp: '73°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'Placentia, CA': { temp: '74°F', condition: 'Partly Cloudy', icon: 'ri-sun-cloudy-line' },
    'Garden Grove, CA': { temp: '73°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'San Bernardino, CA': { temp: '78°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Simi Valley, CA': { temp: '70°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Fontana, CA': { temp: '77°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'Anaheim, CA': { temp: '72°F', condition: 'Partly Cloudy', icon: 'ri-sun-cloudy-line' },
    'Santa Ana, CA': { temp: '71°F', condition: 'Overcast', icon: 'ri-cloudy-line' },
    'Phoenix, AZ': { temp: '89°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Corona, CA': { temp: '76°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'Santa Clarita, CA': { temp: '75°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'Pomona, CA': { temp: '74°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'City of Industry, CA': { temp: '73°F', condition: 'Hazy', icon: 'ri-haze-line' },
    'La Puente, CA': { temp: '73°F', condition: 'Hazy', icon: 'ri-haze-line' },
    'Ontario, CA': { temp: '76°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'Chino, CA': { temp: '75°F', condition: 'Sunny', icon: 'ri-sun-line' },
    'Tempe, AZ': { temp: '88°F', condition: 'Clear', icon: 'ri-sun-line' },
    'San Jose, CA': { temp: '68°F', condition: 'Fog', icon: 'ri-mist-line' },
    'Fremont, CA': { temp: '67°F', condition: 'Fog', icon: 'ri-mist-line' },
    'Sparks, NV': { temp: '62°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Lancaster, CA': { temp: '80°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Hayward, CA': { temp: '66°F', condition: 'Overcast', icon: 'ri-cloudy-line' },
    'Walnut Creek, CA': { temp: '69°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Mayfield, OH': { temp: '55°F', condition: 'Cloudy', icon: 'ri-cloudy-line' },
    'Carson, CA': { temp: '70°F', condition: 'Marine Layer', icon: 'ri-cloudy-line' },
    'Gardena, CA': { temp: '70°F', condition: 'Marine Layer', icon: 'ri-cloudy-line' },
    'Stockton, CA': { temp: '72°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Las Vegas, NV': { temp: '85°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Carson City, NV': { temp: '60°F', condition: 'Clear', icon: 'ri-sun-line' },
    'Normal, IL': { temp: '58°F', condition: 'Cloudy', icon: 'ri-cloudy-line' },
    'Charlotte, NC': { temp: '65°F', condition: 'Partly Cloudy', icon: 'ri-sun-cloudy-line' },
    'Alhambra, CA': { temp: '73°F', condition: 'Hazy', icon: 'ri-haze-line' },
    'Portland, OR': { temp: '55°F', condition: 'Rain', icon: 'ri-rainy-line' },
    'Rancho Dominguez, CA': { temp: '70°F', condition: 'Marine Layer', icon: 'ri-cloudy-line' },
};

const LEVEL_ORDER = ['executive', 'vp', 'director', 'manager', 'coordinator', 'analyst'];
const LEVEL_LABELS = { executive: 'C-Suite / Executive', vp: 'Vice President', director: 'Director', manager: 'Manager', coordinator: 'Coordinator', analyst: 'Analyst' };

const TOUCH_ICONS = {
    call: { icon: 'ri-phone-line', color: 'success', label: 'Phone Call' },
    email: { icon: 'ri-mail-send-line', color: 'info', label: 'Email' },
    linkedin: { icon: 'ri-linkedin-box-fill', color: 'primary', label: 'LinkedIn' },
    meeting: { icon: 'ri-calendar-check-line', color: 'warning', label: 'Meeting' },
    research: { icon: 'ri-search-eye-line', color: 'secondary', label: 'Research' },
    note: { icon: 'ri-sticky-note-line', color: 'pumpkin', label: 'Note' },
};

export default function AccountDetailPage() {
    const { slug } = useParams();
    const account = getAccountBySlug(slug);

    if (!account) {
        return (
            <Container fluid="xxl" className="py-7">
                <div className="text-center py-5">
                    <i className="ri-building-2-line fs-1 text-muted d-block mb-3" />
                    <h3>Account Not Found</h3>
                    <p className="text-muted mb-4">No account matches this URL.</p>
                    <Link href="/apps/targets" className="btn btn-primary">Back to Target Accounts</Link>
                </div>
            </Container>
        );
    }

    const idx = TARGET_ACCOUNTS.findIndex(t => t.slug === slug);
    const prev = idx > 0 ? TARGET_ACCOUNTS[idx - 1] : null;
    const next = idx < TARGET_ACCOUNTS.length - 1 ? TARGET_ACCOUNTS[idx + 1] : null;

    const sector = SECTORS[account.cat] || {};
    const priority = PRIORITY_MAP[account.pri] || { label: account.pri, color: 'secondary' };
    const stage = PIPELINE_STAGES[account.pipelineStage] || {};
    const weather = WEATHER_DATA[account.loc] || { temp: '—', condition: 'Unknown', icon: 'ri-question-line' };

    const sectorCompetitors = COMPETITORS.filter(c =>
        c.overlapAccounts?.some(name => name === account.n)
    );

    const contactsByLevel = LEVEL_ORDER.reduce((acc, level) => {
        const contacts = (account.contacts || []).filter(c => c.level === level);
        if (contacts.length > 0) acc[level] = contacts;
        return acc;
    }, {});

    return (
        <Container fluid="xxl">
            {/* Breadcrumb + Nav */}
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Link href="/apps/targets" className="btn btn-sm btn-flush-dark btn-icon btn-rounded flush-soft-hover">
                                <ArrowLeft size={16} />
                            </Link>
                            <span className="fs-8 text-muted">Target Accounts</span>
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <h1 className="pg-title mb-0">{account.n}</h1>
                            {account.ticker && (
                                <HkBadge bg="dark" size="sm" className="font-monospace">{account.ticker}</HkBadge>
                            )}
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="d-inline-flex align-items-center gap-1 text-muted fs-7">
                                <i className="ri-map-pin-line" /> {account.loc}
                            </span>
                            <span className="d-inline-flex align-items-center gap-1 text-muted fs-7">
                                <i className={weather.icon} /> {weather.temp} {weather.condition}
                            </span>
                            <HkBadge bg={sector.color || 'secondary'} soft size="sm">{sector.label || account.cat}</HkBadge>
                            <HkBadge bg={priority.color} soft size="sm">{priority.label}</HkBadge>
                            <HkBadge bg={stage.color || 'secondary'} soft size="sm">{stage.label || account.pipelineStage}</HkBadge>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {account.estDealValue && (
                            <div className="text-end me-3">
                                <div className="fs-8 text-muted text-uppercase">Est. Deal Value</div>
                                <div className="fs-3 fw-bold text-dark">{account.estDealValue}</div>
                            </div>
                        )}
                        <div className="d-flex gap-1">
                            {prev && (
                                <Link href={`/apps/targets/${prev.slug}`} className="btn btn-sm btn-flush-dark btn-icon btn-rounded flush-soft-hover">
                                    <ArrowLeft size={14} />
                                </Link>
                            )}
                            {next && (
                                <Link href={`/apps/targets/${next.slug}`} className="btn btn-sm btn-flush-dark btn-icon btn-rounded flush-soft-hover">
                                    <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* External Links */}
                <div className="d-flex gap-2 mt-3 flex-wrap">
                    {account.website && (
                        <a href={account.website} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                            <i className="ri-global-line" /> Website <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {account.linkedin && (
                        <a href={account.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1">
                            <i className="ri-linkedin-box-fill" /> LinkedIn <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {account.socialLinks?.twitter && (
                        <a href={account.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1">
                            <i className="ri-twitter-x-line" /> Twitter <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {account.socialLinks?.facebook && (
                        <a href={account.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1">
                            <i className="ri-facebook-circle-fill" /> Facebook <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {account.socialLinks?.instagram && (
                        <a href={account.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1">
                            <i className="ri-instagram-line" /> Instagram <ExternalLinkIcon size={12} />
                        </a>
                    )}
                    {account.phone && (
                        <a href={`tel:${account.phone}`} className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1">
                            <i className="ri-phone-line" /> {account.phone}
                        </a>
                    )}
                </div>
            </div>

            <div className="hk-pg-body">
                <Tab.Container defaultActiveKey="overview">
                    <Nav variant="tabs" className="nav-light nav-line mb-4">
                        <Nav.Item><Nav.Link eventKey="overview"><span className="nav-link-text">Overview</span></Nav.Link></Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="contacts">
                                <span className="nav-link-text">Contacts {account.contacts?.length > 0 && <HkBadge bg="primary" soft size="sm" className="ms-1">{account.contacts.length}</HkBadge>}</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="activity">
                                <span className="nav-link-text">Activity {account.touchLog?.length > 0 && <HkBadge bg="info" soft size="sm" className="ms-1">{account.touchLog.length}</HkBadge>}</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        {/* OVERVIEW TAB */}
                        <Tab.Pane eventKey="overview">
                            <Row>
                                {/* Left Column */}
                                <Col lg={8}>
                                    {/* Company Snapshot */}
                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Company Snapshot</h6></Card.Header>
                                        <Card.Body>
                                            {account.description && <p className="mb-3">{account.description}</p>}
                                            <Row>
                                                {account.founded && (
                                                    <Col sm={3} xs={6} className="mb-3">
                                                        <div className="fs-8 text-uppercase text-muted mb-1">Founded</div>
                                                        <div className="fw-medium">{account.founded}</div>
                                                    </Col>
                                                )}
                                                {account.revenue && (
                                                    <Col sm={3} xs={6} className="mb-3">
                                                        <div className="fs-8 text-uppercase text-muted mb-1">Revenue</div>
                                                        <div className="fw-medium">{account.revenue}</div>
                                                    </Col>
                                                )}
                                                {account.employees && (
                                                    <Col sm={3} xs={6} className="mb-3">
                                                        <div className="fs-8 text-uppercase text-muted mb-1">Employees</div>
                                                        <div className="fw-medium">{account.employees}</div>
                                                    </Col>
                                                )}
                                                <Col sm={3} xs={6} className="mb-3">
                                                    <div className="fs-8 text-uppercase text-muted mb-1">Sector</div>
                                                    <div className="fw-medium">{sector.label || account.cat}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>

                                    {/* Steel Requirements */}
                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Steel Requirements</h6></Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col sm={6} className="mb-3">
                                                    <div className="fs-8 text-uppercase text-muted mb-1">Applications</div>
                                                    <div className="fw-medium">{account.needs}</div>
                                                </Col>
                                                <Col sm={6} className="mb-3">
                                                    <div className="fs-8 text-uppercase text-muted mb-1">Steel Products</div>
                                                    <div className="fw-medium">{account.steel}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>

                                    {/* News & Headlines */}
                                    {account.news?.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header><h6 className="mb-0">News & Headlines</h6></Card.Header>
                                            <Card.Body className="p-0">
                                                <div className="list-group list-group-flush">
                                                    {account.news.map((n, i) => (
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

                                    {/* Competing For This Account */}
                                    {sectorCompetitors.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header><h6 className="mb-0">Competitors Targeting This Account</h6></Card.Header>
                                            <Card.Body className="p-0">
                                                <Table responsive hover className="mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>Competitor</th>
                                                            <th>Type</th>
                                                            <th>Threat</th>
                                                            <th>Key Differentiator</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sectorCompetitors.map((c, i) => (
                                                            <tr key={i} className="cursor-pointer" onClick={() => window.location.href = `/apps/competitors/${c.slug}`} style={{ cursor: 'pointer' }}>
                                                                <td className="fw-medium">{c.name}</td>
                                                                <td className="text-muted fs-8">{c.type}</td>
                                                                <td><HkBadge bg={c.threat === 'high' ? 'danger' : c.threat === 'medium' ? 'warning' : 'success'} soft size="sm">{c.threat}</HkBadge></td>
                                                                <td className="fs-8 text-muted">{c.keyDifferentiator}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Col>

                                {/* Right Column */}
                                <Col lg={4}>
                                    {/* Pipeline Position */}
                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Pipeline Position</h6></Card.Header>
                                        <Card.Body>
                                            <div className="d-flex gap-1 mb-3">
                                                {Object.entries(PIPELINE_STAGES).map(([key, s]) => (
                                                    <div key={key} className="flex-1">
                                                        <div
                                                            className={`rounded-pill ${key === account.pipelineStage ? `bg-${s.color}` : 'bg-light'}`}
                                                            style={{ height: 6 }}
                                                        />
                                                        <div className={`fs-9 text-center mt-1 ${key === account.pipelineStage ? `text-${s.color} fw-medium` : 'text-muted'}`}>
                                                            {s.label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    {/* Location & Weather */}
                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Location</h6></Card.Header>
                                        <Card.Body>
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="avatar avatar-icon avatar-md avatar-soft-info avatar-rounded">
                                                    <span className="initial-wrap"><i className={weather.icon + ' fs-4'} /></span>
                                                </div>
                                                <div>
                                                    <div className="fw-medium">{account.loc}</div>
                                                    <div className="text-muted fs-7">{weather.temp} &middot; {weather.condition}</div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    {/* Notes */}
                                    {account.notes?.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header className="card-header-action">
                                                <h6 className="mb-0">Notes</h6>
                                                <HkBadge bg="smoke" soft size="sm">{account.notes.length}</HkBadge>
                                            </Card.Header>
                                            <Card.Body className="p-0">
                                                <div className="list-group list-group-flush">
                                                    {account.notes.map((note, i) => (
                                                        <div key={i} className="list-group-item px-4 py-3">
                                                            <div className="d-flex gap-2">
                                                                <i className="ri-sticky-note-line text-warning flex-shrink-0 mt-1" />
                                                                <span className="fs-7">{note}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    {/* Primary Contact Quick View */}
                                    {account.contacts?.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header><h6 className="mb-0">Primary Contact</h6></Card.Header>
                                            <Card.Body>
                                                {account.contacts.filter(c => c.isPrimary).map((c, i) => (
                                                    <div key={i}>
                                                        <div className="d-flex align-items-center gap-3 mb-3">
                                                            <div className="avatar avatar-sm avatar-primary avatar-rounded">
                                                                <span className="initial-wrap">{c.name.split(' ').map(n => n[0]).join('')}</span>
                                                            </div>
                                                            <div>
                                                                <div className="fw-medium">{c.name}</div>
                                                                <div className="fs-8 text-muted">{c.title}</div>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex flex-column gap-1">
                                                            {c.email && (
                                                                <a href={`mailto:${c.email}`} className="fs-8 text-muted d-flex align-items-center gap-2">
                                                                    <i className="ri-mail-line" /> {c.email}
                                                                </a>
                                                            )}
                                                            {c.phone && (
                                                                <a href={`tel:${c.phone}`} className="fs-8 text-muted d-flex align-items-center gap-2">
                                                                    <i className="ri-phone-line" /> {c.phone}
                                                                </a>
                                                            )}
                                                            {c.linkedin && (
                                                                <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="fs-8 text-primary d-flex align-items-center gap-2">
                                                                    <i className="ri-linkedin-box-fill" /> LinkedIn Profile
                                                                </a>
                                                            )}
                                                            {c.birthday && (
                                                                <span className="fs-8 text-muted d-flex align-items-center gap-2">
                                                                    <i className="ri-cake-2-line" /> {c.birthday}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Col>
                            </Row>
                        </Tab.Pane>

                        {/* CONTACTS TAB */}
                        <Tab.Pane eventKey="contacts">
                            {account.contacts?.length === 0 ? (
                                <Card className="card-border">
                                    <Card.Body className="text-center py-5">
                                        <i className="ri-contacts-book-line fs-1 text-muted d-block mb-3" />
                                        <h5>No Contacts Yet</h5>
                                        <p className="text-muted">Add contacts to build your relationship map for {account.n}.</p>
                                        <button className="btn btn-primary btn-sm" disabled>
                                            <i className="ri-user-add-line me-1" /> Add Contact
                                        </button>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <>
                                    {Object.entries(contactsByLevel).map(([level, contacts]) => (
                                        <div key={level} className="mb-4">
                                            <h6 className="text-uppercase fs-8 text-muted mb-3">{LEVEL_LABELS[level] || level}</h6>
                                            <Row>
                                                {contacts.map((c, i) => (
                                                    <Col lg={4} md={6} key={i} className="mb-3">
                                                        <Card className={`card-border mb-0 h-100 ${c.isPrimary ? 'border-primary border-2' : ''}`}>
                                                            <Card.Body>
                                                                <div className="d-flex align-items-center gap-3 mb-3">
                                                                    <div className={`avatar avatar-sm ${c.isPrimary ? 'avatar-primary' : 'avatar-soft-primary'} avatar-rounded`}>
                                                                        <span className="initial-wrap">{c.name.split(' ').map(n => n[0]).join('')}</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-medium d-flex align-items-center gap-2">
                                                                            {c.name}
                                                                            {c.isPrimary && <HkBadge bg="primary" size="sm">Primary</HkBadge>}
                                                                        </div>
                                                                        <div className="fs-8 text-muted">{c.title}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex flex-column gap-2">
                                                                    {c.email && (
                                                                        <a href={`mailto:${c.email}`} className="fs-8 text-muted d-flex align-items-center gap-2 text-truncate">
                                                                            <i className="ri-mail-line flex-shrink-0" /> {c.email}
                                                                        </a>
                                                                    )}
                                                                    {c.phone && (
                                                                        <a href={`tel:${c.phone}`} className="fs-8 text-muted d-flex align-items-center gap-2">
                                                                            <i className="ri-phone-line flex-shrink-0" /> {c.phone}
                                                                        </a>
                                                                    )}
                                                                    {c.linkedin && (
                                                                        <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="fs-8 text-primary d-flex align-items-center gap-2">
                                                                            <i className="ri-linkedin-box-fill flex-shrink-0" /> LinkedIn
                                                                        </a>
                                                                    )}
                                                                    {c.birthday && (
                                                                        <span className="fs-8 text-muted d-flex align-items-center gap-2">
                                                                            <i className="ri-cake-2-line flex-shrink-0" /> Birthday: {c.birthday}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    ))}
                                </>
                            )}
                        </Tab.Pane>

                        {/* ACTIVITY TAB */}
                        <Tab.Pane eventKey="activity">
                            <Row>
                                <Col lg={8}>
                                    <Card className="card-border mb-4">
                                        <Card.Header className="card-header-action">
                                            <h6 className="mb-0">Touch Log</h6>
                                            <button className="btn btn-sm btn-primary" disabled>
                                                <i className="ri-add-line me-1" /> Log Activity
                                            </button>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            {account.touchLog?.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <i className="ri-history-line fs-1 text-muted d-block mb-3" />
                                                    <h5>No Activity Yet</h5>
                                                    <p className="text-muted">Start logging touches with {account.n}.</p>
                                                </div>
                                            ) : (
                                                <div className="timeline-activity px-4 py-3">
                                                    {account.touchLog.map((t, i) => {
                                                        const cfg = TOUCH_ICONS[t.type] || TOUCH_ICONS.note;
                                                        return (
                                                            <div key={i} className="d-flex gap-3 mb-4">
                                                                <div className={`avatar avatar-icon avatar-xs avatar-soft-${cfg.color} avatar-rounded flex-shrink-0`}>
                                                                    <span className="initial-wrap"><i className={cfg.icon} /></span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <div>
                                                                            <HkBadge bg={cfg.color} soft size="sm" className="mb-1">{cfg.label}</HkBadge>
                                                                            <p className="mb-0 fs-7">{t.note}</p>
                                                                        </div>
                                                                        <div className="text-end flex-shrink-0 ms-3">
                                                                            <div className="fs-8 text-muted">{formatDate(t.date)}</div>
                                                                            <div className="fs-9 text-muted">{t.who}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={4}>
                                    {/* Notes Sidebar */}
                                    <Card className="card-border mb-4">
                                        <Card.Header className="card-header-action">
                                            <h6 className="mb-0">Notes</h6>
                                            <button className="btn btn-sm btn-soft-warning" disabled>
                                                <i className="ri-add-line me-1" /> Add Note
                                            </button>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            {account.notes?.length > 0 ? (
                                                <div className="list-group list-group-flush">
                                                    {account.notes.map((note, i) => (
                                                        <div key={i} className="list-group-item px-4 py-3">
                                                            <div className="d-flex gap-2">
                                                                <i className="ri-sticky-note-line text-warning flex-shrink-0 mt-1" />
                                                                <span className="fs-7">{note}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-muted fs-8 mb-0">No notes yet</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>

                                    {/* Activity Summary */}
                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Activity Summary</h6></Card.Header>
                                        <Card.Body>
                                            {Object.entries(
                                                (account.touchLog || []).reduce((acc, t) => {
                                                    acc[t.type] = (acc[t.type] || 0) + 1;
                                                    return acc;
                                                }, {})
                                            ).map(([type, count], i) => {
                                                const cfg = TOUCH_ICONS[type] || TOUCH_ICONS.note;
                                                return (
                                                    <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="d-flex align-items-center gap-2 fs-7">
                                                            <i className={`${cfg.icon} text-${cfg.color}`} />
                                                            {cfg.label}
                                                        </span>
                                                        <HkBadge bg={cfg.color} soft size="sm">{count}</HkBadge>
                                                    </div>
                                                );
                                            })}
                                            {account.touchLog?.length === 0 && (
                                                <p className="text-muted fs-8 mb-0">No activity recorded</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </div>
        </Container>
    );
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
