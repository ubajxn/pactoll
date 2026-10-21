"use client"
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Col, Container, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { Plus, Search, Trash2 } from 'react-feather';
import { SECTORS, PRIORITY_MAP, PIPELINE_STAGES } from '@/data/targets/target-data';

const EMPTY_ACCOUNT = {
    n: '', cat: 'automotive', loc: '', pri: 'med', needs: '', steel: '',
    website: '', linkedin: '', phone: '', revenue: '', employees: '',
    founded: '', ticker: '', description: '', pipelineStage: 'awareness',
    estDealValue: '',
};

const TargetsPage = () => {
    const router = useRouter();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sectorFilter, setSectorFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [stageFilter, setStageFilter] = useState('all');
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ ...EMPTY_ACCOUNT });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/targets');
            if (res.ok) {
                setAccounts(await res.json());
            }
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const sectorCounts = useMemo(() => {
        return Object.keys(SECTORS).reduce((acc, key) => {
            acc[key] = accounts.filter(t => t.cat === key).length;
            return acc;
        }, {});
    }, [accounts]);

    const filtered = useMemo(() => {
        return accounts.filter(t => {
            const matchSearch = !search || t.n.toLowerCase().includes(search.toLowerCase()) || (t.loc || '').toLowerCase().includes(search.toLowerCase()) || (t.needs || '').toLowerCase().includes(search.toLowerCase());
            const matchSector = sectorFilter === 'all' || t.cat === sectorFilter;
            const matchPri = priorityFilter === 'all' || t.pri === priorityFilter;
            const matchStage = stageFilter === 'all' || t.pipelineStage === stageFilter;
            return matchSearch && matchSector && matchPri && matchStage;
        });
    }, [accounts, search, sectorFilter, priorityFilter, stageFilter]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!addForm.n.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });
            if (res.ok) {
                setShowAdd(false);
                setAddForm({ ...EMPTY_ACCOUNT });
                fetchAccounts();
            }
        } catch { }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/targets/${deleteTarget.slug}`, { method: 'DELETE' });
            if (res.ok) {
                setDeleteTarget(null);
                fetchAccounts();
            }
        } catch { }
        setDeleting(false);
    };

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div className="mb-lg-0 mb-2">
                        <h1 className="pg-title">Target Accounts</h1>
                        <p className="text-muted mb-0">{accounts.length} identified accounts across {Object.keys(SECTORS).length} sectors</p>
                    </div>
                    <Button variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowAdd(true)}>
                        <Plus size={16} /> Add Account
                    </Button>
                </div>
            </div>

            <div className="hk-pg-body">
                {/* Sector Summary Cards */}
                <Row className="mb-4">
                    {Object.entries(SECTORS).map(([key, sec]) => (
                        <Col xl={2} sm={4} xs={6} key={key} className="mb-3">
                            <Card className={`card-border mb-0 cursor-pointer ${sectorFilter === key ? 'border-primary' : ''}`} onClick={() => setSectorFilter(sectorFilter === key ? 'all' : key)}>
                                <Card.Body className="text-center py-3">
                                    <i className={`${sec.icon} fs-3 text-${sec.color} d-block mb-1`} />
                                    <div className="fs-4 fw-bold">{sectorCounts[key] || 0}</div>
                                    <div className="fs-8 text-muted">{sec.label}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Filters */}
                <Card className="card-border mb-4">
                    <Card.Body className="py-3">
                        <Row className="align-items-center">
                            <Col md={3} className="mb-md-0 mb-2">
                                <InputGroup>
                                    <InputGroup.Text><Search size={14} /></InputGroup.Text>
                                    <Form.Control placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
                                </InputGroup>
                            </Col>
                            <Col md={3} className="mb-md-0 mb-2">
                                <Form.Select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
                                    <option value="all">All Sectors</option>
                                    {Object.entries(SECTORS).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2} className="mb-md-0 mb-2">
                                <Form.Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                    <option value="all">All Priorities</option>
                                    <option value="high">High Priority</option>
                                    <option value="med">Medium Priority</option>
                                    <option value="low">Standard</option>
                                </Form.Select>
                            </Col>
                            <Col md={2} className="mb-md-0 mb-2">
                                <Form.Select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                                    <option value="all">All Stages</option>
                                    {Object.entries(PIPELINE_STAGES).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2} className="text-end">
                                <span className="text-muted fs-7">{filtered.length} results</span>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Accounts Table */}
                <Card className="card-border">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5 text-muted">Loading accounts...</div>
                        ) : (
                            <Table responsive hover className="mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Company</th>
                                        <th>Location</th>
                                        <th>Sector</th>
                                        <th>Priority</th>
                                        <th>Stage</th>
                                        <th className="text-end">Est. Deal</th>
                                        <th style={{ width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((t, i) => {
                                        const sec = SECTORS[t.cat] || {};
                                        const pri = PRIORITY_MAP[t.pri] || { label: t.pri, color: 'secondary' };
                                        const stage = PIPELINE_STAGES[t.pipelineStage] || {};
                                        return (
                                            <tr key={t.slug || i} style={{ cursor: 'pointer' }}>
                                                <td className="text-muted" onClick={() => router.push(`/apps/targets/${t.slug}`)}>{i + 1}</td>
                                                <td onClick={() => router.push(`/apps/targets/${t.slug}`)}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="fw-medium">{t.n}</span>
                                                        {t.ticker && <HkBadge bg="smoke" size="sm" soft className="font-monospace">{t.ticker}</HkBadge>}
                                                    </div>
                                                </td>
                                                <td onClick={() => router.push(`/apps/targets/${t.slug}`)}><span className="text-muted d-inline-flex align-items-center gap-1"><i className="ri-map-pin-line fs-8" /> {t.loc}</span></td>
                                                <td onClick={() => router.push(`/apps/targets/${t.slug}`)}><HkBadge bg={sec.color || 'secondary'} soft size="sm">{sec.label || t.cat}</HkBadge></td>
                                                <td onClick={() => router.push(`/apps/targets/${t.slug}`)}><HkBadge bg={pri.color} soft size="sm">{pri.label}</HkBadge></td>
                                                <td onClick={() => router.push(`/apps/targets/${t.slug}`)}><HkBadge bg={stage.color || 'secondary'} soft size="sm">{stage.label || t.pipelineStage}</HkBadge></td>
                                                <td className="text-end fw-medium" onClick={() => router.push(`/apps/targets/${t.slug}`)}>{t.estDealValue || '—'}</td>
                                                <td>
                                                    <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover text-danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Add Account Modal */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)} size="lg" centered>
                <Form onSubmit={handleAdd}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fs-5">Add Target Account</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Company Name *</Form.Label>
                                    <Form.Control value={addForm.n} onChange={e => setAddForm(p => ({ ...p, n: e.target.value }))} required placeholder="e.g. Acme Steel Corp" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Location</Form.Label>
                                    <Form.Control value={addForm.loc} onChange={e => setAddForm(p => ({ ...p, loc: e.target.value }))} placeholder="e.g. Carson, CA" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Sector</Form.Label>
                                    <Form.Select value={addForm.cat} onChange={e => setAddForm(p => ({ ...p, cat: e.target.value }))}>
                                        {Object.entries(SECTORS).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Priority</Form.Label>
                                    <Form.Select value={addForm.pri} onChange={e => setAddForm(p => ({ ...p, pri: e.target.value }))}>
                                        {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Pipeline Stage</Form.Label>
                                    <Form.Select value={addForm.pipelineStage} onChange={e => setAddForm(p => ({ ...p, pipelineStage: e.target.value }))}>
                                        {Object.entries(PIPELINE_STAGES).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Steel Needs</Form.Label>
                                    <Form.Control value={addForm.needs} onChange={e => setAddForm(p => ({ ...p, needs: e.target.value }))} placeholder="e.g. Steel service bodies, utility bodies" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Steel Products</Form.Label>
                                    <Form.Control value={addForm.steel} onChange={e => setAddForm(p => ({ ...p, steel: e.target.value }))} placeholder="e.g. Galvannealed (GA) coil/sheet" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Est. Deal Value</Form.Label>
                                    <Form.Control value={addForm.estDealValue} onChange={e => setAddForm(p => ({ ...p, estDealValue: e.target.value }))} placeholder="e.g. $120K" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Revenue</Form.Label>
                                    <Form.Control value={addForm.revenue} onChange={e => setAddForm(p => ({ ...p, revenue: e.target.value }))} placeholder="e.g. $85M" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Employees</Form.Label>
                                    <Form.Control value={addForm.employees} onChange={e => setAddForm(p => ({ ...p, employees: e.target.value }))} placeholder="e.g. 500+" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Website</Form.Label>
                                    <Form.Control value={addForm.website} onChange={e => setAddForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">LinkedIn</Form.Label>
                                    <Form.Control value={addForm.linkedin} onChange={e => setAddForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/company/..." />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Phone</Form.Label>
                                    <Form.Control value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fs-8 fw-semibold">Description</Form.Label>
                                    <Form.Control as="textarea" rows={2} value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief company description..." />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving || !addForm.n.trim()}>
                            {saving ? 'Saving...' : 'Add Account'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">Delete Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete <strong>{deleteTarget?.n}</strong>?</p>
                    <p className="text-muted mb-0">This action cannot be undone. All contacts, notes, and activity history for this account will be removed.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default TargetsPage;
