#!/usr/bin/env python3
"""Generate public/og.png (1200x630) — the default Open Graph / Twitter card image. Run: python3 scripts/make-og-image.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BLUE, INK, MUTED, BG = (26, 86, 219), (17, 24, 39), (75, 85, 99), (255, 255, 255)
FONT_DIR = Path('/usr/share/fonts/truetype/dejavu')

def font(name, size):
    try:
        return ImageFont.truetype(str(FONT_DIR / name), size)
    except OSError:
        return ImageFont.load_default()

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)
d.rectangle([0, 0, W, 16], fill=BLUE)
# logo tile (same mark as favicon.svg)
x0, y0, s = 80, 110, 120
d.rounded_rectangle([x0, y0, x0 + s, y0 + s], radius=26, fill=BLUE)
d.line([(x0 + 34, y0 + 64), (x0 + 53, y0 + 83), (x0 + 87, y0 + 41)], fill=BG, width=13, joint='curve')
d.text((x0 + s + 36, y0 + 8), 'Plugin', font=font('DejaVuSans-Bold.ttf', 92), fill=INK)
pw = d.textlength('Plugin', font=font('DejaVuSans-Bold.ttf', 92))
d.text((x0 + s + 36 + pw, y0 + 8), 'Lint', font=font('DejaVuSans-Bold.ttf', 92), fill=BLUE)
d.text((80, 300), 'Free, private pre-submission checks', font=font('DejaVuSans-Bold.ttf', 50), fill=INK)
d.text((80, 365), 'for ChatGPT plugin directory listings', font=font('DejaVuSans-Bold.ttf', 50), fill=INK)
d.text((80, 455), 'Listing grader · Privacy auditor · Test-case linter · Rules', font=font('DejaVuSans.ttf', 32), fill=MUTED)
d.text((80, 540), 'Independent project — not affiliated with OpenAI', font=font('DejaVuSans.ttf', 26), fill=MUTED)
out = Path(__file__).resolve().parent.parent / 'public' / 'og.png'
img.save(out, optimize=True)
print(out, img.size, out.stat().st_size, 'bytes')
