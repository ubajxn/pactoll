import React from 'react';
import SimpleBar from 'simplebar-react';
import { AlignLeft, Bell, Calendar, CheckSquare, Clock, CreditCard, Inbox, Plus, Settings, Tag } from 'react-feather';
import { Button, Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import Link from 'next/link';
import Image from 'next/image';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import CompactMenu from './CompactMenu';
import NavSearch from './NavSearch';
import { useTheme } from '../theme-provider/theme-provider';
import { ThemeSwitcher } from '../theme-provider/theme-switcher';

//Images
import avatar2 from '@/assets/img/avatar2.jpg';
import avatar3 from '@/assets/img/avatar3.jpg';
import avatar10 from '@/assets/img/avatar10.jpg';
import avatar12 from '@/assets/img/avatar12.jpg';
import BrandSm from '@/assets/img/ptp-icon.svg';
import ptpBrand from '@/assets/img/ptp-brand.svg';
import ptpBrandDark from '@/assets/img/ptp-brand-dark.svg';


const CompactNav = () => {
    const { state, dispatch } = useGlobalStateContext();
    const { theme } = useTheme();

    return (
        <Navbar expand="xl" className="hk-navbar navbar-light fixed-top" >
            <Container fluid>
                {/* Start Nav */}
                <div className="nav-start-wrap flex-fill">
                    {/* Brand */}
                    <Link href="/" className="navbar-brand d-xl-flex d-none">
                        <Image className="brand-img img-fluid" src={BrandSm} alt="brand" />
                        {theme === "light" ? <Image className="brand-img img-fluid logo-light" src={ptpBrand} alt="Pacific Toll Processing" /> : <Image className="brand-img img-fluid logo-dark" src={ptpBrandDark} alt="Pacific Toll Processing" />}
                    </Link>
                    {/* /Brand */}

                    <Button onClick={() => dispatch({ type: "sidebar_toggle" })} className="btn-icon btn-rounded btn-flush-dark flush-soft-hover navbar-toggle d-xl-none">
                        <span className="icon">
                            <span className="feather-icon"><AlignLeft /></span>
                        </span>
                    </Button>
                    {/* <!-- Navbar Nav --> */}
                    <CompactMenu />
                    <div onClick={() => dispatch({ type: "sidebar_toggle" })} className="hk-menu-backdrop" />
                </div>
                {/* End Nav */}
                <div className="nav-end-wrap">
                    {/* Search */}
                    <NavSearch />
                    <Nav className="navbar-nav flex-row">
                        <Nav.Item className='ms-2'>
                            <ThemeSwitcher />
                        </Nav.Item>
                        <Nav.Item>
                            <Button variant="flush-dark" as={Link} href="/apps/email" className="btn-icon btn-rounded flush-soft-hover">
                                <span className="icon">
                                    <span className=" position-relative">
                                        <span className="feather-icon"><Inbox /></span>
                                        <HkBadge bg="primary" soft pill size="sm" className="position-top-end-overflow-1" >4</HkBadge>
                                    </span>
                                </span>
                            </Button>
                        </Nav.Item>
                        <Nav.Item>
                            <Dropdown className="dropdown-notifications">
                                <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="position-relative">
                                            <span className="feather-icon"><Bell /></span>
                                            <HkBadge bg="success" indicator className="position-top-end-overflow-1" />
                                        </span>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="p-0">
                                    <Dropdown.Header className="px-4 fs-6">
                                        Notifications
                                        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                            <span className="icon">
                                                <span className="feather-icon"><Settings /></span>
                                            </span>
                                        </Button>
                                    </Dropdown.Header>
                                    <SimpleBar className="dropdown-body  p-2">
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar avatar-rounded avatar-sm">
                                                        <Image src={avatar2} alt="user" className="avatar-img" />
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Morgan Freeman accepted your invitation to join the team</div>
                                                        <div className="notifications-info">
                                                            <HkBadge bg="success" soft >Collaboration</HkBadge>
                                                            <div className="notifications-time">Today, 10:14 PM</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar  avatar-icon avatar-sm avatar-success avatar-rounded">
                                                        <span className="initial-wrap">
                                                            <span className="feather-icon"><Inbox /> </span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">New message received from Alan Rickman</div>
                                                        <div className="notifications-info">
                                                            <div className="notifications-time">Today, 7:51 AM</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar  avatar-icon avatar-sm avatar-pink avatar-rounded">
                                                        <span className="initial-wrap">
                                                            <span className="feather-icon"><Clock /></span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Follow up with Chatsworth Products on facility tour — Friday at 9:30 am</div>
                                                        <div className="notifications-info">
                                                            <div className="notifications-time">Yesterday, 9:25 PM</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar avatar-sm avatar-rounded">
                                                        <Image src={avatar3} alt="user" className="avatar-img" />
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Application of Sarah Williams is waiting for your approval</div>
                                                        <div className="notifications-info">
                                                            <div className="notifications-time">Today 10:14 PM</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar avatar-sm avatar-rounded">
                                                        <Image src={avatar10} alt="user" className="avatar-img" />
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Winston Churchil shared a document with you</div>
                                                        <div className="notifications-info">
                                                            <HkBadge bg="violet" soft >File Manager</HkBadge>
                                                            <div className="notifications-time">2 Oct, 2021</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar  avatar-icon avatar-sm avatar-danger avatar-rounded">
                                                        <span className="initial-wrap">
                                                            <span className="feather-icon"><Calendar /></span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Last 2 days left for the project to be completed</div>
                                                        <div className="notifications-info">
                                                            <HkBadge bg="orange" soft >Updates</HkBadge>
                                                            <div className="notifications-time">14 Sep, 2021</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                    </SimpleBar>
                                    <div className="dropdown-footer">
                                        <Link href="#"><u>View all notifications</u>
                                        </Link>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav.Item>
                        <Nav.Item>
                            <Dropdown className="ps-2">
                                <Dropdown.Toggle as="a" href="#" className="no-caret">
                                    <div className="avatar avatar-rounded avatar-xs">
                                        <Image src={avatar12} alt="user" className="avatar-img" />
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end">
                                    <div className="p-2">
                                        <div className="media">
                                            <div className="media-head me-2">
                                                <div className="avatar avatar-primary avatar-sm avatar-rounded">
                                                    <span className="initial-wrap">JJ</span>
                                                </div>
                                            </div>
                                            <div className="media-body">
                                                <Dropdown>
                                                    <Dropdown.Toggle as="a" href="#" className="d-block fw-medium text-dark">Jeff Jack</Dropdown.Toggle>
                                                    <Dropdown.Menu align="end">
                                                        <div className="p-2">
                                                            <div className="media align-items-center active-user mb-3">
                                                                <div className="media-head me-2">
                                                                    <div className="avatar avatar-primary avatar-xs avatar-rounded">
                                                                        <span className="initial-wrap">JJ</span>
                                                                    </div>
                                                                </div>
                                                                <div className="media-body">
                                                                    <Link href="#" className="d-flex link-dark">Jeff Jack <i className="ri-checkbox-circle-fill fs-7 text-primary ms-1" />
                                                                    </Link>
                                                                    <Link href="#" className="d-block fs-8 link-secondary">
                                                                        <u>Manage your account</u>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                            <div className="media align-items-center mb-3">
                                                                <div className="media-head me-2">
                                                                    <div className="avatar avatar-xs avatar-rounded">
                                                                        <Image src={avatar12} alt="user" className="avatar-img" />
                                                                    </div>
                                                                </div>
                                                                <div className="media-body">
                                                                    <Link href="#" className="d-block link-dark">Jeff / Admin</Link>
                                                                    <Link href="#" className="d-block fs-8 link-secondary">jeff@pacifictoll.com</Link>
                                                                </div>
                                                            </div>
                                                            <Button variant="outline-light" size="sm" className="btn-block">
                                                                <span>
                                                                    <span className="icon">
                                                                        <span className="feather-icon">
                                                                            <Plus />
                                                                        </span>
                                                                    </span>
                                                                    <span>Add Account</span></span>
                                                            </Button>
                                                        </div>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                <div className="fs-7">jeff@pacifictoll.com</div>
                                                <Link href="#" className="d-block fs-8 link-secondary">
                                                    <u>Sign Out</u>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item as={Link} href="/profile" >Profile</Dropdown.Item>
                                    <Dropdown.Item>
                                        <span className="me-2">Offers</span>
                                        <span className="badge badge-sm badge-soft-pink">2</span>
                                    </Dropdown.Item>
                                    <Dropdown.Divider as="div" />
                                    <h6 className="dropdown-header">Manage Account</h6>
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <CreditCard />
                                        </span>
                                        <span>Payment methods</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <CheckSquare />
                                        </span>
                                        <span>Subscriptions</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <Settings />
                                        </span>
                                        <span>Settings</span>
                                    </Dropdown.Item>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <Tag />
                                        </span>
                                        <span>Raise a ticket</span>
                                    </Dropdown.Item>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item>
                                        Terms &amp; Conditions
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        Help &amp; Support
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav.Item>
                    </Nav>
                </div>
                {/* /End Nav */}
            </Container>
        </Navbar>
    )
}


export default CompactNav;