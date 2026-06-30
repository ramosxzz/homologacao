import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';

const path = process.argv[2];
const out = process.argv[3];
const bytes = fs.readFileSync(path);
const doc = await PDFDocument.load(bytes);
const font = await doc.embedFont(StandardFonts.Helvetica);
doc.getPages().forEach((page) => {
  const { width, height } = page.getSize();
  for (let x = 0; x <= width; x += 50) {
    page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: x % 100 === 0 ? 0.7 : 0.3, color: x % 100 === 0 ? rgb(1, 0, 0) : rgb(0, 0.45, 1), opacity: 0.45 });
    for (let y = height - 12; y > 0; y -= 100) page.drawText(String(x), { x: x + 1, y, size: 5, font, color: rgb(1, 0, 0) });
  }
  for (let y = 0; y <= height; y += 50) {
    page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: y % 100 === 0 ? 0.7 : 0.3, color: y % 100 === 0 ? rgb(1, 0, 0) : rgb(0, 0.45, 1), opacity: 0.45 });
    for (let x = 2; x < width; x += 100) page.drawText(String(y), { x, y: y + 1, size: 5, font, color: rgb(1, 0, 0) });
  }
});
fs.writeFileSync(out, await doc.save());
console.log('grid written', out);
