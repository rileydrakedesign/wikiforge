import Handlebars from "handlebars";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root of the package (two levels up from dist/utils/) */
const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");

// Register Handlebars helpers
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper(
  "includes",
  (arr: unknown[], val: unknown) => Array.isArray(arr) && arr.includes(val),
);
Handlebars.registerHelper(
  "join",
  (arr: unknown[], sep: string) =>
    Array.isArray(arr) ? arr.join(sep) : "",
);

let partialsRegistered = false;

/**
 * Register Handlebars partials from the templates/agents/personas/ directory.
 */
async function registerPartials(): Promise<void> {
  if (partialsRegistered) return;

  const personasDir = path.join(PACKAGE_ROOT, "templates", "agents", "personas");
  try {
    const files = await readdir(personasDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const name = path.basename(file, ".md");
      const content = await readFile(path.join(personasDir, file), "utf-8");
      Handlebars.registerPartial(`persona-${name}`, content);
    }
  } catch {
    // personas directory may not exist yet during development
  }
  partialsRegistered = true;
}

/**
 * Load and compile a Handlebars template from the templates/ directory.
 */
export async function loadTemplate(
  templatePath: string,
): Promise<HandlebarsTemplateDelegate> {
  await registerPartials();
  const fullPath = path.join(PACKAGE_ROOT, "templates", templatePath);
  const source = await readFile(fullPath, "utf-8");
  return Handlebars.compile(source);
}

/**
 * Render a template with the given context data.
 */
export async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown>,
): Promise<string> {
  const template = await loadTemplate(templatePath);
  return template(data);
}
