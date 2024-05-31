FROM amazon/aws-otel-collector:v0.39.0

COPY otel-config*.yaml /etc/
CMD ["--config", "/etc/otel-config-debug-only.yaml"]
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=2 CMD [ "/healthcheck" ]
