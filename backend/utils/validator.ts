import Ajv from 'ajv';
const ajv = new Ajv();

export function validate(schema: object, data: any): boolean {
  const validate = ajv.compile(schema);
  return validate(data);
}
