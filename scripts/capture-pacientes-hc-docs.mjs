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
const route = '/hc/configuracion/pacientes';

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
    let node = el;
    if (el.getAttribute('role') === 'switch' || el.id === 'statusModify') {
      node =
        el.closest('[data-testid="flowbite-tooltip-target"]') ||
        el.parentElement?.parentElement ||
        el.parentElement ||
        el;
    } else if (el.tagName.toLowerCase() === 'svg') {
      node = el.parentElement || el;
    }
    node.setAttribute('data-doc-highlight', 'true');
    Object.assign(node.style, style);
    if (node !== el) node.style.borderRadius = '6px';
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
  await page
    .locator('.animate-spin')
    .first()
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

async function waitDialogFormReady(page) {
  await page.locator('[role=dialog] .transform.rounded-lg.bg-white').first().waitFor({ state: 'visible', timeout: 15000 });
  await waitForGlobalLoader(page);
  await page.waitForFunction(() => {
    const dlg = document.querySelector('[role=dialog]');
    if (!dlg) return false;
    const spins = [...dlg.querySelectorAll('.animate-spin')].filter((el) => {
      const st = getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden' && el.offsetParent !== null;
    });
    if (spins.length) return false;
    const fn = dlg.querySelector('input[name="firstName"], input[name="documentNumber"]');
    return Boolean(fn && fn.value && fn.value.length > 0);
  }, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(400);
}

function menuItemExact(page, label) {
  return page.locator('[role=menuitem]').filter({ hasText: new RegExp(`^${label}$`, 'i') });
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
  await panel.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await clearHighlights(page);
  await page.waitForTimeout(400);
}

async function gotoHc(page, pathRoute) {
  await setHcContext(page);
  await page.goto(`${base}${pathRoute}`);
  await page.waitForLoadState('networkidle');
  await waitForGlobalLoader(page);
  await page.waitForTimeout(800);
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

async function clickOptionsMenu(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-doc-opts]').forEach((el) => el.removeAttribute('data-doc-opts'));
    const nuevoEl = [...document.querySelectorAll('main button')].find((b) =>
      /Nuevo paciente/i.test(b.textContent || '')
    );
    if (!nuevoEl) return;
    const nr = nuevoEl.getBoundingClientRect();
    const el = [...document.querySelectorAll('main button')].find((b) => {
      const r = b.getBoundingClientRect();
      return !b.textContent.trim() && Math.abs(r.y - nr.y) < 5 && r.x > nr.x && r.width < 50;
    });
    if (el) el.setAttribute('data-doc-opts', '1');
  });
  const opts = page.locator('button[data-doc-opts="1"]');
  await opts.waitFor({ state: 'visible', timeout: 10000 });
  await opts.click();
  await page.waitForTimeout(400);
  return opts;
}

async function captureIngresoSidebar(page) {
  await gotoHc(page, route);
  await closeOpenDialogs(page);
  const parentName = 'Configuración';
  const parentBtn = page
    .locator('aside button, nav button')
    .filter({ hasText: new RegExp(`^${parentName}$`) })
    .first();
  await parentBtn.click().catch(() => {});
  await page.waitForTimeout(600);
  const leaf = page.locator(`a[href="${route}"]`).first();
  if (!(await leaf.isVisible().catch(() => false))) {
    await parentBtn.click();
    await page.waitForTimeout(500);
  }
  await leaf.waitFor({ state: 'visible', timeout: 15000 });
  await clearHighlights(page);
  await highlightLocator(parentBtn);
  await highlightLocator(leaf);
  await leaf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const aside = (await page.locator('aside').first().isVisible().catch(() => false))
    ? page.locator('aside').first()
    : page.locator('nav').first();
  const box = await aside.boundingBox();
  const mainBox = await page.locator('main').first().boundingBox();
  const clipWidth = Math.min(box.width + Math.min(mainBox.width * 0.5, 560) + 16, 1080);
  await page.screenshot({
    path: path.join(shotsDir, 'pacientes-01-ingreso.png'),
    clip: {
      x: Math.max(0, box.x - 8),
      y: 0,
      width: clipWidth,
      height: Math.min(Math.max(box.height + 16, mainBox?.height ?? box.height), 900),
    },
  });
  console.log('OK pacientes-01-ingreso.png');
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
  return row.locator('td').last().locator('svg.h-5.w-5.cursor-pointer').first();
}

