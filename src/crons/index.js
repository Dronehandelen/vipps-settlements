import '../setupDotenv.js';
import Sentry from '@sentry/node';
import logger from '../services/logger.js';
import appConfig from '../config/app.js';

if (appConfig.isProd) {
    Sentry.init({
        dsn: appConfig.sentryUrl,
        environment: process.env.NODE_ENV || 'development',
    });
}

const done = (error = null) => {
    if (error) {
        Sentry.captureException(error);
        logger.error(error.stack);
    }

    logger.info(`Task ${process.argv[2]} is done`);
    setTimeout(() => process.exit(), 2000);
};

setTimeout(() => {
    import(`./${process.argv[2]}.js`).then((jobDefinition) =>
        jobDefinition
            .default()
            .then(() => done())
            .catch((error) => done(error))
    );
}, 1000);

export {};
