import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import {
  Driver, DriverRequest, Params
} from './types.js';

export const CreateDriverSchema = {
  body: DriverRequest,
  response: {
    201: Driver,
    400: ErrorSchema
  },
  tags: [ 'Drivers' ]
};

export const UpdateDriverSchema = {
  body: DriverRequest,
  response: {
    200: Driver,
    400: ErrorSchema,
    404: ErrorSchema
  },
  tags: [ 'Drivers' ]
};

export const GetDriverSchema = {
  params: Params,
  response: {
    200: Driver,
    404: ErrorSchema
  },
  tags: [ 'Drivers' ]
};

export const DeleteDriverSchema = {
  params: Params,
  response: {
    200: DeleteStatus,
    404: ErrorSchema
  },
  tags: [ 'Drivers' ]
};
