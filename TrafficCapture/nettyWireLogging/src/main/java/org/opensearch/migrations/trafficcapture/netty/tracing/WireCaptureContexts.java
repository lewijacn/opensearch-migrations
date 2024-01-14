package org.opensearch.migrations.trafficcapture.netty.tracing;

import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.Meter;
import lombok.Getter;
import lombok.NonNull;
import org.opensearch.migrations.tracing.BaseNestedSpanContext;
import org.opensearch.migrations.tracing.CommonScopedMetricInstruments;
import org.opensearch.migrations.tracing.commoncontexts.IConnectionContext;

public class WireCaptureContexts extends IWireCaptureContexts {
    public static final String COUNT_UNITS = "count";
    public static final String BYTES_UNIT = "bytes";


    public static class ConnectionContext
            extends org.opensearch.migrations.trafficcapture.tracing.ConnectionContext
            implements IWireCaptureContexts.ICapturingConnectionContext
    {
        public ConnectionContext(IRootWireLoggingContext rootInstrumentationScope, String connectionId, String nodeId) {
            super(rootInstrumentationScope, connectionId, nodeId);
        }

        @Override
        public IRootWireLoggingContext getRootInstrumentationScope() {
            return (IRootWireLoggingContext) super.getRootInstrumentationScope();
        }

        public static class MetricInstruments
                extends org.opensearch.migrations.trafficcapture.tracing.ConnectionContext.MetricInstruments {
            public final LongCounter unregisteredCounter;
            public final LongCounter removedCounter;

            public MetricInstruments(Meter meter) {
                super(meter);
                unregisteredCounter = meter
                        .counterBuilder(MetricNames.UNREGISTERED).setUnit(COUNT_UNITS).build();
                removedCounter = meter
                        .counterBuilder(MetricNames.REMOVED).setUnit(COUNT_UNITS).build();
            }
        }

        @Override
        public @NonNull MetricInstruments getMetrics() {
            return getRootInstrumentationScope().getConnectionInstruments();
        }

        @Override
        public IWireCaptureContexts.IHttpMessageContext createInitialRequestContext() {
            return new RequestContext((RootWireLoggingContext)getRootInstrumentationScope(),
                    this, 0);
        }

        @Override
        public void onUnregistered() {
            meterIncrementEvent(getMetrics().unregisteredCounter);
        }

        @Override
        public void onRemoved() {
            meterIncrementEvent(getMetrics().removedCounter);
        }
    }

    @Getter
    public abstract static class HttpMessageContext extends
            BaseNestedSpanContext<RootWireLoggingContext, IConnectionContext>
            implements IWireCaptureContexts.IHttpMessageContext {

        final long sourceRequestIndex;

        protected HttpMessageContext(RootWireLoggingContext rootWireLoggingContext, IConnectionContext enclosingScope,
                                    long sourceRequestIndex) {
            super(rootWireLoggingContext, enclosingScope);
            this.sourceRequestIndex = sourceRequestIndex;
            initializeSpan();
        }

        @Override
        public IWireCaptureContexts.ICapturingConnectionContext getLogicalEnclosingScope() {
            return (IWireCaptureContexts.ICapturingConnectionContext) getEnclosingScope();
        }

        @Override
        public IWireCaptureContexts.IBlockingContext createBlockingContext() {
            close();
            return new BlockingContext(getRootInstrumentationScope(), getImmediateEnclosingScope(), sourceRequestIndex);
        }

        @Override
        public IWireCaptureContexts.IWaitingForResponseContext createWaitingForResponseContext() {
            close();
            return new WaitingForResponseContext(getRootInstrumentationScope(), getImmediateEnclosingScope(),
                    sourceRequestIndex);
        }

        @Override
        public IWireCaptureContexts.IResponseContext createResponseContext() {
            close();
            return new ResponseContext(getRootInstrumentationScope(), getImmediateEnclosingScope(), sourceRequestIndex);
        }

        @Override
        public IWireCaptureContexts.IRequestContext createNextRequestContext() {
            close();
            return new RequestContext(getRootInstrumentationScope(), getImmediateEnclosingScope(),
                    sourceRequestIndex+1);
        }
    }

