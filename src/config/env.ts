import { configDotenv } from 'dotenv';
import {
  cleanEnv, num, str
} from 'envalid';

configDotenv();

export const env = cleanEnv(process.env, {
  API_HOST: str({ desc: 'Hostname of the server', devDefault: '127.0.0.1' }),
  API_PORT: num({ desc: 'Port the server binds to', devDefault: 3000 }),
  DB_HOST: str({ desc: 'Hostname of the database server', devDefault: 'localhost' }),
  DB_NAME: str({ desc: 'Name of the database', devDefault: 'f1db' }),
  DB_PASSWORD: str({ desc: 'Password for the database user' }),
  DB_PORT: num({ default: 3306, desc: 'Port the database is listening on' }),
  DB_USER: str({ desc: 'Username of the acting database user' }),
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
    desc: 'The current Node environment'
  })
});

