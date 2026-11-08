import { extractClaimToken } from '../claimToken';

describe('extractClaimToken', () => {
  it('accepts raw, JSON and URL payloads', () => {
    expect(extractClaimToken(' abc ')).toBe('abc');
    expect(extractClaimToken('{"claimToken":"json-token"}')).toBe('json-token');
    expect(extractClaimToken('guardian://onboard?claimToken=url-token')).toBe('url-token');
  });

  it('rejects malformed JSON token values', () => {
    expect(extractClaimToken('{"claimToken":42}')).toBe('');
  });
});
