-- Consolidates the workshop/event catalog into a single database table.
-- This supersedes:
--   - the static src/app/workshop/workshopData.js / src/app/events/eventsData.js
--     files (deleted — the database is now the only source of truth), and
--   - the two-table catalog_overrides / catalog_identity split from
--     migrations 0007/0008 (merged back into one table for simplicity).
-- `contacts` is new: a list of { name, role, phone } for on-ground contacts
-- per workshop/event, editable from /admin's Catalog tab.
-- `sort_order` preserves the original display order within each kind
-- (previously implicit in the static array's element order).
create table if not exists public.catalog_items (
  id text primary key,
  kind text not null check (kind in ('workshop', 'event')),
  sort_order integer not null default 0,

  title text not null,
  subtitle text,
  type text,
  section text,
  section_color text,
  duration integer,
  seats integer,
  eligibility text default '',
  venue text default '',
  timing text default '',
  image text,
  badge_icon text,
  accent_color text,
  glow_color text,
  foil_gradient text,
  description text,
  about_extra jsonb not null default '[]',
  highlights jsonb not null default '[]',
  requirements jsonb not null default '[]',
  format text,
  certificate text,
  tags jsonb not null default '[]',
  brochure_url text default '',
  layout jsonb not null default '{}',
  contacts jsonb not null default '[]',

  -- Payment-critical fields. Never touched by the general content editor.
  price text not null,
  ticket_id integer not null,

  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.catalog_items enable row level security;

drop policy if exists "Public can view catalog items" on public.catalog_items;
create policy "Public can view catalog items"
  on public.catalog_items for select
  using (true);

-- No insert/update/delete policy for anon/authenticated: writes only happen
-- server-side via the service-role key in /api/admin/catalog routes.

insert into public.catalog_items (
  id, kind, sort_order,
  title, subtitle, type,
  section, section_color,
  duration, seats,
  eligibility, venue, timing,
  image, badge_icon,
  accent_color, glow_color, foil_gradient,
  description,
  about_extra, highlights, requirements,
  format, certificate, tags,
  brochure_url, layout, contacts,
  price, ticket_id
) values
  (
    'rocket', 'workshop', 0,
    'Advanced Rocketry Workshop', 'Engineering the Future Through Time', 'Rocketry',
    'Pre-Conscientia', '#33d6ff',
    3, 120,
    '', '', '',
    'https://picsum.photos/seed/rocket/800/600', '🚀',
    '#33d6ff', 'rgba(51,214,255,.5)', 'linear-gradient(135deg,#0b1c2f,#123f5d,#081019)',
    'Explore propulsion, aerodynamics, guidance systems and launch simulations.',
    '["Teams design, build, and static-test a small solid-fuel rocket across the three days, culminating in a live launch and recovery attempt.", "Mentored by IIST faculty and alumni who''ve worked on real launch vehicle programs."]'::jsonb, '["Propulsion fundamentals and solid/liquid fuel tradeoffs", "Aerodynamic stability and fin design", "Flight computer setup and telemetry", "Static motor testing on the launch stand", "Full launch-day simulation and recovery"]'::jsonb, '["Basic physics background helpful, not required", "Closed-toe shoes for the workshop floor", "Enthusiasm for hands-on building"]'::jsonb,
    'In-Person', 'Included', '["Rocketry", "Hands-on", "IIST", "Workshop"]'::jsonb,
    '', '{"top": "130vh", "left": "43%", "width": "clamp(270px, 72vw, 500px)"}'::jsonb, '[]'::jsonb,
    '₹2,499', 3043
  ),
  (
    'ai-ml', 'workshop', 1,
    'AI & Machine Learning', 'Neural Networks & Deep Learning', 'AI/ML',
    'Pre-Conscientia', '#33d6ff',
    5, 80,
    '', '', '',
    'https://picsum.photos/seed/ai-ml/800/600', '🤖',
    '#a855f7', 'rgba(168,85,247,.5)', 'linear-gradient(135deg,#1a0b2e,#3b1d6e,#0d0520)',
    'Build intelligent systems with neural networks, transformers and generative AI models.',
    '["Five days moving from first-principles neural nets to training and fine-tuning transformer models on GPU clusters.", "Every participant leaves with a deployed model and a portfolio-ready project."]'::jsonb, '["Neural network fundamentals from scratch", "Transformer architecture and attention", "Fine-tuning pretrained language models", "Prompt engineering and evaluation", "Deploying a model behind a live API"]'::jsonb, '["Comfortable writing Python", "Laptop with 8GB+ RAM", "Basic linear algebra recommended"]'::jsonb,
    'In-Person + Online', 'Included', '["AI", "Python", "Deep Learning", "GPU"]'::jsonb,
    '', '{"top": "175vh", "right": "10%", "width": "clamp(270px, 72vw, 450px)"}'::jsonb, '[]'::jsonb,
    '₹3,999', 3043
  ),
  (
    'cybersec', 'workshop', 2,
    'Cybersecurity Bootcamp', 'Defend the Digital Frontier', 'Security',
    'Pre-Conscientia', '#33d6ff',
    4, 60,
    '', '', '',
    'https://picsum.photos/seed/cybersec/800/600', '🛡️',
    '#22c55e', 'rgba(34,197,94,.5)', 'linear-gradient(135deg,#0a1f12,#1a4a2e,#061208)',
    'Master penetration testing, cryptography, network defense and incident response.',
    '["Four days of red-team/blue-team exercises in an isolated lab range built specifically for this bootcamp.", "Wraps up with a live CTF where teams attack and defend real infrastructure."]'::jsonb, '["Penetration testing methodology (recon to report)", "Cryptography fundamentals and common pitfalls", "Network defense and intrusion detection", "Incident response playbooks", "Live capture-the-flag finale"]'::jsonb, '["Comfortable with the Linux command line", "Own laptop capable of running a VM", "No prior security experience required"]'::jsonb,
    'In-Person', 'Included', '["CyberSec", "CTF", "Ethical Hacking", "Linux"]'::jsonb,
    '', '{"top": "220vh", "left": "35%", "width": "clamp(270px, 72vw, 480px)"}'::jsonb, '[]'::jsonb,
    '₹3,499', 3043
  ),
  (
    'robotics', 'workshop', 3,
    'Robotics & Automation', 'Machines That Think and Act', 'Robotics',
    'Pre-Conscientia', '#33d6ff',
    6, 50,
    '', '', '',
    'https://picsum.photos/seed/robotics/800/600', '🤖',
    '#f97316', 'rgba(249,115,22,.5)', 'linear-gradient(135deg,#1a0f05,#3d2410,#0d0703)',
    'Design, build and program autonomous robots with sensors, actuators and AI control.',
    '["Six days building a fully autonomous robot from bare chassis to working sensor fusion and control loop.", "Ends with a live obstacle-course challenge between teams."]'::jsonb, '["Sensor integration (ultrasonic, IMU, vision)", "Motor control and PID tuning", "ROS-based software architecture", "Autonomous navigation and obstacle avoidance", "Team obstacle-course competition"]'::jsonb, '["Basic electronics knowledge helpful", "Some programming experience (any language)", "Laptop for flashing firmware"]'::jsonb,
    'In-Person', 'Included', '["Robotics", "Arduino", "ROS", "Mechatronics"]'::jsonb,
    '', '{"top": "265vh", "right": "45%", "width": "clamp(270px, 72vw, 520px)"}'::jsonb, '[]'::jsonb,
    '₹4,499', 3043
  ),
  (
    'quantum', 'workshop', 4,
    'Quantum Computing Lab', 'Beyond Classical Computation', 'Quantum',
    'Pre-Conscientia', '#33d6ff',
    3, 40,
    '', '', '',
    'https://picsum.photos/seed/quantum/800/600', '⚛️',
    '#ec4899', 'rgba(236,72,153,.5)', 'linear-gradient(135deg,#1a0515,#3d1030,#0d0310)',
    'Explore qubits, quantum gates, entanglement and run algorithms on real quantum hardware.',
    '["Three intensive days covering quantum computing theory alongside hands-on coding with Qiskit.", "Culminates in running a real algorithm on cloud quantum hardware."]'::jsonb, '["Qubits, superposition and entanglement", "Quantum gates and circuit design", "Programming with Qiskit", "Grover''s and Shor''s algorithms, simplified", "Running circuits on real quantum hardware"]'::jsonb, '["Comfort with linear algebra and complex numbers", "Python experience recommended", "Curiosity about quantum mechanics"]'::jsonb,
    'In-Person + Online', 'Included', '["Quantum", "Qiskit", "Physics", "Research"]'::jsonb,
    '', '{"top": "310vh", "left": "10%", "width": "clamp(270px, 72vw, 460px)"}'::jsonb, '[]'::jsonb,
    '₹5,999', 3043
  ),
  (
    'data-science', 'workshop', 5,
    'Data Science & Analytics', 'Insights From Raw Information', 'Data Science',
    'Pre-Conscientia', '#33d6ff',
    4, 95,
    '', '', '',
    'https://picsum.photos/seed/data-science/800/600', '📊',
    '#6366f1', 'rgba(99,102,241,.5)', 'linear-gradient(135deg,#0f0a2e,#251d6e,#080520)',
    'Master statistical analysis, data visualization, and predictive modeling with real-world datasets.',
    '["Four days working end-to-end on real, messy datasets \u2014 from cleaning to a deployed predictive model.", "Includes a guided case study modeled on an actual industry problem."]'::jsonb, '["Data cleaning and exploratory analysis", "Statistical inference fundamentals", "Building visual dashboards", "Predictive modeling with scikit-learn", "Presenting insights to a non-technical audience"]'::jsonb, '["Basic Python or willingness to learn fast", "Laptop with Python 3 installed", "No prior statistics background required"]'::jsonb,
    'In-Person + Online', 'Included', '["Data Science", "Python", "SQL", "Analytics"]'::jsonb,
    '', '{"top": "352.5vh", "right": "50%", "width": "clamp(270px, 72vw, 470px)"}'::jsonb, '[]'::jsonb,
    '₹3,199', 3043
  ),
  (
    'cloud', 'workshop', 6,
    'Cloud & DevOps', 'Infrastructure at Scale', 'Cloud',
    'Pre-Conscientia', '#33d6ff',
    4, 75,
    '', '', '',
    'https://picsum.photos/seed/cloud/800/600', '☁️',
    '#0ea5e9', 'rgba(14,165,233,.5)', 'linear-gradient(135deg,#071a2f,#10405a,#040e18)',
    'Deploy, scale and manage applications on AWS, GCP and Azure with CI/CD pipelines.',
    '["Four days containerizing, deploying, and scaling a real application across cloud providers.", "Finishes with a working CI/CD pipeline you keep access to after the workshop."]'::jsonb, '["Docker fundamentals and image optimization", "Kubernetes orchestration basics", "CI/CD pipeline design", "Multi-cloud deployment (AWS, GCP, Azure)", "Monitoring and auto-scaling"]'::jsonb, '["Basic command-line comfort", "Free-tier cloud account (setup guide provided)", "Some backend development experience helpful"]'::jsonb,
    'In-Person + Online', 'Included', '["Cloud", "AWS", "Docker", "Kubernetes"]'::jsonb,
    '', '{"top": "395vh", "left": "30%", "width": "clamp(270px, 72vw, 480px)"}'::jsonb, '[]'::jsonb,
    '₹3,699', 3043
  ),
  (
    'aerospace', 'workshop', 7,
    'Aerospace Engineering', 'Designing Aircraft of Tomorrow', 'Aerospace',
    'Live-Conscientia', '#a855f7',
    4, 90,
    '', '', '',
    'https://picsum.photos/seed/aerospace/800/600', '✈️',
    '#06b6d4', 'rgba(6,182,212,.5)', 'linear-gradient(135deg,#071a1f,#103d4a,#040e12)',
    'Study aerodynamics, flight mechanics, structural design and wind tunnel testing.',
    '["Four days combining aerodynamics theory with real wind-tunnel testing on student-designed airfoils.", "Guided by working aerospace engineers from the industry."]'::jsonb, '["Aerodynamics and lift/drag fundamentals", "Flight mechanics and stability", "CAD modeling of an airfoil", "Wind tunnel testing session", "Structural load analysis basics"]'::jsonb, '["Basic physics background helpful", "Laptop with CAD software (provided if needed)", "Interest in aviation/aerospace"]'::jsonb,
    'In-Person', 'Included', '["Aerospace", "CFD", "CAD", "Simulation"]'::jsonb,
    '', '{"top": "470vh", "right": "20%", "width": "clamp(270px, 72vw, 490px)"}'::jsonb, '[]'::jsonb,
    '₹3,799', 3043
  ),
  (
    'blockchain', 'workshop', 8,
    'Blockchain Development', 'Decentralized Systems & Web3', 'Web3',
    'Live-Conscientia', '#a855f7',
    4, 70,
    '', '', '',
    'https://picsum.photos/seed/blockchain/800/600', '⛓️',
    '#eab308', 'rgba(234,179,8,.5)', 'linear-gradient(135deg,#1a1505,#3d3410,#0d0a03)',
    'Build smart contracts, DeFi protocols and decentralized applications on Ethereum and Solana.',
    '["Four days writing, testing, and deploying real smart contracts to a live testnet.", "Covers both the Ethereum (Solidity) and Solana (Rust) ecosystems."]'::jsonb, '["Smart contract fundamentals in Solidity", "DeFi protocol design patterns", "Testing and auditing basics", "Deploying to a live testnet", "Intro to Solana / Rust programs"]'::jsonb, '["Programming experience in any language", "Laptop with MetaMask or similar wallet", "Basic understanding of blockchain concepts helpful"]'::jsonb,
    'In-Person + Online', 'Included', '["Blockchain", "Solidity", "Web3", "Crypto"]'::jsonb,
    '', '{"top": "520vh", "left": "55%", "width": "clamp(270px, 72vw, 470px)"}'::jsonb, '[]'::jsonb,
    '₹3,299', 3043
  ),
  (
    'iot', 'workshop', 9,
    'Internet of Things Lab', 'Connected Devices & Edge Computing', 'IoT',
    'Live-Conscientia', '#a855f7',
    3, 55,
    '', '', '',
    'https://picsum.photos/seed/iot/800/600', '📡',
    '#14b8a6', 'rgba(20,184,166,.5)', 'linear-gradient(135deg,#071a17,#103d35,#040e0c)',
    'Design sensor networks, embedded systems and real-time data pipelines for smart environments.',
    '["Three days wiring up sensor networks and streaming their data into a live dashboard.", "Every team leaves with a working connected-device prototype."]'::jsonb, '["Sensor networks and embedded basics", "MQTT and real-time data pipelines", "Edge computing fundamentals", "Building a live sensor dashboard", "Power and connectivity tradeoffs"]'::jsonb, '["Basic electronics comfort", "Some programming experience", "Laptop for flashing microcontrollers"]'::jsonb,
    'In-Person', 'Included', '["IoT", "Arduino", "Sensors", "Edge"]'::jsonb,
    '', '{"top": "570vh", "right": "10%", "width": "clamp(270px, 72vw, 510px)"}'::jsonb, '[]'::jsonb,
    '₹2,999', 3043
  ),
  (
    'biotech', 'workshop', 10,
    'Biotech & Genomics', 'Code Meets Biology', 'Biotech',
    'Live-Conscientia', '#a855f7',
    5, 45,
    '', '', '',
    'https://picsum.photos/seed/biotech/800/600', '🧬',
    '#f43f5e', 'rgba(244,63,94,.5)', 'linear-gradient(135deg,#1a0510,#3d1028,#0d030a)',
    'Analyze genomic data, model protein structures and build bioinformatics pipelines.',
    '["Five days at the intersection of biology and code \u2014 from raw sequencing data to a working analysis pipeline.", "Guest sessions from working computational biology researchers."]'::jsonb, '["Genomic data formats and preprocessing", "Sequence alignment fundamentals", "Protein structure modeling basics", "Building a bioinformatics pipeline", "Interpreting results like a researcher"]'::jsonb, '["Basic Python helpful", "Interest in biology, no degree required", "Laptop with 8GB+ RAM"]'::jsonb,
    'In-Person + Online', 'Included', '["Biotech", "Genomics", "Python", "Research"]'::jsonb,
    '', '{"top": "615vh", "left": "45%", "width": "clamp(270px, 72vw, 480px)"}'::jsonb, '[]'::jsonb,
    '₹4,799', 3043
  ),
  (
    'code-combat', 'event', 0,
    'Code Combat', 'High-Stakes Competitive Programming', 'Competition',
    'Competitions', '#33d6ff',
    1, 200,
    '', '', '',
    'https://picsum.photos/seed/code-combat/800/600', '⚔️',
    '#33d6ff', 'rgba(51,214,255,.5)', 'linear-gradient(135deg,#0b1c2f,#123f5d,#081019)',
    'A high-intensity competitive programming arena where participants solve algorithmic challenges under pressure. Solo or team — survive the leaderboard.',
    '["A single-day, multi-round contest running on a live leaderboard \u2014 solve fast, climb ranks, and survive elimination rounds.", "Open to solo coders and teams of up to three."]'::jsonb, '["Timed algorithmic problem sets", "Live, public leaderboard", "Elimination-style final round", "Prizes for top individuals and teams"]'::jsonb, '["Laptop with your preferred IDE", "Comfort with at least one programming language", "A stable internet connection"]'::jsonb,
    'In-Person', 'Participation certificate for all entrants', '["Competition", "DSA", "Leaderboard"]'::jsonb,
    '', '{"top": "130vh", "left": "43%", "width": "clamp(270px, 72vw, 500px)"}'::jsonb, '[]'::jsonb,
    'Free Entry', 3047
  ),
  (
    'hackathon', 'event', 1,
    'Hackathon', '24-Hour Build Sprint', 'Build Sprint',
    'Competitions', '#33d6ff',
    1, 0,
    '', '', '',
    'https://picsum.photos/seed/hackathon/800/600', '💻',
    '#f59e0b', 'rgba(245,158,11,.5)', 'linear-gradient(135deg,#1a1005,#3d2a10,#0d0803)',
    'A marathon build sprint where cross-disciplinary teams prototype real-world solutions. Judged on impact, creativity, and technical execution.',
    '["24 straight hours to go from idea to working prototype, with mentors circulating throughout the night.", "Judged by a panel of industry engineers and founders."]'::jsonb, '["Mentor check-ins throughout the night", "Free food, drinks, and dev tools access", "Live pitch and demo finale", "Cash prizes and internship opportunities"]'::jsonb, '["Teams of 2\u20134 (solo entries allowed)", "Laptop and charger", "An idea, or willingness to team up on the spot"]'::jsonb,
    'In-Person', 'Participation certificate for all entrants', '["Hackathon", "Teams", "Build"]'::jsonb,
    '', '{"top": "175vh", "right": "10%", "width": "clamp(270px, 72vw, 450px)"}'::jsonb, '[]'::jsonb,
    'Free Entry', 3047
  ),
  (
    'robo-war', 'event', 2,
    'Robo War', 'Combat Robotics Arena', 'Robotics',
    'Competitions', '#33d6ff',
    1, 60,
    '', '', '',
    'https://picsum.photos/seed/robo-war/800/600', '🤖',
    '#ef4444', 'rgba(239,68,68,.5)', 'linear-gradient(135deg,#1a0505,#3d1010,#0d0303)',
    'Combat robotics arena — custom-built bots face off in elimination rounds. Categories include autonomous, remote-controlled, and mini-sumo.',
    '["Bring your own bot or build one on-site \u2014 elimination-format battles across three weight/category classes.", "Arena bouts are livestreamed to the main stage."]'::jsonb, '["Autonomous, RC, and mini-sumo categories", "Elimination bracket format", "On-site repair bay between bouts", "Livestreamed arena battles"]'::jsonb, '["Bot conforming to published weight/size rules", "Team of up to 4", "Safety inspection before first bout"]'::jsonb,
    'In-Person', 'Participation certificate for all entrants', '["Robotics", "Combat", "Elimination"]'::jsonb,
    '', '{"top": "220vh", "left": "35%", "width": "clamp(270px, 72vw, 480px)"}'::jsonb, '[]'::jsonb,
    '₹999', 3047
  ),
  (
    'tech-talks', 'event', 3,
    'Tech Talk Series', 'Keynotes From Industry Pioneers', 'Talks',
    'Showcase & Culture', '#a855f7',
    1, 500,
    '', '', '',
    'https://picsum.photos/seed/tech-talks/800/600', '🎤',
    '#a855f7', 'rgba(168,85,247,.5)', 'linear-gradient(135deg,#1a0b2e,#3b1d6e,#0d0520)',
    'Keynote sessions and panel discussions led by industry pioneers and researchers. Topics span AI, space systems, sustainability, and emerging tech.',
    '["A day of back-to-back keynotes and panels from people actually building the technologies being discussed.", "Q&A open floor after every session."]'::jsonb, '["Keynotes from industry pioneers", "Panel discussions with open Q&A", "Topics spanning AI, space, and sustainability", "Networking breaks between sessions"]'::jsonb, '["Open to all attendees", "No technical background required", "Seats are first-come, first-served"]'::jsonb,
    'In-Person', 'Attendance certificate on request', '["Talks", "Keynote", "Panel"]'::jsonb,
    '', '{"top": "265vh", "right": "45%", "width": "clamp(270px, 72vw, 520px)"}'::jsonb, '[]'::jsonb,
    'Free Entry', 3047
  ),
  (
    'innovation-expo', 'event', 4,
    'Innovation Expo', 'Project Exhibition & Demos', 'Exhibition',
    'Showcase & Culture', '#a855f7',
    1, 300,
    '', '', '',
    'https://picsum.photos/seed/innovation-expo/800/600', '🌟',
    '#10b981', 'rgba(16,185,129,.5)', 'linear-gradient(135deg,#051a10,#0f3d25,#030d08)',
    'Project exhibition where student teams showcase research prototypes, hardware builds, and proof-of-concept demos to a panel of judges and industry visitors.',
    '["Student teams set up live demo booths judged by a rotating panel of industry visitors throughout the day.", "Open to the public between judging rounds."]'::jsonb, '["Live demo booths", "Judging by industry professionals", "Open to public visitors", "Awards for top prototypes"]'::jsonb, '["Working or near-working prototype", "Team booth setup (table/power provided)", "One-page project summary for judges"]'::jsonb,
    'In-Person', 'Participation certificate for all exhibitors', '["Exhibition", "Research", "Demo"]'::jsonb,
    '', '{"top": "310vh", "left": "10%", "width": "clamp(270px, 72vw, 460px)"}'::jsonb, '[]'::jsonb,
    'Free Entry', 3047
  ),
  (
    'cultural-night', 'event', 5,
    'Cultural Night', 'Music, Dance & Performances', 'Cultural',
    'Showcase & Culture', '#a855f7',
    1, 800,
    '', '', '',
    'https://picsum.photos/seed/cultural-night/800/600', '🎭',
    '#ec4899', 'rgba(236,72,153,.5)', 'linear-gradient(135deg,#1a0515,#3d1030,#0d0310)',
    'An evening of music, dance, and performances that celebrate the creative spirit of the community. The perfect close to a day of high-energy competition.',
    '["Live performances from student groups and a headline act close out the fest under open skies.", "Free entry for all badge holders."]'::jsonb, '["Student music and dance performances", "Headline evening act", "Open-air stage setup", "Food stalls open throughout"]'::jsonb, '["Fest badge for entry", "Open to all attendees", "No registration needed"]'::jsonb,
    'In-Person', 'Not applicable', '["Cultural", "Music", "Dance"]'::jsonb,
    '', '{"top": "352.5vh", "right": "50%", "width": "clamp(270px, 72vw, 470px)"}'::jsonb, '[]'::jsonb,
    'Free Entry', 3047
  )
on conflict (id) do nothing;

-- Superseded by catalog_items above.
drop table if exists public.catalog_overrides;
drop table if exists public.catalog_identity;
