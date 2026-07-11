import "server-only";

export type RuntimeConfig = {
  hermesBaseUrl?: string;
  hermesApiKey?: string;
  openAiApiKey?: string;
  convexUrl?: string;
  convexAuthToken?: string;
  demoFallback: boolean;
};

export type RuntimeConfigUpdate = Partial<RuntimeConfig>;

export type RuntimeConfigFieldStatus = {
  configured: boolean;
  maskedSuffix?: string;
};

export type RuntimeConfigStatus = {
  hermesBaseUrl: RuntimeConfigFieldStatus;
  hermesApiKey: RuntimeConfigFieldStatus;
  openAiApiKey: RuntimeConfigFieldStatus;
  convexUrl: RuntimeConfigFieldStatus;
  convexAuthToken: RuntimeConfigFieldStatus;
  demoFallback: boolean;
};

declare global {
  // The global survives module reloads during a single local demo process.
  var __mosaicRuntimeConfig: RuntimeConfigUpdate | undefined;
}

function overrides(): RuntimeConfigUpdate {
  globalThis.__mosaicRuntimeConfig ??= {};
  return globalThis.__mosaicRuntimeConfig;
}

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

function envBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function getRuntimeConfig(): RuntimeConfig {
  const current = overrides();

  return {
    hermesBaseUrl:
      normalized(current.hermesBaseUrl) ?? normalized(process.env.HERMES_BASE_URL),
    hermesApiKey:
      normalized(current.hermesApiKey) ?? normalized(process.env.HERMES_API_KEY),
    openAiApiKey:
      normalized(current.openAiApiKey) ?? normalized(process.env.OPENAI_API_KEY),
    convexUrl: normalized(current.convexUrl) ?? normalized(process.env.CONVEX_URL),
    convexAuthToken:
      normalized(current.convexAuthToken) ??
      normalized(process.env.CONVEX_AUTH_TOKEN),
    demoFallback:
      current.demoFallback ?? envBoolean(process.env.MOSAIC_DEMO_FALLBACK),
  };
}

export function updateRuntimeConfig(update: RuntimeConfigUpdate): RuntimeConfigStatus {
  const current = overrides();

  for (const key of [
    "hermesBaseUrl",
    "hermesApiKey",
    "openAiApiKey",
    "convexUrl",
    "convexAuthToken",
  ] as const) {
    const value = normalized(update[key]);
    if (value !== undefined) current[key] = value;
  }

  if (typeof update.demoFallback === "boolean") {
    current.demoFallback = update.demoFallback;
  }

  return getRuntimeConfigStatus();
}

function fieldStatus(value: string | undefined): RuntimeConfigFieldStatus {
  if (!value) return { configured: false };

  return {
    configured: true,
    maskedSuffix: value.length > 4 ? `••••${value.slice(-4)}` : "••••",
  };
}

export function getRuntimeConfigStatus(): RuntimeConfigStatus {
  const config = getRuntimeConfig();

  return {
    hermesBaseUrl: fieldStatus(config.hermesBaseUrl),
    hermesApiKey: fieldStatus(config.hermesApiKey),
    openAiApiKey: fieldStatus(config.openAiApiKey),
    convexUrl: fieldStatus(config.convexUrl),
    convexAuthToken: fieldStatus(config.convexAuthToken),
    demoFallback: config.demoFallback,
  };
}
