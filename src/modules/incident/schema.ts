import { DeleteStatus } from '../../types/db.js';
import { ErrorSchema } from '../../types/responses.js';
import { IdParam } from '../../types/schemas.js';
import {
  Incident, IncidentRequest
} from './types.js';

export const CreateIncidentSchema = {
  body: IncidentRequest,
  response: {
    201: Incident,
    400: ErrorSchema
  },
  tags: [ 'Incidents' ]
};

export const UpdateIncidentSchema = {
  body: IncidentRequest,
  response: {
    200: Incident,
    400: ErrorSchema,
    404: ErrorSchema,
  },
  tags: [ 'Incidents' ]
};

export const GetIncidentSchema = {
  params: IdParam,
  response: {
    200: Incident,
    404: ErrorSchema
  },
  tags: [ 'Incidents' ]
};

export const DeleteIncidentSchema = {
  params: IdParam,
  response: {
    200: DeleteStatus,
    404: ErrorSchema
  },
  tags: [ 'Incidents' ]
};
