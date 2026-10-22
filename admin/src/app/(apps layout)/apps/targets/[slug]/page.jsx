"use client"
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Card, Col, Container, Form, Modal, Nav, OverlayTrigger, Row, Tab, Table, Tooltip } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { ArrowLeft, ArrowRight, Edit2, ExternalLink as ExternalLinkIcon, Plus, Trash2, X } from 'react-feather';
import { SECTORS, PRIORITY_MAP, PIPELINE_STAGES, CONTACT_LEVELS, SOURCE_TYPES } from '@/data/targets/target-data';
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

const LEVEL_ORDER = ['executive', 'vp', 'director', 'manager', 'coordinator', 'analyst', 'other'];
const LEVEL_LABELS = { executive: 'C-Suite / Executive', vp: 'Vice President', director: 'Director', manager: 'Manager', coordinator: 'Coordinator', analyst: 'Analyst', other: 'Other' };

const TOUCH_ICONS = {
    call: { icon: 'ri-phone-line', color: 'success', label: 'Phone Call' },
    email: { icon: 'ri-mail-send-line', color: 'info', label: 'Email' },
    linkedin: { icon: 'ri-linkedin-box-fill', color: 'primary', label: 'LinkedIn' },
    meeting: { icon: 'ri-calendar-check-line', color: 'warning', label: 'Meeting' },
    research: { icon: 'ri-search-eye-line', color: 'secondary', label: 'Research' },
    note: { icon: 'ri-sticky-note-line', color: 'pumpkin', label: 'Note' },
};

const EMPTY_CONTACT = {
    name: '', title: '', email: '', phone: '', linkedin: '',
    birthday: '', level: 'manager', isPrimary: false,
    department: '', preferredContactMethod: 'email', notes: '',
};

const EMPTY_SOURCE = { field: '', sourceType: 'linkedin', detail: '', url: '' };

function SourceBadge({ source }) {
    const cfg = SOURCE_TYPES[source.sourceType] || SOURCE_TYPES.other;
    return (
        <OverlayTrigger placement="top" overlay={
            <Tooltip>
                <strong>{cfg.label}</strong>
                {source.detail && <><br />{source.detail}</>}
                {source.url && <><br /><em>{source.url}</em></>}
                {source.verifiedBy && <><br />Verified by {source.verifiedBy}</>}
            </Tooltip>
        }>
            <span className={`badge bg-soft-${cfg.color} text-${cfg.color} fw-normal ms-1`} style={{ cursor: 'help', fontSize: '0.65rem' }}>
                <i className={`${cfg.icon} me-1`} style={{ fontSize: '0.6rem' }} />{cfg.label}
            </span>
        </OverlayTrigger>
    );
}

