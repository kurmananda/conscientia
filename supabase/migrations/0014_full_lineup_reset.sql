-- Wipes every existing event and workshop (catalog_items + tickets rows of
-- both kinds) and replaces them with exactly the requested lineup — nothing
-- from the previous event set (migration 0013) or any prior workshop set
-- survives. This is the sole source of truth for events/workshops; there is
-- no static fallback (see src/lib/catalogStore.js).
delete from public.catalog_items where kind in ('event', 'workshop');
delete from public.tickets where type in ('event', 'workshop');

insert into public.tickets (id, type, cost, ticket_id) values
  ('bgmi', 'event', '₹399', 3129),
  ('ff', 'event', '₹399', 3129),
  ('clashroyale', 'event', '₹99', 3132),
  ('gg', 'event', '₹99', 3132),
  ('cicada', 'event', '₹199', 3131),
  ('battleofbots', 'event', '₹1799', 3133),
  ('dronetrix', 'event', '₹799', 3134),
  ('rcrallycross', 'event', '₹699', 3126),
  ('hackorbitalteam', 'event', '₹1799', 3133),
  ('hackorbitalindividual', 'event', '₹349', 3135),
  ('cansat', 'event', '₹999', 3138),
  ('robosoccer', 'event', '₹699', 3126),
  ('rcplane', 'event', '₹699', 3126),
  ('amphibot', 'event', '₹699', 3126),
  ('quantasiateam', 'event', '₹1499', 3139),
  ('quantasiaindividual', 'event', '₹399', 3129),
  ('linefollower', 'event', '₹499', 3128),
  ('mazesolver', 'event', '₹499', 3128),
  ('codeclash', 'event', '₹299', 3130),
  ('arduinohackathon', 'event', '₹399', 3129),
  ('circuiter', 'event', '₹399', 3129),
  ('thrilltopia', 'event', '₹99', 3132),
  ('counterpoint', 'event', '₹299', 3130),
  ('conscientiafootballcup', 'event', '₹599', 3127),
  ('mocksharktank', 'event', '₹249', 3136),
  ('cricketauction', 'event', '₹199', 3131),
  ('xenohabitatdesign', 'event', '₹199', 3131),
  ('intbee', 'event', '₹199', 3131),
  ('generalquiz', 'event', '₹199', 3131),
  ('spacequiz', 'event', '₹99', 3132),
  ('hammertime', 'event', '₹99', 3132),
  ('ahogwartsmystery', 'event', '₹299', 3130),
  ('escapetheupsidedown', 'event', '₹125', 3137),
  ('astronomy_pc', 'workshop', '₹99', 3140),
  ('astroph_pc', 'workshop', '₹199', 3141),
  ('cubesat_pc', 'workshop', '₹199', 3144),
  ('3dcad_pc', 'workshop', '₹299', 3142),
  ('mun_pc', 'workshop', '₹399', 3143),
  ('aero_pc', 'workshop', '₹549', 3145),
  ('quant0to1', 'workshop', '₹599', 3146),
  ('robo_pc', 'workshop', '₹1399', 3147),
  ('rocketry_pc', 'workshop', '₹1499', 3148),
  ('mod_rocketry', 'workshop', '₹1499', 3149),
  ('adv_rocketry', 'workshop', '₹1649', 3150);

