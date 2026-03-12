import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { postJson, readStoredToken, resolveApiUrl, sha256File, verifyHashEd25519 } from '../identity';

export interface VerifyOptions {
  apiUrl?: string;
  sig?: string;
  provenance?: string;
  identityToken?: string;
}

/**
 * Verify command - verifies an artifact against API certificate checks.
 */
export function verifyCommand(baseDir: string, artifact: string, options: VerifyOptions = {}): Promise<void> {
  const artifactPath = path.resolve(baseDir, artifact);
  const sigPath = path.resolve(baseDir, options.sig || `${artifact}.sig`);
  const provenancePath = path.resolve(baseDir, options.provenance || `${artifact}.prov.json`);
  const apiUrl = resolveApiUrl(options.apiUrl);
  const identityToken = options.identityToken || readStoredToken();

  if (!fs.existsSync(artifactPath)) {
    return Promise.reject(new Error(`Artifact not found: ${artifact}`));
  }
  if (!fs.existsSync(sigPath)) {
    return Promise.reject(new Error(`Signature file not found: ${path.relative(baseDir, sigPath)}`));
  }
  if (!fs.existsSync(provenancePath)) {
    return Promise.reject(new Error(`Provenance file not found: ${path.relative(baseDir, provenancePath)}`));
  }

  const hashHex = sha256File(artifactPath);
  const artifactHash = `sha256:${hashHex}`;

  const signaturePayload = fs.readJsonSync(sigPath);
  const provenancePayload = fs.readJsonSync(provenancePath);

  const signature = signaturePayload.signature || provenancePayload.signature;
  const certificate = provenancePayload.certificate || signaturePayload.certificate;
  const publicKey = signaturePayload.public_key || provenancePayload.public_key;

  if (!signature) {
    return Promise.reject(new Error('Missing signature in .sig or .prov.json'));
  }

  const headers: Record<string, string> = {};
  if (identityToken) {
    headers.Authorization = `Bearer ${identityToken}`;
  }

  return postJson(
    `${apiUrl}/verify`,
    {
      artifact_hash: artifactHash,
      signature,
      certificate
    },
    headers
  )
    .then((response) => {
      const result = response.data || {};
      if (result.verified) {
        console.log(chalk.green('✅ Verified by ProvenanceCode API'));
        console.log(chalk.gray(`   Artifact: ${path.relative(baseDir, artifactPath)}`));
        console.log(chalk.gray(`   Agent:    ${result.agent_id || provenancePayload.agent_id || 'unknown'}`));
        if (result.user || provenancePayload.user) {
          console.log(chalk.gray(`   User:     ${result.user || provenancePayload.user}`));
        }
        if (result.org || provenancePayload.org) {
          console.log(chalk.gray(`   Org:      ${result.org || provenancePayload.org}`));
        }
        return;
      }

      throw new Error('API returned verified=false');
    })
    .catch((error) => {
      if (!publicKey) {
        throw new Error(
          `Remote verification failed (${error.message}) and no public key was available for local fallback.`
        );
      }

      const locallyVerified = verifyHashEd25519(hashHex, signature, publicKey);
      if (!locallyVerified) {
        throw new Error(`Remote verification failed (${error.message}) and local signature verification failed.`);
      }

      console.log(chalk.yellow('⚠️  API verification unavailable; verified locally'));
      console.log(chalk.gray(`   Artifact: ${path.relative(baseDir, artifactPath)}`));
      console.log(chalk.gray(`   Hash:     ${artifactHash}`));
      console.log(chalk.gray(`   Agent:    ${provenancePayload.agent_id || 'unknown'}`));
    });
}
