/**
 * Turns `ResumeData` into one self-contained, ATS-friendly HTML document. The
 * same string is shown in the /resume preview iframe and printed to PDF by
 * src/lib/resume-pdf.ts, so what you see is what gets downloaded.
 *
 * Layout choices that keep ATS parsers happy: a single column in reading
 * order, standard section names, plain text with no images, icons, tables or
 * text boxes, a standard font, and no letter-spacing (some extractors turn
 * spaced-out letters into "E X P E R I E N C E"). Everything is escaped, so
 * the markup is safe to drop into `srcDoc`.
 */
import type { ResumeData } from "@/lib/resume-data";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Escapes, then turns `**key phrase**` into bold, so the data can stress what matters. */
function fmt(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** Only http(s) links become clickable, whatever the data says. */
function link(text: string, href: string): string {
  return /^https?:\/\//i.test(href) ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text);
}

const CSS = `
@page { size: A4; margin: 12mm 14mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.32; }
@media screen { body { width: 794px; padding: 45px 53px; background: #fff; } }
a { color: #111; text-decoration: none; }
h1 { margin: 0; font-size: 20pt; line-height: 1.15; text-align: center; color: #0b4f8a; }
.headline { margin: 2px 0 0; text-align: center; font-size: 10.5pt; }
.contact { margin: 3px 0 0; text-align: center; font-size: 9.5pt; }
h2 { margin: 9px 0 4px; padding-bottom: 2px; border-bottom: 1.5px solid #0b4f8a; color: #0b4f8a; font-size: 10.5pt; text-transform: uppercase; }
p { margin: 0; }
.row { display: flex; justify-content: space-between; gap: 12px; }
.strong { font-weight: 700; }
.co { color: #0b4f8a; font-size: 10.5pt; }
.label { color: #0b4f8a; font-weight: 700; }
strong { font-weight: 700; color: #000; }
.dates { color: #333; }
.muted { color: #333; font-style: italic; }
.entry { margin-bottom: 5px; break-inside: avoid; }
.job { margin-bottom: 6px; }
.project { margin-top: 3px; break-inside: avoid; }
ul { margin: 2px 0 0; padding-left: 16px; }
li { margin: 1px 0; }
.skills p { margin: 1px 0; }
`;

function section(title: string, body: string): string {
  return body ? `<h2>${esc(title)}</h2>${body}` : "";
}

export function renderResumeHtml(data: ResumeData): string {
  const contact = [data.location, data.phone, data.email]
    .filter((part): part is string => Boolean(part))
    .map((part) => (part === data.email ? `<a href="mailto:${esc(part)}">${esc(part)}</a>` : esc(part)))
    .concat(data.links.map((l) => link(l.text, l.href)))
    .join(" | ");

  const summary = section("Summary", data.summary ? `<p>${fmt(data.summary)}</p>` : "");

  const skills = section(
    "Skills",
    data.skills.length
      ? `<div class="skills">${data.skills
          .map((s) => `<p><span class="label">${esc(s.label)}:</span> ${esc(s.items.join(", "))}</p>`)
          .join("")}</div>`
      : "",
  );

  const experience = section(
    "Experience",
    data.experience
      .map(
        (job) => `<div class="job">
<div class="row"><span class="strong co">${esc(job.company)}</span><span class="dates">${esc(job.start)} – ${esc(job.end)}</span></div>
<div class="row"><span class="muted">${esc(job.title)}</span>${job.location ? `<span>${esc(job.location)}</span>` : ""}</div>
${job.projects
  .map(
    (project) => `<div class="project">
${project.name ? `<p><span class="label">Project:</span> <span class="strong">${esc(project.name)}</span></p>` : ""}
<ul>${project.bullets.map((bullet) => `<li>${fmt(bullet)}</li>`).join("")}</ul>
${project.tech ? `<p><span class="label">Technologies:</span> ${esc(project.tech)}</p>` : ""}
</div>`,
  )
  .join("")}
</div>`,
      )
      .join(""),
  );

  const education = section(
    "Education",
    data.education
      .map(
        (item) => `<div class="entry">
<div class="row"><span class="strong">${esc(item.school)}</span><span class="dates">${esc(item.start)} – ${esc(item.end)}</span></div>
<div class="row"><span class="muted">${esc(item.degree)}</span>${item.note ? `<span>${esc(item.note)}</span>` : ""}</div>
</div>`,
      )
      .join(""),
  );

  const certifications = section(
    "Certifications",
    data.certifications
      .map(
        (cert) =>
          `<div class="row"><span><span class="strong">${esc(cert.name)}</span>, ${esc(cert.issuer)}</span>${cert.link ? `<span>${link(cert.link.text, cert.link.href)}</span>` : ""}</div>`,
      )
      .join(""),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(data.name)} - Resume</title>
<style>${CSS}</style>
</head>
<body>
<h1>${esc(data.name)}</h1>
<p class="headline">${esc(data.headline)}</p>
<p class="contact">${contact}</p>
${summary}${skills}${experience}${education}${certifications}
</body>
</html>`;
}
