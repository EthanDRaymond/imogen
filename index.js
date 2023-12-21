#! /usr/bin/env node

import fs from 'fs';
import { exec } from 'child_process';
import { program } from 'commander';
import schedule from 'node-schedule';

import { validateConfig } from './src/validateConfig.js';

program
	.name('imogen')
	.version('0.1.2');
program.command('run')
	.description('Run imogen job scheduler.')
	.option('-c, --config <string>', 'Config file', 'test.config.json')
	.action(
		(str, options) => {
			// Load Options
			const opts = options.opts();

			// Load config
			let config = fs.readFileSync(opts.config);
			config = JSON.parse(config);

			// Validate Config
			validateConfig(config);
			console.log('The config file is valid.');

			// Schedule Jobs
			config.jobs.forEach(
				(job) => {
					let isRunning = false;

					schedule.scheduleJob(
						job.time,
						async () => {
							if (!(isRunning && job.concurrent)) {
								console.log(`Starting execution of job "${job.command}".`);
								isRunning = true;
								exec(
									job.command,
									(err, stdout, stderr) => {
										if (err) {
											console.error(`Failed to run job: ${err}`);
										}
										if (stdout) {
											console.log(`Execution STDOUT:\n${stdout}`);
										}
										if (stderr) {
											console.log(`Execution STDERR:\n${stderr}`);
										}
										console.log(`Finished execution of job "${job.command}".`);
									},
								);
								isRunning = false;
							}
						},
					);
				},
			);
		},
	);
program.command('validate')
	.description('Validate a configuration file.')
	.option('-c, --config <string>', 'Config file', 'test.config.json')
	.action(
		(str, options) => {
			// Load Options
			const opts = options.opts();

			// Load config
			let config = fs.readFileSync(opts.config);
			config = JSON.parse(config);

			// Validate Config
			validateConfig(config);
			console.log('The config file is valid.');
		},
	);

program.parse();
