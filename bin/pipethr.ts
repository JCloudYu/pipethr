#!/usr/bin/env node
import clipargs from "clipargs";
import fsp from "fs/promises";
import child from "child_process";
import path from "path";


const SIGNAL_MAP:{[key in NodeJS.Signals]: number} = Object.freeze({
	SIGHUP:		1,
	SIGINT:		2,
	SIGQUIT:	3,
	SIGILL:		4,
	SIGTRAP:	5,
	SIGABRT:	6,
	SIGBUS:		7,
	SIGFPE:		8,
	SIGKILL:	9,
	SIGUSR1:	10,
	SIGSEGV:	11,
	SIGUSR2:	12,
	SIGPIPE:	13,
	SIGALRM:	14,
	SIGTERM:	15,
	SIGCHLD:	17,
	SIGCONT:	18,
	SIGSTOP:	19,
	SIGTSTP:	20,
	SIGTTIN:	21,
	SIGTTOU:	22,
	SIGURG:		23,
	SIGXCPU:	24,
	SIGXFSZ:	25,
	SIGVTALRM:	26,
	SIGPROF:	27,
	SIGWINCH:	28,
	SIGIO:		29,
	SIGPWR:		30,
	SIGSYS:		31,

	SIGIOT:		127,
	SIGPOLL:	127,
	SIGSTKFLT:	127,
	SIGUNUSED:	127,
	SIGBREAK:	127,
	SIGLOST:	127,
	SIGINFO:	127
} as const);

const EXEC_ARGS:string[] = process.argv.slice(2);
const SHELL_ARGS:string[] = [];
if ( EXEC_ARGS.indexOf('--') >= 0 ) {
	const CMDS = EXEC_ARGS.splice(EXEC_ARGS.indexOf('--'));
	CMDS.shift();

	SHELL_ARGS.push(...CMDS)
}


const args:{
	_:string[];
	help?:boolean;
	silent?:boolean;
	daily?:string[];
	hourly?:string[];
	monthly?:string[];
	yearly?:string[];
} = clipargs
.flag('help', '--help')
.flag('silent', '-s', '--silent')
.flag('hourly', '-H', '--hourly')
.flag('daily', '-D', '--daily')
.flag('monthly', '-M', '--monthly')
.flag('yearly', '-Y', '--yearly')
.parse(EXEC_ARGS);


if ( args._.length <= 0 ) {
	console.error("Please provides LOG_PATH!");
	args.help = true;
}

if ( args.help ) {
	console.error("Usage: pipethr [--hourly] [--daily] [--monthly] [--yearly] [--silent] LOG_PATH [--] shell command here");
	process.exit(0);
}





const PERIOD_IDS = ['yearly', 'monthly', 'daily', 'hourly', ''] as const;
const Runtime:{
	silent: boolean;
	base_path: string;
	time_id: string;
	period: typeof PERIOD_IDS[number];
	data_pool: Buffer[];
	log_timeout: NodeJS.Timeout|0|null|false;
	run_state: null|number; 
} = {
	silent: args.silent||false,
	base_path: args._[0],
	time_id: '',
	period: '',
	data_pool: [],
	log_timeout: null,
	run_state: null
};


if ( args.hourly ) {
	Runtime.period = 'hourly';
}
else
if ( args.daily ) {
	Runtime.period = 'daily';
}
else
if ( args.monthly ) {
	Runtime.period = 'monthly';
}
else
if ( args.yearly ) {
	Runtime.period = 'yearly';
}



process
.on('SIGHUP', ()=>{}).on('SIGINT', ()=>{})
.on('SIGQUIT', SignalTerminate)
.on('SIGHUP',  SignalTerminate)
.on('SIGTERM', SignalTerminate);



if ( SHELL_ARGS.length > 0 ) {
	const sub = child.spawn(SHELL_ARGS[0], SHELL_ARGS.slice(1), {
		env:process.env,
		cwd: process.cwd(),
		stdio: ['ignore', 'pipe', process.stderr]
	});
	sub.stdout.on('data', c=>Runtime.data_pool.push(c));
	sub.on('close', (code, signal)=>{
		Runtime.run_state = code !== null ? code : (128 + SIGNAL_MAP[signal!]||127);
	});
}
else {
	process
	.on('data', c=>Runtime.data_pool.push(c))
	.on('end', ()=>Runtime.run_state=0);
}




Runtime.log_timeout = setTimeout(ProcessLog, 0);
function ProcessLog() {
	Promise.resolve().then(async()=>{
		while(Runtime.data_pool.length > 0) await ConsumeLog();
	})
	.then(()=>{
		if ( Runtime.run_state !== null ) {
			setTimeout((state)=>process.exit(state), 0, Runtime.run_state);
			return;
		}
		
		Runtime.log_timeout = setTimeout(ProcessLog, 0);
	})
	.catch((e)=>{
		console.error("Cannot write log due to unexpected error!", e);
		setTimeout(()=>process.exit(1));
	});
}



async function ConsumeLog() {
	const now = new Date();
	const time = {
		year:`${now.getFullYear()}`,
		month:`${now.getMonth() + 1}`.padStart(2, '0'),
		day:`${now.getDate()}`.padStart(2, '0'),
		hour:`${now.getHours()}`.padStart(2, '0')
	};

	let time_id = '';
	switch(Runtime.period) {
		case 'monthly':
			time_id = `${time.year}${time.month}`;
			break;
		
		case 'yearly':
			time_id = `${time.year}`;
			break;

		case 'daily':
			time_id = `${time.year}${time.month}${time.day}`;
			break;
		
		case 'hourly':
			time_id = `${time.year}${time.month}${time.day}${time.hour}`;
			break;
		
		default:
			time_id = '';
			break;
	}

	
	const data = Buffer.concat(Runtime.data_pool.splice(0, 100));
	const log_path = Runtime.base_path.replace('{}', time_id);

	// Create dir if time_id is different!
	if ( Runtime.time_id !== time_id ) {
		await fsp.mkdir(path.dirname(log_path), {recursive:true}).catch((e:Error&{code:string})=>{
			if ( e.code !== 'EEXIST' ) throw e;
		});
		Runtime.time_id = time_id;
	}


	await fsp.appendFile(log_path, data);
	if ( !Runtime.silent ) {
		process.stdout.write(data);
	}
}
function SignalTerminate() {
	Runtime.run_state = 1;
}