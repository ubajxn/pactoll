'use client';
import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadCards = useCallback(() => {
    fetch('/api/cards')
      .then(r => r.json())
      .then(data => { setCards(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  function openQR(card) {
    setSelectedCard(card);
    setShowQR(true);
  }

  function openDetail(card) {
    fetch(`/api/cards/${card.id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setShowDetail(true); });
  }

  function deleteCard(id) {
    if (!confirm('Delete this card? This cannot be undone.')) return;
    fetch(`/api/cards/${id}`, { method: 'DELETE' })
      .then(() => loadCards());
  }

  function getCardUrl(card) {
    return `${window.location.origin}/cards/${card.id}`;
  }

  const totalViews = cards.reduce((sum, c) => sum + (c.viewCount || 0), 0);
  const totalShares = cards.reduce((sum, c) => sum + (c.shareCount || 0), 0);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Holiday Cards</h4>
          <p className="text-muted mb-0">Published cards with QR codes and tracking</p>
        </div>
      </div>

      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h2 className="mb-1">{cards.length}</h2>
              <small className="text-muted">Published Cards</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h2 className="mb-1 text-primary">{totalViews}</h2>
              <small className="text-muted">Total Views</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h2 className="mb-1 text-success">{totalShares}</h2>
              <small className="text-muted">Total Shares</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : cards.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted mb-2">No cards published yet</h5>
              <p className="text-muted">
                Open the Holiday Card editor at <code>localhost:8234/holiday-card.html</code> and click <strong>Publish</strong> to create a shareable card.
              </p>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Published</th>
                  <th className="text-center">Views</th>
                  <th className="text-center">Shares</th>
                  <th className="text-center">QR Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map(card => (
                  <tr key={card.id}>
                    <td>
                      <strong
                        style={{ cursor: 'pointer', color: '#4A7FA5' }}
                        onClick={() => openDetail(card)}
                      >
                        {card.title}
                      </strong>
                      <br />
                      <small className="text-muted font-monospace">{card.id}</small>
                    </td>
                    <td className="text-muted" style={{ fontSize: '.85rem' }}>
                      {new Date(card.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </td>
                    <td className="text-center">
                      <Badge bg="primary" pill>{card.viewCount || 0}</Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg="success" pill>{card.shareCount || 0}</Badge>
                    </td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => openQR(card)}
                      >
                        QR
                      </Button>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-1"
                        onClick={() => window.open(getCardUrl(card), '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => deleteCard(card.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* QR Code Modal */}
      <Modal show={showQR} onHide={() => setShowQR(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {selectedCard && (
            <>
              <QRCodeSVG
                value={getCardUrl(selectedCard)}
                size={240}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/images/ptp-logo-white.png',
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
              <div className="mt-3">
                <small className="text-muted d-block mb-2">{selectedCard.title}</small>
                <code className="d-block mb-3" style={{ fontSize: '.75rem', wordBreak: 'break-all' }}>
                  {getCardUrl(selectedCard)}
                </code>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(getCardUrl(selectedCard));
                  }}
                >
                  Copy Link
                </Button>
                {' '}
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    const svg = document.querySelector('.modal-body svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([svgData], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ptp-card-${selectedCard.id}-qr.svg`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download QR
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Detail / Analytics Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{detail?.title || 'Card Details'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail && (
            <>
              <Row className="mb-4 g-3">
                <Col md={4}>
                  <Card className="border bg-light">
                    <Card.Body className="text-center py-3">
                      <h3 className="mb-0">{detail.views?.length || 0}</h3>
                      <small className="text-muted">Total Views</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border bg-light">
                    <Card.Body className="text-center py-3">
                      <h3 className="mb-0">{detail.shares?.length || 0}</h3>
                      <small className="text-muted">Total Shares</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border bg-light">
                    <Card.Body className="text-center py-3">
                      <h3 className="mb-0">
                        {detail.views ? new Set(detail.views.map(v => v.ip)).size : 0}
                      </h3>
                      <small className="text-muted">Unique Visitors</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h6 className="mb-3">Recent Activity</h6>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <Table size="sm" hover>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Source</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...(detail.views || []).map(v => ({ ...v, _type: 'view' })),
                      ...(detail.shares || []).map(s => ({ ...s, _type: 'share' })),
                    ]
                      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
                      .slice(0, 50)
                      .map((ev, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: '.8rem' }}>
                            {new Date(ev.ts).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })}
                          </td>
                          <td>
                            <Badge bg={ev._type === 'view' ? 'primary' : 'success'} pill>
                              {ev._type}
                            </Badge>
                          </td>
                          <td style={{ fontSize: '.8rem' }}>{ev.ref || ev.method || '—'}</td>
                          <td style={{ fontSize: '.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.ua ? (ev.ua.includes('Mobile') ? 'Mobile' : 'Desktop') : '—'}
                          </td>
                        </tr>
                      ))}
                    {(!detail.views?.length && !detail.shares?.length) && (
                      <tr><td colSpan={4} className="text-center text-muted py-3">No activity yet</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
