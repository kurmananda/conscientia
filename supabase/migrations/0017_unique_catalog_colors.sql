-- Every event/workshop gets a fully unique accent/glow/foil color combo
-- (hues spread via golden-ratio increment so no two are adjacent or similar),
-- superseding 0014's grouped 8-color-palette approach where ~5-7 items shared
-- one color. Safe to re-run.
update public.catalog_items set accent_color = '#b14df2', glow_color = 'rgba(177,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#283f19,#05070a)' where id = 'bgmi';
update public.catalog_items set accent_color = '#4df281', glow_color = 'rgba(77,242,129,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f1933,#05070a)' where id = 'ff';
update public.catalog_items set accent_color = '#f2514d', glow_color = 'rgba(242,81,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193e3f,#05070a)' where id = 'clashroyale';
update public.catalog_items set accent_color = '#4d79f2', glow_color = 'rgba(77,121,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f3519,#05070a)' where id = 'gg';
update public.catalog_items set accent_color = '#a9f24d', glow_color = 'rgba(169,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#2a193f,#05070a)' where id = 'cicada';
update public.catalog_items set accent_color = '#f24dd9', glow_color = 'rgba(242,77,217,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f1f,#05070a)' where id = 'battleofbots';
update public.catalog_items set accent_color = '#4df2da', glow_color = 'rgba(77,242,218,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f191e,#05070a)' where id = 'dronetrix';
update public.catalog_items set accent_color = '#f2aa4d', glow_color = 'rgba(242,170,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#192a3f,#05070a)' where id = 'rcrallycross';
update public.catalog_items set accent_color = '#7a4df2', glow_color = 'rgba(122,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#353f19,#05070a)' where id = 'hackorbitalteam';
update public.catalog_items set accent_color = '#50f24d', glow_color = 'rgba(80,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f193f,#05070a)' where id = 'hackorbitalindividual';
update public.catalog_items set accent_color = '#f24d80', glow_color = 'rgba(242,77,128,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f33,#05070a)' where id = 'cansat';
update public.catalog_items set accent_color = '#4db0f2', glow_color = 'rgba(77,176,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f2819,#05070a)' where id = 'robosoccer';
update public.catalog_items set accent_color = '#e0f24d', glow_color = 'rgba(224,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#1d193f,#05070a)' where id = 'rcplane';
update public.catalog_items set accent_color = '#d34df2', glow_color = 'rgba(211,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#203f19,#05070a)' where id = 'amphibot';
update public.catalog_items set accent_color = '#4df2a3', glow_color = 'rgba(77,242,163,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f192b,#05070a)' where id = 'quantasiateam';
update public.catalog_items set accent_color = '#f2734d', glow_color = 'rgba(242,115,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#19363f,#05070a)' where id = 'quantasiaindividual';
update public.catalog_items set accent_color = '#4d57f2', glow_color = 'rgba(77,87,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f3d19,#05070a)' where id = 'linefollower';
update public.catalog_items set accent_color = '#87f24d', glow_color = 'rgba(135,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#32193f,#05070a)' where id = 'mazesolver';
update public.catalog_items set accent_color = '#f24db7', glow_color = 'rgba(242,77,183,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f27,#05070a)' where id = 'codeclash';
update public.catalog_items set accent_color = '#4de7f2', glow_color = 'rgba(77,231,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f1b19,#05070a)' where id = 'arduinohackathon';
update public.catalog_items set accent_color = '#f2cc4d', glow_color = 'rgba(242,204,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#19223f,#05070a)' where id = 'circuiter';
update public.catalog_items set accent_color = '#9c4df2', glow_color = 'rgba(156,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#2d3f19,#05070a)' where id = 'thrilltopia';
update public.catalog_items set accent_color = '#4df26c', glow_color = 'rgba(77,242,108,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f1938,#05070a)' where id = 'counterpoint';
update public.catalog_items set accent_color = '#f24d5e', glow_color = 'rgba(242,77,94,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f3b,#05070a)' where id = 'conscientiafootballcup';
update public.catalog_items set accent_color = '#4d8ef2', glow_color = 'rgba(77,142,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f3019,#05070a)' where id = 'mocksharktank';
update public.catalog_items set accent_color = '#bef24d', glow_color = 'rgba(190,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#25193f,#05070a)' where id = 'cricketauction';
update public.catalog_items set accent_color = '#f24dee', glow_color = 'rgba(242,77,238,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f1a,#05070a)' where id = 'xenohabitatdesign';
update public.catalog_items set accent_color = '#4df2c5', glow_color = 'rgba(77,242,197,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f1923,#05070a)' where id = 'intbee';
update public.catalog_items set accent_color = '#f2954d', glow_color = 'rgba(242,149,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#192e3f,#05070a)' where id = 'generalquiz';
update public.catalog_items set accent_color = '#654df2', glow_color = 'rgba(101,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3a3f19,#05070a)' where id = 'spacequiz';
update public.catalog_items set accent_color = '#65f24d', glow_color = 'rgba(101,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3a193f,#05070a)' where id = 'hammertime';
update public.catalog_items set accent_color = '#f24d95', glow_color = 'rgba(242,77,149,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f2f,#05070a)' where id = 'ahogwartsmystery';
update public.catalog_items set accent_color = '#4dc5f2', glow_color = 'rgba(77,197,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f2319,#05070a)' where id = 'escapetheupsidedown';
update public.catalog_items set accent_color = '#f2ee4d', glow_color = 'rgba(242,238,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#191a3f,#05070a)' where id = 'astronomy_pc';
update public.catalog_items set accent_color = '#be4df2', glow_color = 'rgba(190,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#253f19,#05070a)' where id = 'astroph_pc';
update public.catalog_items set accent_color = '#4df28e', glow_color = 'rgba(77,242,142,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f1930,#05070a)' where id = 'cubesat_pc';
update public.catalog_items set accent_color = '#f25e4d', glow_color = 'rgba(242,94,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193b3f,#05070a)' where id = '3dcad_pc';
update public.catalog_items set accent_color = '#4d6cf2', glow_color = 'rgba(77,108,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f3819,#05070a)' where id = 'mun_pc';
update public.catalog_items set accent_color = '#9cf24d', glow_color = 'rgba(156,242,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#2d193f,#05070a)' where id = 'aero_pc';
update public.catalog_items set accent_color = '#f24dcc', glow_color = 'rgba(242,77,204,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#193f22,#05070a)' where id = 'quant0to1';
update public.catalog_items set accent_color = '#4df2e7', glow_color = 'rgba(77,242,231,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f191b,#05070a)' where id = 'robo_pc';
update public.catalog_items set accent_color = '#f2b74d', glow_color = 'rgba(242,183,77,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#19273f,#05070a)' where id = 'rocketry_pc';
update public.catalog_items set accent_color = '#874df2', glow_color = 'rgba(135,77,242,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#323f19,#05070a)' where id = 'mod_rocketry';
update public.catalog_items set accent_color = '#4df257', glow_color = 'rgba(77,242,87,0.5)', foil_gradient = 'linear-gradient(135deg,#0b0f14,#3f193d,#05070a)' where id = 'adv_rocketry';
