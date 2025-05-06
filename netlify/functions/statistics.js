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

    const total = await collection.countDocuments();

    const biasCount = await collection.aggregate([
      {
        $group: {
          _id: null,
          left: { $sum: "$bias_ratio.left" },
          center: { $sum: "$bias_ratio.center" },
          right: { $sum: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({
        total,
        biasCount: biasCount[0]
      }),
    };
  } catch (error) {
    console.error('statistics.js Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
