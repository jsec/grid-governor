import {
  Params, Season, SeasonRequest
} from './types.js';

export const CreateSeasonSchema = {
  body: SeasonRequest,
  response: {
    201: Season
  },
  tags: [ 'Seasons' ]
};

export const UpdateSeasonSchema = {
  body: SeasonRequest,
  response: {
    200: Season
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
