import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import {
  attestAgent,
  decodeJwtPayload,
  getRepoSlug,
  logProvenance,
  readStoredToken,
  resolveApiUrl,
  sha256File,
  signHashEd25519
} from '../identity';

export interface SignOptions {
  apiUrl?: string;
  tool?: string;
  runtime?: string;
  repo?: string;
  identityToken?: string;
  noAttest?: boolean;
  noLog?: boolean;
}

interface ProvenanceRecord {
  schema: string;
  artifact: string;
  artifact_hash: string;
  signature: string;
  signature_algorithm: string;
  public_key: string;
  timestamp: string;
  tool: string;
  runtime: string;
  repo: string;
  agent_id: string;
  certificate?: string;
  certificate_expires?: string;
  user?: string;
  org?: string;
}

/**
 * Sign command - hashes and signs an artifact and writes sidecars.
 */
export function signCommand(baseDir: string, artifact: string, options: SignOptions = {}): Promise<void> {
  const artifactPath = path.resolve(baseDir, artifact);

  if (!fs.existsSync(artifactPath)) {
    return Promise.reject(new Error(`Artifact not found: ${artifact}`));
  }

  const apiUrl = resolveApiUrl(options.apiUrl);
  const identityToken = options.identityToken || readStoredToken();
  const tool = options.tool || 'prvc';
  const runtime = options.runtime || 'cli';
  const repo = options.repo || getRepoSlug(baseDir);

  const hashHex = sha256File(artifactPath);
  const signatureOutput = signHashEd25519(hashHex);
  const timestamp = new Date().toISOString();
  const artifactHash = `sha256:${hashHex}`;

  let attestationPromise = Promise.resolve(null as any);
  if (!options.noAttest && identityToken) {
    attestationPromise = attestAgent(apiUrl, {
      tool,
      runtime,
      repo,
      identityToken
    }).catch((error) => {
      console.log(chalk.yellow('⚠️  Attestation failed. Continuing with local signature.'));
      console.log(chalk.gray(`   ${error.message}`));
      return null;
    });
  }

  return attestationPromise.then((attestation) => {
    const certClaims = attestation && attestation.certificate ? decodeJwtPayload(attestation.certificate) : null;
    const identityClaims = identityToken ? decodeJwtPayload(identityToken) : null;

    const record: ProvenanceRecord = {
      schema: 'provenancecode.agent.provenance@1',
      artifact: path.basename(artifactPath),
      artifact_hash: artifactHash,
      signature: signatureOutput.signature,
      signature_algorithm: 'ed25519',
      public_key: signatureOutput.publicKey,
      timestamp,
      tool,
      runtime,
      repo,
      agent_id: (attestation && attestation.agent_id) || 'local-agent',
      certificate: attestation ? attestation.certificate : undefined,
      certificate_expires: attestation ? attestation.expires : undefined,
      user:
        (certClaims && (certClaims.user || certClaims.user_id || certClaims.email)) ||
        (identityClaims && (identityClaims.email || identityClaims.sub)),
      org: (certClaims && (certClaims.org || certClaims.org_id)) || (identityClaims && identityClaims.org)
    };

    const signatureFilePath = `${artifactPath}.sig`;
    const provenanceFilePath = `${artifactPath}.prov.json`;

    fs.writeJsonSync(
      signatureFilePath,
      {
        schema: 'provenancecode.artifact.signature@1',
        artifact: path.basename(artifactPath),
        artifact_hash: artifactHash,
        algorithm: 'ed25519',
        signature: signatureOutput.signature,
        public_key: signatureOutput.publicKey,
        timestamp
      },
      { spaces: 2 }
    );

    fs.writeJsonSync(provenanceFilePath, record, { spaces: 2 });

    console.log(chalk.green('✅ Artifact signed'));
    console.log(chalk.gray(`   Artifact:   ${path.relative(baseDir, artifactPath)}`));
    console.log(chalk.gray(`   Signature:  ${path.relative(baseDir, signatureFilePath)}`));
    console.log(chalk.gray(`   Provenance: ${path.relative(baseDir, provenanceFilePath)}`));
    console.log(chalk.gray(`   Hash:       ${artifactHash}`));
    console.log(chalk.gray(`   Agent ID:   ${record.agent_id}`));

    if (!options.noLog && identityToken && attestation && attestation.agent_id) {
      return logProvenance(apiUrl, identityToken, {
        agent_id: attestation.agent_id,
        artifact_hash: artifactHash,
        signature: signatureOutput.signature,
        tool,
        repo
      })
        .then(() => {
          console.log(chalk.gray('   Provenance log: submitted to API'));
        })
        .catch((error) => {
          console.log(chalk.yellow('⚠️  Could not submit provenance log.'));
          console.log(chalk.gray(`   ${error.message}`));
        });
    }

    if (!identityToken) {
      console.log(chalk.yellow('ℹ️  No identity token found. Use `prvc login` for attestation/logging.'));
    }

    return Promise.resolve();
  });
}
