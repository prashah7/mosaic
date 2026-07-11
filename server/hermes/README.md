# Hermes adapter

This folder owns the private transport between Mosaic and Hermes. The rest of
the application depends only on `HermesClient`.

The Hermes owner can change paths, authentication, payloads, or response
parsing inside this folder. Keep secrets server-side and return only structured,
user-safe summaries; never expose hidden reasoning or provider credentials.
