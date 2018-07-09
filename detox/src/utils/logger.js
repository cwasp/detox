const _ = require('lodash');
const path = require('path');
const winston = require('winston');
const argparse = require('./argparse');

const shouldRecordLogs = argparse.getArgValue('record-logs') !== 'none';
const artifactsLocation = argparse.getArgValue('artifacts-location');

const logger = winston.createLogger({
  level: argparse.getArgValue('loglevel') || 'info',
  transports: _.compact([
    shouldRecordLogs ? new winston.transports.File({
      filename: path.join(artifactsLocation, 'detox-cli.log'),
      format: winston.format.json(),
    }) : null,
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ]),
});

module.exports = logger;
