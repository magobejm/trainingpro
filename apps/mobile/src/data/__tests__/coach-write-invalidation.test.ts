import { coachQueryRootsForPath } from '../hooks/coach-query-roots';

describe('coachQueryRootsForPath', () => {
  it('refreshes only what the written route can change', () => {
    expect(coachQueryRootsForPath('/clients/c1/notes')).toEqual(['coach', 'clients']);
    expect(coachQueryRootsForPath('/chat/messages')).toEqual(['chat-messages']);
    expect(coachQueryRootsForPath('/calendar/events?x=1')).toEqual(['calendar']);
    expect(coachQueryRootsForPath('/nutrition/plans')).toEqual(['nutrition']);
  });

  it('falls back to every coach list for unknown routes', () => {
    expect(coachQueryRootsForPath('/something/else')).toEqual([
      'coach',
      'clients',
      'chat-messages',
      'calendar',
      'nutrition',
    ]);
  });
});
