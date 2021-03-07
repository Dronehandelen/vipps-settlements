export default {
    host: process.env.CONFIG_DB_HOST || 'postgres',
    user: process.env.CONFIG_DB_USER || 'postgres',
    password: process.env.CONFIG_DB_PASSWORD || 'postgres',
    database: process.env.CONFIG_DB_DATABASE || 'vippssettlements',
    port: 5432,
};
