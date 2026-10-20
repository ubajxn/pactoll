'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Badge, Button, Form, Dropdown } from 'react-bootstrap';
import { ArrowLeft, Clock, Calendar, User, Tag, Eye, MessageSquare, Edit2, Send, AlertTriangle, CheckCircle, Link as LinkIcon, ExternalLink, Plus } from 'react-feather';
import Link from 'next/link';
import { getTicketById, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_TYPES, TEAM_MEMBERS, getTeamMember } from '@/data/tickets/ticket-data';
import { getAccountBySlug } from '@/data/targets/target-data';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticket = getTicketById(params.id);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(ticket?.comments || []);
  const [status, setStatus] = useState(ticket?.status || 'open');

  if (!ticket) {
    return (
      <Container fluid className="p-4">
        <Card className="border-0 shadow-sm text-center py-5">
          <h5 className="text-muted">Ticket not found</h5>
          <p className="text-muted">Ticket {params.id} doesn&apos;t exist or has been deleted.</p>
          <div><Link href="/apps/tickets" className="btn btn-primary btn-sm">Back to Tickets</Link></div>
        </Card>
      </Container>
    );
  }

  const statusCfg = TICKET_STATUSES[status] || TICKET_STATUSES.open;
  const priCfg = TICKET_PRIORITIES[ticket.priority] || TICKET_PRIORITIES.medium;
  const typeCfg = TICKET_TYPES[ticket.type] || TICKET_TYPES.task;
  const assignee = getTeamMember(ticket.assignee);
  const reporter = getTeamMember(ticket.reporter);
  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && !['resolved', 'closed'].includes(status);
  const linkedAccount = ticket.targetAccount ? getAccountBySlug(ticket.targetAccount) : null;

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = {
      id: comments.length + 1,
      author: 'jeff',
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const statusFlow = Object.keys(TICKET_STATUSES);

  return (
    <Container fluid className="p-4">
      {/* Breadcrumb */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded" onClick={() => router.push('/apps/tickets')}>
          <ArrowLeft size={16} />
        </Button>
        <Link href="/apps/tickets" className="text-muted fs-7 text-decoration-none">Tickets</Link>
        <span className="text-muted fs-7">/</span>
        <span className="fw-semibold fs-7">{ticket.id}</span>
      </div>

      <Row className="g-4">
        {/* Main Content */}
        <Col lg={8}>
          {/* Header */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg={`soft-${typeCfg.bg}`} className={`text-${typeCfg.bg} fw-normal`}>{typeCfg.label}</Badge>
                  <Badge bg={priCfg.bg} className="fw-semibold">{priCfg.label}</Badge>
                  {isOverdue && <Badge bg="danger"><AlertTriangle size={10} className="me-1" />Overdue</Badge>}
                </div>
                <span className="text-muted fs-7">{ticket.id}</span>
              </div>

              <h4 className="fw-bold mb-3">{ticket.title}</h4>

              {ticket.description && (
                <p className="text-muted mb-3" style={{ lineHeight: 1.7 }}>{ticket.description}</p>
              )}

              {ticket.labels?.length > 0 && (
                <div className="d-flex gap-1 flex-wrap">
                  {ticket.labels.map(l => (
                    <Badge key={l} bg="soft-secondary" className="text-secondary fw-normal">
                      <Tag size={10} className="me-1" />{l}
                    </Badge>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Linked Account */}
          {linkedAccount && (
            <Card className="border-0 shadow-sm mb-4 border-start border-primary border-3">
              <Card.Body className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted text-uppercase fs-8 fw-semibold mb-1">Linked Account</div>
                    <Link href={`/apps/targets/${ticket.targetAccount}`} className="fw-semibold link-dark text-decoration-none fs-6">
                      {linkedAccount.n}
                    </Link>
                    <span className="text-muted fs-7 ms-2">{linkedAccount.loc}</span>
                    {linkedAccount.estDealValue && (
                      <Badge bg="soft-success" className="text-success ms-2">{linkedAccount.estDealValue}</Badge>
                    )}
                  </div>
                  <Link href={`/apps/targets/${ticket.targetAccount}`} className="btn btn-sm btn-outline-primary">
                    <ExternalLink size={14} className="me-1" /> View Account
                  </Link>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Activity / Comments */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="mb-0 fw-semibold">
                <MessageSquare size={16} className="me-2" />
                Activity ({comments.length})
              </h6>
            </Card.Header>
            <Card.Body>
              {comments.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">No comments yet. Start the conversation.</p>
              ) : (
                <div className="d-flex flex-column gap-3 mb-4">
                  {comments.map((comment) => {
                    const author = getTeamMember(comment.author);
                    return (
                      <div key={comment.id} className="d-flex gap-3">
                        <div className={`avatar avatar-sm avatar-${author?.color || 'primary'} avatar-rounded flex-shrink-0`}>
                          <span className="initial-wrap">{author?.initials || '??'}</span>
                        </div>
                        <div className="flex-fill">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-semibold fs-7">{author?.name || comment.author}</span>
                            <span className="text-muted fs-8">{formatDateTime(comment.createdAt)}</span>
                            <span className="text-muted fs-8">({timeAgo(comment.createdAt)})</span>
                          </div>
                          <div className="fs-7" style={{ lineHeight: 1.6 }}>{comment.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Comment */}
              <Form onSubmit={handleAddComment}>
                <div className="d-flex gap-3">
                  <div className="avatar avatar-sm avatar-primary avatar-rounded flex-shrink-0">
                    <span className="initial-wrap">JJ</span>
                  </div>
                  <div className="flex-fill">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment, update, or note..."
                      className="mb-2"
                    />
                    <div className="d-flex justify-content-end">
                      <Button variant="primary" size="sm" type="submit" disabled={!newComment.trim()}>
                        <Send size={14} className="me-1" /> Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Status Control */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="mb-0 fw-semibold">Status</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                {statusFlow.map(s => {
                  const cfg = TICKET_STATUSES[s];
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={status === s ? cfg.bg : `outline-${cfg.bg}`}
                      onClick={() => setStatus(s)}
                      className="rounded-pill"
                    >
                      {cfg.label}
                    </Button>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          {/* Details */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-transparent border-bottom">
              <h6 className="mb-0 fw-semibold">Details</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Assignee</span>
                  {assignee ? (
                    <div className="d-flex align-items-center gap-2">
                      <div className={`avatar avatar-xs avatar-${assignee.color} avatar-rounded`}>
                        <span className="initial-wrap fs-8">{assignee.initials}</span>
                      </div>
                      <span className="fs-7 fw-semibold">{assignee.name}</span>
                    </div>
                  ) : <span className="fs-7 text-muted">Unassigned</span>}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Reporter</span>
                  {reporter ? (
                    <span className="fs-7">{reporter.name}</span>
                  ) : <span className="fs-7 text-muted">—</span>}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Priority</span>
                  <Badge bg={priCfg.bg}>{priCfg.label}</Badge>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Type</span>
                  <Badge bg={`soft-${typeCfg.bg}`} className={`text-${typeCfg.bg}`}>{typeCfg.label}</Badge>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Due Date</span>
                  <span className={`fs-7 ${isOverdue ? 'text-danger fw-semibold' : ''}`}>
                    {isOverdue && <AlertTriangle size={12} className="me-1" />}
                    {formatDate(ticket.dueDate)}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Created</span>
                  <span className="fs-7">{formatDate(ticket.createdAt)}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-7">Updated</span>
                  <span className="fs-7">{timeAgo(ticket.updatedAt)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Watchers */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-transparent border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><Eye size={14} className="me-1" /> Watchers</h6>
                <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded">
                  <Plus size={14} />
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {(ticket.watchers?.length > 0) ? (
                <div className="d-flex flex-column gap-2">
                  {ticket.watchers.map(wId => {
                    const w = getTeamMember(wId);
                    if (!w) return null;
                    return (
                      <div key={wId} className="d-flex align-items-center gap-2">
                        <div className={`avatar avatar-xs avatar-${w.color} avatar-rounded`}>
                          <span className="initial-wrap fs-8">{w.initials}</span>
                        </div>
                        <div>
                          <div className="fs-7 fw-semibold">{w.name}</div>
                          <div className="fs-8 text-muted">{w.role}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted fs-7 mb-0">No watchers yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
