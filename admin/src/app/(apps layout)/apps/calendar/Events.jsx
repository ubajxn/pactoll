import { CAMPAIGNS } from '@/data/campaigns/campaign-data';

const CAMPAIGN_COLORS = {
    website: { bg: '#298DFF', border: '#298DFF' },
    social: { bg: '#da82f8', border: '#da82f8' },
    content: { bg: '#FFC400', border: '#FFC400' },
    directories: { bg: '#007D88', border: '#007D88' },
    events: { bg: '#FF6B6B', border: '#FF6B6B' },
    email: { bg: '#00C9A7', border: '#00C9A7' },
    publications: { bg: '#6C5CE7', border: '#6C5CE7' },
};

function parseTimeline(timeline) {
    const months = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };
    const lower = timeline.toLowerCase();
    let startMonth = null, endMonth = null;
    let startYear = '2026', endYear = '2027';

    for (const [name, num] of Object.entries(months)) {
        const idx = lower.indexOf(name);
        if (idx !== -1) {
            if (!startMonth) startMonth = num;
            else endMonth = num;
        }
    }
    if (lower.includes('q1')) { startMonth = startMonth || '01'; endMonth = endMonth || '03'; }
    if (lower.includes('q2')) { startMonth = startMonth || '04'; endMonth = endMonth || '06'; }
    if (lower.includes('q3')) { startMonth = startMonth || '07'; endMonth = endMonth || '09'; }
    if (lower.includes('q4')) { startMonth = startMonth || '10'; endMonth = endMonth || '12'; }

    if (lower.includes('2026')) startYear = '2026';
    if (lower.includes('2027') && endMonth) endYear = '2027';
    if (!endMonth) endMonth = startMonth;
    if (!startMonth) startMonth = '10';

    if (parseInt(startMonth) >= 10) startYear = '2026';
    if (parseInt(endMonth) <= 6 && parseInt(startMonth) >= 10) endYear = '2027';
    if (parseInt(endMonth) >= 10) endYear = '2026';

    return {
        start: `${startYear}-${startMonth}-01`,
        end: `${endYear}-${endMonth}-28`,
    };
}

export const CalendarEvents = CAMPAIGNS.map(c => {
    const colors = CAMPAIGN_COLORS[c.category] || { bg: '#298DFF', border: '#298DFF' };
    const { start, end } = parseTimeline(c.timeline);
    return {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        title: `#${c.number} ${c.name}`,
        start,
        end,
        url: `/apps/campaigns/${c.slug}`,
        extendedProps: {
            campaign: c.slug,
            category: c.category,
            status: c.status,
            budget: c.budget,
        },
    };
});
