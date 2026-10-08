import { loadConfig } from '@grid-governor/core/config';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
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
            new HttpInstrumentation(),
            new PgInstrumentation(),
            new PinoInstrumentation({ disableLogSending: true }),
        ],
        metricReaders: [
            new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter(),
            }),
        ],
        resource: resourceFromAttributes({
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.APP_ENV,
            [ATTR_SERVICE_NAME]: 'api',
            [ATTR_SERVICE_VERSION]: config.APP_RELEASE,
        }),
        traceExporter: new OTLPTraceExporter(),
    });

    sdk.start();

    process.on('SIGTERM', () => {
        void sdk.shutdown().finally(() => process.exit());
    });
}
