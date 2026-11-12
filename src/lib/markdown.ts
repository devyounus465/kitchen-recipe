const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])_(.+?)_/g, "$1<em>$2</em>")
    .replace(/\[(.+?)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\[(.+?)\]\((https?:\/\/[^)\s]*)\)/g, '<a href="$2" rel="nofollow noopener noreferrer" target="_blank">$1</a>');
}
/** Minimal, XSS-safe markdown: headings, paragraphs, ordered/unordered lists, quotes, bold, italic, links. */
export function renderMarkdown(md: string): string {
  const out: string[] = []; let list: "ol" | "ul" | null = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of md.split(/\n/)) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { close(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.*)/))) { close(); const h = m[1].length; out.push(`<h${h} id="${esc(m[2].toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">${inline(m[2])}</h${h}>`); continue; }
    if ((m = line.match(/^\d+\.\s+(.*)/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = line.match(/^[-*]\s+(.*)/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = line.match(/^>\s?(.*)/))) { close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    close(); out.push(`<p>${inline(line)}</p>`);
  }
  close(); return out.join("\n");
}
