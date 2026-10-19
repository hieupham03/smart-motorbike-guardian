import { canAcknowledgeAlert, canControlDevice, canResolveAlert } from '../permissions';

describe('device-scoped permissions', () => {
  it('blocks Viewer from commands and resolving alerts', () => {
    expect(canControlDevice('VIEWER')).toBe(false);
    expect(canResolveAlert('VIEWER')).toBe(false);
  });

  it('allows Viewer to acknowledge alerts', () => {
    expect(canAcknowledgeAlert('VIEWER')).toBe(true);
  });

  it.each(['OWNER', 'ADMIN'] as const)('allows %s to control and resolve', (role) => {
    expect(canControlDevice(role)).toBe(true);
    expect(canResolveAlert(role)).toBe(true);
  });
});
