/**
 * Id do build do WEB (short-sha ou carimbo AAMMDD.HHMM), injetado via
 * NEXT_PUBLIC_GIT_SHA em build-time pelo Dockerfile. Vazio em dev local.
 * A versão em si vem de ./changelog.
 */
const raw = (process.env.NEXT_PUBLIC_GIT_SHA ?? '').trim();

// Encurta só se for um sha git completo (40 hex); carimbo passa como veio.
export const BUILD_SHA = /^[0-9a-f]{40}$/i.test(raw) ? raw.slice(0, 7) : raw;
