/**
 * Add padding to logo for better adaptive icon display
 * 
 * This script creates a new logo with padding so it displays fully in circular icons
 * 
 * Manual steps:
 * 1. Open assets/logo.png in any image editor (Paint, Photoshop, GIMP, Figma)
 * 2. Create new canvas: 1024x1024 with WHITE background
 * 3. Paste your logo centered but smaller (about 70% size)
 * 4. This leaves padding around edges so circular crop shows full logo
 * 5. Save as assets/logo.png (overwrite)
 * 
 * Or use online tool:
 * - https://www.iloveimg.com/resize-image
 * - Upload logo.png
 * - Add white borders: 150px on all sides
 * - Download and save as assets/logo.png
 */

const fs = require('node:fs');
const path = require('node:path');

console.log('📐 Logo Padding Guide');
console.log('====================\n');

const logoPath = path.join(__dirname, '../assets/logo.png');

if (fs.existsSync(logoPath)) {
  console.log('✅ Found logo.png');
  console.log('\n🎯 Problem: Adaptive icons crop to circle/rounded square');
  console.log('   Your logo gets cut off at edges\n');
  
  console.log('🔧 Solution: Add padding around logo\n');
  
  console.log('📝 Quick Fix Options:\n');
  
  console.log('Option 1 - Online Tool (Easiest):');
  console.log('  1. Go to: https://www.iloveimg.com/resize-image');
  console.log('  2. Upload assets/logo.png');
  console.log('  3. Choose "Add borders"');
  console.log('  4. Set: 150px padding on all sides');
  console.log('  5. Background: White (#FFFFFF)');
  console.log('  6. Download and replace assets/logo.png\n');
  
  console.log('Option 2 - MS Paint (Windows):');
  console.log('  1. Open assets/logo.png in Paint');
  console.log('  2. Resize canvas to 1024x1024 (keep logo smaller)');
  console.log('  3. Use "Select" → "Select all"');
  console.log('  4. Drag logo to center, make it ~70% size');
  console.log('  5. Fill background white');
  console.log('  6. Save\n');
  
  console.log('Option 3 - Figma/Photoshop:');
  console.log('  1. Create 1024x1024 canvas with white background');
  console.log('  2. Place logo.png centered');
  console.log('  3. Scale logo to 70% (about 716x716)');
  console.log('  4. Export as PNG → assets/logo.png\n');
  
  console.log('🎨 Background Color Tip:');
  console.log('  - Current: White (#FFFFFF)');
  console.log('  - Change in app.json → android.adaptiveIcon.backgroundColor');
  console.log('  - Use your brand color if logo has transparency\n');
  
} else {
  console.log('❌ logo.png not found at:', logoPath);
}

console.log('📱 After fixing, rebuild:');
console.log('   eas build -p android --profile preview\n');

console.log('💡 Pro Tip: Android safe zone is center 66% of icon');
console.log('   Keep important content in middle ~720x720 area');
