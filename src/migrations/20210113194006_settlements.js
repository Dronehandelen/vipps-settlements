export const up = function (knex) {
    return knex.schema.createTable('settlements', function (table) {
        table.increments('id').primary();
        table.date('date').notNullable().unique();
        table.date('estimatedDateOnBankAccount').notNullable();
        table.decimal('amountToBankAccount', 14, 2).notNullable();
        table.decimal('fees', 14, 2).notNullable();
        table
            .timestamp('createdAt', { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());
    });
};

export const down = function (knex) {
    return knex.schema.dropTable('settlements');
};
