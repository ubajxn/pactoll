export const TICKET_STATUSES = {
  open: { label: 'Open', bg: 'info', icon: 'circle' },
  'in-progress': { label: 'In Progress', bg: 'primary', icon: 'clock' },
  'waiting': { label: 'Waiting on Response', bg: 'warning', icon: 'pause-circle' },
  'review': { label: 'In Review', bg: 'purple', icon: 'eye' },
  resolved: { label: 'Resolved', bg: 'success', icon: 'check-circle' },
  closed: { label: 'Closed', bg: 'secondary', icon: 'x-circle' },
};

export const TICKET_PRIORITIES = {
  critical: { label: 'Critical', bg: 'danger', order: 0 },
  high: { label: 'High', bg: 'orange', order: 1 },
  medium: { label: 'Medium', bg: 'warning', order: 2 },
  low: { label: 'Low', bg: 'info', order: 3 },
};

export const TICKET_TYPES = {
  task: { label: 'Task', icon: 'check-square', bg: 'primary' },
  bug: { label: 'Bug', icon: 'alert-triangle', bg: 'danger' },
  feature: { label: 'Feature Request', icon: 'star', bg: 'success' },
  question: { label: 'Question', icon: 'help-circle', bg: 'info' },
  escalation: { label: 'Escalation', icon: 'alert-octagon', bg: 'danger' },
  'follow-up': { label: 'Follow-Up', icon: 'rotate-cw', bg: 'warning' },
  outreach: { label: 'Outreach', icon: 'send', bg: 'primary' },
};

export const TEAM_MEMBERS = [
  { id: 'jeff', name: 'Jeff Zielinski', role: 'Admin / CMO', email: 'jeff@pacifictoll.com', initials: 'JZ', color: 'primary' },
  { id: 'mark', name: 'Mark Proner', role: 'Owner / President', email: 'mproner@pacifictoll.com', initials: 'MP', color: 'success' },
  { id: 'rose', name: 'Rose', role: 'Operations', email: 'rose@pacifictoll.com', initials: 'RO', color: 'warning' },
];

let nextId = 1020;
export function generateTicketId() {
  return `PTP-${nextId++}`;
}

