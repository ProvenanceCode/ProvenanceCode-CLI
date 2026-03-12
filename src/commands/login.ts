import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  getDefaultApiUrl,
  getTokenPath,
  openBrowserUrl,
  resolveApiUrl,
  writeAuthConfig,
  writeStoredToken
} from '../identity';

export interface LoginOptions {
  provider?: string;
  apiUrl?: string;
  token?: string;
  noBrowser?: boolean;
}

/**
 * Login command - stores an API JWT token for identity operations.
 */
export function loginCommand(options: LoginOptions = {}): Promise<void> {
  const provider = (options.provider || 'github').toLowerCase();
  const apiUrl = resolveApiUrl(options.apiUrl);

  const persist = (token: string): void => {
    writeStoredToken(token);
    writeAuthConfig({
      apiUrl,
      provider,
      updatedAt: new Date().toISOString()
    });

    console.log(chalk.green('✅ Login complete'));
    console.log(chalk.gray(`   Token stored at: ${getTokenPath()}`));
    console.log(chalk.gray(`   API endpoint:    ${apiUrl}`));
  };

  if (options.token && options.token.trim().length > 0) {
    persist(options.token.trim());
    return Promise.resolve();
  }

  const loginUrl = `${apiUrl}/auth/login?provider=${encodeURIComponent(provider)}&mode=cli`;
  console.log(chalk.blue('🔐 ProvenanceCode login'));
  console.log(chalk.gray(`   Provider: ${provider}`));
  console.log(chalk.gray(`   API:      ${apiUrl}`));
  console.log();
  console.log(chalk.cyan(`1) Authenticate in your browser: ${loginUrl}`));

  if (!options.noBrowser) {
    const opened = openBrowserUrl(loginUrl);
    if (opened) {
      console.log(chalk.gray('2) Browser opened. Complete login and copy your JWT token.'));
    } else {
      console.log(chalk.yellow('2) Could not auto-open browser. Open the URL manually.'));
    }
  } else {
    console.log(chalk.gray('2) Open the URL manually and copy your JWT token.'));
  }

  console.log(chalk.gray('3) Paste the token below to store it locally.'));
  console.log();

  return inquirer
    .prompt([
      {
        type: 'password',
        name: 'token',
        message: 'JWT token:',
        mask: '*',
        validate: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Token is required';
          }

          return true;
        }
      }
    ])
    .then((answers) => {
      persist((answers.token || '').trim());
      console.log();
      console.log(chalk.bold('Tip:'));
      console.log(
        chalk.gray(
          `  Set PROVC_API_URL to override API target (default: ${getDefaultApiUrl()}).`
        )
      );
    });
}
