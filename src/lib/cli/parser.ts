/**
 * Argument Parser and Validation
 * 
 * This file implements command line argument parsing and validation for CLI system.
 */

import type { CommandOption, CommandArgs } from './types';

/**
 * Parsed argument result
 */
interface ParseResult {
	/** Parsed command arguments */
	args: CommandArgs;
	
	/** Whether parsing was successful */
	success: boolean;
	
	/** Error message if parsing failed */
	error?: string;
	
	/** Help requested flag */
	helpRequested: boolean;
}

/**
 * Command line argument parser
 */
export class ArgumentParser {
	private options: CommandOption[];
	private commandName: string;
	
	/**
	 * Create a new argument parser
	 * @param commandName Name of the command
	 * @param options Command options
	 */
	constructor(commandName: string, options: CommandOption[] = []) {
		this.commandName = commandName;
		this.options = options;
	}
	
	/**
	 * Parse command line arguments
	 * @param argv Raw command line arguments
	 * @returns Parse result
	 */
	parse(argv: string[]): ParseResult {
		try {
			const args = this.parseArguments(argv);
			return {
				args,
				success: true,
				helpRequested: args.hasFlag('help')
			};
		} catch (error) {
			return {
				args: this.createEmptyArgs(argv),
				success: false,
				error: error instanceof Error ? error.message : String(error),
				helpRequested: false
			};
		}
	}
	
	/**
	 * Parse arguments into CommandArgs object
	 * @param argv Raw arguments
	 * @returns Parsed command arguments
	 */
	private parseArguments(argv: string[]): CommandArgs {
		const positionals: string[] = [];
		const options: Record<string, any> = {};
		const multiOptions: Record<string, any[]> = {};
		
		let i = 0;
		while (i < argv.length) {
			const arg = argv[i];
			
			// Handle long options (--option)
			if (arg.startsWith('--')) {
				i = this.parseLongOption(arg, argv, i, options, multiOptions);
			}
			// Handle short options (-o, -abc)
			else if (arg.startsWith('-') && !arg.startsWith('--')) {
				i = this.parseShortOption(arg, argv, i, options, multiOptions);
			}
			// Handle positional arguments
			else {
				positionals.push(arg);
				i++;
			}
		}
		
		// Apply defaults for missing options
		this.applyDefaults(options);
		
		// Handle multi-value options
		for (const [name, values] of Object.entries(multiOptions)) {
			if (values.length > 0) {
				options[name] = values;
			}
		}
		
		return this.createCommandArgs(positionals, options, argv);
	}
	
	/**
	 * Parse a long option (--option)
	 * @param arg Option argument
	 * @param argv All arguments
	 * @param index Current index
	 * @param options Options object
	 * @param multiOptions Multi-value options object
	 * @returns New index
	 */
	private parseLongOption(
		arg: string,
		argv: string[],
		index: number,
		options: Record<string, any>,
		multiOptions: Record<string, any[]>
	): number {
		const eqIndex = arg.indexOf('=');
		let name: string;
		let value: any = true;
		
		if (eqIndex > 0) {
			// Option with value: --option=value
			name = arg.substring(2, eqIndex);
			value = arg.substring(eqIndex + 1);
		} else {
			// Option without value: --option
			name = arg.substring(2);
		}
		
		const option = this.findOption(name);
		if (!option) {
			throw new Error(`Unknown option: --${name}`);
		}
		
		// Handle boolean flags
		if (!option.hasValue) {
			options[name] = true;
			return index + 1;
		}
		
		// Handle options with values
		if (eqIndex > 0) {
			// Value provided with = syntax
			if (option.choices && !option.choices.includes(value)) {
				throw new Error(`Invalid value for --${name}: ${value}. ` +
					`Allowed values: ${option.choices.join(', ')}`);
			}
			
			if (option.multiple) {
				if (!multiOptions[name]) multiOptions[name] = [];
				multiOptions[name].push(value);
			} else {
				options[name] = value;
			}
			
			return index + 1;
		} else {
			// Value should be next argument
			if (index + 1 >= argv.length) {
				throw new Error(`Option --${name} requires a value`);
			}
			
			const nextArg = argv[index + 1];
			
			// Check if next argument is another option
			if (nextArg.startsWith('-')) {
				throw new Error(`Option --${name} requires a value`);
			}
			
			if (option.choices && !option.choices.includes(nextArg)) {
				throw new Error(`Invalid value for --${name}: ${nextArg}. ` +
					`Allowed values: ${option.choices.join(', ')}`);
			}
			
			if (option.multiple) {
				if (!multiOptions[name]) multiOptions[name] = [];
				multiOptions[name].push(nextArg);
			} else {
				options[name] = nextArg;
			}
			
			return index + 2;
		}
	}
	
