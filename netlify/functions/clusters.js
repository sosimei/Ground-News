const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let client;
let collection;

async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('news_bias');
    collection = db.collection('clusters');
  }
}

exports.handler = async function(event, context) {
  try {
    await connectToDB();

    const clusters = await collection.find({}).sort({ crawl_date: -1 }).limit(10).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({
        clusters,
        pagination: {
          total: clusters.length,
          page: 1,
          limit: 10,
          pages: 1
        }
      }),
    };
  } catch (error) {
    console.error('clusters.js Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
