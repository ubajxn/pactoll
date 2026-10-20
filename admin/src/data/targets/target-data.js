export const SECTORS = {
    automotive: { label: 'Automotive & Truck Body', icon: 'ri-car-line', color: 'primary' },
    datacenter: { label: 'Data Center & Enclosures', icon: 'ri-server-line', color: 'info' },
    construction: { label: 'Construction & Fabrication', icon: 'ri-building-2-line', color: 'warning' },
    solar: { label: 'Solar & Renewable Energy', icon: 'ri-sun-line', color: 'success' },
    battery: { label: 'Battery & Energy Storage', icon: 'ri-battery-charge-line', color: 'violet' },
    industrial: { label: 'Industrial & General Fab', icon: 'ri-settings-3-line', color: 'smoke' },
};

export const PRIORITY_MAP = {
    high: { label: 'High', color: 'danger' },
    med: { label: 'Medium', color: 'warning' },
    low: { label: 'Standard', color: 'info' },
    critical: { label: 'Critical', color: 'danger' },
};

export const TARGET_ACCOUNTS = [
    { n: "Royal Truck Body", cat: "automotive", loc: "Paramount, CA", pri: "high", needs: "Steel service bodies, utility bodies", steel: "Galvannealed (GA) coil/sheet" },
    { n: "CIE Manufacturing", cat: "automotive", loc: "South Gate, CA", pri: "high", needs: "Intermodal container chassis frames", steel: "HR, heavy-gauge slit coil" },
    { n: "West Coast Metal Stamping", cat: "automotive", loc: "Placentia, CA", pri: "high", needs: "Automotive stampings, progressive die", steel: "CR, GA, EG — precision slit coil" },
    { n: "Bazz Houston International", cat: "automotive", loc: "Garden Grove, CA", pri: "high", needs: "Progressive & high-speed stampings", steel: "CR, GI, GA — strip and sheet" },
    { n: "Southwest Data Products (Nucor)", cat: "datacenter", loc: "San Bernardino, CA", pri: "high", needs: "Server racks, cabinets, containment", steel: "CR, GI — precision slit coil" },
    { n: "Chatsworth Products (CPI)", cat: "datacenter", loc: "Simi Valley, CA", pri: "high", needs: "Server racks, NEMA enclosures", steel: "CR, GI — slit coil and blanks" },
    { n: "Crown Technical Systems (Flex)", cat: "datacenter", loc: "Fontana, CA", pri: "high", needs: "Switchgear, E-Houses, enclosures", steel: "CR, GI — enclosure panels" },
    { n: "Electrorack Products (Legrand)", cat: "datacenter", loc: "Anaheim, CA", pri: "high", needs: "Seismic-rated server racks", steel: "CR, heavy gauge — precision slit" },
    { n: "Fabcon", cat: "datacenter", loc: "Santa Ana, CA", pri: "high", needs: "Sheet metal enclosures, cabinets", steel: "CR, GI, stainless" },
    { n: "Verco Decking (Nucor)", cat: "construction", loc: "Phoenix, AZ", pri: "high", needs: "Steel floor/roof deck panels", steel: "GI coil — roll-formed deck" },
    { n: "Steelcraft Automotive", cat: "automotive", loc: "Corona, CA", pri: "med", needs: "Grille guards, side bars, bumpers", steel: "CR, HR — blanks and sheets" },
    { n: "Marathon Industries", cat: "automotive", loc: "Santa Clarita, CA", pri: "med", needs: "Truck bodies, trailers", steel: "HR, GI — various gauges" },
    { n: "Phenix Truck Bodies", cat: "automotive", loc: "Pomona, CA", pri: "med", needs: "Municipal/utility truck bodies", steel: "CR, GI — government spec" },
    { n: "Proformance Manufacturing", cat: "automotive", loc: "Corona, CA", pri: "med", needs: "Deep draw stampings", steel: "CR, GA — precision slit coil" },
    { n: "iStarUSA Group", cat: "datacenter", loc: "City of Industry, CA", pri: "med", needs: "Server chassis, storage chassis", steel: "CR — thin gauge slit coil" },
    { n: "RackMountPro", cat: "datacenter", loc: "La Puente, CA", pri: "med", needs: "Rackmount servers, chassis", steel: "CR — precision gauge" },
    { n: "TCI Engineering", cat: "automotive", loc: "Ontario, CA", pri: "med", needs: "Hot rod/muscle car chassis", steel: "CR, HR — blanks and CTL sheet" },
    { n: "Aranda Tooling", cat: "automotive", loc: "Chino, CA", pri: "med", needs: "Automotive stampings, tool & die", steel: "CR, GA, HSLA — precision blanks" },
    { n: "First Solar", cat: "solar", loc: "Tempe, AZ", pri: "high", needs: "Solar panel mounting frames", steel: "GI, Galvalume — structural" },
    { n: "SunPower (Maxeon)", cat: "solar", loc: "San Jose, CA", pri: "high", needs: "Residential solar racking", steel: "GI — roll-formed racking" },
    { n: "Tesla Energy", cat: "battery", loc: "Fremont, CA", pri: "high", needs: "Powerwall/Megapack enclosures", steel: "CR, GI — precision enclosure panels" },
    { n: "Samsung SDI", cat: "battery", loc: "Ontario, CA", pri: "high", needs: "Battery cell enclosures", steel: "CR, stainless — precision" },
    { n: "Panasonic Energy", cat: "battery", loc: "Sparks, NV", pri: "high", needs: "Battery module housings", steel: "CR — precision gauge" },
    { n: "BYD North America", cat: "battery", loc: "Lancaster, CA", pri: "med", needs: "EV bus body panels", steel: "CR, GI — bus body sheet" },
    { n: "Ironridge", cat: "solar", loc: "Hayward, CA", pri: "high", needs: "Solar mounting hardware", steel: "GI, stainless — structural rail" },
    { n: "Quick Mount PV", cat: "solar", loc: "Walnut Creek, CA", pri: "med", needs: "Roof mount flashing", steel: "GI, aluminum — stamped mounts" },
    { n: "Preformed Line Products", cat: "solar", loc: "Mayfield, OH", pri: "med", needs: "Cable management, solar hardware", steel: "GI — formed hardware" },
    { n: "DBM Vircon", cat: "construction", loc: "Carson, CA", pri: "high", needs: "Structural steel, metal deck", steel: "HR, GI — structural shapes" },
    { n: "Martin Bros", cat: "construction", loc: "Gardena, CA", pri: "high", needs: "Misc steel fabrication", steel: "HR, CR — plate and sheet" },
    { n: "Herrick Corp", cat: "construction", loc: "Stockton, CA", pri: "med", needs: "Structural steel erection", steel: "HR — structural" },
    { n: "QTS Data Centers", cat: "datacenter", loc: "Phoenix, AZ", pri: "high", needs: "Data center infrastructure", steel: "CR, GI — various" },
    { n: "Switch Data Centers", cat: "datacenter", loc: "Las Vegas, NV", pri: "med", needs: "Data center construction", steel: "CR, GI — structural" },
    { n: "Redwood Materials", cat: "battery", loc: "Carson City, NV", pri: "med", needs: "Battery recycling infrastructure", steel: "HR, stainless" },
    { n: "Rivian Automotive", cat: "automotive", loc: "Normal, IL", pri: "high", needs: "EV body panels, structural", steel: "AHSS, CR — auto body" },
    { n: "Nucor Steel", cat: "industrial", loc: "Charlotte, NC", pri: "high", needs: "Distribution partnership", steel: "HR, CR — distribution" },
    { n: "California Steel Industries", cat: "industrial", loc: "Fontana, CA", pri: "high", needs: "Toll processing overflow", steel: "HR, CR — coil processing" },
    { n: "Metal Container Corp", cat: "industrial", loc: "City of Industry, CA", pri: "med", needs: "Container components", steel: "Tin plate, CR" },
    { n: "Calmak Manufacturing", cat: "construction", loc: "Alhambra, CA", pri: "med", needs: "HVAC duct, fittings", steel: "GI — duct gauge" },
    { n: "Western Pacific Enterprises", cat: "construction", loc: "Portland, OR", pri: "med", needs: "Metal building components", steel: "GI, painted — roll-formed" },
    { n: "Robertson-Ceco (BlueScope)", cat: "construction", loc: "Rancho Dominguez, CA", pri: "high", needs: "Metal building systems", steel: "GI, Galvalume — coil" },
];

export const SECTOR_COUNTS = Object.keys(SECTORS).reduce((acc, key) => {
    acc[key] = TARGET_ACCOUNTS.filter(t => t.cat === key).length;
    return acc;
}, {});
