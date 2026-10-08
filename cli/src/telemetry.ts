import { loadConfig } from '@grid-governor/core/config';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
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
        logRecordProcessors: [
            new BatchLogRecordProcessor({
                exporter: new OTLPLogExporter(),
            }),
        ],
        metricReaders: [],
        resource: resourceFromAttributes({
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.APP_ENV,
            [ATTR_SERVICE_NAME]: 'cli',
            [ATTR_SERVICE_VERSION]: config.APP_RELEASE,
        }),
        resourceDetectors: [],
        traceExporter: new OTLPTraceExporter(),
    });

    sdk.start();

    process.once('beforeExit', () => {
        void sdk.shutdown();
    });
}
