import { loadConfig } from '@grid-governor/core/config';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { NodeSDK, resources } from '@opentelemetry/sdk-node';
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { register } from 'node:module';

const config = loadConfig();

if (config.OTEL_EXPORTER_OTLP_ENDPOINT) {
    register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

    const sdk = new NodeSDK({
        instrumentations: [
            new PgInstrumentation(),
            new PinoInstrumentation(),
        ],
        metricReaders: [],
        resource: resources.resourceFromAttributes({
            'deployment.environment.name': config.APP_ENV,
            'service.name': 'cli',
            'service.version': config.APP_RELEASE,
        }),
        resourceDetectors: [],
    });

    sdk.start();

    process.once('beforeExit', () => {
        void sdk.shutdown();
    });
}