	/**
	 * Parse a short option (-o or -abc)
	 * @param arg Option argument
	 * @param argv All arguments
	 * @param index Current index
	 * @param options Options object
	 * @param multiOptions Multi-value options object
	 * @returns New index
	 */
	private parseShortOption(
		arg: string,
		argv: string[],
		index: number,
		options: Record<string, any>,
		multiOptions: Record<string, any[]>
	): number {
		const chars = arg.substring(1);
		
		// Handle combined flags (-abc)
		if (chars.length > 1) {
			for (let i = 0; i < chars.length; i++) {
				const char = chars[i];
				const option = this.findOptionByShort(char);
				
				if (!option) {
					throw new Error(`Unknown option: -${char}`);
				}
				
				if (option.hasValue) {
					// Last character in combined flags can have a value
					if (i === chars.length - 1) {
						return this.parseShortOptionWithValue(
							`-${char}`,
							argv,
							index,
							options,
							multiOptions
						);
					} else {
						throw new Error(`Option -${char} requires a value`);
					}
				} else {
					options[option.name] = true;
				}
			}
			
			return index + 1;
		}
		
		// Handle single short option
		return this.parseShortOptionWithValue(arg, argv, index, options, multiOptions);
	}
	
	/**
	 * Parse a short option with a value
	 * @param arg Option argument
	 * @param argv All arguments
	 * @param index Current index
	 * @param options Options object
	 * @param multiOptions Multi-value options object
	 * @returns New index
	 */
	private parseShortOptionWithValue(
		arg: string,
		argv: string[],
		index: number,
		options: Record<string, any>,
		multiOptions: Record<string, any[]>
	): number {
		const char = arg.substring(1);
		const option = this.findOptionByShort(char);
		
		if (!option) {
			throw new Error(`Unknown option: -${char}`);
		}
		
		if (!option.hasValue) {
			options[option.name] = true;
			return index + 1;
		}
		
		// Check if value is provided with = syntax
		const eqIndex = arg.indexOf('=');
		if (eqIndex > 0) {
			const value = arg.substring(eqIndex + 1);
			
			if (option.choices && !option.choices.includes(value)) {
				throw new Error(`Invalid value for -${char}: ${value}. ` +
					`Allowed values: ${option.choices.join(', ')}`);
			}
			
			if (option.multiple) {
				if (!multiOptions[option.name]) multiOptions[option.name] = [];
				multiOptions[option.name].push(value);
			} else {
				options[option.name] = value;
			}
			
			return index + 1;
		}
		
		// Value should be next argument
		if (index + 1 >= argv.length) {
			throw new Error(`Option -${char} requires a value`);
		}
		
		const nextArg = argv[index + 1];
		
		// Check if next argument is another option
		if (nextArg.startsWith('-')) {
			throw new Error(`Option -${char} requires a value`);
		}
		
		if (option.choices && !option.choices.includes(nextArg)) {
			throw new Error(`Invalid value for -${char}: ${nextArg}. ` +
				`Allowed values: ${option.choices.join(', ')}`);
		}
		
		if (option.multiple) {
			if (!multiOptions[option.name]) multiOptions[option.name] = [];
			multiOptions[option.name].push(nextArg);
		} else {
			options[option.name] = nextArg;
		}
		
		return index + 2;
	}
	
