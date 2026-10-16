import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { Router } from "express";

const ROUTES_DIR = import.meta.dirname;
const SUFFIX = ".routes.js";

const router = Router();

const files = (await readdir(ROUTES_DIR)).filter((name) => name.endsWith(SUFFIX)).sort();

for (const file of files) {
  const path = join(ROUTES_DIR, file);
  const source = await readFile(path, "utf8");

  if (source.trim() === "") {
    continue;
  }

  const prefix = `/${file.slice(0, -SUFFIX.length)}`;
  const { default: route } = await import(pathToFileURL(path).href);

  if (typeof route !== "function") {
    throw new TypeError(`${file} phải export default một Express Router`);
  }

  router.use(prefix, route);
}

export default router;
