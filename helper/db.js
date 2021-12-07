const { Client } = require("pg");

// const url =
//   "postgres://bmwthjakkbagzx:6e6867a4d7d07e432027aa5c1a7fb9832e96b234586546858791f28caf13a9fc@ec2-3-230-219-251.compute-1.amazonaws.com:5432/d1njov88lhu1i7";
const url = process.env.DATABASE_URL;
const client = new Client({
  connectionString: url,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

const readSession = async () => {
  try {
    const res = await client.query(
      "SELECT * FROM wa_session ORDER BY created_at DESC LIMIT 1"
    );
    if (res.rows.length) return res.rows[0].session;
    return "";
  } catch (error) {
    throw error;
  }
};

const saveSession = async (session) => {
  client.query(
    "INSERT INTO wa_session (session) VALUES($1)",
    [session],
    (err, results) => {
      if (err) {
        console.error("Failed to save session" + err);
      } else {
        console.log("session saved");
      }
    }
  );
};

const removeSession = async () => {
  client.query("DELETE FROM wa_session", (err, results) => {
    if (err) {
      console.error("failed to remove session : " + err);
    } else {
      console.log("session deleted");
    }
  });
};

module.exports = {
  readSession,
  saveSession,
  removeSession,
};
