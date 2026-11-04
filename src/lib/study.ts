// Catalog of the study notebooks in content/study/. Shared by the /study index
// page and the PDF route handler — the slug is also the file name, and the
// route only ever serves slugs listed here (no user input reaches the file
// system path).
export const NOTEBOOKS = [
  {
    slug: "html-css",
    title: "HTML & CSS",
    blurb: "Semantic HTML, forms, accessibility, the cascade, box model, flexbox, grid, responsive and modern CSS.",
  },
  {
    slug: "javascript",
    title: "JavaScript",
    blurb: "Core language, closures, this, prototypes, async, the event loop, plus 42 spoken-style interview answers.",
  },
  {
    slug: "react",
    title: "React",
    blurb: "Rendering model, JSX, state, hooks, effects, context, performance, routing and React 19.",
  },
  {
    slug: "system-design",
    title: "System Design",
    blurb: "Sharding, caching, SQL vs NoSQL, CAP, Kafka and Zookeeper, case studies (Uber, Messenger, typeahead) and microservices.",
  },
  {
    slug: "nodejs",
    title: "Node.js, Express & MongoDB",
    blurb: "Event loop, modules, streams, Express middleware, auth, Mongoose, scaling, and interview Q&A.",
  },
  {
    slug: "frontend-perf-security",
    title: "Frontend Performance, Browser & Security",
    blurb: "Rendering pipeline, Core Web Vitals, bundles and runtime speed, caching, real time and offline, XSS/CSRF/CORS, accessibility, and senior architecture questions.",
  },
  {
    slug: "machine-coding",
    title: "Machine Coding & Frontend LLD",
    blurb: "Build-it-yourself rounds: autocomplete, infinite scroll, multi-step form, file upload, Kanban, modal and toast, data grid, comments, live chat, with the approach and edge cases.",
  },
  {
    slug: "behavioral",
    title: "Behavioral & Leadership",
    blurb: "STAR answers and fill-in-the-blank templates for deadlines, incidents, conflict, mentoring, decisions and failure, plus a story-bank worksheet.",
  },
  {
    slug: "database-sql",
    title: "Database & SQL",
    blurb: "DBMS, ER model, keys, SQL from DDL to window functions, normalisation, indexing and EXPLAIN, transactions and isolation, replication, sharding, CAP, NoSQL, and classic SQL interview problems.",
  },
  {
    slug: "operating-systems",
    title: "Operating Systems",
    blurb: "Kernel and system calls, processes and threads, CPU scheduling, synchronisation and deadlock, paging and virtual memory, file systems and disk scheduling, and how it shows up in Node and containers.",
  },
] as const;

export type NotebookSlug = (typeof NOTEBOOKS)[number]["slug"];

export function findNotebook(slug: string) {
  return NOTEBOOKS.find((notebook) => notebook.slug === slug);
}
