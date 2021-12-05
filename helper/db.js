const { Client } = require("pg");

// const url =
//   "postgres://xemomvtgpexztz:71ad1d6161097988964ea001daa146384e8d7181d72bbf173c8139f3fbfc0ed1@ec2-44-193-111-218.compute-1.amazonaws.com:5432/d4541ko6l6l8ub";
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
