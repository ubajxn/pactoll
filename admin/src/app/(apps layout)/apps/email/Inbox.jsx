import { useState } from 'react';
import { Badge, Button, Dropdown, Form, ListGroup } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { useWindowWidth } from '@react-hook/window-size';
import { Archive, Calendar, Check, Edit, Inbox, Layout, Mail, RefreshCw, Send, Settings, Star, Trash2 } from 'react-feather';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import ComposeEmail from './ComposeEmail';

const InboxList = ({ show, toggleSidebar }) => {
    const { states, dispatch } = useGlobalStateContext();
    const [showComposePopup, setShowComposePopup] = useState(false);

    const width = useWindowWidth();
    const Conversation = () => {
        if (width <= 991) {
            dispatch({ type: "open_email" })
            dispatch({ type: "top_nav_toggle" })

        }
    }

    return (
        <>
            <div className="emailapp-aside">
                <header className="aside-header">
                    <Dropdown>
                        <Dropdown.Toggle as="a" className="emailapp-title link-dark" href="#">
                            <h1>Inbox</h1>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Inbox />
                                </span>
                                <span>Inbox</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Send />
                                </span>
                                <span>Sent</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Archive />
                                </span>
                                <span>Archive</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Edit />
                                </span>
                                <span>Draft</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Trash2 />
                                </span>
                                <span>Trash</span>
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <div className="d-flex">
                        <Button as="a" href="#" className="btn-icon btn-flush-dark btn-rounded flush-soft-hover me-0">
                            <span className="icon">
                                <span className="feather-icon">
                                    <RefreshCw />
                                </span>
                            </span>
                        </Button>
                        <Dropdown>
                            <Dropdown.Toggle as="a" href="#" className="btn btn-icon  btn-rounded flush-soft-hover btn-flush-dark dropdown-toggle no-caret me-1">
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Settings />
                                    </span>
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" >
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Mail />
                                    </span>
                                    <span>Show unread messages</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Star />
                                    </span>
                                    <span>Show Starred Messages</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Calendar />
                                    </span>
                                    <span>Sort by Date</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Layout />
                                    </span>
                                    <span>Sort by Category</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Check />
                                    </span>
                                    <span>Mark all as read</span></Dropdown.Item>
                                <div className="dropdown-divider" />
                                <Dropdown.Item>Settings</Dropdown.Item>
                                <Dropdown.Item>Help</Dropdown.Item>
                                <Dropdown.Item>Report a problem	</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button as="a" href="#" className="btn-icon btn-rounded show-compose-popup" onClick={() => dispatch({ type: "compose_email", composeEmail: !states.emailState.composeEmail })} >
                            <span className="icon">
                                <span className="feather-icon">
                                    <Edit />
                                </span>
                            </span>
                        </Button>
                    </div>
                    <div className={classNames("hk-sidebar-togglable", { "active": !show })} onClick={toggleSidebar} />
                </header>
                <SimpleBar className="aside-body">
                    <Form className="aside-search" role="search">
                        <Form.Control type="text" placeholder="Search inbox" />
                    </Form>
                    <ListGroup as="ul" variant="flush" className="email-list">
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-primary avatar-rounded">
                                        <span className="initial-wrap">MP</span>
                                    </div>
                                    <Badge bg="primary" className="badge-indicator badge-indicator-nobdr" />
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Mark Proner</div>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">9:30 AM</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Website RFQ form — field requirements</div>
                                        <div className="email-text">
                                            <p>Jeff, the RFQ form needs gauge, width, grade, and quantity fields. Also need a dropdown for service type (slitting, leveling, CTL).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-warning avatar-rounded">
                                        <span className="initial-wrap">TR</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Thomas Register</div>
                                            <Badge pill bg="warning" className="badge-sm">Directory</Badge>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">7:51 AM</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Your listing has been verified</div>
                                        <div className="email-text">
                                            <p>Pacific Toll Processing has been verified and is now live on Thomas Register. Your profile will appear in steel processing searches.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email active-user">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-success avatar-rounded">
                                        <span className="initial-wrap">JJ</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Jeff Jack</div>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">Yesterday</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Campaign calendar synced — 32 campaigns mapped</div>
                                        <div className="email-text">
                                            <p>All campaigns are now in the operations suite with deliverables, KPIs, timelines, and budgets. Calendar is live.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-info avatar-rounded">
                                        <span className="initial-wrap">FB</span>
                                    </div>
                                    <Badge bg="primary" className="badge-indicator badge-indicator-nobdr" />
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">FABTECH Events</div>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">Oct 18</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Booth confirmation — FABTECH 2026</div>
                                        <div className="email-text">
                                            <p>Your booth #4217 for FABTECH 2026 has been confirmed. Please review the floor plan and submit your booth design by Nov 15.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-danger avatar-rounded">
                                        <span className="initial-wrap">LI</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">LinkedIn Sales Nav</div>
                                            <Badge bg="primary" pill className="badge-sm">Outreach</Badge>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">Oct 17</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">7 new connection requests accepted</div>
                                        <div className="email-text">
                                            <p>Your outreach campaign targeting automotive and construction sector purchasing managers has 7 new accepted connections this week.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-violet avatar-rounded">
                                        <span className="initial-wrap">MC</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Metal Center News</div>
                                            <Badge bg="success" pill className="badge-sm">Publication</Badge>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">Oct 15</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Ad placement confirmation — Q1 2027</div>
                                        <div className="email-text">
                                            <p>Your half-page ad placement in Metal Center News has been confirmed for Jan/Feb and Mar/Apr 2027 issues.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-success avatar-rounded">
                                        <span className="initial-wrap">PTP</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">PTP Operations</div>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">Oct 14</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Weekly pipeline update — 205 target accounts</div>
                                        <div className="email-text">
                                            <p>Pipeline status: 194 awareness, 7 engagement, 3 consideration, 1 proposal. Total estimated value: $3.3M.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                    </ListGroup>
                </SimpleBar>
            </div>
            {/* Compose email */}
            <ComposeEmail show={showComposePopup} onClose={() => setShowComposePopup(!showComposePopup)} />
            {/* /Compose email */}
        </>
    )
}


export default InboxList;
