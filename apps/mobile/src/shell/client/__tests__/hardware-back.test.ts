import { hardwareBackAction } from '../hardware-back';

describe('hardwareBackAction', () => {
  it('closes an open overlay before leaving the app', () => {
    expect(hardwareBackAction({ activeTab: 'home', overlay: 'calendar' })).toBe('close-overlay');
    expect(hardwareBackAction({ activeTab: 'more', overlay: 'session' })).toBe('close-overlay');
  });

  it('returns to home from another tab', () => {
    expect(hardwareBackAction({ activeTab: 'chat', overlay: null })).toBe('go-home');
    expect(hardwareBackAction({ activeTab: 'more', overlay: null })).toBe('go-home');
  });

  it('lets Android exit from the home screen', () => {
    expect(hardwareBackAction({ activeTab: 'home', overlay: null })).toBe('exit');
  });
});
