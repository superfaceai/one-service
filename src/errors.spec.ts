import {
  ErrorBase,
  JessieError,
  MappedError,
  MappedHTTPError,
  SDKExecutionError,
} from '@superfaceai/one-sdk';
import { isOneSdkError, remapOneSdkError } from './errors';

describe('errors', () => {
  describe('isOneSdkError', () => {
    it("doesn't accept a plain object", () => {
      expect(isOneSdkError({ message: 'foo' })).toBe(false);
    });

    it("doesn't accept an Error object", () => {
      expect(isOneSdkError(new Error('bar'))).toBe(false);
    });

    it("doesn't accept null", () => {
      expect(isOneSdkError(null)).toBe(false);
    });

    it("doesn't accept anything else", () => {
      expect(isOneSdkError(['baz'])).toBe(false);
      expect(isOneSdkError('foobar')).toBe(false);
    });

    it('accepts ErrorBase', () => {
      expect(isOneSdkError(new ErrorBase('Foo', 'Bar'))).toBe(true);
    });

    it('accepts SDKExecutionError', () => {
      expect(isOneSdkError(new SDKExecutionError('Foo', [], []))).toBe(true);
    });

    it('accepts MappedHTTPError', () => {
      expect(isOneSdkError(new MappedHTTPError('foo', 200))).toBe(true);
    });

    it('accepts MappedError', () => {
      expect(isOneSdkError(new MappedError('foo'))).toBe(true);
    });

    it('accepts JessieError', () => {
      expect(isOneSdkError(new JessieError('foo', new Error()))).toBe(true);
    });
  });

  describe('remapOneSdkError', () => {
    it('wraps object to Error', () => {
      expect(
        remapOneSdkError({ name: 'FooBar', message: 'Some message' }),
      ).toBeInstanceOf(Error);
    });

    it('keeps originalError in a property', () => {
      const input = { name: 'FooBar', message: 'Some message' };
      const result = remapOneSdkError(input);
      expect(result.message).toBe(input.message);
      expect(result.originalError).toEqual(input);
    });

    it('copies over selected properties from the input', () => {
      const extensions = {
        kind: 'Kind',
        properties: {
          foo: true,
          bar: ['baz'],
        },
        statusCode: '200',
        response: {
          body: 'foo',
        },
      };

      const result = remapOneSdkError({
        message: 'Message',
        name: 'Error',
        ...extensions,
      });
      expect(result.extensions).toEqual(extensions);
    });

    it('ignores other properties from the input error', () => {
      const input = {
        message: 'Message',
        name: 'Error',
        foo: 'bar',
        metadata: {
          foo: 'bar',
        },
      };

      const result = remapOneSdkError(input);
      expect(result).not.toHaveProperty('foo');
      expect(result).not.toHaveProperty('metadata');
      expect(result.extensions).not.toHaveProperty('foo');
      expect(result.extensions).not.toHaveProperty('metadata');
    });
  });
});
