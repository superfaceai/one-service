export class ArrayMultiMap<K, V> {
  #map: Map<K, V[]>;

  constructor() {
    this.#map = new Map();
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: K): V[] | undefined {
    return this.#map.get(key);
  }

  has(key: K): boolean {
    return this.#map.has(key);
  }

  set(key: K, value: V): this {
    const existingValue = this.get(key);
    if (existingValue) {
      existingValue.push(value);
    } else {
      this.#map.set(key, [value]);
    }
    return this;
  }

  forEach(callbackfn: (value: V[], key: K, map: Map<K, V[]>) => void): void {
    return this.#map.forEach(callbackfn);
  }

  [Symbol.iterator](): IterableIterator<[K, V[]]> {
    return this.#map[Symbol.iterator]();
  }

  entries(): IterableIterator<[K, V[]]> {
    return this.#map.entries();
  }

  keys(): IterableIterator<K> {
    return this.#map.keys();
  }

  values(): IterableIterator<V[]> {
    return this.#map.values();
  }

  get [Symbol.toStringTag](): string {
    return 'ArrayMultiMap';
  }
}
