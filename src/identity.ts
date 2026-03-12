import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

export interface AuthConfig {
  apiUrl: string;
  provider?: string;
  updatedAt: string;
}

export interface HttpJsonResponse {
  statusCode: number;
  data: any;
}

export interface AttestRequest {
  tool: string;
  runtime: string;
  repo: string;
  identityToken: string;
}

export interface AttestResponse {
  agent_id: string;
  certificate: string;
  expires?: string;
}

const DEFAULT_API_URL = 'https://api.provenancecode.org';
const AUTH_DIR = path.join(os.homedir(), '.provenancecode');
const TOKEN_PATH = path.join(AUTH_DIR, 'token');
const AUTH_CONFIG_PATH = path.join(AUTH_DIR, 'config.json');

export function getDefaultApiUrl(): string {
  return DEFAULT_API_URL;
}

export function getTokenPath(): string {
  return TOKEN_PATH;
}

export function getAuthDir(): string {
  return AUTH_DIR;
}

export function readStoredToken(): string | null {
  if (!fs.existsSync(TOKEN_PATH)) {
    return null;
  }

  const token = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
  return token.length > 0 ? token : null;
}

export function writeStoredToken(token: string): void {
  fs.ensureDirSync(AUTH_DIR);
  fs.writeFileSync(TOKEN_PATH, token.trim(), { mode: 0o600 });
  fs.chmodSync(TOKEN_PATH, 0o600);
}

export function readAuthConfig(): AuthConfig | null {
  if (!fs.existsSync(AUTH_CONFIG_PATH)) {
    return null;
  }

  try {
    return fs.readJsonSync(AUTH_CONFIG_PATH);
  } catch (error) {
    return null;
  }
}

export function writeAuthConfig(config: AuthConfig): void {
  fs.ensureDirSync(AUTH_DIR);
  fs.writeJsonSync(AUTH_CONFIG_PATH, config, { spaces: 2 });
}

export function resolveApiUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.trim().length > 0) {
    return trimTrailingSlash(overrideUrl.trim());
  }

  if (process.env.PROVC_API_URL && process.env.PROVC_API_URL.trim().length > 0) {
    return trimTrailingSlash(process.env.PROVC_API_URL.trim());
  }

  const saved = readAuthConfig();
  if (saved && saved.apiUrl) {
    return trimTrailingSlash(saved.apiUrl);
  }

  return DEFAULT_API_URL;
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function openBrowserUrl(url: string): boolean {
  try {
    if (process.platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
      return true;
    }

    if (process.platform === 'win32') {
      execSync(`cmd /c start "" "${url}"`, { stdio: 'ignore' });
      return true;
    }

    execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

export function postJson(url: string, payload: any, headers: Record<string, string> = {}): Promise<HttpJsonResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const requestBody = JSON.stringify(payload);

    const requestHeaders: Record<string, string | number> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      ...headers
    };

    const transport = target.protocol === 'https:' ? https : http;
    const req = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: requestHeaders
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk.toString();
        });

        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          let parsed: any = body;

          try {
            parsed = body.length > 0 ? JSON.parse(body) : {};
          } catch (error) {
            parsed = {
              raw: body
            };
          }

          if (statusCode >= 200 && statusCode < 300) {
            resolve({
              statusCode,
              data: parsed
            });
            return;
          }

          reject(new Error(`HTTP ${statusCode}: ${JSON.stringify(parsed)}`));
        });
      }
    );

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

export function getRepoSlug(baseDir: string): string {
  try {
    const remote = execSync('git config --get remote.origin.url', { cwd: baseDir }).toString().trim();
    const normalized = remote
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/\.git$/, '');

    const match = normalized.match(/github\.com\/([^/]+\/[^/]+)$/);
    if (match) {
      return match[1];
    }

    const generic = normalized.match(/[:/]([^/]+\/[^/]+)$/);
    if (generic) {
      return generic[1];
    }
  } catch (error) {
    // Ignore and fallback
  }

  return 'unknown/unknown';
}

export function sha256File(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export interface SignatureOutput {
  signature: string;
  publicKey: string;
}

export function signHashEd25519(hashHex: string): SignatureOutput {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const digest = Buffer.from(hashHex, 'hex');
  const signed = crypto.sign(null, digest, privateKey).toString('base64');
  const exportedPublic = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  return {
    signature: signed,
    publicKey: exportedPublic
  };
}

export function verifyHashEd25519(hashHex: string, signatureBase64: string, publicKeyPem: string): boolean {
  try {
    const digest = Buffer.from(hashHex, 'hex');
    const signature = Buffer.from(signatureBase64, 'base64');
    return crypto.verify(null, digest, publicKeyPem, signature);
  } catch (error) {
    return false;
  }
}

export function decodeJwtPayload(jwt: string): any | null {
  const parts = jwt.split('.');
  if (parts.length < 2) {
    return null;
  }

  const payload = parts[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);

  try {
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export function attestAgent(apiUrl: string, request: AttestRequest): Promise<AttestResponse> {
  const url = `${trimTrailingSlash(apiUrl)}/agent/attest`;
  return postJson(
    url,
    {
      tool: request.tool,
      runtime: request.runtime,
      repo: request.repo,
      identity_token: request.identityToken
    },
    {
      Authorization: `Bearer ${request.identityToken}`
    }
  ).then((result) => result.data as AttestResponse);
}

export function logProvenance(
  apiUrl: string,
  identityToken: string,
  payload: {
    agent_id: string;
    artifact_hash: string;
    signature: string;
    tool: string;
    repo: string;
  }
): Promise<void> {
  const url = `${trimTrailingSlash(apiUrl)}/provenance/log`;
  return postJson(url, payload, {
    Authorization: `Bearer ${identityToken}`
  }).then(() => undefined);
}
