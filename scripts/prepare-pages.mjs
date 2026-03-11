import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const pagesDir = path.join(projectRoot, "cloudflare-pages");

async function ensureDistExists() {
  try {
    await access(distDir);
  } catch {
    throw new Error("dist klasoru bulunamadi. Once `npm run build` calistirin.");
  }
}

async function preparePagesOutput() {
  await ensureDistExists();
  await rm(pagesDir, { recursive: true, force: true });
  await mkdir(pagesDir, { recursive: true });
  await cp(distDir, pagesDir, { recursive: true });
  await writeFile(path.join(pagesDir, "_redirects"), "/* /index.html 200\n", "utf8");
}

preparePagesOutput()
  .then(() => {
    console.log("Cloudflare Pages cikti klasoru hazir: cloudflare-pages/");
  })
  .catch((error) => {
    console.error("Cloudflare Pages hazirlik hatasi:", error.message);
    process.exitCode = 1;
  });
