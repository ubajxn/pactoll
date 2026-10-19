import React, { useState } from 'react';
import SimpleBar from 'simplebar-react';
import { Button, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Search } from 'react-feather';

//Image
import avatar3 from '@/assets/img/avatar3.jpg';
import avatar4 from '@/assets/img/avatar4.jpg';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import Link from 'next/link';
import Image from 'next/image';

const NavSearch = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchValue, setSearchValue] = useState("")

    const CloseSearchInput = () => {
        setSearchValue("");
        setShowDropdown(false);
    }

    const pageVariants = {
        initial: {
            opacity: 0,
            y: 10
        },
        open: {
            opacity: 1,
            y: 0
        },
        close: {
            opacity: 0,
            y: 10
        }
    };

    return (
        <Dropdown as={Form} className="navbar-search me-2" show={showDropdown}>
            <Dropdown.Toggle as="div" className="no-caret bg-transparent">
                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover  d-xl-none" onClick={() => setShowDropdown(!showDropdown)} >
                    <span className="icon">
                        <span className="feather-icon"><Search /></span>
                    </span>
                </Button>
                <InputGroup className="d-xl-flex d-none">
                    <span className="input-affix-wrapper input-search affix-border">
                        <Form.Control type="text" className="bg-transparent" data-navbar-search-close="false" placeholder="Search..." aria-label="Search" onFocus={() => setShowDropdown(true)} onBlur={() => setShowDropdown(false)} value={searchValue} onChange={e => setSearchValue(e.target.value)} />
                        <span className="input-suffix" onClick={() => setSearchValue("")} >
                            <span>/</span>
                            <span className="btn-input-clear">
                                <i className="bi bi-x-circle-fill" />
                            </span>
                            <span className="spinner-border spinner-border-sm input-loader text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                            </span>
                        </span>
                    </span>
                </InputGroup>
            </Dropdown.Toggle>
            <Dropdown.Menu as={motion.div}
                initial="initial"
                animate={showDropdown ? "open" : "close"}
                variants={pageVariants}
                transition={{ duration: 0.3 }}
                className="p-0"
            >
                {/* Mobile Search */}
                <Dropdown.Item className="d-xl-none bg-transparent">
                    <InputGroup className="mobile-search">
                        <span className="input-affix-wrapper input-search">
                            <Form.Control type="text" placeholder="Search..." aria-label="Search" value={searchValue} onChange={e => setSearchValue(e.target.value)} onFocus={() => setShowDropdown(true)} autoFocus />
                            <span className="input-suffix" onClick={CloseSearchInput} >
                                <span className="btn-input-clear">
                                    <i className="bi bi-x-circle-fill" />
                                </span>
                                <span className="spinner-border spinner-border-sm input-loader text-primary" role="status">
                                    <span className="sr-only">Loading...</span>
                                </span>
                            </span>
                        </span>
                    </InputGroup>
                </Dropdown.Item>
                {/*/ Mobile Search */}
                <SimpleBar className="dropdown-body p-2">
                    <Dropdown.Header>Recent Search</Dropdown.Header>
                    <Dropdown.Item className="bg-transparent">
                        <HkBadge bg="secondary" soft pill className="me-1" >React</HkBadge>
                        <HkBadge bg="secondary" soft pill className="me-1" >Node JS</HkBadge>
                        <HkBadge bg="secondary" soft pill>SCSS</HkBadge>
                    </Dropdown.Item>
                    <Dropdown.Divider as="div" />
                    <Dropdown.Header>Help</Dropdown.Header>
                    <Dropdown.Item as={Link} href="#">
                        <div className="media align-items-center">
                            <div className="media-head me-2">
                                <div className="avatar avatar-icon avatar-xs avatar-soft-light avatar-rounded">
                                    <span className="initial-wrap">
                                        <span className="svg-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-corner-down-right" width={24} height={24} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M6 6v6a3 3 0 0 0 3 3h10l-4 -4m0 8l4 -4" />
                                            </svg>
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div className="media-body">
                                How to setup theme?
                            </div>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} href="#">
                        <div className="media align-items-center">
                            <div className="media-head me-2">
                                <div className="avatar avatar-icon avatar-xs avatar-soft-light avatar-rounded">
                                    <span className="initial-wrap">
                                        <span className="svg-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-corner-down-right" width={24} height={24} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M6 6v6a3 3 0 0 0 3 3h10l-4 -4m0 8l4 -4" />
                                            </svg>
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div className="media-body">
                                View detail documentation
                            </div>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Divider as="div" />
                    <Dropdown.Header>Users</Dropdown.Header>
                    <Dropdown.Item as={Link} href="#">
                        <div className="media align-items-center">
                            <div className="media-head me-2">
                                <div className="avatar avatar-xs avatar-rounded">
                                    <Image src={avatar3} alt="user" className="avatar-img" />
                                </div>
                            </div>
                            <div className="media-body">
                                Sarah Jone
                            </div>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} href="#">
                        <div className="media align-items-center">
                            <div className="media-head me-2">
                                <div className="avatar avatar-xs avatar-soft-primary avatar-rounded">
                                    <span className="initial-wrap">J</span>
                                </div>
                            </div>
                            <div className="media-body">
                                Joe Jackson
                            </div>
                        </div>
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} href="#">
                        <div className="media align-items-center">
                            <div className="media-head me-2">
                                <div className="avatar avatar-xs avatar-rounded">
                                    <Image src={avatar4} alt="user" className="avatar-img" />
                                </div>
                            </div>
                            <div className="media-body">
                                Maria Richard
                            </div>
                        </div>
                    </Dropdown.Item>
                </SimpleBar>
                <div className="dropdown-footer d-xl-flex d-none">
                    <Link href="#">
                        <u>Search all</u>
                    </Link>
                </div>
            </Dropdown.Menu>
        </Dropdown>
    )
}

export default NavSearch
