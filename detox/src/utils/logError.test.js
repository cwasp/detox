const { exec } = require('child-process-promise');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const logger = require('./logger');
const logError = require('./logError');

describe('logError', () => {
  it('should not fail on nulls', () => {
    logError(logger, null);
    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.verbose).not.toHaveBeenCalled();
  });

  it('should skip child process errors', async () => {
    await exec('sdfhkdshfjksdhfjkhks').catch((e) => logError(logger, e));
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should log long detox runtime errors', () => {
    const err = new DetoxRuntimeError({
      message: 'msg123',
      hint: 'hint',
      debugInfo: 'debugInfo',
    });

    logError(logger, err);

    expect(logger.error).toHaveBeenCalledWith({ stack: true }, expect.stringContaining('msg123'));
    expect(logger.warn).toHaveBeenCalledWith({ hint: true }, 'hint');
    expect(logger.warn).toHaveBeenCalledWith({ debugInfo: true }, 'See debug info below:\ndebugInfo');
    expect(logger.verbose).not.toHaveBeenCalled();
  });

  it('should log short detox runtime errors', () => {
    logError(logger, new DetoxRuntimeError({ message: 'short' }));

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('short'));
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.verbose).not.toHaveBeenCalled();
  });

  it('should log other errors', () => {
    const err = new Error('message');
    logError(logger, err);

    expect(logger.error).toHaveBeenCalledWith({ err }, err);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.verbose).not.toHaveBeenCalled();
  });
});

