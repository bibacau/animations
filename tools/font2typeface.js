// Convert a TTF/WOFF font into a three.js typeface JSON (like facetype.js).
// usage: node tools/font2typeface.js <font.woff> <out.json>
const fs = require('fs');
const opentype = require('opentype.js');
const [, , src, out] = process.argv;
const buf = fs.readFileSync(src);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
const res = { glyphs: {}, familyName: font.names.fontFamily.en, ascender: Math.round(font.ascender * scale),
  descender: Math.round(font.descender * scale), underlinePosition: 0, underlineThickness: 0,
  boundingBox: { yMin: 0, xMin: 0, yMax: 0, xMax: 0 }, resolution: 1000, original_font_information: {} };
const chars = " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'!?.,$%&+:/";
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  if (!g) continue;
  const token = { ha: Math.round(g.advanceWidth * scale), x_min: 0, x_max: 0, o: '' };
  if (g.xMin !== undefined) { token.x_min = Math.round(g.xMin * scale); token.x_max = Math.round(g.xMax * scale); }
  g.path.commands.forEach((c) => {
    const t = c.type.toLowerCase() === 'c' ? 'b' : c.type.toLowerCase();
    token.o += t + ' ';
    if (c.x !== undefined && c.y !== undefined) token.o += Math.round(c.x * scale) + ' ' + Math.round(c.y * scale) + ' ';
    if (c.x1 !== undefined) token.o += Math.round(c.x1 * scale) + ' ' + Math.round(c.y1 * scale) + ' ';
    if (c.x2 !== undefined) token.o += Math.round(c.x2 * scale) + ' ' + Math.round(c.y2 * scale) + ' ';
  });
  res.glyphs[ch] = token;
}
fs.writeFileSync(out, JSON.stringify(res));
console.log('wrote', out, Object.keys(res.glyphs).length, 'glyphs');
