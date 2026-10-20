"use client"
import { useState, useMemo } from 'react';
import { Badge, Button, Card, Col, Container, Form, InputGroup, Row, Table } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { Search, Filter, Download, MapPin } from 'react-feather';
import { TARGET_ACCOUNTS, SECTORS, PRIORITY_MAP, SECTOR_COUNTS } from '@/data/targets/target-data';

const TargetsPage = () => {
    const [search, setSearch] = useState('');
    const [sectorFilter, setSectorFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const filtered = useMemo(() => {
        return TARGET_ACCOUNTS.filter(t => {
            const matchSearch = !search || t.n.toLowerCase().includes(search.toLowerCase()) || t.loc.toLowerCase().includes(search.toLowerCase()) || t.needs.toLowerCase().includes(search.toLowerCase());
            const matchSector = sectorFilter === 'all' || t.cat === sectorFilter;
            const matchPri = priorityFilter === 'all' || t.pri === priorityFilter;
            return matchSearch && matchSector && matchPri;
        });
    }, [search, sectorFilter, priorityFilter]);

    return (
        <Container fluid="xxl">
            <div className="hk-pg-header pt-7 pb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center">
                    <div className="mb-lg-0 mb-2">
                        <h1 className="pg-title">Target Accounts</h1>
                        <p>{TARGET_ACCOUNTS.length} identified accounts across {Object.keys(SECTORS).length} sectors</p>
                    </div>
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
                                    <div className="fs-4 fw-bold">{SECTOR_COUNTS[key]}</div>
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
                            <Col md={4} className="mb-md-0 mb-2">
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
                            <Col md={3} className="mb-md-0 mb-2">
                                <Form.Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                    <option value="all">All Priorities</option>
                                    <option value="high">High Priority</option>
                                    <option value="med">Medium Priority</option>
                                    <option value="low">Standard</option>
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
                        <Table responsive hover className="mb-0">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Company</th>
                                    <th>Location</th>
                                    <th>Sector</th>
                                    <th>Priority</th>
                                    <th>Needs</th>
                                    <th>Steel Products</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((t, i) => {
                                    const sec = SECTORS[t.cat] || {};
                                    const pri = PRIORITY_MAP[t.pri] || { label: t.pri, color: 'secondary' };
                                    return (
                                        <tr key={i}>
                                            <td className="text-muted">{i + 1}</td>
                                            <td className="fw-medium">{t.n}</td>
                                            <td><span className="text-muted d-inline-flex align-items-center gap-1"><MapPin size={12} /> {t.loc}</span></td>
                                            <td><HkBadge bg={sec.color || 'secondary'} soft size="sm">{sec.label || t.cat}</HkBadge></td>
                                            <td><HkBadge bg={pri.color} soft size="sm">{pri.label}</HkBadge></td>
                                            <td className="fs-8">{t.needs}</td>
                                            <td className="fs-8 text-muted">{t.steel}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default TargetsPage;
