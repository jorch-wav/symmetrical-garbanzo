const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#060606';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#e8ff6b';
  ctx.font = `bold ${size * 0.45}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);
  return canvas.toBuffer('image/png');
}

fs.writeFileSync('public/icon-192.png', makeIcon(192));
fs.writeFileSync('public/icon-512.png', makeIcon(512));
console.log('Icons generated');
