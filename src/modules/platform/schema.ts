import {
  Params, Platform, PlatformRequest
} from './types.js';

export const CreatePlatformSchema = {
  body: PlatformRequest,
  response: {
    201: Platform
  },
  tags: [ 'Platform' ]
};

export const UpdatePlatformSchema = {
  body: PlatformRequest,
  params: Params,
  response: {
    200: Platform
  },
  tags: [ 'Platform' ]
};

export const GetPlatformSchema = {
  params: Params,
  response: {
    200: Platform
  },
  tags: [ 'Platform' ]
};
