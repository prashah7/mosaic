# Contracts

This folder is the shared boundary between the UI, Mosaic API, and Hermes.

- Changes must remain backward compatible during the hackathon.
- HTTP handlers validate unknown input before calling server modules.
- UI code imports response and event types from here instead of redefining them.
- Hermes-specific payloads stay in `server/hermes`; they are not public API.
- Additive fields are preferred. Renames require agreement from all three owners.

The API-contract owner should extend `runs.ts` or add a versioned sibling file,
then provide one fixture for every response shape used by the frontend.
