const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isSafeUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("#");

const formatInline = (value: string) => {
  const escaped = escapeHtml(value);
  const codeSnippets: string[] = [];

  const withCodePlaceholders = escaped.replace(/`([^`]+)`/g, (_match, code) => {
    const index = codeSnippets.length;
    codeSnippets.push(`<code class="rounded bg-slate-100 px-1 py-0.5 text-[13px] text-slate-800">${code}</code>`);
    return `{{CODE_${index}}}`;
  });

  const withLinks = withCodePlaceholders.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
    const safeHref = isSafeUrl(href) ? href : "#";
    const target = safeHref.startsWith("http") ? ' target="_blank" rel="noreferrer"' : "";
    return `<a class="text-blue-600 underline underline-offset-4" href="${safeHref}"${target}>${text}</a>`;
  });

  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return codeSnippets.reduce(
    (acc, snippet, index) => acc.replace(new RegExp(`\\{\\{CODE_${index}\\}\\}`, "g"), snippet),
    withItalic
  );
};

export const renderMarkdownToHtml = (value: string) => {
  if (!value) return "";
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const fenceStart = i;
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i += 1;
      } else {
        i = fenceStart + 1;
      }
      const code = escapeHtml(codeLines.join("\n"));
      blocks.push(
        `<pre class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 overflow-x-auto"><code>${code}</code></pre>`
      );
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = formatInline(headingMatch[2].trim());
      const headingClass =
        level === 1
          ? "text-2xl font-semibold text-slate-900"
          : level === 2
            ? "text-xl font-semibold text-slate-900"
            : "text-lg font-semibold text-slate-900";
      blocks.push(`<h${level} class="${headingClass}">${text}</h${level}>`);
      i += 1;
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        const item = lines[i].trim().slice(2);
        items.push(`<li class="text-slate-600">${formatInline(item)}</li>`);
        i += 1;
      }
      blocks.push(`<ul class="space-y-2 pl-5 list-disc">${items.join("")}</ul>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].match(/^(#{1,3})\s+/) &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ")
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    const paragraph = formatInline(paragraphLines.join(" "));
    blocks.push(`<p class="text-slate-600 leading-relaxed">${paragraph}</p>`);
  }

  return blocks.join("\n");
};