insert into public.catalog_items (
  id, kind, sort_order, title, subtitle, type, section, section_color, description
) values
  ('bgmi', 'event', 0, 'BGMI', 'Conscientia 2026', 'BGMI', 'Events', '#a855f7', 'Squad up and battle it out in BGMI at Conscientia 2026.'),
  ('ff', 'event', 1, 'Free Fire', 'Conscientia 2026', 'Free Fire', 'Events', '#a855f7', 'Battle royale action in Free Fire at Conscientia 2026.'),
  ('clashroyale', 'event', 2, 'Clash Royale', 'Conscientia 2026', 'Clash Royale', 'Events', '#a855f7', 'Deck out and duel in Clash Royale at Conscientia 2026.'),
  ('gg', 'event', 3, 'GG', 'Conscientia 2026', 'GG', 'Events', '#a855f7', 'Gaming showdown at Conscientia 2026.'),
  ('cicada', 'event', 4, 'Cicada', 'Conscientia 2026', 'Cicada', 'Events', '#a855f7', 'Crack the code in Cicada, Conscientia''s puzzle-hunt challenge.'),
  ('battleofbots', 'event', 5, 'Battle of Bots', 'Conscientia 2026', 'Battle of Bots', 'Events', '#a855f7', 'Bring your bot and battle it out on the arena floor.'),
  ('dronetrix', 'event', 6, 'Dronetrix', 'Conscientia 2026', 'Dronetrix', 'Events', '#a855f7', 'Pilot your drone through the Dronetrix obstacle course.'),
  ('rcrallycross', 'event', 7, 'RC Rally Cross', 'Conscientia 2026', 'RC Rally Cross', 'Events', '#a855f7', 'Race your RC car through the rally cross circuit.'),
  ('hackorbitalteam', 'event', 8, 'Hack Orbital (Team)', 'Conscientia 2026', 'Hack Orbital', 'Events', '#a855f7', 'Team hackathon — build and ship in Hack Orbital.'),
  ('hackorbitalindividual', 'event', 9, 'Hack Orbital (Individual)', 'Conscientia 2026', 'Hack Orbital', 'Events', '#a855f7', 'Solo hackathon track of Hack Orbital.'),
  ('cansat', 'event', 10, 'CanSat', 'Conscientia 2026', 'CanSat', 'Events', '#a855f7', 'Design and fly a can-sized satellite in CanSat.'),
  ('robosoccer', 'event', 11, 'Robo Soccer', 'Conscientia 2026', 'Robo Soccer', 'Events', '#a855f7', 'Build a bot and compete in robotic soccer.'),
  ('rcplane', 'event', 12, 'RC Plane', 'Conscientia 2026', 'RC Plane', 'Events', '#a855f7', 'Fly your RC plane in this aeromodelling event.'),
  ('amphibot', 'event', 13, 'Amphibot', 'Conscientia 2026', 'Amphibot', 'Events', '#a855f7', 'Build an amphibious bot for land and water challenges.'),
  ('quantasiateam', 'event', 14, 'Quantasia (Team)', 'Conscientia 2026', 'Quantasia', 'Events', '#a855f7', 'Team track of Quantasia, the quant/finance challenge.'),
  ('quantasiaindividual', 'event', 15, 'Quantasia (Individual)', 'Conscientia 2026', 'Quantasia', 'Events', '#a855f7', 'Solo track of Quantasia, the quant/finance challenge.'),
  ('linefollower', 'event', 16, 'Line Follower', 'Conscientia 2026', 'Line Follower', 'Events', '#a855f7', 'Race your bot along the line-following circuit.'),
  ('mazesolver', 'event', 17, 'Maze Solver', 'Conscientia 2026', 'Maze Solver', 'Events', '#a855f7', 'Build a bot that solves the maze the fastest.'),
  ('codeclash', 'event', 18, 'Code Clash', 'Conscientia 2026', 'Code Clash', 'Events', '#a855f7', 'Competitive programming showdown in Code Clash.'),
  ('arduinohackathon', 'event', 19, 'Arduino Hackathon', 'Conscientia 2026', 'Arduino Hackathon', 'Events', '#a855f7', 'Build hardware hacks with Arduino in this hackathon.'),
  ('circuiter', 'event', 20, 'Circuiter', 'Conscientia 2026', 'Circuiter', 'Events', '#a855f7', 'Circuit design and debugging challenge.'),
  ('thrilltopia', 'event', 21, 'Thrilltopia', 'Conscientia 2026', 'Thrilltopia', 'Events', '#a855f7', 'A lineup of thrilling fun challenges at Conscientia.'),
  ('counterpoint', 'event', 22, 'Counterpoint', 'Conscientia 2026', 'Counterpoint', 'Events', '#a855f7', 'Debate and discourse in Counterpoint.'),
  ('conscientiafootballcup', 'event', 23, 'Conscientia Football Cup', 'Conscientia 2026', 'Football Cup', 'Events', '#a855f7', 'The Conscientia Football Cup tournament.'),
  ('mocksharktank', 'event', 24, 'Mock Shark Tank', 'Conscientia 2026', 'Mock Shark Tank', 'Events', '#a855f7', 'Pitch your startup idea in Mock Shark Tank.'),
  ('cricketauction', 'event', 25, 'Cricket Auction', 'Conscientia 2026', 'Cricket Auction', 'Events', '#a855f7', 'Strategize and bid in the Cricket Auction.'),
  ('xenohabitatdesign', 'event', 26, 'Xenohabitat Design', 'Conscientia 2026', 'Xenohabitat Design', 'Events', '#a855f7', 'Design a habitat for life beyond Earth.'),
  ('intbee', 'event', 27, 'IntBee', 'Conscientia 2026', 'IntBee', 'Events', '#a855f7', 'A quiz-and-wit spelling-bee-style challenge.'),
  ('generalquiz', 'event', 28, 'General Quiz', 'Conscientia 2026', 'General Quiz', 'Events', '#a855f7', 'Test your general knowledge in this quiz.'),
  ('spacequiz', 'event', 29, 'Space Quiz', 'Conscientia 2026', 'Space Quiz', 'Events', '#a855f7', 'A quiz all about space and astronomy.'),
  ('hammertime', 'event', 30, 'Hammertime', 'Conscientia 2026', 'Hammertime', 'Events', '#a855f7', 'A fast-paced building/construction challenge.'),
  ('ahogwartsmystery', 'event', 31, 'A Hogwarts Mystery', 'Conscientia 2026', 'A Hogwarts Mystery', 'Events', '#a855f7', 'Solve the mystery in this immersive experience.'),
  ('escapetheupsidedown', 'event', 32, 'Escape The Upside Down', 'Conscientia 2026', 'Escape Room', 'Events', '#a855f7', 'Escape-room challenge inspired by the Upside Down.'),
  ('astronomy_pc', 'workshop', 0, 'Astronomy', 'Conscientia 2026', 'Astronomy', 'Workshops', '#33d6ff', 'An introductory workshop on astronomy.'),
  ('astroph_pc', 'workshop', 1, 'Astrophysics', 'Conscientia 2026', 'Astrophysics', 'Workshops', '#33d6ff', 'A workshop diving into astrophysics fundamentals.'),
  ('cubesat_pc', 'workshop', 2, 'CubeSat', 'Conscientia 2026', 'CubeSat', 'Workshops', '#33d6ff', 'Hands-on workshop building a CubeSat.'),
  ('3dcad_pc', 'workshop', 3, '3D CAD', 'Conscientia 2026', '3D CAD', 'Workshops', '#33d6ff', 'A workshop on 3D CAD modelling.'),
  ('mun_pc', 'workshop', 4, 'MUN', 'Conscientia 2026', 'MUN', 'Workshops', '#33d6ff', 'A Model United Nations workshop.'),
  ('aero_pc', 'workshop', 5, 'Aeromodelling', 'Conscientia 2026', 'Aeromodelling', 'Workshops', '#33d6ff', 'A hands-on aeromodelling workshop.'),
  ('quant0to1', 'workshop', 6, 'Quant 0 to 1', 'Conscientia 2026', 'Quant', 'Workshops', '#33d6ff', 'A beginner-to-advanced quant finance workshop.'),
  ('robo_pc', 'workshop', 7, 'Robotics', 'Conscientia 2026', 'Robotics', 'Workshops', '#33d6ff', 'A hands-on robotics workshop.'),
  ('rocketry_pc', 'workshop', 8, 'Rocketry', 'Conscientia 2026', 'Rocketry', 'Workshops', '#33d6ff', 'An introductory rocketry workshop.'),
  ('mod_rocketry', 'workshop', 9, 'Model Rocketry', 'Conscientia 2026', 'Model Rocketry', 'Workshops', '#33d6ff', 'A model rocketry workshop.'),
  ('adv_rocketry', 'workshop', 10, 'Advanced Rocketry', 'Conscientia 2026', 'Advanced Rocketry', 'Workshops', '#33d6ff', 'An advanced rocketry workshop for experienced builders.');

