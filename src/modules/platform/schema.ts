import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import { IdParam } from '../../types/schemas.js';
import {
  Platform, PlatformRequest
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
  params: IdParam,
  response: {
    200: Platform,
    400: ErrorSchema,
    404: ErrorSchema
  },
  tags: [ 'Platforms' ]
};

export const GetPlatformSchema = {
  params: IdParam,
  response: {
    200: Platform,
    404: ErrorSchema
  },
  tags: [ 'Platforms' ]
};

export const DeletePlatformSchema = {
  params: IdParam,
  response: {
    200: DeleteStatus,
    404: ErrorSchema
  },
  tags: [ 'Platforms' ]
};
