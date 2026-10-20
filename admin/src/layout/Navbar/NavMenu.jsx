import * as Icons from 'tabler-icons-react';
import HkBadge from '@/components/@hk-badge/@hk-badge';

export const NavMenu = [
    {
        group: '',
        contents: [
            {
                name: 'Dashboard',
                icon: <Icons.Template />,
                path: '/dashboard',
                badge: <HkBadge size="sm" bg="pumpkin" soft className="ms-xl-2 ms-auto">CMO</HkBadge>
            },
        ]
    },
    {
        group: 'Work',
        contents: [
            {
                name: 'Tickets',
                icon: <Icons.Ticket />,
                path: '/apps/tickets',
                badge: <HkBadge size="sm" bg="danger" soft className="ms-xl-2 ms-auto">8</HkBadge>,
                grp_name: "work",
            },
            {
                name: 'Calendar',
                icon: <Icons.CalendarEvent />,
                path: '/apps/calendar',
                grp_name: "work",
            },
            {
                id: 'dash_email',
                name: 'Messages',
                icon: <Icons.Mail />,
                path: '/apps/email',
                grp_name: "work",
            },
            {
                id: 'dash_chat',
                name: 'Team Chat',
                icon: <Icons.Messages />,
                path: '/apps/chat/chats',
                grp_name: "work",
            },
        ]
    },
    {
        group: 'Sales',
        contents: [
            {
                name: 'Leads',
                icon: <Icons.Flame />,
                path: '/apps/leads',
                grp_name: "sales",
            },
            {
                name: 'Target Accounts',
                icon: <Icons.Target />,
                path: '/apps/targets',
                badge: <HkBadge size="sm" bg="primary" soft className="ms-xl-2 ms-auto">203</HkBadge>,
                grp_name: "sales",
            },
            {
                name: 'Pipeline',
                icon: <Icons.ArrowsRight />,
                path: '/apps/pipeline',
                grp_name: "sales",
            },
            {
                name: 'Competitors',
                icon: <Icons.ChartBar />,
                path: '/apps/competitors',
                grp_name: "sales",
            },
            {
                id: 'dash_campaigns',
                name: 'Campaigns',
                icon: <Icons.Speakerphone />,
                path: '/apps/campaigns/',
                childrens: [
                    {
                        name: 'All Campaigns',
                        path: '/apps/campaigns/all',
                        grp_name: "sales",
                    },
                    {
                        name: 'Calendar',
                        path: '/apps/campaigns/calendar',
                        grp_name: "sales",
                    },
                ]
            },
        ]
    },
    {
        group: 'Content',
        contents: [
            {
                name: 'Content Calendar',
                icon: <Icons.CalendarEvent />,
                path: '/apps/content-calendar',
                grp_name: "content",
            },
            {
                name: 'Gallery',
                icon: <Icons.Photo />,
                path: '/apps/gallery',
                grp_name: "content",
            },
            {
                id: 'dash_blog',
                name: 'Blog',
                icon: <Icons.Browser />,
                path: '/apps/blog/',
                childrens: [
                    {
                        name: 'Posts',
                        path: '/apps/blog/posts',
                        grp_name: "content",
                    },
                    {
                        name: 'Add New Post',
                        path: '/apps/blog/add-new-post',
                        grp_name: "content",
                    },
                ]
            },
        ]
    },
    {
        group: 'Admin',
        contents: [
            {
                id: 'dash_contact',
                name: 'Contacts',
                icon: <Icons.Notebook />,
                path: '/apps/contact/',
                childrens: [
                    {
                        name: 'Contact List',
                        path: '/apps/contact/contact-list',
                        grp_name: "admin",
                    },
                    {
                        name: 'Contact Cards',
                        path: '/apps/contact/contact-cards',
                        grp_name: "admin",
                    },
                ]
            },
            {
                id: 'dash_invoice',
                name: 'Proposals',
                icon: <Icons.FileDigit />,
                path: '/apps/invoices/',
                childrens: [
                    {
                        name: 'Proposal List',
                        path: '/apps/invoices/invoice-list',
                        grp_name: "admin",
                    },
                    {
                        name: 'Create Proposal',
                        path: '/apps/invoices/create-invoice',
                        grp_name: "admin",
                    },
                    {
                        name: 'Preview',
                        path: '/apps/invoices/invoice-preview',
                        grp_name: "admin",
                    },
                ]
            },
            {
                name: 'File Manager',
                icon: <Icons.Folders />,
                path: '/apps/file-manager/list-view',
                grp_name: "admin",
            },
            {
                id: 'dash_profile',
                name: 'Settings',
                icon: <Icons.Settings />,
                path: '/profile/',
                childrens: [
                    {
                        name: 'Profile',
                        path: '/profile',
                        grp_name: "admin",
                    },
                    {
                        name: 'Account',
                        path: '/profile/account',
                        grp_name: "admin",
                    },
                ]
            },
        ]
    },
    {
        group: 'Quick Links',
        contents: [
            {
                name: 'PTP Website',
                icon: <Icons.World />,
                path: '/site/index.html',
                grp_name: "links",
            },
            {
                name: 'Intro Deck',
                icon: <Icons.Presentation />,
                path: '/deck/index.html',
                grp_name: "links",
            },
        ]
    },
]
