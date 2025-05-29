
"use server"

import db from '../../lib/connection';

export async function getProducts() {
    const [rows] = await db.query(`
    SELECT 
      product.*, 
      category.category_name 
    FROM 
      product 
    JOIN 
      category 
    ON 
      product.category_id = category.category_id;
  `);
    return rows;
}

export async function getDiscount() {
    const [rows] = await db.query(`
SELECT * FROM discount_campaign
  `);
    return rows;
}