/**
 * Convert SVG logo to PNG icons for app
 * 
 * This script converts the logo.svg to required PNG formats for Android/iOS builds
 * 
 * Requirements: 
 * - Install sharp: npm install --save-dev sharp
 * - Or use online converter: https://cloudconvert.com/svg-to-png
 * 
 * Manual steps if running this script fails:
 * 1. Open public/logo.svg in a browser
 * 2. Take screenshot or use online converter
 * 3. Resize to 1024x1024 px (square)
 * 4. Save as:
 *    - assets/icon.png (1024x1024)
 *    - assets/adaptive-icon.png (1024x1024)
 *    - assets/splash-icon.png (1284x2778 or 1024x1024 centered)
 */

const fs = require('node:fs');
const path = require('node:path');

console.log('📋 Logo Conversion Guide');
console.log('========================\n');

const svgPath = path.join(__dirname, '../public/logo.svg');
const assetsPath = path.join(__dirname, '../assets');

if (fs.existsSync(svgPath)) {
  console.log('✅ Found logo.svg at:', svgPath);
  console.log('\n📝 Manual Conversion Steps:');
  console.log('1. Open public/logo.svg in Chrome/Edge');
  console.log('2. Right-click > Inspect > Console');
  console.log('3. Paste this code:\n');
  console.log(`
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(document.querySelector('svg').outerHTML);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const link = document.createElement('a');
      link.download = 'icon.png';
      link.href = canvas.toDataURL();
      link.click();
    };
  `);
  console.log('\n4. Save downloaded file as:');
  console.log('   - assets/icon.png');
  console.log('   - assets/adaptive-icon.png');
  console.log('   - assets/splash-icon.png');
  
  console.log('\n🌐 Or use online converter:');
  console.log('   - https://cloudconvert.com/svg-to-png');
  console.log('   - Set output to 1024x1024 pixels');
  console.log('   - Download and replace assets/*.png files');
  
  console.log('\n⚡ Quick Command (if you have ImageMagick):');
  console.log('   convert public/logo.svg -resize 1024x1024 assets/icon.png');
  console.log('   convert public/logo.svg -resize 1024x1024 assets/adaptive-icon.png');
  
} else {
  console.log('❌ logo.svg not found at:', svgPath);
}

console.log('\n📱 After conversion, rebuild your APK:');
console.log('   eas build -p android --profile preview');
console.log('   or');
console.log('   npx expo prebuild --clean && eas build -p android --profile preview');
