import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import {
  Params, Season, SeasonRequest
} from './types.js';

export const CreateSeasonSchema = {
  body: SeasonRequest,
  response: {
    201: Season,
    400: ErrorSchema,
  },
  tags: [ 'Seasons' ]
};

export const UpdateSeasonSchema = {
  body: SeasonRequest,
  response: {
    200: Season,
    400: ErrorSchema,
    404: ErrorSchema
  },
  tags: [ 'Seasons' ]
};

export const GetSeasonSchema = {
  params: Params,
  response: {
    200: Season
  },
  tags: [ 'Seasons' ]
};

export const DeleteSeasonSchema = {
  params: Params,
  response: {
    200: DeleteStatus
  },
  tags: [ 'Seasons' ]
};
