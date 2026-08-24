import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI;
const client = new MongoClient(mongoURI);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("atm");
    console.log("Connected!");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export { connectDB, client };
export default db;
