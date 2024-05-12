import {
  League, LeagueRequest, Params
} from './types.js';

export const CreateLeagueSchema = {
  body: LeagueRequest,
  response: {
    201: League,
  },
  tags: [ 'League' ]
};

export const UpdateLeagueSchema = {
  body: LeagueRequest,
  response: {
    200: League,
  },
  tags: [ 'League' ]
};

export const GetLeagueSchema = {
  params: Params,
  response: {
    200: League
  },
  tags: [ 'League' ]
};
