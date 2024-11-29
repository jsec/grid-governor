import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import { IdParam } from '../../types/schemas.js';
import { Race, RaceRequest } from './types.js';

export const CreateRaceSchema = {
  body: RaceRequest,
  response: {
    201: Race,
    400: ErrorSchema,
  },
  tags: ['Races'],
};

export const UpdateRaceSchema = {
  body: RaceRequest,
  response: {
    200: Race,
    400: ErrorSchema,
    404: ErrorSchema,
  },
  tags: ['Races'],
};

export const GetRaceSchema = {
  params: IdParam,
  response: {
    200: Race,
    404: ErrorSchema,
  },
  tags: ['Races'],
};

export const DeleteRaceSchema = {
  params: IdParam,
  response: {
    200: DeleteStatus,
  },
  tags: ['Races'],
};
