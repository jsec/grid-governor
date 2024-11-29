import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import { IdParam } from '../../types/schemas.js';
import { Penalty, PenaltyRequest } from './types.js';

export const CreatePenaltySchema = {
  body: PenaltyRequest,
  response: {
    201: Penalty,
    400: ErrorSchema,
  },
  tags: ['Penalties'],
};

export const UpdatePenaltySchema = {
  body: PenaltyRequest,
  response: {
    200: Penalty,
    400: ErrorSchema,
    404: ErrorSchema,
  },
  tags: ['Penalties'],
};

export const GetPenaltySchema = {
  params: IdParam,
  response: {
    200: Penalty,
    404: ErrorSchema,
  },
  tags: ['Penalties'],
};

export const DeletePenaltySchema = {
  params: IdParam,
  response: {
    200: DeleteStatus,
    404: ErrorSchema,
  },
  tags: ['Penalties'],
};
