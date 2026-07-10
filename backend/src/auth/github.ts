/**
 * GitHub OAuth helpers — isolated behind injectable fetch for testability.
 */

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUser {
  login: string;
  id: number;
}

export interface GitHubAuthDeps {
  fetch: typeof globalThis.fetch;
}

const defaultDeps: GitHubAuthDeps = { fetch: globalThis.fetch };

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  deps: GitHubAuthDeps = defaultDeps,
): Promise<GitHubTokenResponse | null> {
  const response = await deps.fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.access_token !== 'string') return null;

  return data as unknown as GitHubTokenResponse;
}

export async function fetchGitHubUser(
  accessToken: string,
  deps: GitHubAuthDeps = defaultDeps,
): Promise<GitHubUser | null> {
  const response = await deps.fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.login !== 'string') return null;

  return data as unknown as GitHubUser;
}