	/**
	 * Find an option by name
	 * @param name Option name
	 * @returns Option or null if not found
	 */
	private findOption(name: string): CommandOption | null {
		return this.options.find(opt => opt.name === name) || null;
	}
	
	/**
	 * Find an option by short form
	 * @param short Short form
	 * @returns Option or null if not found
	 */
	private findOptionByShort(short: string): CommandOption | null {
		return this.options.find(opt => opt.short === short) || null;
	}
	
	/**
	 * Apply default values to options
	 * @param options Options object
	 */
	private applyDefaults(options: Record<string, any>): void {
		for (const option of this.options) {
			if (option.default !== undefined && !(option.name in options)) {
				options[option.name] = option.default;
			}
		}
	}
	
	/**
	 * Create a CommandArgs object
	 * @param positionals Positional arguments
	 * @param options Named options
	 * @param raw Raw arguments
	 * @returns CommandArgs object
	 */
	private createCommandArgs(
		positionals: string[],
		options: Record<string, any>,
		raw: string[]
	): CommandArgs {
		const command = positionals[0] || this.commandName;
		const subcommand = positionals[1];
		
		return {
			command,
			subcommand,
			positionals: positionals.slice(1),
			options,
			raw,
			
			getOption: (name: string, defaultValue?: any) => {
				return options[name] !== undefined ? options[name] : defaultValue;
			},
			
			hasOption: (name: string) => {
				return name in options;
			},
			
			hasFlag: (name: string) => {
				return options[name] === true;
			},
			
			getOptions: (name: string) => {
				const value = options[name];
				if (Array.isArray(value)) {
					return value;
				}
				return value ? [value] : [];
			}
		};
	}
	
	/**
	 * Create empty CommandArgs for error cases
	 * @param raw Raw arguments
	 * @returns Empty CommandArgs
	 */
	private createEmptyArgs(raw: string[]): CommandArgs {
		return {
			command: this.commandName,
			positionals: [],
			options: {},
			raw,
			
			getOption: (name: string, defaultValue?: any) => defaultValue,
			hasOption: (name: string) => false,
			hasFlag: (name: string) => false,
			getOptions: (name: string) => []
		};
	}
	
	/**
	 * Generate usage text
	 * @returns Usage string
	 */
	generateUsage(): string {
		const parts: string[] = [];
		
		// Command name
		parts.push(`Usage: ${this.commandName}`);
		
		// Options
		if (this.options.length > 0) {
			parts.push('[options]');
		}
		
		// Positional arguments
		// This would need to be customized per command
		parts.push('...');
		
		return parts.join(' ');
	}
	
	/**
	 * Generate options help text
	 * @returns Options help string
	 */
	generateOptionsHelp(): string {
		if (this.options.length === 0) {
			return '';
		}
		
		const lines: string[] = [];
		lines.push('Options:');
		
		// Calculate max option name length for alignment
		const maxNameLength = Math.max(...this.options.map(opt => {
			const name = `--${opt.name}`;
			const short = opt.short ? `-${opt.short}, ` : '';
			return short.length + name.length;
		}));
		
		for (const option of this.options) {
			const name = `--${option.name}`;
			const short = option.short ? `-${option.short}, ` : '';
			const fullName = `${short}${name}`;
			const padding = ' '.repeat(maxNameLength - fullName.length + 2);
			
			let line = `  ${fullName}${padding}${option.description}`;
			
			// Add default value if present
			if (option.default !== undefined) {
				line += ` (default: ${option.default})`;
			}
			
			// Add choices if present
			if (option.choices) {
				line += ` (choices: ${option.choices.join(', ')})`;
			}
			
			lines.push(line);
		}
		
		return lines.join('\n');
	}
}