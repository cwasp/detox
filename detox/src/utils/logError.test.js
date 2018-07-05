const { exec } = require('child-process-promise');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

describe('logError', () => {
  let logger;
  let logError;

  beforeEach(() => {
    jest.mock('./logger');
    logger = require('./logger');

    logError = require('./logError');
  });

  it('should not fail on nulls', () => {
    logError(null);
    expect(logger.error).toHaveBeenCalledWith('detox', expect.any(String));

    logError(null, 'module');
    expect(logger.error).toHaveBeenCalledWith('module', expect.any(String));

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.verbose).not.toHaveBeenCalled();
  });

  it('should log child process errors', async () => {
    await exec('sdfhkdshfjksdhfjkhks').catch(logError);

    expect(logger.error).toHaveBeenCalledWith('detox', '%s', expect.any(String));
    expect(logger.verbose).toHaveBeenCalledWith('child-process-stdout', '%s', expect.any(String));
    expect(logger.verbose).toHaveBeenCalledWith('child-process-stderr', '%s', expect.any(String));
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should log long detox runtime errors', () => {
    const err = new DetoxRuntimeError({
      message: 'msg123',
      hint: 'hint',
      debugInfo: 'debugInfo',
    });

    logError(err, 'module');

    expect(logger.error).toHaveBeenCalledWith('module', '%s', expect.stringContaining('msg123'));
    expect(logger.warn).toHaveBeenCalledWith('module', 'Hint: %s', 'hint');
    expect(logger.warn).toHaveBeenCalledWith('module', 'See debug info below:\n%s', 'debugInfo');
    expect(logger.verbose).not.toHaveBeenCalled();
  });

  it('should log short detox runtime errors', () => {
    logError(new DetoxRuntimeError({ message: 'short' }));

    expect(logger.error).toHaveBeenCalledWith('detox', '%s', expect.stringContaining('short'));
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.verbose).not.toHaveBeenCalled();
  });

  it('should log oother errors', () => {
    const err = new Error('message');
    logError(err);

    expect(logger.error).toHaveBeenCalledWith('detox', '', err);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.verbose).not.toHaveBeenCalled();
  });
});

