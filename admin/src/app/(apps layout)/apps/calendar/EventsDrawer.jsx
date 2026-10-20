'use client';
import SimpleBar from 'simplebar-react';
import { Button, Badge } from 'react-bootstrap';
import classNames from 'classnames';
import Link from 'next/link';
import * as Icons from 'react-feather';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import { getCampaignBySlug, CAMPAIGN_CATEGORIES, CAMPAIGN_STATUSES } from '@/data/campaigns/campaign-data';

const EventsDrawer = ({ show, onClose, info, event }) => {
    const campaignSlug = event?.extendedProps?.campaign;
    const campaign = campaignSlug ? getCampaignBySlug(campaignSlug) : null;
    const cat = campaign ? CAMPAIGN_CATEGORIES[campaign.category] : null;
    const status = campaign ? CAMPAIGN_STATUSES[campaign.status] : null;

    return (
        <div className={classNames("hk-drawer calendar-drawer drawer-right", { "drawer-toggle": show })} style={{ border: "none", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }}>
            <div className="drawer-header">
                <div className="drawer-header-action">
                    {campaign && (
                        <Link href={`/apps/campaigns/${campaign.slug}`} className="btn btn-sm btn-flush-secondary btn-icon btn-rounded flush-soft-hover">
                            <span className="icon">
                                <span className="feather-icon">
                                    <Icons.ExternalLink />
                                </span>
                            </span>
                        </Link>
                    )}
                    <Button bsPrefix="btn-close" className="drawer-close" onClick={onClose}>
                        <span aria-hidden="true">&times;</span>
                    </Button>
                </div>
            </div>
            <div className="drawer-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="drawer-content-wrap">
                        {campaign ? (
                            <>
                                <div className="event-head mb-4">
                                    <HkBadge bg={cat?.color || 'primary'} indicator className="badge-indicator-xl flex-shrink-0 me-2" />
                                    <div>
                                        <div className="event-name">{campaign.name}</div>
                                        <span className="text-muted fs-8">Campaign #{campaign.number}</span>
                                    </div>
                                </div>
                                <ul className="event-detail">
                                    <li>
                                        <span className="ev-icon-wrap">
                                            <span className="feather-icon"><Icons.Calendar /></span>
                                        </span>
                                        {campaign.timeline}
                                    </li>
                                    <li>
                                        <span className="ev-icon-wrap">
                                            <span className="feather-icon"><Icons.DollarSign /></span>
                                        </span>
                                        {campaign.budget}
                                    </li>
                                    <li>
                                        <span className="ev-icon-wrap">
                                            <span className="feather-icon"><Icons.Tag /></span>
                                        </span>
                                        <div className="d-flex gap-2">
                                            {cat && <Badge bg={`soft-${cat.color}`} className={`text-${cat.color}`}><i className={`${cat.icon} me-1`} />{cat.label}</Badge>}
                                            {status && <Badge bg={status.color}>{status.label}</Badge>}
                                        </div>
                                    </li>
                                    <li>
                                        <span className="ev-icon-wrap">
                                            <span className="feather-icon"><Icons.CheckSquare /></span>
                                        </span>
                                        <div>
                                            <div className="fw-medium mb-1">{campaign.deliverables.length} Deliverables</div>
                                            <ul className="list-unstyled mb-0 ps-0">
                                                {campaign.deliverables.slice(0, 4).map((d, i) => (
                                                    <li key={i} className="fs-7 text-muted mb-1">
                                                        <i className="ri-checkbox-blank-circle-line fs-9 me-1" />{d}
                                                    </li>
                                                ))}
                                                {campaign.deliverables.length > 4 && (
                                                    <li className="fs-8 text-primary">+{campaign.deliverables.length - 4} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="ev-icon-wrap">
                                            <span className="feather-icon"><Icons.TrendingUp /></span>
                                        </span>
                                        <div>
                                            <div className="fw-medium mb-1">KPIs</div>
                                            <div className="fs-7 text-muted">{campaign.kpis}</div>
                                        </div>
                                    </li>
                                </ul>
                                <div className="mt-3">
                                    <Link href={`/apps/campaigns/${campaign.slug}`} className="btn btn-primary btn-sm w-100">
                                        View Full Campaign
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="event-head mb-4">
                                <HkBadge bg="primary" indicator className="badge-indicator-xl flex-shrink-0 me-2" />
                                <div>
                                    <div className="event-name">{info}</div>
                                    <span>Event</span>
                                </div>
                            </div>
                        )}
                    </div>
                </SimpleBar>
            </div>
        </div>
    );
};

export default EventsDrawer;
