import { sanitize } from './schema.utils';

describe('schema.utils', () => {
  describe('sanitize', () => {
    it('replaces all "/" with "_" ', () => {
      expect(sanitize('test/test/test')).toBe('test_test_test');
    });

    it('replaces all "-" with "_"', () => {
      expect(sanitize('test-test-test')).toBe('test_test_test');
    });
  });
});
