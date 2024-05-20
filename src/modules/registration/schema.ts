import { ErrorSchema } from '../../types/responses.js';
import {
  Params, Registration, RegistrationRequest
} from './types.js';

export const CreateRegistrationSchema = {
  body: RegistrationRequest,
  response: {
    201: Registration,
    400: ErrorSchema
  },
  tags: [ 'Registrations' ]
};

export const UpdateRegistrationSchema = {
  body: RegistrationRequest,
  response: {
    200: Registration,
    400: ErrorSchema,
    404: ErrorSchema,
    409: ErrorSchema
  },
  tags: [ 'Registrations' ]
};

export const GetRegistrationSchema = {
  params: Params,
  response: {
    200: Registration,
    404: ErrorSchema
  }
};
