#! /usr/bin/env node

import fs from 'fs';
import { exec } from 'child_process';
import { program } from 'commander';
import schedule from 'node-schedule';
import pino from 'pino';

import { validateConfig } from './src/validateConfig.js';

program
	.name('imogen')
	.version('0.3.0');
program.command('run')
	.description('Run imogen job scheduler.')
	.option('-c, --config <string>', 'Config file', 'test.config.json')
	.action(
		(str, options) => {
			// Load Options
			const opts = options.opts();

			// Set Default Config
			const DEFAULT_CONFIG = {
				record: {
					directory: 'records',
					writeStdOut: false,
					writeStdErr: false,
				}
			};

			// Load config
			let config = fs.readFileSync(opts.config);
			config = {
				...DEFAULT_CONFIG,
				...JSON.parse(config),
			};

			// Validate Config
			validateConfig(config);

			// Make Logger
			const logger = pino(config.pino.options, config.pino.destination);

			// Schedule Jobs
			config.jobs.forEach(
				(job) => {
					let isRunning = false;

					schedule.scheduleJob(
						job.time,
						async () => {
							if (!(isRunning && job.simultaneous)) {
								if (job.name !== undefined) {
									logger.info(`Starting execution of job "${job.name}".`);
								} else {
									logger.info(`Starting execution of job "${job.command}".`);
								}
								isRunning = true;
								exec(
									job.command,
									(err, stdout, stderr) => {
										// Log STDOUT and STDERR
										if (stdout) {
											logger.info(`Execution STDOUT:\n${stdout}`);
										}
										if (stderr) {
											logger.info(`Execution STDERR:\n${stderr}`);
										}

										if (err) {
											logger.error(`Failed to run job: ${err}`);
										} else {
											// Log job completion
											if (job.name !== undefined) {
												logger.info(`Finished execution of job "${job.name}".`);
											} else {
												logger.info(`Finished execution of job "${job.command}".`);
											}
										}
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
			// Make Logger
			const logger = pino();

			// Load Options
			const opts = options.opts();

			// Load config
			let config = fs.readFileSync(opts.config);
			config = JSON.parse(config);

			// Validate Config
			validateConfig(config);
			logger.info('Validated the config file.');
		},
	);

program.parse();
