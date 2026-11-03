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
] as const;

export type NotebookSlug = (typeof NOTEBOOKS)[number]["slug"];

export function findNotebook(slug: string) {
  return NOTEBOOKS.find((notebook) => notebook.slug === slug);
}
