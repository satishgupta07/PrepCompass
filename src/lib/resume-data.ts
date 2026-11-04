/**
 * The resume shown at /resume (admin only) and exported by /resume/pdf. It is
 * plain data in this file on purpose: there is no in-app editor, so to change
 * the resume you edit it here and the page, the preview and the PDF all follow
 * (see `renderResumeHtml` in src/lib/resume-html.ts for the layout).
 *
 * Writing for ATS parsers: one column, standard section names, real text (no
 * images or icons), dates as "Mon YYYY", one fact per bullet that starts with
 * a verb. Add real numbers (users, %, time saved) to bullets wherever you
 * truthfully have them: this resume currently has none, which is its biggest
 * gap compared with strong resumes.
 */

export type ResumeLink = { label: string; text: string; href: string };

export type ResumeProject = {
  /** Project name; leave out for a role that has no named project. */
  name?: string;
  bullets: string[];
  /** Printed as "Technologies: …" under the bullets. */
  tech?: string;
};

export type ResumeData = {
  name: string;
  headline: string;
  location?: string;
  phone: string;
  email: string;
  links: ResumeLink[];
  summary: string;
  skills: { label: string; items: string[] }[];
  /** Newest first. Each role lists its projects, like a consulting-style resume. */
  experience: {
    company: string;
    title: string;
    location?: string;
    start: string;
    end: string;
    projects: ResumeProject[];
  }[];
  education: { school: string; degree: string; start: string; end: string; note?: string }[];
  certifications: { name: string; issuer: string; link?: { text: string; href: string } }[];
};

