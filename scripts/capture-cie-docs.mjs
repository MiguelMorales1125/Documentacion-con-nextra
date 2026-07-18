import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const shotsDir = path.join(root, 'public', 'screenshots', 'moduloHistoriasClinicas');
const base = 'https://dev-cms.solvatico.com';
const creds = JSON.parse(readFileSync(path.join(__dirname, '.capture-creds.json'), 'utf8'));

const HIGHLIGHT = {
  outline: '3px solid #e03e3e',
  outlineOffset: '4px',
  boxShadow: '0 0 0 2px rgba(224, 62, 62, 0.15)',
};

async function login(page) {
  await page.goto(`${base}/auth/signin`);
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(creds.email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(creds.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 60000 });
}

async function setHcContext(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      'moduleMulti',
      JSON.stringify({
        id: 'inventory-hc',
        name: 'Historias clinicas',
        value: 'hc',
        href: '/hc',
        description: '',
      })
    );
  });
}

async function clearHighlights(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-doc-highlight]').forEach((el) => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.boxShadow = '';
      el.removeAttribute('data-doc-highlight');
    });
  });
}

async function highlightLocator(loc) {
  await loc.first().waitFor({ state: 'visible', timeout: 15000 });
  await loc.first().evaluate((el, style) => {
    el.setAttribute('data-doc-highlight', 'true');
    Object.assign(el.style, style);
  }, HIGHLIGHT);
}

async function highlight(page, selector) {
  await highlightLocator(page.locator(selector));
}