export const TICKETS = [
  {
    id: 'PTP-1001',
    title: 'Follow up with Tesla Energy on facility tour scheduling',
    description: 'Tesla Energy expressed interest in touring our facility during the initial call. Need to coordinate with Mark on available dates and prepare the floor for walkthrough. This is a high-value prospect — $2.5M estimated deal.',
    type: 'follow-up',
    priority: 'high',
    status: 'in-progress',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: ['mark'],
    labels: ['sales', 'high-value'],
    targetAccount: 'tesla-energy',
    dueDate: '2026-10-25',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-18T14:30:00Z',
    comments: [
      { id: 1, author: 'jeff', text: 'Sent email to Sarah Chen requesting available dates. She mentioned sometime next week.', createdAt: '2026-10-15T09:15:00Z' },
      { id: 2, author: 'mark', text: 'Floor will be clear Thursday and Friday. Let\'s prep the conference room with the capability deck.', createdAt: '2026-10-16T11:00:00Z' },
      { id: 3, author: 'jeff', text: 'Confirmed Thursday Oct 24 at 10am. Sarah + their procurement lead will attend. Preparing welcome package.', createdAt: '2026-10-18T14:30:00Z' },
    ],
  },
  {
    id: 'PTP-1002',
    title: 'Chatsworth Products RFQ — slitting specs review',
    description: 'Chatsworth Products sent over their RFQ for 2027 slitting needs. Need to review specifications, pull pricing, and prepare our response by end of month.',
    type: 'task',
    priority: 'high',
    status: 'open',
    assignee: 'jeff',
    reporter: 'mark',
    watchers: ['rose'],
    labels: ['rfq', 'slitting'],
    targetAccount: 'chatsworth-products',
    dueDate: '2026-10-31',
    createdAt: '2026-10-17T08:00:00Z',
    updatedAt: '2026-10-17T08:00:00Z',
    comments: [
      { id: 1, author: 'mark', text: 'Got this from their purchasing manager Jason Park. Specs are attached in the shared drive. Priority — they\'re also talking to Feralloy.', createdAt: '2026-10-17T08:00:00Z' },
    ],
  },
  {
    id: 'PTP-1003',
    title: 'Website contact bot — design and requirements',
    description: 'Mark wants a popup contact bot on the customer website. Should be the most elegant, useful, and state-of-the-art chat/help interface. Research what competitors have, design our approach.',
    type: 'feature',
    priority: 'medium',
    status: 'open',
    assignee: 'jeff',
    reporter: 'mark',
    watchers: ['mark'],
    labels: ['website', 'customer-facing'],
    targetAccount: null,
    dueDate: '2026-11-15',
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
    comments: [
      { id: 1, author: 'mark', text: 'I really like the idea of a popup that asks if they can help. Should feel premium, not generic. Look at what the best SaaS companies do.', createdAt: '2026-10-18T10:00:00Z' },
    ],
  },
  {
    id: 'PTP-1004',
    title: 'Set up Google Business Profile for PTP',
    description: 'We have zero Google Business presence. Need to claim/create our GBP listing with correct NAP (name, address, phone), business hours, photos of the facility, and service categories.',
    type: 'task',
    priority: 'high',
    status: 'open',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: ['mark'],
    labels: ['digital', 'seo', 'quick-win'],
    targetAccount: null,
    dueDate: '2026-10-28',
    createdAt: '2026-10-14T07:00:00Z',
    updatedAt: '2026-10-14T07:00:00Z',
    comments: [],
  },
  {
    id: 'PTP-1005',
    title: 'Samsung SDI — cold outreach via LinkedIn',
    description: 'Samsung SDI\'s battery manufacturing facility in Ontario, CA is a prime target. Need to identify the right procurement contacts, connect on LinkedIn, and begin a warm introduction sequence.',
    type: 'outreach',
    priority: 'medium',
    status: 'in-progress',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: [],
    labels: ['sales', 'ev-battery'],
    targetAccount: 'samsung-sdi',
    dueDate: '2026-11-01',
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-19T16:00:00Z',
    comments: [
      { id: 1, author: 'jeff', text: 'Found Jin-Ho Park (VP Manufacturing) and Amy Lawson (Procurement Manager) on LinkedIn. Sent connection requests with custom notes about our toll processing capabilities.', createdAt: '2026-10-10T09:30:00Z' },
      { id: 2, author: 'jeff', text: 'Amy accepted! Sent an intro message about our facility proximity to their Ontario plant. Waiting for response.', createdAt: '2026-10-14T11:00:00Z' },
      { id: 3, author: 'jeff', text: 'Amy responded — they currently ship to Midwest for processing. Interested in local option. Setting up a call for next week.', createdAt: '2026-10-19T16:00:00Z' },
    ],
  },
  {
    id: 'PTP-1006',
    title: 'Create LinkedIn Company Page',
    description: 'PTP has no LinkedIn company page. Need to create it with proper branding, description, and start posting content. This is foundational for B2B outreach.',
    type: 'task',
    priority: 'high',
    status: 'waiting',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: ['mark'],
    labels: ['digital', 'social', 'quick-win'],
    targetAccount: null,
    dueDate: '2026-10-22',
    createdAt: '2026-10-12T08:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
    comments: [
      { id: 1, author: 'jeff', text: 'Need Mark to provide admin access to the company email for verification. Sent request.', createdAt: '2026-10-15T09:00:00Z' },
    ],
  },
  {
    id: 'PTP-1007',
    title: 'Monthly pipeline review — October',
    description: 'Schedule and prepare for the October pipeline review. Need to update all target account stages, review won/lost analysis, and set November priorities.',
    type: 'task',
    priority: 'medium',
    status: 'open',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: ['mark', 'rose'],
    labels: ['recurring', 'pipeline'],
    targetAccount: null,
    dueDate: '2026-10-30',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
    comments: [],
  },
  {
    id: 'PTP-1008',
    title: 'Feralloy competitive intelligence update',
    description: 'Feralloy just opened a new automotive-certified processing line. Need to assess impact on our pipeline, especially accounts like West Coast Metal Stamping and Proformance Manufacturing.',
    type: 'escalation',
    priority: 'high',
    status: 'in-progress',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: ['mark'],
    labels: ['competitive-intel', 'urgent'],
    targetAccount: null,
    dueDate: '2026-10-22',
    createdAt: '2026-10-16T07:00:00Z',
    updatedAt: '2026-10-18T15:00:00Z',
    comments: [
      { id: 1, author: 'jeff', text: 'Confirmed via Metal Center News — Feralloy\'s new line is IATF 16949 certified. This directly competes with our automotive prospects.', createdAt: '2026-10-16T10:00:00Z' },
      { id: 2, author: 'mark', text: 'We need to accelerate outreach to our automotive targets before Feralloy locks them in. What\'s our counter-position?', createdAt: '2026-10-17T08:00:00Z' },
      { id: 3, author: 'jeff', text: 'Our advantage: proximity (Carson vs Commerce), faster turnaround, personal service. Drafting a comparison one-pager we can use in sales conversations.', createdAt: '2026-10-18T15:00:00Z' },
    ],
  },
  {
    id: 'PTP-1009',
    title: 'Trade show registration — MSCI 2027 Conference',
    description: 'Register PTP for the MSCI (Metals Service Center Institute) annual conference, March 2027. Book booth, prepare materials, identify target contacts attending.',
    type: 'task',
    priority: 'low',
    status: 'open',
    assignee: 'jeff',
    reporter: 'jeff',
    watchers: ['mark'],
    labels: ['trade-show', 'marketing'],
    targetAccount: null,
    dueDate: '2026-12-15',
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
    comments: [],
  },
  {
    id: 'PTP-1010',
    title: 'Rivian Automotive — introduction via CalSteel connection',
    description: 'George Estrada at CSI mentioned that Rivian is looking for local toll processing for their EV body panels. He can make an intro. This could be massive.',
    type: 'outreach',
    priority: 'critical',
    status: 'open',
    assignee: 'jeff',
    reporter: 'mark',
    watchers: ['mark'],
    labels: ['sales', 'ev', 'high-value'],
    targetAccount: 'rivian-automotive',
    dueDate: '2026-10-23',
    createdAt: '2026-10-19T07:30:00Z',
    updatedAt: '2026-10-19T07:30:00Z',
    comments: [
      { id: 1, author: 'mark', text: 'George called me this morning. Rivian is unhappy with shipping costs to their Midwest processor. He offered to intro us directly to their supply chain VP. Let\'s move fast on this.', createdAt: '2026-10-19T07:30:00Z' },
    ],
  },
];

export function getTicketById(id) {
  return TICKETS.find(t => t.id === id);
}

export function getTicketsByAssignee(userId) {
  return TICKETS.filter(t => t.assignee === userId);
}

export function getTicketsByStatus(status) {
  return TICKETS.filter(t => t.status === status);
}

export function getTicketsByAccount(accountSlug) {
  return TICKETS.filter(t => t.targetAccount === accountSlug);
}

export function getTeamMember(id) {
  return TEAM_MEMBERS.find(m => m.id === id);
}

export function getOpenTicketCount() {
  return TICKETS.filter(t => !['resolved', 'closed'].includes(t.status)).length;
}

export function getMyTicketCount(userId) {
  return TICKETS.filter(t => t.assignee === userId && !['resolved', 'closed'].includes(t.status)).length;
}
