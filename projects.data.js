// projects.data.js
// Single source of truth for the project list, shared by index.html and projects.html.
//
// Array order = priority order (best first). Do NOT sort by year — the order is the
// editorial decision, and re-sorting by date is what makes a portfolio read like a log.
//
// Fields:
//   id          stable slug. Also the DOM key; keep it kebab-case.
//   name        display name. Prose, not a repo slug — the slug lives in `repo`.
//   description one or two sentences. Sourced from the repo's own GitHub description
//               where one exists, trimmed for length. See NEEDS-DESCRIPTION below.
//   url         the live, clickable deployment. Omit when there isn't one.
//   repo        the GitHub URL. Omit only if there is no public repo.
//   shot        screenshot of the running app, relative to the site root. Presence of
//               this field is what promotes a card to the wide "showcase" treatment,
//               so only set it for things a visitor can actually open and use.
//   motion      an animated GIF of a real navigation flow through the app, recorded by
//               `npm run gifs` (see tools/demo-gif/). Shown in place of `shot`.
//               `shot` stays REQUIRED alongside it: it is the still fallback used when
//               the visitor prefers reduced motion and when the GIF fails to load.
//               Only add this where the motion says something a screenshot cannot —
//               a static page gains nothing from being animated.
//   shotPos     object-position for that screenshot. Cards crop hard, so this matters:
//               default 'top center' keeps a header/nav visible, which is right for a
//               dashboard, but an app whose content sits in the middle of the viewport
//               needs 'center' or the crop shows empty chrome. Omit for the default.
//   icon        absolute URL to the site's own favicon, shown next to the live link.
//               Omit when the site serves none — the UI then draws a coloured
//               initial-badge instead (see projectFavicon below). Each site owns its
//               own favicon; they are added per repo, not shared from the platform.
//   status      'live' for something you can open right now, which renders a dot and a
//               LIVE badge. OMIT IT OTHERWISE. There is deliberately no 'research'
//               label any more: the framing is full-stack engineering, and badging most
//               of the list RESEARCH buried that. Publications still show up where they
//               matter, in the description and tags (e.g. MSSL / MICCAI).
//   tier        'core' | 'flagship' | 'minor'  → groups the projects page.
//   featured    shown on the homepage grid.
//   tags        short tech labels.
//   year        last meaningful activity, for display only — never for ordering.
//   hue         0-360, seeds the badge fallback colour so cards stay distinguishable.
//
// Forks are deliberately excluded (tiler, transnet, CourseSelect,
// Machine-Learning-Study-Path-March-2019) — they are other people's work.

