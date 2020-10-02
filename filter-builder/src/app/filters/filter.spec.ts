import { StringValue } from './filter';

describe('FieldValue', () => {
    describe('StringValue', () => {
        it('should parse a value from raw string', () => {
            const raw = 'test value';
            const strValue = new StringValue(raw);
            expect(strValue.value).toBe(raw);
        });

        it('should stringify to a value being as-is', () => {
            const raw = 'test value';
            const strValue = new StringValue(raw);
            expect(strValue.stringify()).toBe(strValue.value);
        });

        it('should parse a value from raw string', () => {
            const raw = 'test value';
            const [result, isParsed] = StringValue.tryParse(raw);
            expect(isParsed).toBeTruthy();
            expect(result.value).toBe(raw);
        });
    });
  });
