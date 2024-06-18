import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import {
  Params, Platform, PlatformRequest
} from './types.js';

export const CreatePlatformSchema = {
  body: PlatformRequest,
  response: {
    201: Platform,
    400: ErrorSchema
  },
  tags: [ 'Platforms' ]
};

export const UpdatePlatformSchema = {
  body: PlatformRequest,
  params: Params,
  response: {
    200: Platform,
    400: ErrorSchema,
    404: ErrorSchema
  },
  tags: [ 'Platforms' ]
};

export const GetPlatformSchema = {
  params: Params,
  response: {
    200: Platform,
    404: ErrorSchema
  },
  tags: [ 'Platforms' ]
};

export const DeletePlatformSchema = {
  params: Params,
  response: {
    200: DeleteStatus,
    404: ErrorSchema
  },
  tags: [ 'Platforms' ]
};
