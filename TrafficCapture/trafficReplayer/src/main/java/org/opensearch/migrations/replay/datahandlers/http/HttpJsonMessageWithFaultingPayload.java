package org.opensearch.migrations.replay.datahandlers.http;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.opensearch.migrations.replay.datahandlers.PayloadAccessFaultingMap;
import org.opensearch.migrations.IHttpMessage;
import org.opensearch.migrations.transform.JsonKeysForHttpMessage;

public class HttpJsonMessageWithFaultingPayload extends LinkedHashMap<String, Object> implements IHttpMessage {

    public static final String MESSAGE_SCHEMA_VERSION = "1.0";

    public HttpJsonMessageWithFaultingPayload() {}

    public HttpJsonMessageWithFaultingPayload(Map<String, ?> m) {

        super(m);
        put(JsonKeysForHttpMessage.HTTP_MESSAGE_SCHEMA_VERSION_KEY, MESSAGE_SCHEMA_VERSION);
    }

    @Override
    public String method() {
        return (String) this.get(JsonKeysForHttpMessage.METHOD_KEY);
    }

    public void setMethod(String value) {
        this.put(JsonKeysForHttpMessage.METHOD_KEY, value);
    }

    @Override
    public String path() {
        return (String) this.get(JsonKeysForHttpMessage.URI_KEY);
    }

    public void setPath(String value) {
        this.put(JsonKeysForHttpMessage.URI_KEY, value);
    }

    @Override
    public String protocol() {
        return (String) this.get(JsonKeysForHttpMessage.PROTOCOL_KEY);
    }

    public void setProtocol(String value) {
        this.put(JsonKeysForHttpMessage.PROTOCOL_KEY, value);
    }

    @Override
    public Map<String, List<String>> headers() {
        Map<String, Object> originalHeaders = this.headersInternal();
        Map<String, List<String>> convertedHeaders = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : originalHeaders.entrySet()) {
            if (entry.getValue() instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> values = (List<String>) entry.getValue();
                convertedHeaders.put(entry.getKey(), values);
            } else if (entry.getValue() != null) {
                convertedHeaders.put(entry.getKey(), Collections.singletonList(entry.getValue().toString()));
            }
        }

        return Collections.unmodifiableMap(convertedHeaders);
    }

    public ListKeyAdaptingCaseInsensitiveHeadersMap headersInternal() {
        return (ListKeyAdaptingCaseInsensitiveHeadersMap) this.get(JsonKeysForHttpMessage.HEADERS_KEY);
    }

    public void setHeaders(ListKeyAdaptingCaseInsensitiveHeadersMap value) {
        this.put(JsonKeysForHttpMessage.HEADERS_KEY, value);
    }

    public Map<String, Object> payload() {
        return (Map<String, Object>) this.get(JsonKeysForHttpMessage.PAYLOAD_KEY);
    }

    public void setPayloadFaultMap(PayloadAccessFaultingMap value) {
        this.put(JsonKeysForHttpMessage.PAYLOAD_KEY, value);
    }
}
