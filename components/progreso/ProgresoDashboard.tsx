"use client";

import { useMemo, useState } from "react";
import {
  AS_OF,
  COVERED,
  COVERAGE_PCT,
  DOCUMENTED_NEXTRA,
  FILTERS,
  GAP_TOUCHED,
  GAP_ZERO,
  NEXTRA_PAGES,
  PENDING_SCREENS,
  PRIORITIES,
  QA_ACCESSIBLE,
  QA_MODULES,
  QA_MODULES_DATA,
  QA_URL,
  pct,
  statusLabel,
  type DocStatus,
} from "./data";
import "./progreso.css";

function badgeClass(status: DocStatus): string {
  switch (status) {
    case "documentado":
      return "progreso-dash__badge progreso-dash__badge--ok";
    case "parcial":
      return "progreso-dash__badge progreso-dash__badge--warn";
    case "pendiente":
      return "progreso-dash__badge progreso-dash__badge--info";
    case "sin-modulo":
      return "progreso-dash__badge progreso-dash__badge--danger";
  }
}

function fillClass(status: DocStatus): string {
  switch (status) {
    case "documentado":
      return "progreso-dash__module-fill progreso-dash__module-fill--ok";
    case "parcial":
      return "progreso-dash__module-fill progreso-dash__module-fill--warn";
    default:
      return "progreso-dash__module-fill progreso-dash__module-fill--danger";
  }
}

