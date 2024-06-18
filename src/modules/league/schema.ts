import { DeleteStatus } from '../../types/db.js';
import {
  League, LeagueRequest, Params
} from './types.js';

export const CreateLeagueSchema = {
  body: LeagueRequest,
  response: {
    201: League,
  },
  tags: [ 'Leagues' ]
};

export const UpdateLeagueSchema = {
  body: LeagueRequest,
  response: {
    200: League,
  },
  tags: [ 'Leagues' ]
};

export const GetLeagueSchema = {
  params: Params,
  response: {
    200: League
  },
  tags: [ 'Leagues' ]
};

export const DeleteLeagueSchema = {
  params: Params,
  response: {
    200: DeleteStatus
  },
  tags: [ 'Leagues' ]
};
