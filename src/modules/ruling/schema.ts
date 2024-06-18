import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import {
  Params, Ruling, RulingRequest
} from './types.js';

export const CreateRulingSchema = {
  body: RulingRequest,
  response: {
    201: Ruling,
    400: ErrorSchema
  },
  tags: [ 'Rulings' ]
};

export const UpdateRulingSchema = {
  body: RulingRequest,
  response: {
    200: Ruling,
    400: ErrorSchema,
    404: ErrorSchema,
  },
  tags: [ 'Rulings' ]
};

export const GetRulingSchema = {
  params: Params,
  response: {
    200: Ruling,
    404: ErrorSchema
  },
  tags: [ 'Rulings' ]
};

export const DeleteRulingSchema = {
  params: Params,
  response: {
    200: DeleteStatus
  },
  tags: [ 'Rulings' ]
};
