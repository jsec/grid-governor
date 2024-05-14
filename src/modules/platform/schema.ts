import {
  Params, Platform, PlatformRequest
} from './types.js';

export const CreatePlatformSchema = {
  body: PlatformRequest,
  response: {
    201: Platform
  },
  tags: [ 'Platforms' ]
};

export const UpdatePlatformSchema = {
  body: PlatformRequest,
  params: Params,
  response: {
    200: Platform
  },
  tags: [ 'Platforms' ]
};

export const GetPlatformSchema = {
  params: Params,
  response: {
    200: Platform
  },
  tags: [ 'Platforms' ]
};
