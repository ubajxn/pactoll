/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Container, Nav } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import NavHeader from './NavHeader';
import { NavMenu } from './NavMenu';
import classNames from 'classnames';
import { useWindowWidth } from '@react-hook/window-size';
import { compactMenu } from '@/utils/CompactNavInit';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';

const CompactMenu = () => {

    const { dispatch } = useGlobalStateContext();
    const [activeMenu, setActiveMenu] = useState();
    const [activeSubMenu, setActiveSubMenu] = useState();
    const width = useWindowWidth();
    const pathname = usePathname();

    useEffect(() => {
        window.dispatchEvent(new Event('resize'))
    }, [])

    useEffect(() => {
        setTimeout(() => {
            compactMenu();
        }, 300);
    })

    useEffect(() => {
        if (width) {
            compactMenu();
        }
    }, [width])

    const router = useRouter();
    useEffect(() => {
        require("bootstrap/js/dist/collapse");
        document.addEventListener("click", function (e) {
            const target = e.target.closest(".more-nav-item");
            const extra = e.target.closest(".extra-link");
            if (target && !extra) {
                e.preventDefault();
                const newTarget = e.target.closest(".nav-link");
                router.prefetch(newTarget.getAttribute("href"));
                router.push(newTarget.getAttribute("href"));
            }
        });
    }, [router])

    const handleClick = (menuName) => {
        setActiveMenu(menuName);
        if (width < 1199) {
            dispatch({ type: "sidebar_toggle" })
        }
    }

    return (
        <div className="hk-menu">
            {/* Brand */}
            <NavHeader />
            {/* Main Menu */}
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <Container fluid className="menu-group">
                        <Nav as="ul" className="navbar-nav flex-column">
                            {
                                NavMenu.map((routes, index) => (
                                    <React.Fragment key={index} >
                                        {
                                            routes.contents.map((menus, ind) => (
                                                <Nav.Item as='li' key={ind} className={classNames({ "active": pathname.startsWith(menus.path) })} >
                                                    {
                                                        menus.childrens
                                                            ?
                                                            <>
                                                                <Nav.Link data-bs-toggle="collapse" data-bs-target={`#${menus.id}`} aria-expanded={activeMenu === menus.name ? "true" : "false"} onClick={() => setActiveMenu(menus.name)}  >
                                                                    <span className={classNames("nav-link-text", { "position-relative": menus.badgeIndicator })} >
                                                                        {menus.name}
                                                                        {menus.badgeIndicator && menus.badgeIndicator}
                                                                    </span>
                                                                    {menus.badge && menus.badge}
                                                                </Nav.Link>

                                                                <Nav as="ul" id={menus.id} className={classNames("nav flex-column nav-children", { "collapse": activeMenu !== menus.name })}>
                                                                    <Nav.Item as="li">
                                                                        <ul className="nav flex-column">
                                                                            {menus.childrens.map((subMenu, indx) => (
                                                                                subMenu.childrens
                                                                                    ?
                                                                                    <Nav.Item as="li" key={indx}>
                                                                                        <Link href="#" className="nav-link" data-bs-toggle="collapse" data-bs-target={`#${subMenu.id}`} aria-expanded={activeSubMenu === subMenu.name ? "true" : "false"} onClick={() => setActiveSubMenu(subMenu.name)}>
                                                                                            <span className="nav-link-text">
                                                                                                {subMenu.name}
                                                                                            </span>
                                                                                        </Link>

                                                                                        <Nav as="ul" id={subMenu.id} className={classNames("nav flex-column nav-children", { "collapse": activeSubMenu !== subMenu.name })}>
                                                                                            <Nav.Item as="li">
                                                                                                <ul className="nav flex-column">
                                                                                                    {subMenu.childrens.map((childrenPath, i) => (
                                                                                                        <li className="nav-item" key={i}>
                                                                                                            <Link href={childrenPath.path} onClick={handleClick} className={classNames("nav-link", { "active": pathname === childrenPath.path })}>
                                                                                                                <span className="nav-link-text">
                                                                                                                    {childrenPath.name}
                                                                                                                </span>
                                                                                                            </Link>
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </Nav.Item>
                                                                                        </Nav>

                                                                                    </Nav.Item>
                                                                                    :
                                                                                    <Nav.Item key={indx}>
                                                                                        <Link href={subMenu.path} onClick={handleClick} className={classNames("nav-link", { "active": pathname === subMenu.path })}>
                                                                                            <span className="nav-link-text">
                                                                                                {subMenu.name}
                                                                                            </span>
                                                                                        </Link>
                                                                                    </Nav.Item>
                                                                            ))}
                                                                        </ul>
                                                                    </Nav.Item>
                                                                </Nav>
                                                            </>
                                                            :
                                                            <>
                                                                {
                                                                    (routes.group === "Documentation")
                                                                        ?
                                                                        <Nav.Link href={menus.path} className="extra-link">
                                                                            <span className="nav-link-text">{menus.name}</span>
                                                                            {menus.badge && menus.badge}
                                                                        </Nav.Link>
                                                                        :
                                                                        <Link href={menus.path} onClick={() => handleClick(menus.name)} className={classNames("nav-link", { "active": pathname === menus.path })} >

                                                                            <span className="nav-link-text">{menus.name}</span>
                                                                            {menus.badge && menus.badge}
                                                                        </Link>
                                                                }
                                                            </>
                                                    }
                                                </Nav.Item>
                                            ))
                                        }
                                    </React.Fragment>
                                ))
                            }
                        </Nav>
                    </Container>
                </div>
            </SimpleBar>
        </div>
    )
}

export default CompactMenu