async function waitForGlobalLoader(page) {
  await page
    .locator('[role=status][aria-label="Loading..."]')
    .waitFor({ state: 'hidden', timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

async function closeOpenDialogs(page) {
  const panel = page.locator('[role=dialog] .transform.rounded-lg.bg-white');
  if (!(await panel.count())) return;
  const cancel = page.locator('[role=dialog] button').filter({ hasText: /^Cancelar$/ });
  if (await cancel.count()) {
    await cancel.first().click();
  } else {
    await page.getByRole('button', { name: 'Cerrar' }).click().catch(() => {});
  }
  await panel.waitFor({ state: 'hidden', timeout: 15000 });
  await clearHighlights(page);
  await page.waitForTimeout(400);
}

async function cropShot(page, name, cropSel, padding = 16) {
  const loc = page.locator(cropSel).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  const box = await loc.boundingBox();
  if (!box) throw new Error(`No bounding box: ${name}`);
  if (box.height < 40 || box.width < 60) {
    throw new Error(`Recorte inválido ${name}: ${box.width}x${box.height}`);
  }
  await page.screenshot({
    path: path.join(shotsDir, name),
    clip: {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
  });
  console.log('OK', name);
}

async function cropShotFromBoxes(page, name, boxes, padding = 24) {
  const valid = boxes.filter(Boolean);
  if (!valid.length) throw new Error(`No boxes: ${name}`);
  const x = Math.max(0, Math.min(...valid.map((b) => b.x)) - padding);
  const y = Math.max(0, Math.min(...valid.map((b) => b.y)) - padding);
  const x2 = Math.max(...valid.map((b) => b.x + b.width)) + padding;
  const y2 = Math.max(...valid.map((b) => b.y + b.height)) + padding;
  const width = x2 - x;
  const height = y2 - y;
  if (height < 50 || width < 80) throw new Error(`Recorte inválido ${name}: ${width}x${height}`);
  await page.screenshot({
    path: path.join(shotsDir, name),
    clip: { x, y, width, height },
  });
  console.log('OK', name);
}

async function gotoHc(page, route) {
  await setHcContext(page);
  await page.goto(`${base}${route}`);
  await page.waitForLoadState('networkidle');
  await waitForGlobalLoader(page);
  await page.waitForTimeout(800);
}

async function scrollTableToActions(page) {
  const scrollContainer = page.locator('main .desing-overflow, main .overflow-auto').first();
  if (await scrollContainer.count()) {
    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
      el.scrollTop = 0;
    });
  }
  await page.waitForTimeout(300);
}

function rowPencil(row) {
  return row.locator('td').last().locator('svg.cursor-pointer').last();
}

function rowToggle(row) {
  return row.locator('td').last().locator('button').first();
}

async function captureTableActionShot(page, name, row, targetLocator) {
  await closeOpenDialogs(page);
  await clearHighlights(page);
  await scrollTableToActions(page);

  const colCount = await page.locator('table thead td[scope="col"]').count();
  const start = Math.max(0, colCount - 3);
  const headers = [0, 1, 2].map((i) => page.locator('table thead td[scope="col"]').nth(start + i));
  const cells = [0, 1, 2].map((i) => row.locator('td').nth(start + i));

  await cells[2].scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const container = page.locator('main .desing-overflow, main .overflow-auto').first();
  const thead = page.locator('table thead').first();
  const theadBox = await thead.boundingBox();
  let rowBox = await row.boundingBox();
  if (theadBox && rowBox && (await container.count())) {
    const gap = rowBox.y - (theadBox.y + theadBox.height);
    if (gap > 8) {
      await container.evaluate((el, delta) => {
        el.scrollTop += delta;
      }, gap);
      await page.waitForTimeout(250);
      rowBox = await row.boundingBox();
    }
  }

  await highlightLocator(targetLocator);

  const headerBoxes = await Promise.all(headers.map((h) => h.boundingBox()));
  const cellBoxes = await Promise.all(cells.map((c) => c.boundingBox()));
  const validHeaders = headerBoxes.filter(Boolean);
  const validCells = cellBoxes.filter(Boolean);
  if (!validHeaders.length || !validCells.length) throw new Error(`No boxes: ${name}`);

  const headerH = Math.max(...validHeaders.map((b) => b.height));
  const x = Math.max(0, Math.min(...validHeaders.map((b) => b.x)) - 24);
  const x2 = Math.max(...validHeaders.map((b) => b.x + b.width)) + 24;
  const yCells = Math.min(...validCells.map((b) => b.y));
  const y2 = Math.max(...validCells.map((b) => b.y + b.height)) + 24;
  const y = Math.max(0, yCells - headerH - 12);
  const width = x2 - x;
  const height = y2 - y;
  if (height < 50 || width < 80) throw new Error(`Recorte inválido ${name}: ${width}x${height}`);
  if (height > 160) throw new Error(`Recorte demasiado alto ${name}: ${height}px (incluye filas de más)`);

  await page.screenshot({
    path: path.join(shotsDir, name),
    clip: { x, y, width, height },
  });
  console.log('OK', name);
}

async function captureModal(page, filename, highlightSelector) {
  const panel = page.locator('[role=dialog] .transform.rounded-lg.bg-white').first();
  await panel.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(400);
  await clearHighlights(page);
  await highlight(page, highlightSelector);
  await cropShot(page, filename, '[role=dialog] .transform.rounded-lg.bg-white');
  await closeOpenDialogs(page);
}

async function captureIngresoSidebar(page, {
  parentName,
  leafHref,
  filename,
}) {
  await gotoHc(page, leafHref);
  await closeOpenDialogs(page);
  const parentBtn = page
    .locator('aside button, nav button')
    .filter({ hasText: new RegExp(`^${parentName}$`) })
    .first();
  await parentBtn.click().catch(() => {});
  await page.waitForTimeout(600);
  const leaf = page.locator(`a[href="${leafHref}"]`).first();
  if (!(await leaf.isVisible().catch(() => false))) {
    await parentBtn.click();
    await page.waitForTimeout(500);
  }
  await leaf.waitFor({ state: 'visible', timeout: 15000 });
  await clearHighlights(page);
  if (await parentBtn.count()) await highlightLocator(parentBtn);
  await highlightLocator(leaf);
  await leaf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const side = page.locator('aside').first();
  const sideAlt = page.locator('nav').first();
  const aside = (await side.isVisible().catch(() => false)) ? side : sideAlt;
  await aside.waitFor({ state: 'visible', timeout: 15000 });
  const box = await aside.boundingBox();
  if (!box) throw new Error(`No aside for ${filename}`);
  const main = page.locator('main').first();
  const mainBox = await main.boundingBox().catch(() => null);
  const clipWidth = mainBox
    ? Math.min(box.width + Math.min(mainBox.width * 0.5, 560) + 16, 1080)
    : box.width + 24;
  await page.screenshot({
    path: path.join(shotsDir, filename),
    clip: {
      x: Math.max(0, box.x - 8),
      y: 0,
      width: clipWidth,
      height: Math.min(Math.max(box.height + 16, mainBox?.height ?? box.height), 900),
    },
  });
  console.log('OK', filename);
}

async function captureCie(page) {
  await captureIngresoSidebar(page, {
    parentName: 'Configuración',
    leafHref: '/hc/configuracion/cie',
    filename: 'cie-01-ingreso.png',
  });

  await gotoHc(page, '/hc/configuracion/cie');
  await closeOpenDialogs(page);

  const nuevoBtn = page.locator('button').filter({ hasText: /Nuevo CIE/i });
  await clearHighlights(page);
  await highlight(page, 'button >> text=/Nuevo CIE/i');
  await cropShot(page, 'cie-02-nuevo.png', 'main');

  await nuevoBtn.first().click();
  await captureModal(page, 'cie-03-formulario.png', 'input[name="code"]');

  await closeOpenDialogs(page);
  await clearHighlights(page);
  await highlight(page, 'input[placeholder="Código, descripción"]');
  await cropShot(page, 'cie-04-buscar.png', 'main .bg-white.shadow-xs.rounded-md.py-6', 12);

  await clearHighlights(page);
  await page.locator('#status').click();
  await page.waitForTimeout(300);
  await highlight(page, '#status');
  await cropShot(page, 'cie-05-filtro-estado.png', 'main .bg-white.shadow-xs.rounded-md.py-6', 12);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await clearHighlights(page);
  await page.locator('#order').click();
  await page.waitForTimeout(300);
  await highlight(page, '#order');
  await cropShot(page, 'cie-06-filtro-ordenar.png', 'main .bg-white.shadow-xs.rounded-md.py-6', 12);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await clearHighlights(page);
  await cropShot(page, 'cie-07-tabla.png', 'main .bg-white.shadow-xs.rounded-md.py-6', 12);

  await gotoHc(page, '/hc/configuracion/cie');
  await closeOpenDialogs(page);
  const row = page.locator('table tbody tr').first();
  await row.waitFor({ state: 'visible', timeout: 15000 });

  await captureTableActionShot(page, 'cie-08-editar.png', row, rowPencil(row));

  await rowPencil(row).click();
  await waitForGlobalLoader(page);
  await captureModal(page, 'cie-09-formulario-editar.png', 'input[name="description"]');

  await gotoHc(page, '/hc/configuracion/cie');
  await closeOpenDialogs(page);

  const inactiveRow = page
    .locator('table tbody tr')
    .filter({ has: page.getByText('Inactivo', { exact: true }) })
    .first();
  const activeRow = page
    .locator('table tbody tr')
    .filter({ has: page.getByText('Activo', { exact: true }) })
    .first();

  if (await inactiveRow.count()) {
    await captureTableActionShot(page, 'cie-11-estado-inactivo.png', inactiveRow, rowToggle(inactiveRow));
  }
  if (await activeRow.count()) {
    await captureTableActionShot(page, 'cie-10-estado-activo.png', activeRow, rowToggle(activeRow));
  }
}

async function main() {
  await mkdir(shotsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);

  if (process.argv.includes('--actions-only')) {
    await gotoHc(page, '/hc/configuracion/cie');
    await closeOpenDialogs(page);
    const row = page.locator('table tbody tr').first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await captureTableActionShot(page, 'cie-08-editar.png', row, rowPencil(row));

    const inactiveRow = page
      .locator('table tbody tr')
      .filter({ has: page.getByText('Inactivo', { exact: true }) })
      .first();
    const activeRow = page
      .locator('table tbody tr')
      .filter({ has: page.getByText('Activo', { exact: true }) })
      .first();
    if (await inactiveRow.count()) {
      await captureTableActionShot(page, 'cie-11-estado-inactivo.png', inactiveRow, rowToggle(inactiveRow));
    }
    if (await activeRow.count()) {
      await captureTableActionShot(page, 'cie-10-estado-activo.png', activeRow, rowToggle(activeRow));
    }
  } else {
    await captureCie(page);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
