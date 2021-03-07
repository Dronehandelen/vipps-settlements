import Winston from 'winston';
import LoggingWinston from '@google-cloud/logging-winston';
import appConfig from '../config/app.js';

const logger = Winston.createLogger({
    level: 'debug',
    transports: [
        appConfig.isProd
            ? new LoggingWinston.LoggingWinston({
                  logName: process.env.CONTAINER_NAME,
              })
            : new Winston.transports.Console({
                  format: Winston.format.simple(),
              }),
    ],
});

export default logger;
