import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import {
  League, LeagueRequest, Params
} from './types.js';

export const CreateLeagueSchema = {
  body: LeagueRequest,
  response: {
    201: League,
    400: ErrorSchema
  },
  tags: [ 'Leagues' ]
};

export const UpdateLeagueSchema = {
  body: LeagueRequest,
  response: {
    200: League,
    400: ErrorSchema,
    404: ErrorSchema
  },
  tags: [ 'Leagues' ]
};

export const GetLeagueSchema = {
  params: Params,
  response: {
    200: League,
    404: ErrorSchema
  },
  tags: [ 'Leagues' ]
};

export const DeleteLeagueSchema = {
  params: Params,
  response: {
    200: DeleteStatus,
    404: ErrorSchema
  },
  tags: [ 'Leagues' ]
};
