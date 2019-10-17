const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


module.exports = {
  getUserWithEmail: (email, values) => {
    return pool.query(`
    SELECT * 
    FROM users
    WHERE email = $1
    `, [`${email}`])
    .then(res => res.rows[0])
  },

  getUserWithId: (id, values) => {
    return pool.query(`
    SELECT * 
    FROM users
    WHERE id = $1
    `, [`${id}`])
    .then(res => res.rows[0])
    .catch(err => error);
  },
  
  addUser: (user, values) => {
    return pool.query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;`
    , [`${user.name}`, `${user.email}`, `${user.password}`])
    .then(res => res.rows[0])
    .catch(err => error);
  },

  getAllReservations: (guest_id, limit = 10) => {
    return pool.query(`
    SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id 
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT 10;`, [guest_id])
    .then(res => res.rows);
  },
  
  getAllProperties: (options, limit = 10) => {

    const queryParams = [];
  
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    LEFT JOIN property_reviews ON properties.id = property_id
    `;
  
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
    }
  
    if (options.owner_id) {
      if(queryParams.length){
      queryParams.push(Number(options.owner_id));
      queryString += `AND owner_id = $${queryParams.length} `;
      } else {
      queryParams.push(Number(options.owner_id));
      queryString += `WHERE owner_id = $${queryParams.length} `;
    }
  }
  
    if (options.minimum_price_per_night) {
      if(queryParams.length) {
      queryParams.push(Number(options.minimum_price_per_night) * 100);
      queryString += `AND cost_per_night > $${queryParams.length} `
    } else {
      queryParams.push(Number(options.minimum_price_per_night) * 100);
      queryString += `WHERE cost_per_night > $${queryParams.length} `
    }
  }
  
    if (options.maximum_price_per_night) {
      if(queryParams.length) {
      queryParams.push(Number(options.maximum_price_per_night) * 100);
      queryString += `AND cost_per_night < $${queryParams.length} `
    } else {
      queryParams.push(Number(options.maximum_price_per_night) * 100);
      queryString += `WHERE cost_per_night < $${queryParams.length} `
    }
  }
    queryString += `
    GROUP BY properties.id `
  
    if (options.minimum_rating) {
      if(queryParams.length) {
      queryParams.push(Number(options.minimum_rating));
      queryString += `HAVING avg(property_reviews.rating) > $${queryParams.length} `
    } else {
      queryParams.push(Number(options.minimum_rating));
      queryString += `HAVING avg(property_reviews.rating) > $${queryParams.length} `
    }
  }
  
    queryParams.push(limit);
    queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  
    console.log(queryString, queryParams);
  
    return pool.query(queryString, queryParams)
    .then(res => res.rows);
  },

  addProperty: (property) => {
    return pool.query(`
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night,
      street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;`
    , [`${property.owner_id}`, `${property.title}`, `${property.description}`, `${property.thumbnail_photo_url}`, `${property.cover_photo_url}`, `${property.cost_per_night}`,
      `${property.street}`, `${property.city}`, `${property.province}`, `${property.post_code}`, `${property.country}`, `${property.parking_spaces}`, `${property.number_of_bathrooms}`, `${property.number_of_bedrooms}`
  ])
    .then(res => res.rows)
    .catch(err => error);
  }

}