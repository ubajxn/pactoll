'use client';
import { useGlobalStateContext } from "@/context/GolobalStateProvider";
import PageFooter from "../Footer/PageFooter";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import CompactNav from "../Navbar";

const MainLayout = ({ children }) => {
    const { states, dispatch } = useGlobalStateContext();
    const pathName = usePathname();
    const appRoutes = pathName.match('/apps/');

    return (
        <>
            <div
                className={classNames("hk-wrapper", { "hk__email__backdrop": states.emailState.maximize }, { "hk-pg-auth": pathName === "/error-404" })}
                data-layout="navbar"
                data-navbar-style={states.layoutState.topNavCollapse ? "collapsed" : ""}
                data-layout-style={states.layoutState.isSidebarCollapsed ? "collapsed" : "default"}
                data-menu="light"
                data-footer="simple"
            >
                <CompactNav />
                <div className={classNames("hk-pg-wrapper", { "pb-0": appRoutes })} >
                    {children}
                    {!appRoutes && <PageFooter />}
                </div>
            </div>
        </>
    )
}

export default MainLayout
