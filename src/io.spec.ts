import { access } from 'fs/promises';
import { assertIsIOError, exists } from './io';

jest.mock('fs/promises');

describe('io', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('assertIsIOError', () => {
    it('throws if error is not an object', () => {
      expect(() => {
        assertIsIOError(null);
      }).toThrow(/unexpected error/);
    });

    it('throws if error is an object but has no code', () => {
      expect(() => {
        assertIsIOError({});
      }).toThrow(/unexpected error/);
    });

    it('does not throw if error is an object with code', () => {
      expect(() => {
        assertIsIOError({ code: 'ENOENT' });
      }).not.toThrow();
    });
  });

  describe('exists', () => {
    beforeEach(() => {
      jest.mock('fs/promises');
    });

    it('calls fs.access', async () => {
      const path = 'some/path';

      await exists(path);
      expect(access).toHaveBeenCalledWith(path);
    });

    it('returns false for ENOENT', async () => {
      const path = 'some/path';
      jest.mocked(access).mockRejectedValueOnce({ code: 'ENOENT' });

      await expect(exists(path)).resolves.toBe(false);
    });

    it('returns true if no error is thrown', async () => {
      const path = 'some/path';
      jest.mocked(access).mockResolvedValueOnce();

      await expect(exists(path)).resolves.toBe(true);
    });
  });
});
