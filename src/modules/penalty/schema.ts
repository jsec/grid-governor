import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import {
  Params, Penalty, PenaltyRequest
} from './types.js';

export const CreatePenaltySchema = {
  body: PenaltyRequest,
  response: {
    201: Penalty,
    400: ErrorSchema
  },
  tags: [ 'Penalties' ]
};

export const UpdatePenaltySchema = {
  body: PenaltyRequest,
  response: {
    200: Penalty,
    400: ErrorSchema,
    404: ErrorSchema
  },
  tags: [ 'Penalties' ]
};

export const GetPenaltySchema = {
  params: Params,
  response: {
    200: Penalty,
    404: ErrorSchema
  },
  tags: [ 'Penalties' ]
};

export const DeletePenaltySchema = {
  params: Params,
  response: {
    200: DeleteStatus,
    404: ErrorSchema
  },
  tags: [ 'Penalties' ]
};
