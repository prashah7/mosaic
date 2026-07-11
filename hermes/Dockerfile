FROM nousresearch/hermes-agent:latest

USER root
COPY luci/SOUL.md /opt/luci/SOUL.md
COPY luci/skills/mosaic-project-manager /opt/luci/skills/mosaic-project-manager
COPY docker-entrypoint-mosaic.sh /usr/local/bin/docker-entrypoint-mosaic.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-mosaic.sh
USER hermes

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-mosaic.sh"]
