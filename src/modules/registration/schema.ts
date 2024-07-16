import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import { IdParam } from '../../types/schemas.js';
import {
  Registration, RegistrationRequest
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
  },
  tags: [ 'Registrations' ]
};

export const GetRegistrationSchema = {
  params: IdParam,
  response: {
    200: Registration,
    404: ErrorSchema
  },
  tags: [ 'Registrations' ]
};

export const DeleteRegistrationSchema = {
  params: IdParam,
  response: {
    200: DeleteStatus
  },
  tags: [ 'Registrations' ]
};