window.PROJECTS = [
  // ---------- Core: what a visitor should open first ----------
  {
    id: 'enterprise-resilience-agent',
    name: 'Enterprise Resilience Agent',
    description:
      'A multicloud resilience platform that detects failures early, explains likely causes, recommends safe remediation, and recovers through controlled, auditable runbooks. Full-stack monorepo: React front end, a TypeScript API, PostgreSQL and Redis, with type contracts shared end to end.',
    url: 'https://era-api.rudanxiao.com/',
    repo: 'https://github.com/medxiaorudan/EnterpriseResilienceAgent',
    shot: 'img/projects/enterprise-resilience-agent.jpg',
    // Sidebar tour: Overview → Incidents → Approvals → Runbooks → Overview.
    motion: 'img/projects/enterprise-resilience-agent.gif',
    // No icon: /favicon.ico returns 200 but with content-type text/html — it's the
    // SPA index fallback, not an image. A status-only check passes it, a browser
    // does not. Badge fallback instead until the app ships a real icon.
    status: 'live', tier: 'core', featured: true,
    tags: ['TypeScript', 'React', 'Agentic AI', 'Multicloud'], year: 2026, hue: 190,
  },
  {
    id: 'smart-customer-service',
    name: 'Smart Customer Service',
    description:
      'A RAG-powered GenAI application: administrators securely manage company data, and users hold company-specific conversations, falling back to a base LLM when no data is available.',
    url: 'https://smart-customer-service.rudanxiao.com/',
    repo: 'https://github.com/medxiaorudan/SmartCustomerService',
    shot: 'img/projects/smart-customer-service.jpg',
    // The whole product in one pass: an admin logs in, points the app at three
    // hybridity.ai pages, the app ingests them, then a visitor asks Hybridity AB's
    // assistant a question and gets an answer grounded in what was just ingested.
    // Showing the ingest is the point — a chat-only clip could be any chatbot.
    // `Hybridity AB` is a real company on the live instance, so this is reproducible
    // rather than staged. See CLAUDE.md for the credential handling and the caveats.
    motion: 'img/projects/smart-customer-service.gif',
    shotPos: 'center',
    // Served by the platform, not by the app: the CloudFront router rewrites any
    // /favicon.ico to /_icons/<app-id>.svg in the rudanxiao-apps bucket, where
    // smart-customer-service.svg is a generated per-app monogram. So this needs nothing
    // from the Next.js app or the box it runs on. It used to 404 because that object
    // did not exist yet; it was added 2026-07-28.
    icon: 'https://smart-customer-service.rudanxiao.com/favicon.ico',
    status: 'live', tier: 'core', featured: true,
    tags: ['Python', 'React', 'RAG', 'DeepSeek'], year: 2026, hue: 265,
  },
  {
    id: 'mammoscreen',
    name: 'MammoScreen',
    description:
      'Review and label mammography images, including DICOM. Runs entirely in the browser, so images never leave your device.',
    url: 'https://mammoscreen.rudanxiao.com/',
    repo: 'https://github.com/medxiaorudan/MammoScreen',
    shot: 'img/projects/mammoscreen.jpg',
    // Load synthetic images, then label them with the keyboard shortcuts. Worth
    // animating because "runs entirely in the browser" is a claim about behaviour, and
    // the demo shows files being opened and labelled with no network round trip.
    motion: 'img/projects/mammoscreen.gif',
    shotPos: 'center',
    // The only real favicon in the list so far. It was briefly broken — malformed XML
    // from a double hyphen inside an XML comment, which served a clean 200 but would
    // not decode — fixed at source and redeployed 2026-07-28.
    icon: 'https://mammoscreen.rudanxiao.com/favicon.svg',
    status: 'live', tier: 'core', featured: true,
    tags: ['TypeScript', 'DICOM', 'Medical Imaging', 'Browser-only'], year: 2023, hue: 330,
  },
  {
    id: 'mssl',
    name: 'MSSL',
    description:
      'PyTorch model for vascular segmentation and classification from limited data, combining semi-supervised and supervised training for resource-efficient auto-segmentation. Published at MICCAI.',
    repo: 'https://github.com/medxiaorudan/MSSL',
    tier: 'core', featured: true,
    tags: ['PyTorch', 'Semi-supervised', 'Medical AI', 'MICCAI'], year: 2023, hue: 150,
  },
  {
    id: 'rcc-vascular-morph-classify',
    name: 'RCC Vascular Morphology',
    description:
      'Kidney cancer classification that uniquely leverages vascular network properties for RCC identification. Python for ML, MATLAB for advanced feature extraction.',
    repo: 'https://github.com/medxiaorudan/RCC-VascularMorphClassify',
    tier: 'core', featured: true,
    tags: ['MATLAB', 'Python', 'Deep Learning', 'Oncology'], year: 2023, hue: 285,
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    description:
      'Prompt engineering with LangChain plus fine-tuning of CodeLlama to generate task-specific C++ snippets, validated by unit tests for correctness.',
    repo: 'https://github.com/medxiaorudan/CodeGeneration',
    tier: 'core', featured: true,
    tags: ['C++', 'CodeLlama', 'LangChain', 'Fine-tuning'], year: 2025, hue: 20,
  },

  // ---------- Selected work ----------
  {
    id: 'prior-art-discovery-agent',
    name: 'Prior Art Discovery Agent',
    description:
      'An agentic system that takes a patent number and returns a ranked list of candidate prior-art references, each with supporting evidence for how it maps to the patent\'s claims.',
    repo: 'https://github.com/medxiaorudan/PriorArtDiscoveryAgent',
    tier: 'flagship', featured: false,
    tags: ['Python', 'Agentic AI', 'Patents', 'Retrieval'], year: 2026, hue: 45,
  },
  {
    id: 'colorectal-cancer',
    name: 'Colorectal Cancer Risk',
    description:
      'An R Shiny front end for genetic risk assessment of colorectal cancer, analysing mutations from population cohort research to determine susceptibility and inform targeted drug selection.',
    repo: 'https://github.com/medxiaorudan/ColorectalCancer',
    tier: 'flagship', featured: false,
    tags: ['R Shiny', 'Genomics', 'Risk Assessment'], year: 2023, hue: 355,
  },
  {
    id: 'demand-forecasting-scm',
    name: 'Demand Forecasting (SCM)',
    description:
      'Time-series demand forecasting plus a RAG docs assistant for planners. Evaluates WAPE/MAPE and exposes a FastAPI endpoint with a p95 latency target and a CI eval gate.',
    repo: 'https://github.com/medxiaorudan/DemandForecasting-SCM',
    tier: 'flagship', featured: false,
    tags: ['Python', 'FastAPI', 'Time Series', 'RAG'], year: 2025, hue: 210,
  },
  {
    id: 'breast-mri-prep',
    name: 'Breast MRI Prep',
    description: 'A preprocessing pipeline for AI applications on breast MRI data.',
    repo: 'https://github.com/medxiaorudan/BreastMRIPrep',
    tier: 'flagship', featured: false,
    tags: ['Jupyter', 'MRI', 'Preprocessing'], year: 2025, hue: 305,
  },
  {
    id: 'gene-rank-detection',
    name: 'Gene Rank Detection',
    description:
      'Breast cancer detection and prediction, able to integrate multiple batches of gene expression data across multiple platforms.',
    repo: 'https://github.com/medxiaorudan/GeneRankDetection',
    tier: 'flagship', featured: false,
    tags: ['Perl', 'Gene Expression', 'Oncology'], year: 2023, hue: 95,
  },

  // ---------- Minor: hidden behind a disclosure on the projects page ----------
  // Kept in the data rather than deleted: they are real work, they just should not
  // compete for attention with the list above. See renderProjects('grid-minor').
  {
    id: 'llm-ner-multinerd',
    name: 'LLM NER on MultiNERD',
    description: 'An LLM fine-tuned for Named Entity Recognition on the MultiNERD dataset.',
    repo: 'https://github.com/medxiaorudan/LLM_NER_MultiNERD',
    tier: 'minor', featured: false,
    tags: ['Jupyter', 'NER', 'Fine-tuning'], year: 2024, hue: 240,
  },
  {
    id: 'nlp-emotional-scoring',
    name: 'NLP Emotional Scoring',
    description: 'Emotion prediction combining vector space models with an LSTM.',
    repo: 'https://github.com/medxiaorudan/NLP_AMMI_Emotional_Scoring',
    tier: 'minor', featured: false,
    tags: ['Jupyter', 'NLP', 'LSTM'], year: 2023, hue: 15,
  },
  {
    id: 'ai-scores-mammography',
    name: 'AI Scores in Mammography',
    description: 'Analysis of AI scores produced by the mammography exam.',
    repo: 'https://github.com/medxiaorudan/AI-scores-analysis-of-mammography',
    tier: 'minor', featured: false,
    tags: ['Jupyter', 'Mammography', 'Analysis'], year: 2023, hue: 170,
  },
  // NEEDS-DESCRIPTION: the four below have no description on GitHub. The text here is
  // deliberately minimal and states only what the repo name and primary language show —
  // nothing about method or result is inferred. Replace with real summaries.
  {
    id: 'cervical-cancer',
    name: 'Cervical Cancer',
    description: 'An R study on cervical cancer data.',
    repo: 'https://github.com/medxiaorudan/Cervical-Cancer',
    tier: 'minor', featured: false,
    tags: ['R'], year: 2023, hue: 320,
  },
  {
    id: 'type-diabetes',
    name: 'Type Diabetes',
    description: 'An R study on type-diabetes data.',
    repo: 'https://github.com/medxiaorudan/Type-Diabetes',
    tier: 'minor', featured: false,
    tags: ['R'], year: 2023, hue: 70,
  },
  {
    id: 'opencv-for-python-book',
    name: 'OpenCV for Python',
    description: 'Notebooks worked through alongside an OpenCV-for-Python book.',
    repo: 'https://github.com/medxiaorudan/OpenCV-for-Python-book',
    tier: 'minor', featured: false,
    tags: ['Jupyter', 'OpenCV'], year: 2019, hue: 120,
  },
  {
    id: 'restaurant-app',
    name: 'Restaurant App',
    description: 'A small restaurant application.',
    repo: 'https://github.com/medxiaorudan/RestaurantApp',
    tier: 'minor', featured: false,
    tags: ['App'], year: 2025, hue: 40,
  },
];

