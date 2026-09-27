import type { DesignDirection, Language } from "./direction-engine";

export type WorkspaceAction = "generated" | "built" | "varied" | "remixed" | "mixed";

export type WorkspaceVersion = {
  id: string;
  action: WorkspaceAction;
  brief: string;
  selectedId: DesignDirection["id"];
  directions: DesignDirection[];
  createdAt: string;
};

const actionLabels: Record<Language, Record<WorkspaceAction, string>> = {
  zh: { generated: "生成三个方向", built: "生成完整页面", varied: "增强视觉立场", remixed: "重混配色", mixed: "混合相邻方向" },
  en: { generated: "Generated three directions", built: "Built the full page", varied: "Strengthened the position", remixed: "Remixed the palette", mixed: "Mixed adjacent directions" },
};

function cloneDirections(directions: DesignDirection[]) {
  return directions.map((direction) => ({ ...direction, colors: [...direction.colors] as DesignDirection["colors"] }));
}

export function createWorkspaceVersion(
  action: WorkspaceAction,
  brief: string,
  selectedId: DesignDirection["id"],
  directions: DesignDirection[],
): WorkspaceVersion {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    brief,
    selectedId,
    directions: cloneDirections(directions),
    createdAt: new Date().toISOString(),
  };
}

export function actionLabel(action: WorkspaceAction, language: Language) {
  return actionLabels[language][action];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export function exportDirectionHtml(direction: DesignDirection, brief: string, language: Language) {
  if (direction.html) return direction.html;
  const title = escapeHtml(direction.sampleTitle);
  const thesis = escapeHtml(direction.thesis);
  const safeBrief = escapeHtml(brief);
  const [ink, paper, accent, pop] = direction.colors;
  const cta = language === "zh" ? "开始探索" : "Explore the direction";
  const label = language === "zh" ? "由 Variant Design 导出的方向" : "Direction exported from Variant Design";

  return `<!doctype html>
<html lang="${language === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    :root { --ink:${ink}; --paper:${paper}; --accent:${accent}; --pop:${pop}; color:var(--ink); background:var(--paper); font-family:Inter,Arial,sans-serif; }
    * { box-sizing:border-box; } body { margin:0; min-height:100vh; }
    main { min-height:100vh; display:grid; grid-template-rows:auto 1fr auto; padding:clamp(1.25rem,4vw,4rem); }
    nav, footer { display:flex; justify-content:space-between; gap:1rem; font:700 .75rem/1.4 ui-monospace,monospace; text-transform:uppercase; letter-spacing:.08em; }
    section { max-width:76rem; align-self:center; padding-block:5rem; }
    h1 { max-width:12ch; margin:0; font-size:clamp(4rem,11vw,9rem); line-height:.88; letter-spacing:-.07em; }
    p { max-width:42rem; margin:2rem 0 0; font-size:clamp(1.1rem,2vw,1.5rem); line-height:1.55; }
    a { display:inline-block; margin-top:2rem; padding:1rem 1.25rem; color:var(--paper); background:var(--ink); border:2px solid var(--ink); box-shadow:.45rem .45rem 0 var(--accent); text-decoration:none; font-weight:800; }
    .mark { width:4rem; height:.75rem; background:var(--accent); } small { color:var(--accent); }
    @media (max-width:640px) { nav { flex-direction:column; } section { padding-block:3rem; } }
    @media (prefers-reduced-motion:reduce) { * { scroll-behavior:auto!important; } }
  </style>
</head>
<body>
  <main>
    <nav><span>${escapeHtml(direction.name)}</span><span>${label}</span></nav>
    <section><div class="mark"></div><h1>${title}</h1><p>${thesis}</p><a href="#brief">${cta}</a></section>
    <footer id="brief"><small>${escapeHtml(direction.sampleMeta)}</small><span>${safeBrief}</span></footer>
  </main>
</body>
</html>`;
}
