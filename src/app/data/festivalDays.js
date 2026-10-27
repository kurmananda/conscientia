export const FESTIVAL_DAYS = [
  {
    day: 1,
    title: 'Day 1',
    passId: 'day-pass-1',
    events: [
      { title: 'Hackathon', ids: ['hackorbitalteam', 'hackorbitalindividual'] },
      { title: 'CanSat', ids: ['cansat'] },
      { title: 'Battle of Bots', ids: ['battleofbots'] },
    ],
  },
  {
    day: 2,
    title: 'Day 2',
    passId: 'day-pass-2',
    events: [
      { title: 'Hackathon', ids: ['hackorbitalteam', 'hackorbitalindividual'] },
      { title: 'RC Plane', ids: ['rcplane'] },
      { title: 'Dronetrix', ids: ['dronetrix'] },
      { title: 'Robo Soccer', ids: ['robosoccer'] },
    ],
  },
  {
    day: 3,
    title: 'Day 3',
    passId: 'day-pass-3',
    events: [
      { title: 'RC Rallycross', ids: ['rcrallycross'] },
      { title: 'Amphibot', ids: ['amphibot'] },
    ],
  },
];

export const DAY_PASSES = FESTIVAL_DAYS.map(({ day, title, passId }) => ({
  id: passId,
  day,
  title: `${title} Pass`,
  ticketId: 3509 + day,
  price: 150,
  priceLabel: '₹150',
}));
