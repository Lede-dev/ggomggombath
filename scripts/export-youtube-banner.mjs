import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, "..");
const youtubeDirectory = path.join(projectRoot, "assets", "youtube");
const backgroundPath = path.join(
  youtubeDirectory,
  "youtube-banner-background.png",
);
const lockupSourcePath = path.join(
  projectRoot,
  "assets",
  "naver-blog-banners",
  "ggomggombath-naver-safe-2000x700.png",
);
const outputPath = path.join(
  youtubeDirectory,
  "ggomggombath-youtube-banner-2048x1152.png",
);

const canvas = { width: 2048, height: 1152 };
const safeArea = { left: 406, top: 407, width: 1235, height: 338 };
const crop = { left: 720, top: 200, width: 330, height: 300 };

const layout = [
  {
    name: "title",
    source: { left: 28, top: 88, width: 274, height: 68 },
    target: { left: 455, top: 463, width: 500, height: 124 },
  },
  {
    name: "accent",
    source: { left: 29, top: 164, width: 27, height: 12 },
    target: { left: 460, top: 596, width: 42, height: 18 },
  },
  {
    name: "tagline",
    source: { left: 28, top: 183, width: 269, height: 30 },
    target: { left: 460, top: 622, width: 405, height: 45 },
  },
  {
    name: "service-area",
    source: { left: 30, top: 226, width: 262, height: 27 },
    target: { left: 1040, top: 500, width: 400, height: 41 },
  },
  {
    name: "phone",
    source: { left: 28, top: 258, width: 252, height: 36 },
    target: { left: 1040, top: 565, width: 400, height: 57 },
  },
];

const elementRegions = [
  { left: 118, top: 8, right: 193, bottom: 84 },
  { left: 28, top: 88, right: 302, bottom: 156 },
  { left: 29, top: 164, right: 56, bottom: 176 },
  { left: 28, top: 183, right: 297, bottom: 213 },
  { left: 30, top: 226, right: 292, bottom: 253, solid: true },
  { left: 28, top: 258, right: 280, bottom: 294 },
];

function contains(region, x, y) {
  return (
    x >= region.left &&
    x < region.right &&
    y >= region.top &&
    y < region.bottom
  );
}

await mkdir(youtubeDirectory, { recursive: true });

const background = await sharp(backgroundPath)
  .resize(canvas.width, canvas.height, { fit: "cover" })
  .toColourspace("srgb")
  .png()
  .toBuffer();

const { data, info } = await sharp(lockupSourcePath)
  .extract(crop)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let y = 0; y < info.height; y += 1) {
  for (let x = 0; x < info.width; x += 1) {
    const offset = (y * info.width + x) * 4;
    const region = elementRegions.find((candidate) => contains(candidate, x, y));

    if (!region) {
      data[offset + 3] = 0;
      continue;
    }

    if (region.solid) {
      data[offset + 3] = 255;
      continue;
    }

    const darkestChannel = Math.min(
      data[offset],
      data[offset + 1],
      data[offset + 2],
    );
    const alpha = Math.max(0, Math.min(255, (217 - darkestChannel) * 12));
    data[offset + 3] = alpha;
  }
}

const lockup = await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .png()
  .toBuffer();

const safeRight = safeArea.left + safeArea.width;
const safeBottom = safeArea.top + safeArea.height;

for (const element of layout) {
  const right = element.target.left + element.target.width;
  const bottom = element.target.top + element.target.height;

  if (
    element.target.left < safeArea.left ||
    element.target.top < safeArea.top ||
    right > safeRight ||
    bottom > safeBottom
  ) {
    throw new Error(`${element.name} is outside the YouTube safe area`);
  }
}

const composites = await Promise.all(
  layout.map(async (element) => {
    const input = await sharp(lockup)
      .extract(element.source)
      .resize(element.target.width, element.target.height, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();

    return {
      input,
      left: element.target.left,
      top: element.target.top,
    };
  }),
);

await sharp(background)
  .composite(composites)
  .flatten({ background: "#F7F4EF" })
  .removeAlpha()
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

console.log(path.relative(projectRoot, outputPath));
console.log(
  `Canvas ${canvas.width}x${canvas.height}; safe area ${safeArea.width}x${safeArea.height}`,
);