export const RESUME: ResumeData = {
  name: "Satish Kumar",
  headline: "Full-Stack Developer | JavaScript, React, Node.js",
  // location: "City, State, India",   // add a city: recruiters and ATS filters often search by location
  phone: "+91 8570045570",
  email: "satishgupta.cse01@gmail.com",
  links: [
    { label: "LinkedIn", text: "linkedin.com/in/satishgupta007", href: "https://www.linkedin.com/in/satishgupta007" },
    { label: "GitHub", text: "github.com/satishgupta07", href: "https://github.com/satishgupta07" },
  ],
  summary:
    "**Full-stack developer** with **6+ years of experience** (Oct 2020 to present) building web applications with **JavaScript, " +
    "TypeScript, React and Node.js**. Currently a **Senior Associate Consultant at Infosys**, building **React and TypeScript billing and payments applications** on a shared design system; earlier delivered rapid-application-development projects at " +
    "Nagarro. Familiar with AWS, Jenkins and **AI-assisted development** (Claude, GenAI, agentic AI), and a **Claude Certified " +
    "Architect (Foundations)**.",
  skills: [
    { label: "Languages and Core Skills", items: ["JavaScript", "TypeScript", "Java", "Python", "HTML5", "CSS3", "Problem solving", "System design basics (HLD)"] },
    { label: "Frontend", items: ["React", "JSX", "Redux", "Context API", "Next.js", "Tailwind CSS", "Responsive design", "Design systems", "UI prototyping", "Storybook"] },
    { label: "Backend and Databases", items: ["Node.js", "Express.js", "REST APIs", "Java back-end integration", "ASP.NET API integration", "JWT authentication", "MySQL", "Microsoft SQL Server", "MongoDB"] },
    {
      label: "Testing and Tools",
      items: ["Unit testing", "Integration testing", "Jest", "Vitest", "React Testing Library", "Postman", "Git", "Jira", "IntelliJ IDEA", "VS Code", "Agile (Scrum)"],
    },
    { label: "Cloud, CI/CD and AI", items: ["AWS (basics)", "Jenkins", "Claude", "AI-assisted code review", "GenAI", "Agentic AI"] },
  ],
  experience: [
    {
      company: "Infosys",
      title: "Senior Associate Consultant",
      start: "Jun 2024",
      end: "Present",
      projects: [
        {
          name: "Payments UI (customer payments web application)",
          bullets: [
            "Primary contributor (**1,000+ commits**) to a **React and TypeScript** payments application covering make-payment, saved payment methods, add, edit and remove card and bank accounts, and auto-pay setup and cancellation.",
            "**Migrated the application from the legacy UI 7 template library to UI 8 (React)**, rebuilding its pages on the shared design system and upgrading it as the library evolved.",
            "Built the **card-number input, date picker, payment-method tabs and statement-selection page**, plus alerts, modals and session keep-alive prompts, as reusable components.",
            "Wrote the **statement-selection logic**: selecting statements, choosing total balance, past due or a custom amount for each, a running total, field validation and submission to the back end.",
            "Implemented **add-card form validation** (card-type detection, CVV, country-based ZIP checks, inline error messages) with client-side encryption of card data before submission.",
            "Integrated the **Trustly bank-linking widget** and OTP-based sign-in flows, and **integrated the UI with the Java back end** over REST APIs, handling backend redirects and error states with dedicated error pages.",
            "Created **JSON-driven prototype versions** of pages (expired and expiring cards, discount alerts, error states) so design and QA could review every state before backend integration.",
            "Wrote **unit and integration tests** with Jest and React Testing Library, added Storybook stories, fixed Sonar findings and fixed mobile and iPad layout issues.",
          ],
          tech: "React, TypeScript, JSX, JavaScript, HTML, CSS, Storybook, Jest, React Testing Library, REST APIs, Java back-end integration",
        },
        {
          name: "MyBill UI (customer billing web application)",
          bullets: [
            "**Migrated the legacy MyBill application** (HTML, JavaScript, Sass, Grunt) to a **new React and TypeScript application** to improve customer engagement, building the **bill summary, bill delivery options (paperless), bill messages and transaction history** pages and limited-access states for secondary users.",
            "Introduced a **design-token system** and consolidated custom CSS into one stylesheet, replacing hard-coded values so the app can switch brand themes without rewrites.",
            "Added a configurable promotional card, Storybook stories and **prototype versions** for primary and secondary user scenarios.",
          ],
          tech: "React, TypeScript, JSX, JavaScript, HTML, CSS, Storybook, Jest, React Testing Library, Java back-end integration",
        },
      ],
    },
    {
      company: "Freelance",
      title: "Full-Stack Developer",
      start: "Dec 2023",
      end: "May 2024",
      projects: [
        {
          bullets: [
            "Worked independently on client projects: built the **frontend in React** for **ZenGX**, a **learning management system (LMS)**, and a **full-stack billing software** application with **React and Node.js**.",
          ],
          tech: "React, Node.js, JavaScript, HTML, CSS",
        },
      ],
    },
    {
      company: "Nagarro",
      title: "Software Engineer",
      start: "Oct 2020",
      end: "Nov 2023",
      projects: [
        {
          name: "Rapid application development on Simplifier",
          bullets: [
            "Led **rapid-application-development projects** on Simplifier with JavaScript and SQL, streamlining data management.",
            "Developed **webcam-based QR-code scanning** and a **drag-and-drop ticket management** feature.",
            "Led research and prototyping of **Twilio, Google Maps and OCR integrations** to extend application capabilities.",
            "Reproduced and diagnosed Jira-reported defects, found root causes and shipped fixes with the team.",
          ],
          tech: "Simplifier (low-code platform), JavaScript, SQL",
        },
        {
          name: "Demand Tool",
          bullets: [
            "Built **reusable components and front-end libraries** with React and CSS, and revamped the UI of the whole application with a **responsive design**.",
            "Created a **ticketing tool** for monitoring the manufacturing of engines, and collaborated with the client and back-end developers on requirements.",
          ],
          tech: "React, HTML, CSS, JavaScript, Node.js",
        },
        {
          name: "ATRG (machine management application, Rolls-Royce Power Systems)",
          bullets: [
            "Built a **responsive, high-concurrency** React web application for managing machines, organised into **multiple modules** and handling large volumes of data.",
            "Implemented **data processing and formula-based calculations** across modules, backed by **Microsoft SQL Server**, and **integrated the React front end with ASP.NET APIs**.",
            "Designed **complex XML structures** and generated the **XML files** that are used to scan and check the configuration of each machine.",
            "Built **UI component libraries** and took part in user-experience design and architecture initiatives.",
          ],
          tech: "React, HTML, CSS, SQL (Microsoft SQL Server), API integration (ASP.NET)",
        },
      ],
    },
  ],
  education: [
    {
      school: "University Institute of Engineering and Technology (UIET), M.D. University, Rohtak",
      degree: "B.Tech, Computer Science",
      start: "2016",
      end: "2020",
      note: "Percentage: 72%",
    },
  ],
  certifications: [
    {
      name: "Claude Certified Architect - Foundations",
      issuer: "Anthropic",
      link: {
        text: "credly.com/badges/fc07c784-722e-4498-991c-bf6404090bc4",
        href: "https://www.credly.com/badges/fc07c784-722e-4498-991c-bf6404090bc4",
      },
    },
  ],
};