export function ProgresoDashboard() {
  const [filter, setFilter] = useState<string>("Todos");

  const documentedModules = QA_MODULES_DATA.filter(
    (m) => m.status === "documentado" || m.status === "parcial",
  ).length;

  const pending = useMemo(
    () =>
      filter === "Todos"
        ? PENDING_SCREENS
        : PENDING_SCREENS.filter((r) => r.module === filter),
    [filter],
  );

  const okWidth = (COVERED / QA_ACCESSIBLE) * 100;
  const warnWidth = (GAP_TOUCHED / QA_ACCESSIBLE) * 100;
  const dangerWidth = (GAP_ZERO / QA_ACCESSIBLE) * 100;

  return (
    <div className="progreso-dash">
      <header className="progreso-dash__hero">
        <div className="progreso-dash__hero-inner">
          <div>
            <div className="progreso-dash__eyebrow">
              <span className="progreso-dash__eyebrow-dot" />
              IPS Multisalud · Documentación
            </div>
            <h1 className="progreso-dash__title">
              Progreso de la documentación
            </h1>
            <p className="progreso-dash__lead">
              Comparación entre las páginas publicadas en Nextra y las pantallas
              accesibles de la app QA, módulo por módulo.
            </p>
            <div className="progreso-dash__meta">
              <span>Actualizado {AS_OF}</span>
              <span>
                QA:{" "}
                <a href={QA_URL} target="_blank" rel="noreferrer">
                  dev-cms.solvatico.com
                </a>
              </span>
              <span>Fuentes: inventarios QA + app/**/*.mdx</span>
            </div>
          </div>
          <div className="progreso-dash__hero-stat">
            <div className="progreso-dash__hero-stat-label">
              Cobertura QA → Nextra
            </div>
            <div className="progreso-dash__hero-stat-value">{COVERAGE_PCT}%</div>
            <div className="progreso-dash__hero-stat-sub">
              {COVERED} de {QA_ACCESSIBLE} pantallas con página dedicada
            </div>
          </div>
        </div>
      </header>

      <div className="progreso-dash__body">
        <div className="progreso-dash__stats">
          <div className="progreso-dash__stat">
            <div className="progreso-dash__stat-value">{NEXTRA_PAGES}</div>
            <div className="progreso-dash__stat-label">Páginas en Nextra</div>
          </div>
          <div className="progreso-dash__stat">
            <div className="progreso-dash__stat-value">{QA_ACCESSIBLE}</div>
            <div className="progreso-dash__stat-label">
              Pantallas QA accesibles
            </div>
          </div>
          <div className="progreso-dash__stat">
            <div className="progreso-dash__stat-value">
              {documentedModules}/{QA_MODULES}
            </div>
            <div className="progreso-dash__stat-label">
              Módulos QA con documentación
            </div>
          </div>
          <div className="progreso-dash__stat">
            <div className="progreso-dash__stat-value">{QA_ACCESSIBLE - COVERED}</div>
            <div className="progreso-dash__stat-label">Pantallas pendientes</div>
          </div>
        </div>

        <div className="progreso-dash__bar-card">
          <div className="progreso-dash__bar-head">
            <strong>
              Cobertura global: {COVERED} / {QA_ACCESSIBLE}
            </strong>
            <span>{COVERAGE_PCT}%</span>
          </div>
          <div className="progreso-dash__bar-track" aria-hidden>
            <div
              className="progreso-dash__bar-seg progreso-dash__bar-seg--ok"
              style={{ width: `${okWidth}%` }}
            />
            <div
              className="progreso-dash__bar-seg progreso-dash__bar-seg--warn"
              style={{ width: `${warnWidth}%` }}
            />
            <div
              className="progreso-dash__bar-seg progreso-dash__bar-seg--danger"
              style={{ width: `${dangerWidth}%` }}
            />
          </div>
          <div className="progreso-dash__legend">
            <span>
              <i className="progreso-dash__swatch progreso-dash__swatch--ok" />
              Documentadas ({COVERED})
            </span>
            <span>
              <i className="progreso-dash__swatch progreso-dash__swatch--warn" />
              Brechas en módulos iniciados ({GAP_TOUCHED})
            </span>
            <span>
              <i className="progreso-dash__swatch progreso-dash__swatch--danger" />
              Módulos en cero ({GAP_ZERO})
            </span>
          </div>
        </div>

        <div className="progreso-dash__callout">
          <strong>Criterio de medición</strong>
          QA manda sobre Notion. Se cuentan pantallas accesibles del inventario
          completo (97) con página dedicada en Nextra. Padres 404 y formularios
          /nuevo|/editar|/vista no entran en el denominador.
        </div>

        <section>
          <h2 className="progreso-dash__section-title">
            Módulos del home QA
          </h2>
          <p className="progreso-dash__section-sub">
            9 módulos detectados en el home. Barras según pantallas accesibles
            documentadas.
          </p>
          <div className="progreso-dash__modules">
            {QA_MODULES_DATA.map((m) => {
              const p = pct(m.coveredScreens, m.qaAccessible);
              return (
                <article key={m.id} className="progreso-dash__module">
                  <div className="progreso-dash__module-top">
                    <div>
                      <div className="progreso-dash__module-name">{m.name}</div>
                      <span className={badgeClass(m.status)}>
                        {statusLabel(m.status)}
                      </span>
                    </div>
                    <div className="progreso-dash__module-pct">{p}%</div>
                  </div>
                  <div className="progreso-dash__module-track">
                    <div
                      className={fillClass(m.status)}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <div className="progreso-dash__module-meta">
                    {m.coveredScreens}/{m.qaAccessible} pantallas ·{" "}
                    {m.nextraPages} páginas .mdx
                  </div>
                  <div className="progreso-dash__module-notes">{m.notes}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="progreso-dash__section-title">
            Detalle por módulo QA
          </h2>
          <p className="progreso-dash__section-sub">
            Inventario de menú, pantallas accesibles y cobertura en Nextra.
          </p>
          <div className="progreso-dash__table-wrap">
            <table className="progreso-dash__table">
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th className="progreso-dash__num">Menú</th>
                  <th className="progreso-dash__num">Accesibles</th>
                  <th className="progreso-dash__num">Con Nextra</th>
                  <th className="progreso-dash__num">%</th>
                  <th className="progreso-dash__num">.mdx</th>
                  <th>Estado</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {QA_MODULES_DATA.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td className="progreso-dash__num">{m.qaMenuItems}</td>
                    <td className="progreso-dash__num">{m.qaAccessible}</td>
                    <td className="progreso-dash__num">{m.coveredScreens}</td>
                    <td className="progreso-dash__num">
                      {pct(m.coveredScreens, m.qaAccessible)}%
                    </td>
                    <td className="progreso-dash__num">{m.nextraPages}</td>
                    <td>
                      <span className={badgeClass(m.status)}>
                        {statusLabel(m.status)}
                      </span>
                    </td>
                    <td>{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="progreso-dash__section-title">
            Ya documentado en Nextra
          </h2>
          <p className="progreso-dash__section-sub">
            {`Secciones del sidebar con páginas publicadas (${NEXTRA_PAGES} archivos page.mdx).`}
          </p>
          <div className="progreso-dash__table-wrap">
            <table className="progreso-dash__table">
              <thead>
                <tr>
                  <th>Sección sidebar</th>
                  <th>Contenido</th>
                  <th className="progreso-dash__num">Páginas</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENTED_NEXTRA.map((row) => (
                  <tr key={row.section}>
                    <td>{row.section}</td>
                    <td>{row.content}</td>
                    <td className="progreso-dash__num">{row.pages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="progreso-dash__section-title">Pendientes y brechas</h2>
          <p className="progreso-dash__section-sub">
            Pantallas QA sin página dedicada, o solo parcialmente cubiertas.
          </p>
          <div className="progreso-dash__filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`progreso-dash__filter${filter === f ? " is-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="progreso-dash__table-wrap">
            <table className="progreso-dash__table">
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Pantalla / alcance</th>
                  <th>Ruta QA</th>
                  <th>Nextra</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={`${r.module}-${r.screen}-${r.qaPath}`}>
                    <td>{r.module}</td>
                    <td>{r.screen}</td>
                    <td className="progreso-dash__path">{r.qaPath}</td>
                    <td>{r.nextra}</td>
                    <td>
                      <span className={badgeClass(r.status)}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="progreso-dash__section-title">Prioridades sugeridas</h2>
          <p className="progreso-dash__section-sub">
            Orden de trabajo recomendado para subir la cobertura.
          </p>
          <div className="progreso-dash__priorities">
            {PRIORITIES.map((p) => (
              <article key={p.title} className="progreso-dash__priority">
                <div className="progreso-dash__priority-head">
                  <h3>{p.title}</h3>
                  <span
                    className={
                      p.level === "Alta"
                        ? "progreso-dash__badge progreso-dash__badge--danger"
                        : "progreso-dash__badge progreso-dash__badge--warn"
                    }
                  >
                    {p.level}
                  </span>
                </div>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <p className="progreso-dash__footer-note">
          {`Pantallas QA accesibles según inventario del 23 jun 2026 (INVENTARIO-QA-NOTION-COMPLETO.md). Páginas Nextra contadas en el workspace el ${AS_OF} (${NEXTRA_PAGES} archivos page.mdx). Criterio: QA manda sobre Notion.`}
        </p>
      </div>
    </div>
  );
}