function rowToggle(row) {
  return row.locator('td').last().locator('button#statusModify, button[role=switch]').first();
}

async function captureTableActionShot(page, name, row, targetLocator) {
  await closeOpenDialogs(page);
  await clearHighlights(page);
  await scrollTableToActions(page);

  const colCount = await page.locator('table thead td[scope="col"], table thead th').count();
  const headerCells = page.locator('table thead td[scope="col"], table thead th');
  const start = Math.max(0, colCount - 3);
  const headers = [0, 1, 2].map((i) => headerCells.nth(start + i));
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
  if (height > 180) throw new Error(`Recorte demasiado alto ${name}: ${height}px`);

  await page.screenshot({
    path: path.join(shotsDir, name),
    clip: { x, y, width, height },
  });
  console.log('OK', name);
}

async function capturePacientes(page) {
  await captureIngresoSidebar(page);
  await gotoHc(page, route);
  await closeOpenDialogs(page);

  const nuevoBtn = page.locator('button').filter({ hasText: /Nuevo paciente/i });
  await clearHighlights(page);
  await highlightLocator(nuevoBtn);
  await cropShot(page, 'pacientes-02-nuevo.png', 'main');

  await nuevoBtn.first().click();
  await page.waitForTimeout(800);
  const panel = page.locator('[role=dialog] .transform.rounded-lg.bg-white').first();
  await panel.waitFor({ state: 'visible', timeout: 15000 });
  await clearHighlights(page);
  const tipoDoc = page.locator('[role=dialog]').getByText(/Tipo de documento/i).first();
  await highlightLocator(tipoDoc);
  await cropShot(page, 'pacientes-03-formulario.png', '[role=dialog] .transform.rounded-lg.bg-white');
  await closeOpenDialogs(page);

  await clearHighlights(page);
  const opts = await clickOptionsMenu(page);
  await highlightLocator(opts);
  await cropShot(page, 'pacientes-04-opciones.png', 'main');
  await clearHighlights(page);
  await highlightLocator(menuItemExact(page, 'Importar desde csv'));
  await page.screenshot({
    path: path.join(shotsDir, 'pacientes-05-menu-importar.png'),
    clip: await (async () => {
      const menu = page.locator('[role=menu]').first();
      const box = (await menu.boundingBox()) || (await menuItemExact(page, 'Importar desde csv').boundingBox());
      const optsBox = await opts.boundingBox();
      const x = Math.min(optsBox.x, box.x) - 16;
      const y = Math.min(optsBox.y, box.y) - 16;
      return {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.max(optsBox.x + optsBox.width, box.x + box.width) - x + 16,
        height: Math.max(optsBox.y + optsBox.height, box.y + box.height) - y + 16,
      };
    })(),
  });
  console.log('OK pacientes-05-menu-importar.png');

  await menuItemExact(page, 'Importar desde csv').click();
  await page.waitForTimeout(500);
  await clearHighlights(page);
  await highlight(page, '[role=dialog] input[type=file], [role=dialog] label, [role=dialog] button').catch(() => {});
  const fileZone = page.locator('[role=dialog]').locator('text=/csv|archivo|arrastre|seleccione/i').first();
  if (await fileZone.count()) await highlightLocator(fileZone);
  else await highlightLocator(page.locator('[role=dialog] .transform.rounded-lg.bg-white').first());
  await cropShot(page, 'pacientes-06-importar-modal.png', '[role=dialog] .transform.rounded-lg.bg-white');
  await closeOpenDialogs(page);

  await clickOptionsMenu(page);
  await clearHighlights(page);
  await highlightLocator(menuItemExact(page, 'Desactivar masivo por entidad afiliadora'));
  await page.screenshot({
    path: path.join(shotsDir, 'pacientes-07-menu-desactivar.png'),
    clip: await (async () => {
      const item = menuItemExact(page, 'Desactivar masivo por entidad afiliadora');
      const box = await item.boundingBox();
      const menu = page.locator('[role=menu]').first();
      const mbox = (await menu.boundingBox()) || box;
      return {
        x: Math.max(0, mbox.x - 12),
        y: Math.max(0, mbox.y - 12),
        width: mbox.width + 24,
        height: mbox.height + 24,
      };
    })(),
  });
  console.log('OK pacientes-07-menu-desactivar.png');
  await menuItemExact(page, 'Desactivar masivo por entidad afiliadora').click();
  await page.waitForTimeout(500);
  await clearHighlights(page);
  await highlight(page, '[role=dialog] input[placeholder*="búsqueda" i], [role=dialog] input').catch(() => {});
  await cropShot(page, 'pacientes-08-desactivar-modal.png', '[role=dialog] .transform.rounded-lg.bg-white');
  await closeOpenDialogs(page);

  await clickOptionsMenu(page);
  await clearHighlights(page);
  await highlightLocator(menuItemExact(page, 'Activar masivo por entidad afiliadora'));
  await page.screenshot({
    path: path.join(shotsDir, 'pacientes-09-menu-activar.png'),
    clip: await (async () => {
      const menu = page.locator('[role=menu]').first();
      const mbox = await menu.boundingBox();
      return {
        x: Math.max(0, mbox.x - 12),
        y: Math.max(0, mbox.y - 12),
        width: mbox.width + 24,
        height: mbox.height + 24,
      };
    })(),
  });
  console.log('OK pacientes-09-menu-activar.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await clearHighlights(page);
  await highlight(page, 'input[placeholder*="documento" i], input[name="search"]');
  await cropShot(page, 'pacientes-10-buscar.png', 'main .bg-white.shadow-xs.rounded-md.py-6, main form, main', 12);

  await clearHighlights(page);
  await page.locator('#status, button').filter({ hasText: /^Todos$/ }).first().click();
  await page.waitForTimeout(300);
  await highlightLocator(page.locator('#status').or(page.locator('button').filter({ hasText: /^Todos$/ })).first());
  await cropShot(page, 'pacientes-11-filtro-estado.png', 'main .bg-white.shadow-xs.rounded-md.py-6, main', 12);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await clearHighlights(page);
  await page.locator('button').filter({ hasText: /Más reciente|Más antiguo/i }).first().click();
  await page.waitForTimeout(300);
  await highlightLocator(page.locator('button').filter({ hasText: /Más reciente|Más antiguo/i }).first());
  await cropShot(page, 'pacientes-12-filtro-ordenar.png', 'main .bg-white.shadow-xs.rounded-md.py-6, main', 12);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await clearHighlights(page);
  await highlight(page, 'input[name="healthCompanyIds"], label:has-text("Entidad afiliadora")');
  await cropShot(page, 'pacientes-13-filtro-entidad.png', 'main .bg-white.shadow-xs.rounded-md.py-6, main', 12);

  await clearHighlights(page);
  await cropShot(page, 'pacientes-14-tabla.png', 'main');

  const row = page.locator('table tbody tr').first();
  await row.waitFor({ state: 'visible', timeout: 15000 });
  await captureTableActionShot(page, 'pacientes-15-editar.png', row, rowPencil(row));

  await rowPencil(row).click();
  await waitDialogFormReady(page);
  await clearHighlights(page);
  await highlightLocator(page.locator('[role=dialog]').getByText(/^Tipo de documento/i).first());
  await cropShot(page, 'pacientes-16-formulario-editar.png', '[role=dialog] .transform.rounded-lg.bg-white');
  await closeOpenDialogs(page);

  const activeRow = page
    .locator('table tbody tr')
    .filter({ has: page.getByText('Activo', { exact: true }) })
    .first();
  const inactiveRow = page
    .locator('table tbody tr')
    .filter({ has: page.getByText('Inactivo', { exact: true }) })
    .first();

  if (await activeRow.count()) {
    await captureTableActionShot(page, 'pacientes-17-estado-activo.png', activeRow, rowToggle(activeRow));
  }
  if (await inactiveRow.count()) {
    await captureTableActionShot(page, 'pacientes-18-estado-inactivo.png', inactiveRow, rowToggle(inactiveRow));
  } else {
    await page.locator('#status, button').filter({ hasText: /^Todos$/ }).first().click().catch(() => {});
    await page.getByRole('option', { name: /Inactivo/i }).click().catch(() => {});
    await waitForGlobalLoader(page);
    const inactive2 = page
      .locator('table tbody tr')
      .filter({ has: page.getByText('Inactivo', { exact: true }) })
      .first();
    if (await inactive2.count()) {
      await captureTableActionShot(page, 'pacientes-18-estado-inactivo.png', inactive2, rowToggle(inactive2));
    }
  }
}

async function main() {
  await mkdir(shotsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await capturePacientes(page);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