    public static class RequestContext
            extends HttpMessageContext
            implements IWireCaptureContexts.IRequestContext {
        public RequestContext(RootWireLoggingContext rootWireLoggingContext,
                              IConnectionContext enclosingScope,
                              long sourceRequestIndex) {
            super(rootWireLoggingContext, enclosingScope, sourceRequestIndex);
        }

        @Override
        public IWireCaptureContexts.IWaitingForResponseContext createWaitingForResponseContext() {
            return new WaitingForResponseContext(getRootInstrumentationScope(), getImmediateEnclosingScope(),
                    sourceRequestIndex);
        }

        public static class MetricInstruments
                extends org.opensearch.migrations.trafficcapture.tracing.ConnectionContext.MetricInstruments {
            public final LongCounter blockingRequestCounter;
            public final LongCounter requestsNotOffloadedCounter;
            public final LongCounter fullyParsedRequestCounter;
            public final LongCounter bytesReadCounter;

            public MetricInstruments(Meter meter) {
                super(meter);
                blockingRequestCounter = meter
                        .counterBuilder(MetricNames.BLOCKING_REQUEST).setUnit(COUNT_UNITS).build();
                requestsNotOffloadedCounter = meter
                        .counterBuilder(MetricNames.CAPTURE_SUPPRESSED).setUnit(COUNT_UNITS).build();
                fullyParsedRequestCounter = meter
                        .counterBuilder(MetricNames.FULL_REQUEST).setUnit(COUNT_UNITS).build();
                bytesReadCounter = meter
                        .counterBuilder(MetricNames.BYTES_READ).setUnit(BYTES_UNIT).build();
            }
        }

        @Override
        public @NonNull MetricInstruments getMetrics() {
            return getRootInstrumentationScope().getRequestInstruments();
        }

        @Override
        public void onBlockingRequest() {
            meterIncrementEvent(getMetrics().blockingRequestCounter);
        }

        @Override
        public void onCaptureSuppressed() {
            meterIncrementEvent(getMetrics().requestsNotOffloadedCounter);
        }

        @Override
        public void onFullyParsedRequest() {
            meterIncrementEvent(getMetrics().fullyParsedRequestCounter);
        }

        @Override
        public void onBytesRead(int size) {
            meterIncrementEvent(getMetrics().bytesReadCounter, size);
        }
    }

    public static class BlockingContext
            extends HttpMessageContext
            implements IWireCaptureContexts.IBlockingContext {
        public static final String ACTIVITY_NAME = "blocked";

        public BlockingContext(RootWireLoggingContext rootWireLoggingContext,
                              IConnectionContext enclosingScope,
                              long sourceRequestIndex) {
            super(rootWireLoggingContext, enclosingScope, sourceRequestIndex);
        }

        @Override
        public String getActivityName() {
            return ACTIVITY_NAME;
        }
        public static class MetricInstruments extends CommonScopedMetricInstruments {
            public MetricInstruments(Meter meter) {
                super(meter, ACTIVITY_NAME);
            }
        }

        @Override
        public RequestContext.MetricInstruments getMetrics() {
            return getRootInstrumentationScope().requestInstruments;
        }
    }

    public static class WaitingForResponseContext
            extends HttpMessageContext
            implements IWireCaptureContexts.IWaitingForResponseContext {
        public static final String ACTIVITY_NAME = "waitingForResponse";
        public WaitingForResponseContext(RootWireLoggingContext rootWireLoggingContext,
                              IConnectionContext enclosingScope,
                              long sourceRequestIndex) {
            super(rootWireLoggingContext, enclosingScope, sourceRequestIndex);
        }

        @Override
        public String getActivityName() {
            return ACTIVITY_NAME;
        }
        public static class MetricInstruments extends CommonScopedMetricInstruments {
            public MetricInstruments(Meter meter) {
                super(meter, ACTIVITY_NAME);
            }
        }

        @Override
        public RequestContext.MetricInstruments getMetrics() {
            return getRootInstrumentationScope().requestInstruments;
        }
    }

    public static class ResponseContext
            extends HttpMessageContext
            implements IWireCaptureContexts.IResponseContext {
        public static final String ACTIVITY_NAME = "gatheringResponse";
        public ResponseContext(RootWireLoggingContext rootWireLoggingContext,
                              IConnectionContext enclosingScope,
                              long sourceRequestIndex) {
            super(rootWireLoggingContext, enclosingScope, sourceRequestIndex);
        }

        @Override
        public String getActivityName() {
            return ACTIVITY_NAME;
        }

        public static class MetricInstruments extends CommonScopedMetricInstruments {

            private final LongCounter bytesWritten;
            public MetricInstruments(Meter meter) {
                super(meter, ACTIVITY_NAME);
                bytesWritten = meter
                        .counterBuilder(MetricNames.BYTES_WRITTEN).setUnit(BYTES_UNIT).build();
            }
        }

        @Override
        public MetricInstruments getMetrics() {
            return getRootInstrumentationScope().getResponseInstruments();
        }

        @Override
        public void onBytesWritten(int size) {
            meterIncrementEvent(getMetrics().bytesWritten, size);
        }
    }
}
