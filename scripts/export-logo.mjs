import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, "..");
const sourcePath = path.join(projectRoot, "public", "logo.svg");
const wordmarkSourcePath = path.join(
  projectRoot,
  "public",
  "brand",
  "wordmark-profile.svg",
);
const outputDirectory = path.join(projectRoot, "public", "brand", "logo-png");
const source = await readFile(sourcePath);
const wordmarkSource = await readFile(wordmarkSourcePath);

const transparentSizes = [1024, 512, 256, 128, 64, 32];
const instagramSizes = [1080, 320];
const outputs = [];

await mkdir(outputDirectory, { recursive: true });

async function exportPng({ name, size, background, input = source }) {
  const outputPath = path.join(outputDirectory, name);
  let image = sharp(input, { density: 384 })
    .resize(size, size, { fit: "contain", kernel: sharp.kernel.lanczos3 })
    .toColourspace("srgb");

  if (background) {
    image = image.flatten({ background });
  }

  await image
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  outputs.push(outputPath);
}

await Promise.all([
  ...transparentSizes.map((size) =>
    exportPng({ name: `logo-${size}x${size}.png`, size }),
  ),
  ...instagramSizes.map((size) =>
    exportPng({
      name: `instagram-profile-${size}x${size}.png`,
      size,
      background: "#FBFAF7",
    }),
  ),
  ...[1080, 512, 320, 128].map((size) =>
    exportPng({
      name: `wordmark-profile-${size}x${size}.png`,
      size,
      background: "#FBFAF7",
      input: wordmarkSource,
    }),
  ),
]);

outputs.sort();

for (const outputPath of outputs) {
  const file = await stat(outputPath);
  console.log(
    `${path.relative(projectRoot, outputPath)} (${Math.ceil(file.size / 1024)} KB)`,
  );
}