function ContactCard({ contact, onEdit, onDelete }) {
    const initials = contact.name.split(' ').map(n => n[0]).join('');
    const sources = contact.dataSources || [];
    const getSource = (field) => sources.find(s => s.field === field);

    return (
        <Card className={`card-border mb-0 h-100 ${contact.isPrimary ? 'border-primary border-2' : ''}`} style={{ cursor: 'pointer' }}>
            <Card.Body>
                <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className={`avatar avatar-sm ${contact.isPrimary ? 'avatar-primary' : 'avatar-soft-primary'} avatar-rounded`}>
                            <span className="initial-wrap">{initials}</span>
                        </div>
                        <div>
                            <div className="fw-medium d-flex align-items-center gap-2">
                                {contact.name}
                                {contact.isPrimary && <HkBadge bg="primary" size="sm">Primary</HkBadge>}
                            </div>
                            <div className="fs-8 text-muted">{contact.title}</div>
                        </div>
                    </div>
                    <div className="d-flex gap-1">
                        <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover" onClick={(e) => { e.stopPropagation(); onEdit(contact); }}>
                            <Edit2 size={13} />
                        </Button>
                        <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover text-danger" onClick={(e) => { e.stopPropagation(); onDelete(contact); }}>
                            <Trash2 size={13} />
                        </Button>
                    </div>
                </div>
                <div className="d-flex flex-column gap-2">
                    {contact.email && (
                        <div className="fs-8 text-muted d-flex align-items-center gap-2 text-truncate">
                            <i className="ri-mail-line flex-shrink-0" />
                            <a href={`mailto:${contact.email}`} className="text-muted text-truncate" onClick={e => e.stopPropagation()}>{contact.email}</a>
                            {getSource('email') && <SourceBadge source={getSource('email')} />}
                        </div>
                    )}
                    {contact.phone && (
                        <div className="fs-8 text-muted d-flex align-items-center gap-2">
                            <i className="ri-phone-line flex-shrink-0" />
                            <a href={`tel:${contact.phone}`} className="text-muted" onClick={e => e.stopPropagation()}>{contact.phone}</a>
                            {getSource('phone') && <SourceBadge source={getSource('phone')} />}
                        </div>
                    )}
                    {contact.linkedin && (
                        <div className="fs-8 d-flex align-items-center gap-2">
                            <i className="ri-linkedin-box-fill flex-shrink-0 text-primary" />
                            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary" onClick={e => e.stopPropagation()}>LinkedIn</a>
                            {getSource('linkedin') && <SourceBadge source={getSource('linkedin')} />}
                        </div>
                    )}
                    {contact.birthday && (
                        <div className="fs-8 text-muted d-flex align-items-center gap-2">
                            <i className="ri-cake-2-line flex-shrink-0" /> Birthday: {contact.birthday}
                            {getSource('birthday') && <SourceBadge source={getSource('birthday')} />}
                        </div>
                    )}
                    {contact.department && (
                        <div className="fs-8 text-muted d-flex align-items-center gap-2">
                            <i className="ri-building-line flex-shrink-0" /> {contact.department}
                        </div>
                    )}
                    {sources.length > 0 && (
                        <div className="mt-1 pt-1 border-top">
                            <span className="fs-9 text-muted"><i className="ri-shield-check-line me-1" />{sources.length} sourced field{sources.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

function ContactModal({ show, onHide, onSave, contact, title }) {
    const [form, setForm] = useState(contact || EMPTY_CONTACT);
    const [sources, setSources] = useState(contact?.dataSources || []);
    const [showSourceForm, setShowSourceForm] = useState(false);
    const [newSource, setNewSource] = useState({ ...EMPTY_SOURCE });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleAddSource = () => {
        if (!newSource.field || !newSource.sourceType) return;
        setSources(prev => [...prev.filter(s => s.field !== newSource.field), { ...newSource }]);
        setNewSource({ ...EMPTY_SOURCE });
        setShowSourceForm(false);
    };

    const handleRemoveSource = (field) => setSources(prev => prev.filter(s => s.field !== field));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave({ ...form, dataSources: sources });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Full Name *</Form.Label>
                                <Form.Control size="sm" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Title</Form.Label>
                                <Form.Control size="sm" value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="e.g. VP of Purchasing" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Email</Form.Label>
                                <Form.Control size="sm" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Phone</Form.Label>
                                <Form.Control size="sm" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="(555) 123-4567" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">LinkedIn URL</Form.Label>
                                <Form.Control size="sm" value={form.linkedin} onChange={e => handleChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Level</Form.Label>
                                <Form.Select size="sm" value={form.level} onChange={e => handleChange('level', e.target.value)}>
                                    {Object.entries(CONTACT_LEVELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Primary?</Form.Label>
                                <Form.Check type="switch" checked={form.isPrimary} onChange={e => handleChange('isPrimary', e.target.checked)} label={form.isPrimary ? 'Yes' : 'No'} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Birthday</Form.Label>
                                <Form.Control size="sm" value={form.birthday || ''} onChange={e => handleChange('birthday', e.target.value)} placeholder="e.g. Mar 15" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Department</Form.Label>
                                <Form.Control size="sm" value={form.department || ''} onChange={e => handleChange('department', e.target.value)} placeholder="e.g. Procurement" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Preferred Contact</Form.Label>
                                <Form.Select size="sm" value={form.preferredContactMethod || 'email'} onChange={e => handleChange('preferredContactMethod', e.target.value)}>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="text">Text</option>
                                    <option value="other">Other</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Notes</Form.Label>
                                <Form.Control as="textarea" rows={2} size="sm" value={form.notes || ''} onChange={e => handleChange('notes', e.target.value)} />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Source Tracking Section */}
                    <div className="mt-4 pt-3 border-top">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-0 fs-7"><i className="ri-shield-check-line me-1" /> Data Sources</h6>
                                <span className="fs-9 text-muted">Track where each piece of info came from</span>
                            </div>
                            <Button variant="outline-primary" size="sm" onClick={() => setShowSourceForm(!showSourceForm)}>
                                <Plus size={12} className="me-1" /> Add Source
                            </Button>
                        </div>

                        {showSourceForm && (
                            <Card className="card-border bg-light mb-3">
                                <Card.Body className="py-2 px-3">
                                    <Row className="g-2 align-items-end">
                                        <Col md={3}>
                                            <Form.Label className="fs-9 mb-1">Field</Form.Label>
                                            <Form.Select size="sm" value={newSource.field} onChange={e => setNewSource(p => ({ ...p, field: e.target.value }))}>
                                                <option value="">Select field...</option>
                                                <option value="name">Name</option>
                                                <option value="title">Title</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Phone</option>
                                                <option value="linkedin">LinkedIn</option>
                                                <option value="birthday">Birthday</option>
                                                <option value="department">Department</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="fs-9 mb-1">Source</Form.Label>
                                            <Form.Select size="sm" value={newSource.sourceType} onChange={e => setNewSource(p => ({ ...p, sourceType: e.target.value }))}>
                                                {Object.entries(SOURCE_TYPES).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.label}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="fs-9 mb-1">Detail</Form.Label>
                                            <Form.Control size="sm" value={newSource.detail} onChange={e => setNewSource(p => ({ ...p, detail: e.target.value }))} placeholder="How / when" />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="fs-9 mb-1">URL</Form.Label>
                                            <Form.Control size="sm" value={newSource.url} onChange={e => setNewSource(p => ({ ...p, url: e.target.value }))} placeholder="Link" />
                                        </Col>
                                        <Col md={1}>
                                            <Button variant="primary" size="sm" onClick={handleAddSource} disabled={!newSource.field} className="w-100">
                                                <i className="ri-check-line" />
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {sources.length > 0 ? (
                            <div className="d-flex flex-column gap-1">
                                {sources.map((s, i) => {
                                    const cfg = SOURCE_TYPES[s.sourceType] || SOURCE_TYPES.other;
                                    return (
                                        <div key={i} className="d-flex align-items-center justify-content-between py-1 px-2 rounded bg-light">
                                            <div className="d-flex align-items-center gap-2 fs-8">
                                                <span className="fw-semibold text-capitalize">{s.field}</span>
                                                <i className="ri-arrow-right-s-line text-muted" />
                                                <span className={`badge bg-soft-${cfg.color} text-${cfg.color} fw-normal`}>
                                                    <i className={`${cfg.icon} me-1`} />{cfg.label}
                                                </span>
                                                {s.detail && <span className="text-muted">{s.detail}</span>}
                                            </div>
                                            <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded p-0" onClick={() => handleRemoveSource(s.field)}>
                                                <X size={12} />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted fs-8 mb-0">No sources added yet. Add sources to track where personal data came from.</p>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={!form.name.trim()}>
                        <i className="ri-save-line me-1" /> Save Contact
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

function TouchModal({ show, onHide, onSave, touch, title }) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        type: 'call', date: today, note: '', who: 'Jeff', content: '', subject: '',
    });

    useEffect(() => {
        if (touch) {
            setForm({
                type: touch.type || 'call',
                date: touch.date || today,
                note: touch.note || '',
                who: touch.who || 'Jeff',
                content: touch.content || '',
                subject: touch.subject || '',
            });
        } else {
            setForm({ type: 'call', date: today, note: '', who: 'Jeff', content: '', subject: '' });
        }
    }, [touch, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.note.trim()) return;
        onSave(form);
    };

    const showContentField = ['email', 'meeting', 'call', 'linkedin'].includes(form.type);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Type</Form.Label>
                                <Form.Select size="sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                    {Object.entries(TOUCH_ICONS).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Date</Form.Label>
                                <Form.Control size="sm" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Logged By</Form.Label>
                                <Form.Control size="sm" value={form.who} onChange={e => setForm(p => ({ ...p, who: e.target.value }))} />
                            </Form.Group>
                        </Col>
                        {form.type === 'email' && (
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Subject Line</Form.Label>
                                    <Form.Control size="sm" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject..." />
                                </Form.Group>
                            </Col>
                        )}
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label className="fs-8 fw-semibold">Summary *</Form.Label>
                                <Form.Control size="sm" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} required placeholder="Brief description of the activity..." />
                            </Form.Group>
                        </Col>
                        {showContentField && (
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">
                                        {form.type === 'email' ? 'Email Body' : form.type === 'meeting' ? 'Meeting Notes' : form.type === 'call' ? 'Call Notes' : 'Message Content'}
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={6}
                                        value={form.content}
                                        onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                                        placeholder={form.type === 'email' ? 'Paste or compose the full email here...' : 'Detailed notes from the interaction...'}
                                        style={{ fontFamily: form.type === 'email' ? 'inherit' : 'inherit', fontSize: '0.85rem' }}
                                    />
                                    <Form.Text className="text-muted">
                                        {form.type === 'email' ? 'Include the full email text so you can review it later.' : 'Capture details — these become your conversation history.'}
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={!form.note.trim()}>
                        <i className="ri-save-line me-1" /> {touch ? 'Update Activity' : 'Log Activity'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

function NoteModal({ show, onHide, onSave, note, title }) {
    const [text, setText] = useState('');

    useEffect(() => {
        setText(note?.text || '');
    }, [note, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSave(text.trim());
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="fs-8 fw-semibold">Note</Form.Label>
                        <Form.Control as="textarea" rows={4} value={text} onChange={e => setText(e.target.value)} required placeholder="Add a note about this account..." autoFocus />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>Cancel</Button>
                    <Button variant="warning" type="submit" disabled={!text.trim()}>
                        <i className="ri-save-line me-1" /> {note ? 'Update Note' : 'Add Note'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default function AccountDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState([]);
    const [touchLog, setTouchLog] = useState([]);
    const [notes, setNotes] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editContact, setEditContact] = useState(null);
    const [deleteContact, setDeleteContact] = useState(null);
    const [showEditAccount, setShowEditAccount] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [showTouchModal, setShowTouchModal] = useState(false);
    const [editTouch, setEditTouch] = useState(null);
    const [deleteTouch, setDeleteTouch] = useState(null);
    const [expandedTouch, setExpandedTouch] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [editNote, setEditNote] = useState(null);
    const [deleteNote, setDeleteNote] = useState(null);

    const fetchAccount = useCallback(async () => {
        try {
            const res = await fetch(`/api/targets/${slug}`);
            if (res.ok) {
                const data = await res.json();
                setAccount(data);
                setContacts(data.contacts || []);
                setTouchLog(data.touchLog || []);
                setNotes(data.notes || []);
            }
        } catch { }
        setLoading(false);
    }, [slug]);

    useEffect(() => { fetchAccount(); }, [fetchAccount]);

    const saveAccount = async (updates) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/targets/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const data = await res.json();
                setAccount(data);
                setContacts(data.contacts || []);
                setTouchLog(data.touchLog || []);
                setNotes(data.notes || []);
                return true;
            }
        } catch { }
        setSaving(false);
        return false;
    };

    const handleEditAccount = async (e) => {
        e.preventDefault();
        const ok = await saveAccount(editForm);
        if (ok) setShowEditAccount(false);
        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/targets/${slug}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/apps/targets');
                return;
            }
        } catch { }
        setSaving(false);
    };

    if (loading) {
        return (
            <Container fluid="xxl" className="py-7">
                <div className="text-center py-5 text-muted">Loading account...</div>
            </Container>
        );
    }

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

    const sector = SECTORS[account.cat] || {};
    const priority = PRIORITY_MAP[account.pri] || { label: account.pri, color: 'secondary' };
    const stage = PIPELINE_STAGES[account.pipelineStage] || {};
    const weather = WEATHER_DATA[account.loc] || { temp: '—', condition: 'Unknown', icon: 'ri-question-line' };

    const sectorCompetitors = COMPETITORS.filter(c =>
        c.overlapAccounts?.some(name => name === account.n)
    );

    const contactsByLevel = LEVEL_ORDER.reduce((acc, level) => {
        const levelContacts = contacts.filter(c => c.level === level);
        if (levelContacts.length > 0) acc[level] = levelContacts;
        return acc;
    }, {});

    const handleAddContact = async (newContact) => {
        const updated = [...contacts, { ...newContact, id: Date.now() }];
        setContacts(updated);
        await saveAccount({ contacts: updated });
    };

    const handleEditContact = async (updated) => {
        const newContacts = contacts.map(c =>
            (c.id || c.name) === (editContact.id || editContact.name) ? { ...updated, id: c.id } : c
        );
        setContacts(newContacts);
        setEditContact(null);
        await saveAccount({ contacts: newContacts });
    };

    const handleDeleteContact = async () => {
        const newContacts = contacts.filter(c =>
            (c.id || c.name) !== (deleteContact.id || deleteContact.name)
        );
        setContacts(newContacts);
        setDeleteContact(null);
        await saveAccount({ contacts: newContacts });
    };

    const handleAddTouch = async (touch) => {
        const updated = [{ ...touch, id: Date.now() }, ...touchLog];
        setTouchLog(updated);
        setShowTouchModal(false);
        await saveAccount({ touchLog: updated });
    };

    const handleEditTouch = async (touch) => {
        const updated = touchLog.map(t => (t.id || t.date + t.note) === (editTouch.id || editTouch.date + editTouch.note) ? { ...touch, id: t.id } : t);
        setTouchLog(updated);
        setEditTouch(null);
        await saveAccount({ touchLog: updated });
    };

    const handleDeleteTouch = async () => {
        const updated = touchLog.filter(t => (t.id || t.date + t.note) !== (deleteTouch.id || deleteTouch.date + deleteTouch.note));
        setTouchLog(updated);
        setDeleteTouch(null);
        await saveAccount({ touchLog: updated });
    };

    const handleAddNote = async (noteText) => {
        const updated = [...notes, noteText];
        setNotes(updated);
        setShowNoteModal(false);
        await saveAccount({ notes: updated });
    };

    const handleEditNote = async (newText) => {
        const updated = notes.map((n, i) => i === editNote.idx ? newText : n);
        setNotes(updated);
        setEditNote(null);
        await saveAccount({ notes: updated });
    };

    const handleDeleteNote = async () => {
        const updated = notes.filter((_, i) => i !== deleteNote.idx);
        setNotes(updated);
        setDeleteNote(null);
        await saveAccount({ notes: updated });
    };

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
                        <Button variant="outline-primary" size="sm" className="d-inline-flex align-items-center gap-1" onClick={() => { setEditForm({ ...account }); setShowEditAccount(true); }}>
                            <Edit2 size={14} /> Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" className="d-inline-flex align-items-center gap-1" onClick={() => setShowDeleteAccount(true)}>
                            <Trash2 size={14} /> Delete
                        </Button>
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
                                <span className="nav-link-text">Contacts {contacts.length > 0 && <HkBadge bg="primary" soft size="sm" className="ms-1">{contacts.length}</HkBadge>}</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="activity">
                                <span className="nav-link-text">Activity {touchLog.length > 0 && <HkBadge bg="info" soft size="sm" className="ms-1">{touchLog.length}</HkBadge>}</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        {/* OVERVIEW TAB */}
                        <Tab.Pane eventKey="overview">
                            <Row>
                                <Col lg={8}>
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

                                    {account.news?.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header><h6 className="mb-0">News &amp; Headlines</h6></Card.Header>
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
                                                            <tr key={i} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/apps/competitors/${c.slug}`}>
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

                                <Col lg={4}>
                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Pipeline Position</h6></Card.Header>
                                        <Card.Body>
                                            <div className="d-flex gap-1 mb-3">
                                                {Object.entries(PIPELINE_STAGES).map(([key, s]) => (
                                                    <div key={key} className="flex-1">
                                                        <div className={`rounded-pill ${key === account.pipelineStage ? `bg-${s.color}` : 'bg-light'}`} style={{ height: 6 }} />
                                                        <div className={`fs-9 text-center mt-1 ${key === account.pipelineStage ? `text-${s.color} fw-medium` : 'text-muted'}`}>
                                                            {s.label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>

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

                                    {notes.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header className="card-header-action">
                                                <h6 className="mb-0">Notes</h6>
                                                <HkBadge bg="smoke" soft size="sm">{notes.length}</HkBadge>
                                            </Card.Header>
                                            <Card.Body className="p-0">
                                                <div className="list-group list-group-flush">
                                                    {notes.map((note, i) => (
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

                                    {contacts.length > 0 && (
                                        <Card className="card-border mb-4">
                                            <Card.Header><h6 className="mb-0">Primary Contact</h6></Card.Header>
                                            <Card.Body>
                                                {contacts.filter(c => c.isPrimary).map((c, i) => (
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
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="mb-1">Contacts at {account.n}</h5>
                                    <span className="text-muted fs-7">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} on file</span>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                                    <Plus size={14} className="me-1" /> Add Contact
                                </Button>
                            </div>

                            {contacts.length === 0 ? (
                                <Card className="card-border">
                                    <Card.Body className="text-center py-5">
                                        <i className="ri-contacts-book-line fs-1 text-muted d-block mb-3" />
                                        <h5>No Contacts Yet</h5>
                                        <p className="text-muted">Add contacts to build your relationship map for {account.n}.</p>
                                        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                                            <i className="ri-user-add-line me-1" /> Add Contact
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <>
                                    {Object.entries(contactsByLevel).map(([level, levelContacts]) => (
                                        <div key={level} className="mb-4">
                                            <h6 className="text-uppercase fs-8 text-muted mb-3">
                                                {LEVEL_LABELS[level] || level}
                                                <HkBadge bg="smoke" soft size="sm" className="ms-2">{levelContacts.length}</HkBadge>
                                            </h6>
                                            <Row>
                                                {levelContacts.map((c, i) => (
                                                    <Col lg={4} md={6} key={c.id || i} className="mb-3">
                                                        <ContactCard
                                                            contact={c}
                                                            onEdit={(contact) => setEditContact(contact)}
                                                            onDelete={(contact) => setDeleteContact(contact)}
                                                        />
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
                                            <Button variant="primary" size="sm" onClick={() => setShowTouchModal(true)}>
                                                <i className="ri-add-line me-1" /> Log Activity
                                            </Button>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            {touchLog.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <i className="ri-history-line fs-1 text-muted d-block mb-3" />
                                                    <h5>No Activity Yet</h5>
                                                    <p className="text-muted">Start logging touches with {account.n}.</p>
                                                    <Button variant="primary" size="sm" onClick={() => setShowTouchModal(true)}>
                                                        <i className="ri-add-line me-1" /> Log First Activity
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="timeline-activity px-4 py-3">
                                                    {touchLog.map((t, i) => {
                                                        const cfg = TOUCH_ICONS[t.type] || TOUCH_ICONS.note;
                                                        const isExpanded = expandedTouch === (t.id || i);
                                                        return (
                                                            <div key={t.id || i} className="d-flex gap-3 mb-4">
                                                                <div className={`avatar avatar-icon avatar-xs avatar-soft-${cfg.color} avatar-rounded flex-shrink-0`}>
                                                                    <span className="initial-wrap"><i className={cfg.icon} /></span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <div className="flex-1" style={{ cursor: t.content ? 'pointer' : 'default' }} onClick={() => t.content && setExpandedTouch(isExpanded ? null : (t.id || i))}>
                                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                                <HkBadge bg={cfg.color} soft size="sm">{cfg.label}</HkBadge>
                                                                                {t.content && <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-muted fs-7`} />}
                                                                                {t.subject && <span className="fs-8 fw-medium text-dark">{t.subject}</span>}
                                                                            </div>
                                                                            <p className="mb-0 fs-7">{t.note}</p>
                                                                            {isExpanded && t.content && (
                                                                                <Card className="card-border mt-2 bg-light">
                                                                                    <Card.Body className="py-2 px-3">
                                                                                        {t.subject && <div className="fw-semibold fs-7 mb-2 pb-2 border-bottom">Subject: {t.subject}</div>}
                                                                                        <div className="fs-8" style={{ whiteSpace: 'pre-wrap' }}>{t.content}</div>
                                                                                    </Card.Body>
                                                                                </Card>
                                                                            )}
                                                                        </div>
                                                                        <div className="d-flex align-items-start gap-2 flex-shrink-0 ms-3">
                                                                            <div className="text-end">
                                                                                <div className="fs-8 text-muted">{formatDate(t.date)}</div>
                                                                                <div className="fs-9 text-muted">{t.who}</div>
                                                                            </div>
                                                                            <div className="d-flex gap-0">
                                                                                <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover p-0" onClick={() => { setEditTouch(t); }}>
                                                                                    <Edit2 size={12} />
                                                                                </Button>
                                                                                <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover text-danger p-0" onClick={() => setDeleteTouch(t)}>
                                                                                    <Trash2 size={12} />
                                                                                </Button>
                                                                            </div>
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
                                    <Card className="card-border mb-4">
                                        <Card.Header className="card-header-action">
                                            <h6 className="mb-0">Notes</h6>
                                            <Button variant="soft-warning" size="sm" onClick={() => setShowNoteModal(true)}>
                                                <i className="ri-add-line me-1" /> Add Note
                                            </Button>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            {notes.length > 0 ? (
                                                <div className="list-group list-group-flush">
                                                    {notes.map((note, i) => (
                                                        <div key={i} className="list-group-item px-4 py-3">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="d-flex gap-2 flex-1">
                                                                    <i className="ri-sticky-note-line text-warning flex-shrink-0 mt-1" />
                                                                    <span className="fs-7">{note}</span>
                                                                </div>
                                                                <div className="d-flex gap-0 flex-shrink-0 ms-2">
                                                                    <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover p-0" onClick={() => setEditNote({ idx: i, text: note })}>
                                                                        <Edit2 size={12} />
                                                                    </Button>
                                                                    <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover text-danger p-0" onClick={() => setDeleteNote({ idx: i, text: note })}>
                                                                        <Trash2 size={12} />
                                                                    </Button>
                                                                </div>
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

                                    <Card className="card-border mb-4">
                                        <Card.Header><h6 className="mb-0">Activity Summary</h6></Card.Header>
                                        <Card.Body>
                                            {Object.entries(
                                                touchLog.reduce((acc, t) => {
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
                                            {touchLog.length === 0 && (
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

            {/* Add Contact Modal */}
            {showAddModal && (
                <ContactModal
                    show={showAddModal}
                    onHide={() => setShowAddModal(false)}
                    onSave={handleAddContact}
                    contact={null}
                    title={`Add Contact at ${account.n}`}
                />
            )}

            {/* Edit Contact Modal */}
            {editContact && (
                <ContactModal
                    show={!!editContact}
                    onHide={() => setEditContact(null)}
                    onSave={handleEditContact}
                    contact={editContact}
                    title={`Edit ${editContact.name}`}
                />
            )}

            {/* Delete Contact Confirmation Modal */}
            <Modal show={!!deleteContact} onHide={() => setDeleteContact(null)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6">Delete Contact</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">Remove <strong>{deleteContact?.name}</strong> from {account.n}? This cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" size="sm" onClick={() => setDeleteContact(null)}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={handleDeleteContact}>
                        <Trash2 size={14} className="me-1" /> Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Account Modal */}
            <Modal show={showEditAccount} onHide={() => setShowEditAccount(false)} size="lg" centered>
                <Form onSubmit={handleEditAccount}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fs-5">Edit Account</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Company Name *</Form.Label>
                                    <Form.Control value={editForm.n || ''} onChange={e => setEditForm(p => ({ ...p, n: e.target.value }))} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Location</Form.Label>
                                    <Form.Control value={editForm.loc || ''} onChange={e => setEditForm(p => ({ ...p, loc: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Sector</Form.Label>
                                    <Form.Select value={editForm.cat || 'automotive'} onChange={e => setEditForm(p => ({ ...p, cat: e.target.value }))}>
                                        {Object.entries(SECTORS).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Priority</Form.Label>
                                    <Form.Select value={editForm.pri || 'med'} onChange={e => setEditForm(p => ({ ...p, pri: e.target.value }))}>
                                        {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Pipeline Stage</Form.Label>
                                    <Form.Select value={editForm.pipelineStage || 'awareness'} onChange={e => setEditForm(p => ({ ...p, pipelineStage: e.target.value }))}>
                                        {Object.entries(PIPELINE_STAGES).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Steel Needs</Form.Label>
                                    <Form.Control value={editForm.needs || ''} onChange={e => setEditForm(p => ({ ...p, needs: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Steel Products</Form.Label>
                                    <Form.Control value={editForm.steel || ''} onChange={e => setEditForm(p => ({ ...p, steel: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Est. Deal Value</Form.Label>
                                    <Form.Control value={editForm.estDealValue || ''} onChange={e => setEditForm(p => ({ ...p, estDealValue: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Revenue</Form.Label>
                                    <Form.Control value={editForm.revenue || ''} onChange={e => setEditForm(p => ({ ...p, revenue: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Employees</Form.Label>
                                    <Form.Control value={editForm.employees || ''} onChange={e => setEditForm(p => ({ ...p, employees: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Website</Form.Label>
                                    <Form.Control value={editForm.website || ''} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">LinkedIn</Form.Label>
                                    <Form.Control value={editForm.linkedin || ''} onChange={e => setEditForm(p => ({ ...p, linkedin: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Phone</Form.Label>
                                    <Form.Control value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Description</Form.Label>
                                    <Form.Control as="textarea" rows={2} value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowEditAccount(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Touch Log Modal (Add / Edit) */}
            <TouchModal
                show={showTouchModal || !!editTouch}
                onHide={() => { setShowTouchModal(false); setEditTouch(null); }}
                onSave={editTouch ? handleEditTouch : handleAddTouch}
                touch={editTouch}
                title={editTouch ? 'Edit Activity' : 'Log Activity'}
            />

            {/* Note Modal (Add / Edit) */}
            <NoteModal
                show={showNoteModal || !!editNote}
                onHide={() => { setShowNoteModal(false); setEditNote(null); }}
                onSave={editNote ? (text) => handleEditNote(text) : handleAddNote}
                note={editNote}
                title={editNote ? 'Edit Note' : 'Add Note'}
            />

            {/* Delete Touch Confirmation */}
            <Modal show={!!deleteTouch} onHide={() => setDeleteTouch(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">Delete Activity</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this <strong>{deleteTouch && (TOUCH_ICONS[deleteTouch.type]?.label || 'activity')}</strong> entry?</p>
                    <p className="text-muted mb-0">{deleteTouch?.note}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setDeleteTouch(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteTouch}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Note Confirmation */}
            <Modal show={!!deleteNote} onHide={() => setDeleteNote(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">Delete Note</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this note?</p>
                    <p className="text-muted mb-0 fst-italic">&ldquo;{deleteNote?.text}&rdquo;</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setDeleteNote(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteNote}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Account Confirmation Modal */}
            <Modal show={showDeleteAccount} onHide={() => setShowDeleteAccount(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">Delete Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete <strong>{account.n}</strong>?</p>
                    <p className="text-muted mb-0">This action cannot be undone. All contacts, notes, and activity history for this account will be permanently removed.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowDeleteAccount(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteAccount} disabled={saving}>
                        {saving ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