// ---------------------------------------------------------------------------
// Rendering helpers, shared by index.html and projects.html so both pages
// render identically. Kept here rather than in script.js on purpose: this file
// is ours and script.js is upstream's. That mattered more when we could not push
// at all; we are collaborators now, but Rudan still commits directly to
// index.html / style.css / script.js, so keeping our logic here still avoids
// needless conflicts. See CLAUDE.md.
// ---------------------------------------------------------------------------

// The little favicon shown next to a live link. Returns the site's own favicon as
// an <img>, falling back to a coloured initial-badge if `icon` is unset or the
// image fails to load. The fallback is still load-bearing — ERA serves its SPA
// index HTML from /favicon.ico, which passes a status check and fails to decode —
// so keep the onerror path even as individual sites gain real icons.
window.projectFavicon = function (p) {
  const letter = ((p.name || p.id).trim()[0] || '?').toUpperCase();
  const badge = function () {
    const s = document.createElement('span');
    s.className = 'lnk-fav lnk-fav--badge';
    s.style.setProperty('--fav-hue', p.hue != null ? p.hue : 200);
    s.textContent = letter;
    s.setAttribute('aria-hidden', 'true');
    return s;
  };
  if (!p.icon) return badge();
  const img = document.createElement('img');
  img.className = 'lnk-fav';
  img.src = p.icon;
  img.alt = '';
  img.loading = 'lazy';
  img.setAttribute('aria-hidden', 'true');
  img.onerror = function () { img.replaceWith(badge()); };
  return img;
};

