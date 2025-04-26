import synthParamSchema from './config/synthParamSchema.json';
import Ajv from 'ajv';

const ajv = new Ajv({ useDefaults: true });

export function validateAndFillSynthParams(params: any) {
  const validate = ajv.compile(synthParamSchema);
  if (!validate(params)) {
    throw new Error('Schema 驗證失敗');
  }
  return params; // Ajv 會自動補預設值
}
