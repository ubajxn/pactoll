'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, InputGroup, Dropdown, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Plus, Search, Filter, Download, Phone, Mail, Clock, ChevronDown, ChevronUp, Edit2, Trash2, ExternalLink, AlertCircle } from 'react-feather';
import Link from 'next/link';
import { TARGET_ACCOUNTS, SECTORS, PIPELINE_STAGES } from '@/data/targets/target-data';

const STATUS_CONFIG = {
  new: { bg: 'info', label: 'New' },
  contacted: { bg: 'warning', label: 'Contacted' },
  quoted: { bg: 'primary', label: 'Quoted' },
  negotiating: { bg: 'purple', label: 'Negotiating' },
  won: { bg: 'success', label: 'Won' },
  lost: { bg: 'danger', label: 'Lost' },
};

const PIPELINE_TO_STATUS = {
  awareness: 'new',
  engagement: 'contacted',
  consideration: 'quoted',
  proposal: 'negotiating',
  closed: 'won',
};

const SOURCE_OPTIONS = ['website', 'phone', 'email', 'referral', 'trade-show', 'linkedin', 'cold-outreach', 'other'];
const SERVICE_OPTIONS = ['Slitting', 'Leveling / Flattening', 'Cut-to-Length', 'Blanking', 'Multi-Blanking', 'Shearing', 'Warehousing'];
const MATERIAL_OPTIONS = ['Hot Rolled (HR)', 'Cold Rolled (CR)', 'Galvanized (GI)', 'Galvannealed (GA)', 'Galvalume', 'Stainless', 'Aluminum', 'Pre-Painted', 'Other'];
const TIMELINE_OPTIONS = ['Immediate', '1-2 Weeks', '2-4 Weeks', '1-2 Months', '3+ Months', 'Ongoing / Recurring'];

