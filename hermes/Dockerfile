FROM nousresearch/hermes-agent:latest

USER root
COPY hermes/luci/SOUL.md /opt/luci/SOUL.md
COPY hermes/luci/skills/mosaic-project-manager /opt/luci/skills/mosaic-project-manager
COPY hermes/docker-entrypoint-mosaic.sh /usr/local/bin/docker-entrypoint-mosaic.sh
COPY data/seed /opt/mosaic/data/seed
COPY data/runtime /opt/mosaic/data/runtime
RUN chmod +x /usr/local/bin/docker-entrypoint-mosaic.sh
USER hermes

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-mosaic.sh"]
