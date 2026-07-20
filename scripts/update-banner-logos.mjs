import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, "..");
const logoPath = path.join(projectRoot, "public", "logo.svg");
const outputArgument = process.argv.find((argument) =>
  argument.startsWith("--output-dir="),
);
const previewDirectory = outputArgument
  ? path.resolve(projectRoot, outputArgument.slice("--output-dir=".length))
  : null;

const placements = [
  {
    file: "assets/naver-blog-banners/ggomggombath-naver-full-2000x500.png",
    centerX: 112,
    centerY: 98,
    visibleDiameter: 94,
  },
  {
    file: "assets/naver-blog-banners/ggomggombath-naver-full-2000x700.png",
    centerX: 177,
    centerY: 130,
    visibleDiameter: 133,
  },
  {
    file: "assets/naver-blog-banners/ggomggombath-naver-full-2000x900.png",
    centerX: 181,
    centerY: 213,
    visibleDiameter: 133,
  },
  {
    file: "assets/naver-blog-banners/ggomggombath-naver-safe-2000x500.png",
    centerX: 1000,
    centerY: 99,
    visibleDiameter: 85,
  },
  {
    file: "assets/naver-blog-banners/ggomggombath-naver-safe-2000x700.png",
    centerX: 874,
    centerY: 246,
    visibleDiameter: 62,
  },
  {
    file: "assets/naver-blog-banners/ggomggombath-naver-safe-2000x900.png",
    centerX: 999,
    centerY: 330,
    visibleDiameter: 80,
  },
  {
    file: "public/og.png",
    centerX: 230,
    centerY: 184,
    visibleDiameter: 166,
  },
];

const logo = await readFile(logoPath);
const visibleLogoRatio = 224 / 256;

if (previewDirectory) {
  await mkdir(previewDirectory, { recursive: true });
}

for (const placement of placements) {
  const sourcePath = path.join(projectRoot, placement.file);
  const source = await readFile(sourcePath);
  const logoSize = Math.round(placement.visibleDiameter / visibleLogoRatio);
  const renderedLogo = await sharp(logo, { density: 384 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();
  const outputPath = previewDirectory
    ? path.join(previewDirectory, path.basename(placement.file))
    : sourcePath;

  await sharp(source)
    .composite([
      {
        input: renderedLogo,
        left: Math.round(placement.centerX - logoSize / 2),
        top: Math.round(placement.centerY - logoSize / 2),
      },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  console.log(path.relative(projectRoot, outputPath));
}

if (previewDirectory) {
  console.log(`Preview only: ${previewDirectory}`);
} else {
  console.log("Banner logos updated from public/logo.svg");
}