// Build one project card. A card is a <div>, not an <a>: projects link to both a
// live site and a repo, and anchors cannot nest — so the links live in an explicit
// row at the bottom instead of wrapping the whole card.
window.projectCard = function (p) {
  const card = document.createElement('div');
  card.className = 'agent-card mini' + (p.shot ? ' showcase' : '');
  card.dataset.projectId = p.id;

  // Screenshot first, so a runnable app leads with what it looks like.
  if (p.shot) {
    const figure = document.createElement('a');
    figure.className = 'shot';
    figure.href = p.url || p.repo;
    figure.target = '_blank';
    figure.rel = 'noopener';
    // Hidden from assistive tech: the "Live site" link below points at the same
    // place, and a second link to one target is noise rather than help.
    figure.setAttribute('aria-hidden', 'true');
    figure.tabIndex = -1;
    const img = document.createElement('img');
    // Animate where there is an animation to show, but not for a visitor who has asked
    // the OS for less motion — for them the still screenshot is the whole point of
    // keeping `shot` around. An autoplaying GIF cannot be paused, so honouring the
    // preference means not sending it at all rather than pausing it later.
    const stillOnly =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    img.src = p.motion && !stillOnly ? p.motion : p.shot;
    // If the GIF is missing or corrupt, fall back to the screenshot rather than
    // leaving a broken image where the card's main visual should be.
    if (p.motion && !stillOnly) {
      img.onerror = function () {
        img.onerror = null;
        img.src = p.shot;
      };
    }
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (p.shotPos) img.style.objectPosition = p.shotPos;
    figure.append(img);
    card.append(figure);
  }

  const header = document.createElement('div');
  header.className = 'agent-header';
  // A status is the exception, not the rule: only genuinely live things get a dot
  // and a badge. Everything else shows a clean header (see the `status` note above).
  if (p.status === 'live') {
    const dot = document.createElement('span');
    dot.className = 'status-dot live';
    header.append(dot);
  }
  const name = document.createElement('span');
  name.className = 'agent-name';
  name.textContent = p.name;
  header.append(name);
  if (p.status === 'live') {
    const badge = document.createElement('span');
    badge.className = 'agent-badge badge-live';
    badge.textContent = 'LIVE';
    header.append(badge);
  }

  const desc = document.createElement('div');
  desc.className = 'agent-desc';
  desc.textContent = p.description;

  const tags = document.createElement('div');
  tags.className = 'agent-tags';
  (p.tags || []).forEach(function (t) {
    const s = document.createElement('span');
    s.className = 'tag';
    s.textContent = t;
    tags.append(s);
  });

  const links = document.createElement('div');
  links.className = 'agent-links';
  if (p.url) {
    const a = document.createElement('a');
    a.className = 'agent-link agent-link--live';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.append(window.projectFavicon(p));
    a.append(document.createTextNode('Live site'));
    links.append(a);
  }
  if (p.repo) {
    const a = document.createElement('a');
    a.className = 'agent-link agent-link--repo';
    a.href = p.repo;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Source';
    links.append(a);
  }
  const year = document.createElement('span');
  year.className = 'agent-year';
  year.textContent = p.year;
  links.append(year);

  if (p.shot) {
    // Showcase cards lay the screenshot and the text side by side on wide screens,
    // so the text needs its own flex column to keep the link row bottom-aligned.
    const body = document.createElement('div');
    body.className = 'card-body';
    body.append(header, desc, tags, links);
    card.append(body);
  } else {
    card.append(header, desc, tags, links);
  }
  return card;
};

// Render every project matching `filter` into the element with id `containerId`.
// No-ops when the container is absent, so both pages can share one call site.
window.renderProjects = function (containerId, filter) {
  const host = document.getElementById(containerId);
  if (!host) return 0;
  const list = window.PROJECTS.filter(filter || function () { return true; });
  host.textContent = '';
  list.forEach(function (p) { host.append(window.projectCard(p)); });
  return list.length;
};
