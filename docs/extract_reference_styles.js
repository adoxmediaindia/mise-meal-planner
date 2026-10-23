const fs = require('fs');
const css = fs.readFileSync('reference/reference_styles.css', 'utf8');

const targets = [
  '/* ---------- Nav ---------- */',
  '/* ---------- Hero ---------- */',
  '/* ---------- Supermarket marquee ---------- */',
  '/* ---------- Stats ---------- */',
  '/* ---------- How it works ---------- */',
  '/* ---------- Showcase ---------- */',
  '/* ---------- Features ---------- */',
  '/* ---------- Vibes ---------- */',
  '/* ---------- App screenshot gallery ---------- */',
  '/* ---------- Reviews ---------- */',
  '/* ---------- FAQ ---------- */',
  '/* ---------- CTA banner ---------- */',
  '/* ---------- Footer ---------- */',
  '/* ---------- Responsive ---------- */',
];

targets.forEach((t, i) => {
  const start = css.indexOf(t);
  if (start !== -1) {
    const end = i < targets.length - 1 ? css.indexOf(targets[i + 1]) : css.length;
    console.log(`=== ${t} ===`);
    console.log(css.slice(start, Math.min(start + 800, end !== -1 ? end : css.length)));
  }
});