const EMPTY_LEAD = {
  name: '', company: '', email: '', phone: '',
  services: [], material: '', gauge: '', width: '', quantity: '',
  timeline: '', details: '', source: 'website', status: 'new',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_LEAD });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const targetLeads = TARGET_ACCOUNTS.map((a, i) => ({
      id: `target-${a.slug}`,
      slug: a.slug,
      name: a.contacts?.[0]?.name || a.n,
      company: a.n,
      email: a.contacts?.[0]?.email || '',
      phone: a.contacts?.[0]?.phone || a.phone || '',
      services: a.needs ? a.needs.split(',').map(s => s.trim()).slice(0, 3) : [],
      material: a.steel || '',
      gauge: '', width: '', quantity: '',
      timeline: '',
      details: a.description || '',
      source: 'outbound',
      status: PIPELINE_TO_STATUS[a.pipelineStage] || 'new',
      created_at: null,
      sector: a.cat,
      loc: a.loc,
      pri: a.pri,
      isTarget: true,
    }));
    setLeads(targetLeads);
    setLoading(false);
  }, []);

  const counts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = leads
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (l.name || '').toLowerCase().includes(term)
        || (l.company || '').toLowerCase().includes(term)
        || (l.email || '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const av = a[sortField] || '';
      const bv = b[sortField] || '';
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleServiceToggle = (svc) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email || formData.services.length === 0) {
      setFormError('Name, email, and at least one service are required.');
      return;
    }

    const newLead = {
      ...formData,
      id: `manual-${Date.now()}`,
      created_at: new Date().toISOString(),
      isTarget: false,
    };
    setLeads(prev => [newLead, ...prev]);
    setShowAddModal(false);
    setFormData({ ...EMPTY_LEAD });
  };

  const updateStatus = async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const kpis = [
    { label: 'Total Leads', value: leads.length, bg: 'soft-primary', icon: '📊' },
    { label: 'New', value: counts.new || 0, bg: 'soft-info', icon: '🆕' },
    { label: 'In Progress', value: (counts.contacted || 0) + (counts.quoted || 0) + (counts.negotiating || 0), bg: 'soft-warning', icon: '⏳' },
    { label: 'Won', value: counts.won || 0, bg: 'soft-success', icon: '✅' },
    { label: 'Lost', value: counts.lost || 0, bg: 'soft-danger', icon: '❌' },
  ];

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1 fw-bold">Leads Pipeline</h4>
          <p className="text-muted mb-0 fs-7">
            {leads.length} total lead{leads.length !== 1 ? 's' : ''} &middot; {leads.filter(l => l.isTarget).length} target accounts + inbound
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="me-1" /> Add Lead
        </Button>
      </div>

      {/* KPI Cards */}
      <Row className="mb-4 g-3">
        {kpis.map((kpi, i) => (
          <Col key={i} xs={6} md>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-3 px-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fs-7 text-muted text-uppercase fw-semibold">{kpi.label}</div>
                    <div className="fs-3 fw-bold mt-1">{kpi.value}</div>
                  </div>
                  <div className="fs-2">{kpi.icon}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters + Search */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-3">
          <Row className="align-items-center g-3">
            <Col md={6}>
              <div className="d-flex gap-2 flex-wrap">
                {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={filter === s ? 'primary' : 'outline-secondary'}
                    onClick={() => setFilter(s)}
                    className="rounded-pill"
                  >
                    {s === 'all' ? `All (${leads.length})` : `${STATUS_CONFIG[s]?.label || s} (${counts[s] || 0})`}
                  </Button>
                ))}
              </div>
            </Col>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent border-end-0">
                  <Search size={14} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, company, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Leads Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="sm" />
              <p className="text-muted mt-2 mb-0">Loading leads...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <AlertCircle size={40} className="text-muted mb-3" />
              <p className="text-muted mb-1">
                {leads.length === 0 ? 'No leads yet' : 'No leads match this filter'}
              </p>
              <p className="text-muted fs-7">
                {leads.length === 0
                  ? 'Leads from the website quote wizard and manual entry will appear here.'
                  : 'Try adjusting your filters or search term.'}
              </p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 table-nowrap">
              <thead className="bg-light">
                <tr>
                  <th className="cursor-pointer" onClick={() => toggleSort('name')}>
                    Contact <SortIcon field="name" />
                  </th>
                  <th className="cursor-pointer" onClick={() => toggleSort('company')}>
                    Company <SortIcon field="company" />
                  </th>
                  <th>Services</th>
                  <th>Material</th>
                  <th className="cursor-pointer" onClick={() => toggleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="cursor-pointer" onClick={() => toggleSort('source')}>
                    Source <SortIcon field="source" />
                  </th>
                  <th className="cursor-pointer text-end" onClick={() => toggleSort('created_at')}>
                    Date <SortIcon field="created_at" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    expanded={expandedId === lead.id}
                    onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    onStatusChange={updateStatus}
                  />
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Lead Modal */}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setFormError(''); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Add New Lead</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formError && (
              <div className="alert alert-danger py-2 fs-7">{formError}</div>
            )}

            <h6 className="text-muted text-uppercase fs-8 mb-3">Contact Information</h6>
            <Row className="mb-3 g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-7">Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-7">Company</Form.Label>
                  <Form.Control
                    value={formData.company}
                    onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                    placeholder="Company name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-7">Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@company.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-7">Phone</Form.Label>
                  <Form.Control
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="text-muted text-uppercase fs-8 mb-3 mt-4">Services Needed <span className="text-danger">*</span></h6>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {SERVICE_OPTIONS.map(svc => (
                <Button
                  key={svc}
                  size="sm"
                  variant={formData.services.includes(svc) ? 'primary' : 'outline-secondary'}
                  onClick={() => handleServiceToggle(svc)}
                  className="rounded-pill"
                >
                  {svc}
                </Button>
              ))}
            </div>

            <h6 className="text-muted text-uppercase fs-8 mb-3 mt-4">Material Specifications</h6>
            <Row className="mb-3 g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7">Material</Form.Label>
                  <Form.Select
                    value={formData.material}
                    onChange={(e) => setFormData(p => ({ ...p, material: e.target.value }))}
                  >
                    <option value="">Select material...</option>
                    {MATERIAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7">Gauge / Thickness</Form.Label>
                  <Form.Control
                    value={formData.gauge}
                    onChange={(e) => setFormData(p => ({ ...p, gauge: e.target.value }))}
                    placeholder='e.g. 16 ga, 0.060"'
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7">Width</Form.Label>
                  <Form.Control
                    value={formData.width}
                    onChange={(e) => setFormData(p => ({ ...p, width: e.target.value }))}
                    placeholder='e.g. 48", 36"'
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7">Quantity</Form.Label>
                  <Form.Control
                    value={formData.quantity}
                    onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                    placeholder="e.g. 20 tons, 500 pcs"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7">Timeline</Form.Label>
                  <Form.Select
                    value={formData.timeline}
                    onChange={(e) => setFormData(p => ({ ...p, timeline: e.target.value }))}
                  >
                    <option value="">Select timeline...</option>
                    {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7">Source</Form.Label>
                  <Form.Select
                    value={formData.source}
                    onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}
                  >
                    {SOURCE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label className="fs-7">Additional Details / Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.details}
                onChange={(e) => setFormData(p => ({ ...p, details: e.target.value }))}
                placeholder="Special requirements, delivery notes, context from the conversation..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => { setShowAddModal(false); setFormError(''); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <><Spinner size="sm" className="me-1" /> Saving...</> : 'Create Lead'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

function LeadRow({ lead, expanded, onToggle, onStatusChange }) {
  const services = Array.isArray(lead.services) ? lead.services : [lead.services].filter(Boolean);
  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }} className={expanded ? 'table-active' : ''}>
        <td>
          <div className="fw-semibold">{lead.name}</div>
          {lead.email && <div className="text-muted fs-8">{lead.email}</div>}
        </td>
        <td>
          {lead.isTarget && lead.slug ? (
            <Link href={`/apps/targets/${lead.slug}`} className="text-decoration-none fw-medium" onClick={e => e.stopPropagation()}>{lead.company}</Link>
          ) : (
            <span className="text-muted">{lead.company || '—'}</span>
          )}
        </td>
        <td>
          <div className="d-flex flex-wrap gap-1">
            {services.slice(0, 2).map(s => (
              <Badge key={s} bg="soft-primary" className="text-primary fw-normal fs-8">{s}</Badge>
            ))}
            {services.length > 2 && (
              <Badge bg="soft-secondary" className="text-secondary fw-normal fs-8">+{services.length - 2}</Badge>
            )}
          </div>
        </td>
        <td className="text-muted fs-7">{lead.material || '—'}</td>
        <td>
          <Dropdown onClick={(e) => e.stopPropagation()}>
            <Dropdown.Toggle as="span" className="cursor-pointer">
              <Badge bg={statusCfg.bg} className="fs-8 fw-semibold" style={{ cursor: 'pointer' }}>
                {statusCfg.label}
              </Badge>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <Dropdown.Item
                  key={key}
                  active={lead.status === key}
                  onClick={() => onStatusChange(lead.id, key)}
                >
                  <Badge bg={cfg.bg} className="me-2">&nbsp;</Badge> {cfg.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </td>
        <td>
          <span className="text-muted fs-7 text-capitalize">{(lead.source || 'website').replace('-', ' ')}</span>
        </td>
        <td className="text-end text-muted fs-7">
          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          }) : '—'}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-light border-0 px-4 pb-3">
            <Row className="g-3 mt-1">
              <Col md={3}>
                <div className="text-muted text-uppercase fs-8 fw-semibold mb-1">Contact</div>
                {lead.phone && (
                  <div className="fs-7 mb-1">
                    <Phone size={12} className="me-1 text-muted" />
                    <a href={`tel:${lead.phone}`} className="link-dark">{lead.phone}</a>
                  </div>
                )}
                {lead.email && (
                  <div className="fs-7">
                    <Mail size={12} className="me-1 text-muted" />
                    <a href={`mailto:${lead.email}`} className="link-dark">{lead.email}</a>
                  </div>
                )}
              </Col>
              <Col md={3}>
                <div className="text-muted text-uppercase fs-8 fw-semibold mb-1">Specifications</div>
                {lead.gauge && <div className="fs-7">Gauge: <strong>{lead.gauge}</strong></div>}
                {lead.width && <div className="fs-7">Width: <strong>{lead.width}</strong></div>}
                {lead.quantity && <div className="fs-7">Qty: <strong>{lead.quantity}</strong></div>}
                {!lead.gauge && !lead.width && !lead.quantity && <div className="fs-7 text-muted">No specs provided</div>}
              </Col>
              <Col md={3}>
                <div className="text-muted text-uppercase fs-8 fw-semibold mb-1">Timeline</div>
                <div className="fs-7">{lead.timeline || 'Not specified'}</div>
                <div className="text-muted text-uppercase fs-8 fw-semibold mb-1 mt-2">All Services</div>
                <div className="d-flex flex-wrap gap-1">
                  {services.map(s => <Badge key={s} bg="soft-primary" className="text-primary fw-normal fs-8">{s}</Badge>)}
                </div>
              </Col>
              <Col md={3}>
                {lead.details && (
                  <>
                    <div className="text-muted text-uppercase fs-8 fw-semibold mb-1">Notes</div>
                    <p className="fs-7 mb-0" style={{ lineHeight: 1.5 }}>{lead.details}</p>
                  </>
                )}
              </Col>
            </Row>
          </td>
        </tr>
      )}
    </>
  );
}