-- Accent/glow colors weren't in the column list above (kept it short) —
-- fill them in per item, cycling through the same 8-color palette
-- migration 0013 used for events, so cards vary instead of every card in
-- a kind sharing one flat color.
update public.catalog_items set accent_color = '#33d6ff', glow_color = 'rgba(51,214,255,0.5)' where id in ('bgmi', 'hackorbitalteam', 'linefollower', 'mocksharktank', 'escapetheupsidedown', 'astronomy_pc', 'rocketry_pc');
update public.catalog_items set accent_color = '#a855f7', glow_color = 'rgba(168,85,247,0.5)' where id in ('ff', 'hackorbitalindividual', 'mazesolver', 'cricketauction', 'astroph_pc', 'mod_rocketry');
update public.catalog_items set accent_color = '#22c55e', glow_color = 'rgba(34,197,94,0.5)' where id in ('clashroyale', 'cansat', 'codeclash', 'xenohabitatdesign', 'cubesat_pc', 'adv_rocketry');
update public.catalog_items set accent_color = '#f97316', glow_color = 'rgba(249,115,22,0.5)' where id in ('gg', 'robosoccer', 'arduinohackathon', 'intbee', '3dcad_pc');
update public.catalog_items set accent_color = '#ec4899', glow_color = 'rgba(236,72,153,0.5)' where id in ('cicada', 'rcplane', 'circuiter', 'generalquiz', 'mun_pc');
update public.catalog_items set accent_color = '#eab308', glow_color = 'rgba(234,179,8,0.5)' where id in ('battleofbots', 'amphibot', 'thrilltopia', 'spacequiz', 'aero_pc');
update public.catalog_items set accent_color = '#06b6d4', glow_color = 'rgba(6,182,212,0.5)' where id in ('dronetrix', 'quantasiateam', 'counterpoint', 'hammertime', 'quant0to1');
update public.catalog_items set accent_color = '#ef4444', glow_color = 'rgba(239,68,68,0.5)' where id in ('rcrallycross', 'quantasiaindividual', 'conscientiafootballcup', 'ahogwartsmystery', 'robo_pc');

-- foil_gradient is the card's dark backdrop gradient — same fixed value
-- migration 0013 used for every event, applied here to every event and
-- workshop so the last color field isn't left blank either.
update public.catalog_items set foil_gradient = 'linear-gradient(135deg,#0b1c2f,#123f5d,#081019)' where kind in ('event', 'workshop');
