const { Client } = require('pg');
const { Signer } = require('@aws-sdk/rds-signer');
require('dotenv').config({ path: 'apps/api/.env' });

async function run() {
  try {
    const signer = new Signer({
      hostname: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log("Fetching IAM token...");
    const token = await signer.getAuthToken();
    console.log("Token fetched. Length:", token.length);

    const client = new Client({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: token,
      ssl: { rejectUnauthorized: false }
    });

    console.log("Connecting to DB...");
    await client.connect();
    console.log("Connected successfully!");
    await client.end();
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
