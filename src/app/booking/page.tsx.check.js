
import fs from 'fs';

const content = fs.readFileSync('c:/projects/padel-booking/src/app/booking/page.tsx', 'utf8');

const openTags = (content.match(/<[a-zA-Z]/g) || []).length;
const closeTags = (content.match(/<\//g) || []).length;
const selfClosing = (content.match(/\/>/g) || []).length;

console.log(`Open tags: ${openTags}`);
console.log(`Close tags: ${closeTags}`);
console.log(`Self-closing: ${selfClosing}`);

// Check div specifically
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log(`Open divs: ${openDivs}`);
console.log(`Close divs: ${closeDivs}`);
