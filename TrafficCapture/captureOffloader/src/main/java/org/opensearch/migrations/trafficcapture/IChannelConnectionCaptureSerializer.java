package org.opensearch.migrations.trafficcapture;

public interface IChannelConnectionCaptureSerializer extends IChannelConnectionCaptureListener {

    void setIsBlockingMetadata(boolean isBlocking);
}