
"use server"

import db from '../../lib/connection';

export async function getProducts() {
  const [rows] = await db.query('SELECT * FROM product');
  return rows;
}
