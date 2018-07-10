const execLogger = require('../utils/logger').child({ __filename });
const retry = require('../utils/retry');
const {exec, spawn} = require('child-process-promise');

let _operationCounter = 0;

async function execWithRetriesAndLogs(bin, options, statusLogs, retries = 10, interval = 1000) {
  _operationCounter++;

  let cmd;
  if (options) {
    cmd = `${options.prefix ? options.prefix + ' && ' : ''}${bin} ${options.args}`;
  } else {
    cmd = bin;
  }

  const log = execLogger.child({ fn: 'execWithRetriesAndLogs', cmd, _operationCounter });

  log.debug({ event: 'cmd' }, `${cmd}`);

  let result;

  try {
    await retry({retries, interval}, async () => {
      if (statusLogs && statusLogs.trying) {
        log.info({ event: 'status_trying' }, statusLogs.trying);
      }

      result = await exec(cmd);
    });
  } catch (err) {
    log.error({ event: 'cmd_fail', varname: 'code' }, `"${cmd}" failed with code = ${err.code}, stderr:\n`);
    log.error({ event: 'cmd_stderr', varname: 'stderr' }, err.stderr);

    throw err;
  }

  if (result === undefined) {
    throw new Error(`command "${cmd}" returned undefined`);
  }

  if (result.stdout) {
    log.debug({ event: 'cmd_stdout', varname: 'stdout' }, result.stdout);
  }

  if (statusLogs && statusLogs.successful) {
    log.info({ event: 'status_successful' }, statusLogs.successful);
  }

  //if (result.childProcess.exitCode !== 0) {
  //  log.error(`${_operationCounter}: stdout:`, result.stdout);
  //  log.error(`${_operationCounter}: stderr:`, result.stderr);
  //}

  /* istanbul ignore next */
  if (process.platform === 'win32') {
    if (result.stdout) {
      result.stdout = result.stdout.replace(/\r\n/g, '\n');
    }
    if (result.stderr) {
      result.stderr = result.stderr.replace(/\r\n/g, '\n');
    }
  }

  return result;
}

function spawnAndLog(command, flags) {
  let out = '';
  let err = '';
  const result = spawn(command, flags, {stdio: ['ignore', 'pipe', 'pipe'], detached: true});

  const cmd = `${command} ${flags.join(' ')}`;
  const log = execLogger.child({ fn: 'spawnAndLog', cmd });
  log.debug({ event: 'show_command' }, cmd);

  if (result.childProcess) {
    const {pid, stdout, stderr} = result.childProcess;

    stdout.on('data', (chunk) => out += chunk.toString());
    stderr.on('data', (chunk) => err += chunk.toString());

    stdout.on('end', () => out && log.debug({ child_pid: pid, event: 'spawn_stdout' }, out));
    stderr.on('end', () => err && log.debug({ child_pid: pid, event: 'spawn_stderr' }, err));
  }

  return result;
}

module.exports = {
  execWithRetriesAndLogs,
  spawnAndLog
};

