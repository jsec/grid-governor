import { DeleteStatus } from '../../types/db.js';
import {
  Params, Penalty, PenaltyRequest
} from './types.js';

export const CreatePenaltySchema = {
  body: PenaltyRequest,
  response: {
    201: Penalty,
  },
  tags: [ 'Penalties' ]
};

export const UpdatePenaltySchema = {
  body: PenaltyRequest,
  response: {
    200: Penalty,
  },
  tags: [ 'Penalties' ]
};

export const GetPenaltySchema = {
  params: Params,
  response: {
    200: Penalty
  },
  tags: [ 'Penalties' ]
};

export const DeletePenaltySchema = {
  params: Params,
  response: {
    200: DeleteStatus
  },
  tags: [ 'Penalties' ]
};
