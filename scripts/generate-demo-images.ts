/**
 * Generates the small set of original demo illustrations (public/demo/*.webp)
 * plus brand assets (logo-square.png, opengraph-default.png).
 * Everything is drawn from SVG in code — no external or scraped imagery.
 *
 *   npm run media:demo
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { DEMO_IMAGES, type DemoImage } from "./demo-manifest";

const OUT = path.resolve(process.cwd(), "public/demo");
const PUBLIC = path.resolve(process.cwd(), "public");

const r = (n: number) => Math.round(n * 10) / 10;

function nailPath(w: number, h: number, kind: "almond" | "short"): string {
  if (kind === "short") {
    const rx = w * 0.42;
    return `M ${-w / 2} ${h / 2} L ${-w / 2} ${-h / 2 + rx} Q ${-w / 2} ${-h / 2} ${-w / 2 + rx} ${-h / 2} L ${w / 2 - rx} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + rx} L ${w / 2} ${h / 2} Q 0 ${h * 0.6} ${-w / 2} ${h / 2} Z`;
  }
  return `M ${-w / 2} ${h / 2} L ${-w / 2} ${-h * 0.05} C ${-w / 2} ${-h * 0.36} ${-w * 0.16} ${-h / 2} 0 ${-h / 2} C ${w * 0.16} ${-h / 2} ${w / 2} ${-h * 0.36} ${w / 2} ${-h * 0.05} L ${w / 2} ${h / 2} Q 0 ${h * 0.6} ${-w / 2} ${h / 2} Z`;
}

function nails(img: DemoImage, kind: "almond" | "short", french: boolean): string {
  const { width: W, height: H } = img;
  const s = Math.min(W, H) / 1200;
  const nw = 150 * s;
  const nh = (kind === "short" ? 230 : 380) * s;
  const angles = [-22, -11, 0, 11, 22];
  const cx = W / 2;
  const pivotY = H * 0.5 + 900 * s;
  const radius = 900 * s;
  let out = "";
  angles.forEach((a, i) => {
    const rad = (a * Math.PI) / 180;
    const x = cx + Math.sin(rad) * radius;
    const y = pivotY - Math.cos(rad) * radius + (i === 0 || i === 4 ? 70 * s : i === 2 ? -30 * s : 0);
    const d = nailPath(nw, nh, kind);
    const id = `clip-${img.key}-${i}`;
    out += `<g transform="translate(${r(x)} ${r(y)}) rotate(${a})">
      <path d="${d}" fill="#000" opacity="0.10" transform="translate(${10 * s} ${16 * s})" filter="url(#blur)"/>
      <clipPath id="${id}"><path d="${d}"/></clipPath>
      <path d="${d}" fill="${img.ink}"/>
      ${french ? `<rect x="${-nw}" y="${-nh / 2 - 2}" width="${nw * 2}" height="${nh * 0.2}" fill="${img.accent}" clip-path="url(#${id})"/>` : ""}
      <path d="M ${-nw * 0.22} ${-nh * 0.3} Q ${-nw * 0.28} 0 ${-nw * 0.18} ${nh * 0.32}" stroke="#fff" stroke-opacity="0.45" stroke-width="${12 * s}" fill="none" stroke-linecap="round"/>
    </g>`;
  });
  return out;
}

function shadow(cx: number, cy: number, rx: number, ry: number) {
  return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" fill="#000" opacity="0.12" filter="url(#blur)"/>`;
}

function motif(img: DemoImage): string {
  const { width: W, height: H, ink, accent } = img;
  const s = Math.min(W, H) / 1200;
  const cx = W / 2;
  const cy = H / 2;
  const T = (x: number, y: number, inner: string, scale = 1) => `<g transform="translate(${r(x)} ${r(y)}) scale(${r(s * scale * 100) / 100})">${inner}</g>`;

  switch (img.motif) {
    case "almond":
      return nails(img, "almond", false);
    case "french":
      return nails(img, "almond", true);
    case "shortNails":
      return nails(img, "short", false);
    case "nailPalette": {
      const colors = ["#5a3526", "#5f6b3c", "#6e2333", "#9c8a7c", "#1f2b45", "#a8613b"];
      return colors
        .map((c, i) => {
          const x = cx + ((i % 3) - 1) * 300 * s;
          const y = cy + (Math.floor(i / 3) - 0.5) * 320 * s;
          return `${shadow(x + 8 * s, y + 14 * s, 120 * s, 112 * s)}<path d="M ${r(x - 120 * s)} ${r(y)} C ${r(x - 120 * s)} ${r(y - 130 * s)} ${r(x + 120 * s)} ${r(y - 125 * s)} ${r(x + 118 * s)} ${r(y + 5 * s)} C ${r(x + 112 * s)} ${r(y + 120 * s)} ${r(x - 110 * s)} ${r(y + 128 * s)} ${r(x - 120 * s)} ${r(y)} Z" fill="${c}"/><ellipse cx="${r(x - 40 * s)}" cy="${r(y - 50 * s)}" rx="${r(34 * s)}" ry="${r(14 * s)}" fill="#fff" opacity="0.28" transform="rotate(-25 ${r(x - 40 * s)} ${r(y - 50 * s)})"/>`;
        })
        .join("");
    }
    case "coat":
      return T(cx, cy, `
        <rect x="-150" y="330" width="120" height="420" fill="${accent}"/><rect x="30" y="330" width="120" height="420" fill="${accent}"/>
        <path d="M -150 -380 L -70 -420 L 0 -250 L 70 -420 L 150 -380 L 270 -300 L 300 380 L -300 380 L -270 -300 Z" fill="${ink}"/>
        <path d="M -70 -420 L 0 -250 L 70 -420 L 40 -430 L 0 -330 L -40 -430 Z" fill="${accent}"/>
        <path d="M -70 -420 L -130 -200 L 0 -60 Z" fill="#000" opacity="0.10"/><path d="M 70 -420 L 130 -200 L 0 -60 Z" fill="#fff" opacity="0.08"/>
        <path d="M -270 -300 L -330 260 L -270 270 L -230 -120 Z" fill="${ink}"/><path d="M 270 -300 L 330 260 L 270 270 L 230 -120 Z" fill="${ink}"/>
        <rect x="-300" y="40" width="600" height="34" fill="#000" opacity="0.10"/>`);
    case "workwear":
      return T(cx, cy, `
        <path d="M -230 200 L -260 760 L -40 760 L 0 330 L 40 760 L 260 760 L 230 200 Z" fill="${ink}" opacity="0.92"/>
        <path d="M -120 -420 L 120 -420 L 130 230 L -130 230 Z" fill="${accent}"/>
        <path d="M -140 -400 L -60 -430 L 0 -200 L 60 -430 L 140 -400 L 250 -330 L 250 230 L 30 230 L 0 -40 L -30 230 L -250 230 L -250 -330 Z" fill="${ink}"/>
        <path d="M -250 -330 L -310 200 L -255 210 Z" fill="${ink}"/><path d="M 250 -330 L 310 200 L 255 210 Z" fill="${ink}"/>
        <circle cx="-20" cy="60" r="9" fill="${accent}"/>`);
    case "dress":
      return T(cx, cy, `
        <line x1="-90" y1="-560" x2="-110" y2="-380" stroke="${ink}" stroke-width="6"/><line x1="90" y1="-560" x2="110" y2="-380" stroke="${ink}" stroke-width="6"/>
        <path d="M -130 -390 Q 0 -340 130 -390 L 150 -120 Q 0 -90 -150 -120 Z" fill="${ink}"/>
        <path d="M -150 -120 Q 0 -90 150 -120 C 230 120 300 420 340 640 Q 0 700 -340 640 C -300 420 -230 120 -150 -120 Z" fill="${ink}"/>
        <path d="M -40 -100 C -60 200 -110 420 -150 660" stroke="#fff" stroke-opacity="0.18" stroke-width="18" fill="none"/>
        <path d="M 70 -100 C 110 200 170 420 210 650" stroke="#000" stroke-opacity="0.10" stroke-width="26" fill="none"/>`);
    case "denim":
      return `${T(cx - 220 * s, cy, `<path d="M -170 -380 L 170 -380 L 190 400 L 30 400 L 0 -60 L -30 400 L -190 400 Z" fill="${ink}"/><path d="M -170 -380 L 170 -380 L 172 -330 L -172 -330 Z" fill="#000" opacity="0.15"/><path d="M -120 -330 Q -60 -230 -10 -330" stroke="#d9b36a" stroke-width="4" fill="none"/>`)}
        ${T(cx + 300 * s, cy - 40 * s, `<path d="M -150 -260 L -60 -290 Q 0 -250 60 -290 L 150 -260 L 240 -170 L 180 -110 L 140 -150 L 140 260 L -140 260 L -140 -150 L -180 -110 L -240 -170 Z" fill="${accent}" stroke="#000" stroke-opacity="0.06" stroke-width="3"/>`)}`;
    case "loafer": {
      const shoe = `<path d="M -330 60 C -340 -40 -260 -90 -150 -90 L 60 -70 C 160 -120 240 -110 300 -60 C 340 -20 340 40 330 60 Z" fill="${ink}"/>
        <rect x="-340" y="60" width="680" height="34" rx="10" fill="#3a2f26"/><rect x="-330" y="60" width="140" height="64" fill="#3a2f26"/>
        <path d="M 40 -76 L 220 -40" stroke="${accent}" stroke-width="14" stroke-linecap="round"/><path d="M -150 -88 C -100 -60 -30 -58 30 -74" stroke="#fff" stroke-opacity="0.15" stroke-width="10" fill="none"/>`;
      return `${shadow(cx, cy + 200 * s, 420 * s, 26 * s)}${T(cx - 60 * s, cy - 40 * s, shoe, 1)}${T(cx + 90 * s, cy + 130 * s, shoe, 1)}`;
    }
    case "sneaker":
      return `${shadow(cx, cy + 190 * s, 440 * s, 26 * s)}${T(cx, cy, `<path d="M -380 100 L -370 -60 C -360 -140 -300 -160 -230 -150 L -120 -150 L -40 -60 L 160 -20 C 300 0 380 40 390 100 Z" fill="${ink}" stroke="#000" stroke-opacity="0.08" stroke-width="4"/>
        <rect x="-390" y="100" width="790" height="70" rx="22" fill="#c79a6a"/><path d="M -380 115 L 395 115" stroke="#fff" stroke-opacity="0.5" stroke-width="5"/>
        <path d="M -110 -130 L -10 -40 M -150 -110 L -50 -30 M -70 -150 L 30 -50" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
        <path d="M -380 -10 C -300 -30 -260 -20 -240 30" stroke="${accent}" stroke-width="8" fill="none"/>`)}`;
    case "boot":
      return `${shadow(cx, cy + 520 * s, 300 * s, 26 * s)}${T(cx, cy, `<path d="M -150 -620 L 90 -620 L 110 240 C 220 260 300 320 300 420 L 300 480 L -150 480 Z" fill="${ink}"/>
        <rect x="-150" y="480" width="150" height="90" fill="#2c1d14"/><rect x="-150" y="480" width="460" height="26" fill="#2c1d14"/>
        <path d="M -120 -600 L -110 300" stroke="#fff" stroke-opacity="0.12" stroke-width="22"/><path d="M -150 -620 L 90 -620 L 92 -580 L -150 -580 Z" fill="#000" opacity="0.18"/>`)}`;
    case "flat": {
      const flat = `<path d="M -320 40 C -330 -30 -260 -60 -170 -50 L 160 -30 C 270 -30 330 0 330 40 Z" fill="${ink}"/><rect x="-330" y="40" width="660" height="20" rx="8" fill="#5e3640"/>
        <path d="M -40 -60 C -180 -90 -180 0 -40 -30 C 100 0 100 -90 -40 -60 Z" fill="${accent}" opacity="0.9"/><circle cx="-40" cy="-46" r="12" fill="${ink}"/>`;
      return `${shadow(cx, cy + 160 * s, 420 * s, 22 * s)}${T(cx - 80 * s, cy - 60 * s, flat)}${T(cx + 80 * s, cy + 100 * s, flat)}`;
    }
    case "bag":
      return `${shadow(cx, cy + 380 * s, 380 * s, 30 * s)}${T(cx, cy, `<path d="M -170 -250 C -170 -450 170 -450 170 -250" stroke="${ink}" stroke-width="34" fill="none"/>
        <path d="M -330 -230 L 330 -230 L 370 360 L -370 360 Z" fill="${ink}"/>
        <path d="M -330 -230 L 330 -230 L 340 -40 Q 0 30 -340 -40 Z" fill="#000" opacity="0.14"/>
        <rect x="-50" y="-60" width="100" height="60" rx="8" fill="${accent}"/><path d="M -300 -200 L -330 330" stroke="#fff" stroke-opacity="0.12" stroke-width="18"/>`)}`;
    case "hoops":
      return [160, 230, 300]
        .map((rad, i) => {
          const x = cx + (i - 1) * 380 * s;
          return `<circle cx="${r(x + 10 * s)}" cy="${r(cy + 18 * s)}" r="${r(rad * 0.55 * s)}" stroke="#000" stroke-opacity="0.12" stroke-width="${r(26 * s)}" fill="none" filter="url(#blur)"/>
            <circle cx="${r(x)}" cy="${r(cy)}" r="${r(rad * 0.55 * s)}" stroke="${ink}" stroke-width="${r((18 + i * 6) * s)}" fill="none"/>
            <path d="M ${r(x - rad * 0.4 * s)} ${r(cy - rad * 0.38 * s)} A ${r(rad * 0.55 * s)} ${r(rad * 0.55 * s)} 0 0 1 ${r(x + rad * 0.1 * s)} ${r(cy - rad * 0.55 * s)}" stroke="#fff6dc" stroke-width="${r(6 * s)}" fill="none" stroke-linecap="round"/>`;
        })
        .join("");
    case "hair":
      return T(cx, cy, `<rect x="-60" y="120" width="120" height="360" fill="${accent}"/>
        <ellipse cx="20" cy="-60" rx="230" ry="290" fill="${accent}"/>
        <path d="M -280 -120 C -300 -420 260 -470 290 -150 C 300 -20 280 160 240 230 L 70 240 C 120 120 120 -40 60 -120 C -20 -60 -120 -80 -180 -40 C -200 80 -180 180 -150 240 L -290 230 C -320 120 -300 0 -280 -120 Z" fill="${ink}"/>
        <path d="M -200 -300 C -60 -380 120 -380 220 -260" stroke="#fff" stroke-opacity="0.14" stroke-width="20" fill="none"/>`);
    case "lipstick":
      return ["#c99383", "#b85a6a", "#a11d2e", "#6b1f3a"]
        .map((c, i) => {
          const x = cx + (i - 1.5) * 260 * s;
          return `${shadow(x + 10 * s, cy + 330 * s, 110 * s, 20 * s)}${T(x, cy, `<rect x="-70" y="40" width="140" height="280" rx="6" fill="${accent}"/><rect x="-70" y="40" width="140" height="22" fill="#000" opacity="0.12"/>
            <rect x="-56" y="-120" width="112" height="170" fill="#b8954f"/><path d="M -48 -120 L -48 -250 L 48 -320 L 48 -120 Z" fill="${c}"/><path d="M -30 -130 L -30 -250" stroke="#fff" stroke-opacity="0.3" stroke-width="10"/>`)}`;
        })
        .join("");
    case "skincare":
      return `${shadow(cx, cy + 420 * s, 460 * s, 30 * s)}
        ${T(cx - 260 * s, cy + 40 * s, `<rect x="-90" y="-300" width="180" height="680" rx="40" fill="${ink}" stroke="#000" stroke-opacity="0.06" stroke-width="4"/><rect x="-40" y="-380" width="80" height="90" rx="10" fill="${accent}"/><rect x="-90" y="-40" width="180" height="160" fill="${accent}" opacity="0.35"/>`)}
        ${T(cx + 20 * s, cy + 140 * s, `<rect x="-80" y="-180" width="160" height="460" rx="20" fill="#c9a77a" opacity="0.85"/><rect x="-36" y="-290" width="72" height="120" rx="8" fill="#2b2b2b"/><ellipse cx="0" cy="-300" rx="44" ry="30" fill="#2b2b2b"/>`)}
        ${T(cx + 280 * s, cy + 300 * s, `<rect x="-140" y="-80" width="280" height="200" rx="26" fill="${ink}" stroke="#000" stroke-opacity="0.06" stroke-width="4"/><rect x="-150" y="-140" width="300" height="80" rx="16" fill="${accent}"/>`)}`;
    case "sunglasses":
      return `${shadow(cx, cy + 180 * s, 440 * s, 24 * s)}${T(cx, cy, `
        <path d="M -420 -60 C -400 -140 -120 -150 -60 -80 C -40 40 -120 120 -240 110 C -360 100 -430 20 -420 -60 Z" fill="${ink}"/>
        <path d="M 420 -60 C 400 -140 120 -150 60 -80 C 40 40 120 120 240 110 C 360 100 430 20 420 -60 Z" fill="${ink}"/>
        <path d="M -60 -70 Q 0 -110 60 -70" stroke="${accent}" stroke-width="22" fill="none"/>
        <path d="M -400 -70 C -380 -120 -150 -130 -90 -80" stroke="${accent}" stroke-width="18" fill="none"/><path d="M 400 -70 C 380 -120 150 -130 90 -80" stroke="${accent}" stroke-width="18" fill="none"/>
        <path d="M -330 -40 L -200 -60" stroke="#fff" stroke-opacity="0.25" stroke-width="12" stroke-linecap="round"/><path d="M 170 -50 L 300 -60" stroke="#fff" stroke-opacity="0.25" stroke-width="12" stroke-linecap="round"/>`)}`;
  }
}

function svgFor(img: DemoImage): string {
  const { width: W, height: H } = img;
  const s = Math.min(W, H) / 1200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${img.bg[0]}"/><stop offset="1" stop-color="${img.bg[1]}"/></linearGradient>
    <radialGradient id="light" cx="0.3" cy="0.2" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r(14 * s)}"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#light)"/>
  ${motif(img)}
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  <text x="${W - 36 * s}" y="${H - 32 * s}" text-anchor="end" font-family="Georgia, serif" font-size="${r(22 * s)}" letter-spacing="${r(4 * s)}" fill="#000" fill-opacity="0.28">G&amp;T · DEMO ILLUSTRATION</text>
</svg>`;
}

async function brandAssets() {
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#171717"/>
    <text x="256" y="300" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="150" letter-spacing="10" fill="#ffffff">G<tspan fill="#d4a3ae" font-style="italic">&amp;</tspan>T</text></svg>`;
  await sharp(Buffer.from(logo)).png().toFile(path.join(PUBLIC, "logo-square.png"));
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f8f7f5"/>
    <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#171717" stroke-width="2"/>
    <text x="600" y="320" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="88" letter-spacing="18" fill="#171717">GLOSS <tspan fill="#a65f6f" font-style="italic">&amp;</tspan> THREAD</text>
    <text x="600" y="400" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="8" fill="#696969">FASHION. BEAUTY. STYLE.</text></svg>`;
  await sharp(Buffer.from(og)).png().toFile(path.join(PUBLIC, "opengraph-default.png"));
  await sharp(Buffer.from(logo)).resize(180, 180).png().toFile(path.join(PUBLIC, "apple-touch-icon.png"));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const img of DEMO_IMAGES) {
    const file = path.join(OUT, img.file);
    await sharp(Buffer.from(svgFor(img))).webp({ quality: 82 }).toFile(file);
    console.log("✓", img.file);
  }
  await brandAssets();
  console.log(`Generated ${DEMO_IMAGES.length} demo illustrations and brand assets.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
