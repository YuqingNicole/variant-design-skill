import type { Localized } from './i18n/localized';
import slots from './sponsor-slots.json';
// Paid placements in the cases grid (RFC-003 step 7). There are none yet: until one is booked the slot shows the
// house card that points to /sponsor. A booked placement is a record in sponsor-slots.json with the dates it runs; it is always
// labelled "Sponsored" and linked with rel="sponsored" (see the rules on /sponsor). It never changes which cases
// are listed or in what order, and it carries no reader data.
export type SponsorSlot = { id: string; brand: string; title: Localized; text: Localized; url: string; from: string; until: string; image?: { src: string; width: number; height: number; alt: Localized } };
export const sponsorSlots = slots as SponsorSlot[];
// Dates are ISO days (UTC), `from` inclusive and `until` exclusive; the first running record wins.
export const activeSponsorSlot = (now: Date = new Date()) => { const day = now.toISOString().slice(0, 10); return sponsorSlots.find(s => s.from <= day && day < s.until); };
