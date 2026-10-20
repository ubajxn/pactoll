'use client';

import { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, InputGroup, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Plus, Search, Filter, Clock, AlertTriangle, CheckCircle, Eye, ChevronDown, ChevronUp, Calendar, User, Tag } from 'react-feather';
import Link from 'next/link';
import { TICKETS, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_TYPES, TEAM_MEMBERS, getTeamMember, generateTicketId } from '@/data/tickets/ticket-data';

const VIEWS = {
  all: 'All Tickets',
  mine: 'My Tickets',
  watching: 'Watching',
  overdue: 'Overdue',
};

const EMPTY_TICKET = {
  title: '', description: '', type: 'task', priority: 'medium',
  status: 'open', assignee: 'jeff', labels: '', targetAccount: '',
  dueDate: '',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState(TICKETS);
  const [view, setView] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_TICKET });
  const currentUser = 'jeff';

  const now = new Date();

  const filtered = useMemo(() => {
    let result = [...tickets];

    if (view === 'mine') result = result.filter(t => t.assignee === currentUser);
    if (view === 'watching') result = result.filter(t => t.watchers?.includes(currentUser) || t.assignee === currentUser);
    if (view === 'overdue') result = result.filter(t => t.dueDate && new Date(t.dueDate) < now && !['resolved', 'closed'].includes(t.status));
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.id.toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term) ||
        (t.labels || []).some(l => l.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      let av = a[sortField] || '';
      let bv = b[sortField] || '';
      if (sortField === 'priority') {
        av = TICKET_PRIORITIES[a.priority]?.order ?? 99;
        bv = TICKET_PRIORITIES[b.priority]?.order ?? 99;
      }
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tickets, view, statusFilter, priorityFilter, typeFilter, searchTerm, sortField, sortDir, currentUser]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'priority' ? 'asc' : 'desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const statusCounts = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const myCount = tickets.filter(t => t.assignee === currentUser && !['resolved', 'closed'].includes(t.status)).length;
  const overdueCount = tickets.filter(t => t.dueDate && new Date(t.dueDate) < now && !['resolved', 'closed'].includes(t.status)).length;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    const newTicket = {
      ...formData,
      id: generateTicketId(),
      reporter: currentUser,
      watchers: [],
      labels: formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTickets(prev => [newTicket, ...prev]);
    setShowCreateModal(false);
    setFormData({ ...EMPTY_TICKET });
  };

  const kpis = [
    { label: 'Open', value: (statusCounts.open || 0) + (statusCounts['in-progress'] || 0) + (statusCounts.waiting || 0) + (statusCounts.review || 0), bg: 'primary' },
    { label: 'My Active', value: myCount, bg: 'info' },
    { label: 'Overdue', value: overdueCount, bg: overdueCount > 0 ? 'danger' : 'success' },
    { label: 'Resolved', value: (statusCounts.resolved || 0) + (statusCounts.closed || 0), bg: 'success' },
  ];

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1 fw-bold">Tickets</h4>
          <p className="text-muted mb-0 fs-7">Track tasks, follow-ups, escalations, and outreach</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="me-1" /> Create Ticket
        </Button>
      </div>

      {/* KPI Row */}
      <Row className="mb-4 g-3">
        {kpis.map((kpi, i) => (
          <Col key={i} xs={6} md={3}>
            <Card className={`border-0 shadow-sm border-start border-${kpi.bg} border-3`}>
              <Card.Body className="py-3">
                <div className="fs-7 text-muted text-uppercase fw-semibold">{kpi.label}</div>
                <div className="fs-3 fw-bold mt-1">{kpi.value}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* View Tabs + Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <div className="d-flex gap-2">
                {Object.entries(VIEWS).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={view === key ? 'primary' : 'outline-secondary'}
                    onClick={() => setView(key)}
                    className="rounded-pill"
                  >
                    {label}
                    {key === 'mine' && <Badge bg="light" text="dark" className="ms-1">{myCount}</Badge>}
                    {key === 'overdue' && overdueCount > 0 && <Badge bg="danger" className="ms-1">{overdueCount}</Badge>}
                  </Button>
                ))}
              </div>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                {Object.entries(TICKET_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} ({statusCounts[k] || 0})</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                {Object.entries(TICKET_PRIORITIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-transparent border-end-0">
                  <Search size={14} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tickets Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th style={{ width: 100 }} className="cursor-pointer" onClick={() => toggleSort('id')}>
                  ID <SortIcon field="id" />
                </th>
                <th className="cursor-pointer" onClick={() => toggleSort('title')}>
                  Title <SortIcon field="title" />
                </th>
                <th style={{ width: 90 }}>Type</th>
                <th style={{ width: 90 }} className="cursor-pointer" onClick={() => toggleSort('priority')}>
                  Priority <SortIcon field="priority" />
                </th>
                <th style={{ width: 140 }} className="cursor-pointer" onClick={() => toggleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th style={{ width: 110 }}>Assignee</th>
                <th style={{ width: 100 }} className="cursor-pointer text-end" onClick={() => toggleSort('dueDate')}>
                  Due <SortIcon field="dueDate" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No tickets match your filters</td></tr>
              ) : filtered.map(ticket => {
                const statusCfg = TICKET_STATUSES[ticket.status] || TICKET_STATUSES.open;
                const priCfg = TICKET_PRIORITIES[ticket.priority] || TICKET_PRIORITIES.medium;
                const typeCfg = TICKET_TYPES[ticket.type] || TICKET_TYPES.task;
                const assignee = getTeamMember(ticket.assignee);
                const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < now && !['resolved', 'closed'].includes(ticket.status);

                return (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/apps/tickets/${ticket.id}`} className="link-primary fw-semibold fs-7">
                        {ticket.id}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/apps/tickets/${ticket.id}`} className="link-dark text-decoration-none">
                        <div className="fw-semibold">{ticket.title}</div>
                        {ticket.labels?.length > 0 && (
                          <div className="d-flex gap-1 mt-1">
                            {ticket.labels.map(l => (
                              <Badge key={l} bg="soft-secondary" className="text-secondary fw-normal fs-8">{l}</Badge>
                            ))}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td>
                      <Badge bg={`soft-${typeCfg.bg}`} className={`text-${typeCfg.bg} fw-normal fs-8`}>
                        {typeCfg.label}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={priCfg.bg} className="fw-semibold fs-8">{priCfg.label}</Badge>
                    </td>
                    <td>
                      <Badge bg={statusCfg.bg} className="fw-semibold fs-8">{statusCfg.label}</Badge>
                    </td>
                    <td>
                      {assignee && (
                        <div className="d-flex align-items-center gap-2">
                          <div className={`avatar avatar-xs avatar-${assignee.color} avatar-rounded`}>
                            <span className="initial-wrap fs-8">{assignee.initials}</span>
                          </div>
                          <span className="fs-7">{assignee.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </td>
                    <td className={`text-end fs-7 ${isOverdue ? 'text-danger fw-semibold' : 'text-muted'}`}>
                      {ticket.dueDate ? (
                        <>
                          {isOverdue && <AlertTriangle size={12} className="me-1" />}
                          {new Date(ticket.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Create Ticket Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Create Ticket</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fw-semibold">Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="What needs to be done?"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Context, details, what success looks like..."
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7 fw-semibold">Type</Form.Label>
                  <Form.Select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                    {Object.entries(TICKET_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7 fw-semibold">Priority</Form.Label>
                  <Form.Select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}>
                    {Object.entries(TICKET_PRIORITIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fs-7 fw-semibold">Assignee</Form.Label>
                  <Form.Select value={formData.assignee} onChange={e => setFormData(p => ({ ...p, assignee: e.target.value }))}>
                    {TEAM_MEMBERS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-7 fw-semibold">Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-7 fw-semibold">Labels</Form.Label>
                  <Form.Control
                    value={formData.labels}
                    onChange={e => setFormData(p => ({ ...p, labels: e.target.value }))}
                    placeholder="sales, urgent, quick-win (comma-separated)"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!formData.title}>Create Ticket</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
