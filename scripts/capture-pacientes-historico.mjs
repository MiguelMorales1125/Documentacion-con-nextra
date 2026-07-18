import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(__dirname, '..', 'public', 'screenshots', 'moduloHistoriasClinicas');
const base = 'https://dev-cms.solvatico.com';
const creds = JSON.parse(readFileSync(path.join(__dirname, '.capture-creds.json'), 'utf8'));
const HIGHLIGHT = {
  outline: '3px solid #e03e3e',
  outlineOffset: '4px',
  boxShadow: '0 0 0 2px rgba(224, 62, 62, 0.15)',
};

async function hl(loc) {
  await loc.first().waitFor({ state: 'visible', timeout: 15000 });
  await loc.first().evaluate((el, style) => {
    let node = el;
    if (el.tagName.toLowerCase() === 'svg') node = el.parentElement || el;
    node.setAttribute('data-doc-highlight', 'true');
    Object.assign(node.style, style);
    if (node !== el) node.style.borderRadius = '6px';
  }, HIGHLIGHT);
}

async function clear(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-doc-highlight]').forEach((el) => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.boxShadow = '';
      el.removeAttribute('data-doc-highlight');
    });
  });
}

async function waitLoaders(page) {
  await page
    .locator('[role=status][aria-label="Loading..."]')
    .waitFor({ state: 'hidden', timeout: 30000 })
    .catch(() => {});
  await page.locator('.animate-spin').first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/auth/signin`);
await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(creds.email);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(creds.password);
await page.getByRole('button', { name: 'Iniciar sesión' }).click();
await page.waitForURL((u) => !u.pathname.includes('/auth/signin'), { timeout: 60000 });
await page.evaluate(() =>
  localStorage.setItem(
    'moduleMulti',
    JSON.stringify({
      id: 'inventory-hc',
      name: 'Historias clinicas',
      value: 'hc',
      href: '/hc',
      description: '',
    })
  )
);
await page.goto(`${base}/hc/configuracion/pacientes`);
await page.waitForLoadState('networkidle');
await waitLoaders(page);

const scroll = page.locator('main .desing-overflow, main .overflow-auto').first();
if (await scroll.count()) {
  await scroll.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
    el.scrollTop = 0;
  });
}

const row = page.locator('table tbody tr').first();
await row.waitFor({ state: 'visible' });
const historyIcon = row.locator('td').last().locator('svg.h-5.w-5.cursor-pointer').nth(1);

const headers = page.locator('table thead td[scope=col], table thead th');
const colCount = await headers.count();
const start = Math.max(0, colCount - 3);
const hs = [0, 1, 2].map((i) => headers.nth(start + i));
const cs = [0, 1, 2].map((i) => row.locator('td').nth(start + i));
await cs[2].scrollIntoViewIfNeeded();
const theadBox = await page.locator('table thead').first().boundingBox();
let rowBox = await row.boundingBox();
if (theadBox && rowBox && (await scroll.count())) {
  const gap = rowBox.y - (theadBox.y + theadBox.height);
  if (gap > 8) {
    await scroll.evaluate((el, d) => {
      el.scrollTop += d;
    }, gap);
    await page.waitForTimeout(200);
  }
}

await clear(page);
await hl(historyIcon);
{
  const hb = (await Promise.all(hs.map((h) => h.boundingBox()))).filter(Boolean);
  const cb = (await Promise.all(cs.map((c) => c.boundingBox()))).filter(Boolean);
  const headerH = Math.max(...hb.map((b) => b.height));
  const x = Math.max(0, Math.min(...hb.map((b) => b.x)) - 24);
  const x2 = Math.max(...hb.map((b) => b.x + b.width)) + 24;
  const y = Math.max(0, Math.min(...cb.map((b) => b.y)) - headerH - 12);
  const y2 = Math.max(...cb.map((b) => b.y + b.height)) + 24;
  await page.screenshot({
    path: path.join(shotsDir, 'pacientes-19-historico.png'),
    clip: { x, y, width: x2 - x, height: y2 - y },
  });
  console.log('OK pacientes-19-historico.png');
}

await clear(page);
await historyIcon.click();
await page.waitForTimeout(1000);
await waitLoaders(page);

const panel = page.locator('[role=dialog] #headlessui-dialog-panel-\\:r8v\\:, [role=dialog] .transform.rounded-lg.bg-white').first();
await page.locator('[role=dialog] .transform.rounded-lg.bg-white.max-w-7xl, [role=dialog] .max-w-7xl').first().waitFor({ state: 'attached', timeout: 15000 });

const modal = page.locator('[role=dialog] .max-w-7xl, [role=dialog] .transform.rounded-lg.bg-white').first();
await modal.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(500);

// force dialog overflow container scroll to top
await page.evaluate(() => {
  const scroller = document.querySelector('[role=dialog] .overflow-y-auto');
  if (scroller) scroller.scrollTop = 0;
});
await page.waitForTimeout(300);

await clear(page);
await hl(page.locator('[role=dialog]').getByText(/^Histórico$/i).first());

let box = await modal.boundingBox();
if (!box || box.height < 200) {
  box = await page.evaluate(() => {
    const el = document.querySelector('[role=dialog] .max-w-7xl') || document.querySelector('[role=dialog] .transform.rounded-lg.bg-white');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

await page.screenshot({
  path: path.join(shotsDir, 'pacientes-20-historico-detalle.png'),
  clip: {
    x: Math.max(0, box.x - 12),
    y: Math.max(0, Math.min(box.y - 12, 40)),
    width: Math.min(box.width + 24, 1400),
    height: Math.min(Math.max(box.height + 24, 500), 860),
  },
});
console.log('OK pacientes-20-historico-detalle.png', box);

const tabs = ['Histórico de citas médicas', 'Histórico de sanciones', 'Histórico de actualizaciones'];
for (let i = 0; i < tabs.length; i++) {
  const tab = page.locator('[role=dialog]').getByText(tabs[i], { exact: true }).first();
  await tab.click();
  await waitLoaders(page);
  await page.waitForTimeout(500);
  await clear(page);
  await hl(tab);
  await page.evaluate(() => {
    const scroller = document.querySelector('[role=dialog] .overflow-y-auto');
    if (scroller) scroller.scrollTop = 0;
  });
  const b = await modal.boundingBox();
  const n = 21 + i;
  await page.screenshot({
    path: path.join(shotsDir, `pacientes-${n}-historico-tab.png`),
    clip: {
      x: Math.max(0, b.x - 12),
      y: Math.max(0, Math.min(b.y - 12, 40)),
      width: Math.min(b.width + 24, 1400),
      height: Math.min(Math.max(b.height + 24, 480), 860),
    },
  });
  console.log('OK', `pacientes-${n}-historico-tab.png`, tabs[i]);
}

await browser.close();
