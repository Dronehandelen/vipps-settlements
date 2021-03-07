export default {
    isProd: process.env.NODE_ENV === 'production',
    googleProjectId: 'norfpv',
    keyFilename:
        process.env.NODE_ENV === 'production'
            ? '/secrets/google/credentials.json'
            : undefined,
    sentryUrl: process.env.SENTRY_URL,
};
