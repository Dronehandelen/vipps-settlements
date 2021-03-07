import queryBuilder, { dbHelpers } from '../services/db.js';

export const create = (data) => dbHelpers.create('settlements', data);

export const getByDate = (date) =>
    queryBuilder.select('*').from('settlements').where('date', date).first();
