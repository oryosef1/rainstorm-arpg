#!/usr/bin/env ts-node

// Create Feature CLI - Command-line tool for generating feature pods
// Enables rapid feature creation for conflict-free parallel development

import { FeatureGenerator, FeatureSpec } from './feature-generator';
import { prompt } from 'enquirer';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CLIOptions {
  name?: string;
  description?: string;
  category?: string;
  interactive?: boolean;
  template?: string;
  outputDir?: string;
  skipTests?: boolean;
  skipConfig?: boolean;
  skipReadme?: boolean;
}

class FeatureCLI {
  private generator: FeatureGenerator;

  constructor() {
    this.generator = new FeatureGenerator({
      featuresDirectory: './features',
      enableNpmInit: true,
      enableGitInit: false,
      includeExamples: true
    });
  }

  async run(args: string[]): Promise<void> {
    try {
      console.log('🚀 Feature Pod Generator - Conflict-Free Parallel Development');
      console.log('================================================================\n');

      const options = this.parseArguments(args);

      if (options.interactive || !options.name) {
        await this.runInteractiveMode();
      } else {
        await this.runDirectMode(options);
      }

    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  }

  private parseArguments(args: string[]): CLIOptions {
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--name':
        case '-n':
          options.name = nextArg;
          i++;
          break;
        case '--description':
        case '-d':
          options.description = nextArg;
          i++;
          break;
        case '--category':
        case '-c':
          options.category = nextArg;
          i++;
          break;
        case '--template':
        case '-t':
          options.template = nextArg;
          i++;
          break;
        case '--output':
        case '-o':
          options.outputDir = nextArg;
          i++;
          break;
        case '--interactive':
        case '-i':
          options.interactive = true;
          break;
        case '--skip-tests':
          options.skipTests = true;
          break;
        case '--skip-config':
          options.skipConfig = true;
          break;
        case '--skip-readme':
          options.skipReadme = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return options;
  }

  private async runInteractiveMode(): Promise<void> {
    console.log('🎯 Interactive Feature Generator\n');

    try {
      // Basic information
      const basicInfo = await prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Feature name (kebab-case):',
          validate: (value: string) => {
            if (!value) return 'Feature name is required';
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
              return 'Feature name must be in kebab-case format (e.g., my-feature)';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'description',
          message: 'Feature description:',
          validate: (value: string) => value ? true : 'Description is required'
        },
        {
          type: 'select',
          name: 'category',
          message: 'Feature category:',
          choices: ['ui', 'backend', 'game', 'utility', 'integration']
        },
        {
          type: 'input',
          name: 'version',
          message: 'Version:',
          initial: '1.0.0'
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author:',
          initial: 'AI Agent'
        }
      ]) as any;

      // Check if feature already exists
      const exists = await this.generator.featureExists(basicInfo.name);
      if (exists) {
        const overwrite = await prompt({
          type: 'confirm',
          name: 'overwrite',
          message: `Feature '${basicInfo.name}' already exists. Overwrite?`,
          initial: false
        }) as any;

        if (!overwrite.overwrite) {
          console.log('❌ Feature generation cancelled');
          return;
        }
      }

      // Dependencies
      const dependenciesInfo = await prompt([
        {
          type: 'list',
          name: 'dependencies',
          message: 'Dependencies (comma-separated, leave empty for none):',
          separator: ','
        }
      ]) as any;

      // API methods
      const apiInfo = await prompt([
        {
          type: 'confirm',
          name: 'hasApis',
          message: 'Add API methods?',
          initial: true
        }
      ]) as any;

      let apis: any[] = [];
      if (apiInfo.hasApis) {
        apis = await this.collectAPISpecs();
      }

      // Events
      const eventInfo = await prompt([
        {
          type: 'confirm',
          name: 'hasEvents',
          message: 'Add events?',
          initial: true
        }
      ]) as any;

      let events: any[] = [];
      if (eventInfo.hasEvents) {
        events = await this.collectEventSpecs();
      }

      // File options
      const fileOptions = await prompt([
        {
          type: 'confirm',
          name: 'includeTests',
          message: 'Include test file?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'includeConfig',
          message: 'Include configuration file?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'includeReadme',
          message: 'Include README?',
          initial: true
        }
      ]) as any;

      // Build feature spec
      const spec: FeatureSpec = {
        name: basicInfo.name,
        description: basicInfo.description,
        category: basicInfo.category,
        version: basicInfo.version,
        author: basicInfo.author,
        dependencies: dependenciesInfo.dependencies ? 
          dependenciesInfo.dependencies.map((d: string) => d.trim()).filter((d: string) => d) : 
          [],
        apis,
        events,
        includeTests: fileOptions.includeTests,
        includeConfig: fileOptions.includeConfig,
        includeReadme: fileOptions.includeReadme
      };

      // Generate feature
      await this.generateFeature(spec);

    } catch (error) {
      if ((error as any).name === 'cancelledError') {
        console.log('\n❌ Feature generation cancelled');
        return;
      }
      throw error;
    }
  }

  private async collectAPISpecs(): Promise<any[]> {
    const apis: any[] = [];
    let addMore = true;

    while (addMore) {
      console.log(`\n📋 API Method ${apis.length + 1}:`);

      const apiInfo = await prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Method name:',
          validate: (value: string) => {
            if (!value) return 'Method name is required';
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) {
              return 'Method name must be valid JavaScript identifier';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'description',
          message: 'Method description:',
          validate: (value: string) => value ? true : 'Description is required'
        },
        {
          type: 'input',
          name: 'returnType',
          message: 'Return type:',
          initial: 'Promise<void>'
        },
        {
          type: 'confirm',
          name: 'async',
          message: 'Async method?',
          initial: true
        }
      ]) as any;

      // Collect parameters
      const parameters: any[] = [];
      let addMoreParams = true;

      const hasParams = await prompt({
        type: 'confirm',
        name: 'hasParameters',
        message: 'Add parameters?',
        initial: false
      }) as any;

      if (hasParams.hasParameters) {
        while (addMoreParams) {
          console.log(`  Parameter ${parameters.length + 1}:`);

          const paramInfo = await prompt([
            {
              type: 'input',
              name: 'name',
              message: '    Name:',
              validate: (value: string) => value ? true : 'Parameter name is required'
            },
            {
              type: 'input',
              name: 'type',
              message: '    Type:',
              initial: 'string'
            },
            {
              type: 'confirm',
              name: 'required',
              message: '    Required?',
              initial: true
            },
            {
              type: 'input',
              name: 'description',
              message: '    Description:',
              validate: (value: string) => value ? true : 'Description is required'
            }
          ]) as any;

          parameters.push(paramInfo);

          const continueParams = await prompt({
            type: 'confirm',
            name: 'continue',
            message: '    Add another parameter?',
            initial: false
          }) as any;

          addMoreParams = continueParams.continue;
        }
      }

      apis.push({
        ...apiInfo,
        parameters
      });

      const continueApis = await prompt({
        type: 'confirm',
        name: 'continue',
        message: 'Add another API method?',
        initial: false
      }) as any;

      addMore = continueApis.continue;
    }

    return apis;
  }

  private async collectEventSpecs(): Promise<any[]> {
    const events: any[] = [];
    let addMore = true;

    while (addMore) {
      console.log(`\n📡 Event ${events.length + 1}:`);

      const eventInfo = await prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Event name (dot notation):',
          validate: (value: string) => {
            if (!value) return 'Event name is required';
            if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/.test(value)) {
              return 'Event name must use dot notation (e.g., feature.action.happened)';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'description',
          message: 'Event description:',
          validate: (value: string) => value ? true : 'Description is required'
        },
        {
          type: 'select',
          name: 'direction',
          message: 'Event direction:',
          choices: [
            { name: 'emit', message: 'Emit (this feature sends)' },
            { name: 'listen', message: 'Listen (this feature receives)' }
          ]
        }
      ]) as any;

      events.push({
        name: eventInfo.name,
        description: eventInfo.description,
        listen: eventInfo.direction === 'listen'
      });

      const continueEvents = await prompt({
        type: 'confirm',
        name: 'continue',
        message: 'Add another event?',
        initial: false
      }) as any;

      addMore = continueEvents.continue;
    }

    return events;
  }

  private async runDirectMode(options: CLIOptions): Promise<void> {
    if (!options.name) {
      throw new Error('Feature name is required. Use --name or -n flag.');
    }

    // Get template if specified
    let template: Partial<FeatureSpec> = {};
    if (options.template) {
      template = this.generator.getFeatureTemplate(options.template);
    }

    const spec: FeatureSpec = {
      name: options.name,
      description: options.description || `Auto-generated feature: ${options.name}`,
      category: options.category as any || 'utility',
      includeTests: !options.skipTests,
      includeConfig: !options.skipConfig,
      includeReadme: !options.skipReadme,
      ...template
    };

    await this.generateFeature(spec);
  }

  private async generateFeature(spec: FeatureSpec): Promise<void> {
    console.log('\n🏗️ Generating feature...\n');

    const result = await this.generator.generateFeature(spec);

    if (result.success) {
      console.log('✅ Feature generated successfully!\n');
      console.log(`📁 Location: ${result.featurePath}`);
      console.log(`📄 Files created: ${result.filesCreated?.length || 0}`);
      
      if (result.filesCreated) {
        result.filesCreated.forEach(file => {
          console.log(`   - ${path.basename(file)}`);
        });
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        result.warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      }

      console.log('\n🎯 Next steps:');
      console.log('   1. Review and implement the TODO items in the generated files');
      console.log('   2. Run tests: npm test');
      console.log('   3. Start development: npm run dev');
      console.log('   4. The feature will be auto-discovered and loaded');

    } else {
      console.error('❌ Feature generation failed:', result.error);
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log(`
🚀 Feature Pod Generator - Conflict-Free Parallel Development

USAGE:
  npm run create-feature [options]
  ts-node tools/create-feature.ts [options]

OPTIONS:
  -n, --name <name>         Feature name (kebab-case)
  -d, --description <desc>  Feature description
  -c, --category <cat>      Feature category (ui|backend|game|utility|integration)
  -t, --template <tmpl>     Use template (ui|backend|game|utility)
  -o, --output <dir>        Output directory (default: ./features)
  -i, --interactive         Interactive mode (default if no name provided)
      --skip-tests          Skip test file generation
      --skip-config         Skip config file generation
      --skip-readme         Skip README generation
  -h, --help               Show this help

EXAMPLES:
  # Interactive mode
  npm run create-feature

  # Quick generation
  npm run create-feature --name my-feature --description "My awesome feature"

  # Use template
  npm run create-feature --name ui-component --template ui

  # Backend service
  npm run create-feature --name user-service --category backend --description "User management service"

FEATURE CATEGORIES:
  ui          - User interface components
  backend     - Backend services and APIs
  game        - Game logic and mechanics
  utility     - Utility functions and helpers
  integration - Third-party integrations

TEMPLATES:
  ui          - Pre-configured for UI components with render methods
  backend     - Pre-configured for backend services with request processing
  game        - Pre-configured for game features with update loops
  utility     - Basic utility feature template

The generated feature will be completely isolated and ready for conflict-free parallel development!
`);
  }
}

// CLI entry point
if (require.main === module) {
  const cli = new FeatureCLI();
  const args = process.argv.slice(2);
  
  cli.run(args).catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { FeatureCLI };

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeatureCLI };
}