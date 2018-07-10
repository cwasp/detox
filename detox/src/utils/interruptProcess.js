const log = require('./logger').child({ __filename });

async function interruptProcess(childProcessPromise, signal = 'SIGINT') {
  const process = childProcessPromise.childProcess;

  const pid = childProcessPromise.childProcess.pid;
  const spawnargs = process.spawnargs.join(' ');

  log.debug(`sending signal ${signal} to pid ${pid} (${spawnargs})`);

  childProcessPromise.childProcess.kill(signal);
  await childProcessPromise.catch(e => {
    /* istanbul ignore if */
    if (e.exitCode != null) {
      throw e;
    }
  });
}

module.exports = interruptProcess;