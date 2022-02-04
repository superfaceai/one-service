import { ArrayMultiMap } from './structures';

describe('structures', () => {
  describe('ArrayMultiMap', () => {
    it('stores single item in an array', () => {
      const mmap = new ArrayMultiMap<string, string>();
      mmap.set('key', 'value');
      expect(mmap.get('key')).toEqual(['value']);
    });

    it('appends item with same key to array', () => {
      const mmap = new ArrayMultiMap<string, string>();
      mmap.set('key', 'value1');
      mmap.set('key', 'value2');
      expect(mmap.get('key')).toEqual(['value1', 'value2']);
    });

    it('supports iteration', () => {
      const mmap = new ArrayMultiMap<string, string>();
      mmap.set('a', 'a');
      mmap.set('b', 'b1');
      mmap.set('b', 'b2');
      expect(mmap[Symbol.iterator]).toBeDefined();
      expect(Array.from(mmap)).toEqual([
        ['a', ['a']],
        ['b', ['b1', 'b2']],
      ]);
    });
  });
});
