import { ErrorSchema } from '../../types/responses.js';
import { Registration } from '../registration/types.js';
import {
  Params, Race, RaceRequest
} from './types.js';

export const CreateRaceSchema = {
  body: RaceRequest,
  response: {
    201: Race,
    400: ErrorSchema
  },
  tags: [ 'Races' ]
};

export const UpdateRaceSchema = {
  body: RaceRequest,
  response: {
    200: Registration,
    400: ErrorSchema,
    404: ErrorSchema,
    409: ErrorSchema
  },
  tags: [ 'Races' ]
};

export const GetRaceSchema = {
  params: Params,
  response: {
    200: Race,
    404: ErrorSchema
  },
  tags: [ 'Races' ]
};
