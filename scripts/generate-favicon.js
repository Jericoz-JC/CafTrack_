// scripts/generate-favicon.js

// This script provides the SVG for the Coffee icon
// You can save this as coffee-icon.svg and then use https://favicon.io/favicon-converter/ to convert it to a favicon

const coffeeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee">
  <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
  <line x1="6" x2="6" y1="2" y2="4"></line>
  <line x1="10" x2="10" y1="2" y2="4"></line>
  <line x1="14" x2="14" y1="2" y2="4"></line>
</svg>
`;

console.log('Coffee Icon SVG:');
console.log(coffeeSvg);
console.log('\nInstructions:');
console.log('1. Copy the SVG code above');
console.log('2. Save it as coffee-icon.svg in a text editor');
console.log('3. Upload to https://favicon.io/favicon-converter/ to generate favicon files');
console.log('4. Place the generated files in the public directory of your project'); 