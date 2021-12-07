const { Client } = require("pg");

// const url =
//   "postgres://siilvvwdszmnfk:66377e07123af277f9328914c61383120823f4897afce02fc885ab4171e97368@ec2-34-195-69-118.compute-1.amazonaws.com:5432/df9q1q7isk5us6";
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
      "SELECT * FROM wa_sessions ORDER BY created_at DESC LIMIT 1"
    );
    if (res.rows.length) return res.rows[0].session;
    return "";
  } catch (error) {
    throw error;
  }
};

const saveSession = async (session) => {
  client.query(
    "INSERT INTO wa_sessions (session) VALUES($1)",
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
  client.query("DELETE FROM wa_sessions", (err, results) => {
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
