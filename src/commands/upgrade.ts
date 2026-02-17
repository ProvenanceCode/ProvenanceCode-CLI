import chalk from 'chalk';

/**
 * Upgrade command - Show info about GitHub App
 */
export function upgradeCommand(): void {
  console.log();
  console.log(chalk.blue.bold('🎯 Want More from ProvenanceCode?'));
  console.log();
  console.log(chalk.gray('You\'re using the ProvenanceCode CLI - perfect for individual developers!'));
  console.log();
  console.log(chalk.bold('Your team might benefit from:'));
  console.log();
  console.log(chalk.green('  ✨ Real-time dashboards') + chalk.gray(' across all repositories'));
  console.log(chalk.green('  ✨ Approval workflows') + chalk.gray(' that actually work'));
  console.log(chalk.green('  ✨ Decision quality metrics') + chalk.gray(' for the whole team'));
  console.log(chalk.green('  ✨ Automatic PR integration') + chalk.gray(' and enforcement'));
  console.log(chalk.green('  ✨ Compliance reporting') + chalk.gray(' (SOC2, ISO27001, etc.)'));
  console.log(chalk.green('  ✨ Cross-repo analytics') + chalk.gray(' and insights'));
  console.log(chalk.green('  ✨ Team collaboration') + chalk.gray(' with Slack/Teams integration'));
  console.log();
  console.log(chalk.bold('Check out the ProvenanceCode GitHub App:'));
  console.log(chalk.cyan('  → https://provenancecode.org/app'));
  console.log();
  console.log(chalk.gray('The CLI is free forever. The GitHub App adds team governance.'));
  console.log();
  console.log(chalk.dim('(This is the only time we\'ll show this message. Promise.)'));
  console.log();
}

