import {
  Driver, DriverRequest, Params
} from './types.js';

export const CreateDriverSchema = {
  body: DriverRequest,
  response: {
    201: Driver
  },
  tags: [ 'Drivers' ]
};

export const UpdateDriverSchema = {
  body: DriverRequest,
  response: {
    200: Driver
  },
  tags: [ 'Drivers' ]
};

export const GetDriverSchema = {
  params: Params,
  response: {
    200: Driver
  },
  tags: [ 'Drivers' ]
};
