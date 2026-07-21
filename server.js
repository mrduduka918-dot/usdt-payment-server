
require("dotenv").config();

const express = require("express");
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");
const authRoutes = require("./routes/auth");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/", authRoutes);

const PORT = process.env.PORT || 3000;

const WALLET = process.env.USDT_WALLET;
const NETWORK = process.env.NETWORK || "TRC20";
const AMOUNT = process.env.AMOUNT || "10";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
app.get("/signup", (req, res) => {

res.send(`
<!DOCTYPE html>
<html>

<head>
<title>Signup</title>

<style>

body{
font-family:Arial;
background:#f4f4f4;
text-align:center;
margin-top:40px;
}

.card{
background:white;
width:380px;
margin:auto;
padding:20px;
border-radius:10px;
box-shadow:0 0 10px #ccc;
}

input{
width:100%;
padding:10px;
margin-top:10px;
box-sizing:border-box;
}

button{
width:100%;
padding:12px;
margin-top:10px;
background:#16a34a;
color:white;
border:none;
border-radius:5px;
}

</style>

</head>

<body>

<div class="card">

<h2>Create Account</h2>

<form method="POST" action="/signup">

<input
name="name"
placeholder="Full Name"
required>

<input
type="email"
name="email"
placeholder="Email"
required>

<input
type="password"
name="password"
placeholder="Password"
required>

<button type="submit">
Create Account
</button>

</form>

</div>

</body>

</html>
`);

});
// Home page
app.get("/", async (req, res) => {
  const qr = await QRCode.toDataURL(WALLET);

  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>USDT Payment</title>
    <style>
      body{
        font-family:Arial;
        text-align:center;
        background:#f4f4f4;
        margin-top:30px;
      }
      .card{
        background:white;
        width:380px;
        margin:auto;
        padding:20px;
        border-radius:12px;
        box-shadow:0 0 10px rgba(0,0,0,0.1);
      }
      img{ width:220px; }
      input{
        width:100%;
        padding:10px;
        margin-top:10px;
        box-sizing:border-box;
      }
      button{
        width:100%;
        padding:12px;
        margin-top:10px;
        background:#16a34a;
        color:white;
        border:none;
        border-radius:6px;
        font-size:16px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>USDT Payment</h2>
      <h3>${AMOUNT} USDT</h3>
      <p>Network: ${NETWORK}</p>

      <img src="${qr}">

      <input id="wallet" value="${WALLET}" readonly>

      <button onclick="copyWallet()">Copy Wallet</button>

      <form method="POST" action="/paid">
        <input name="txid" placeholder="Enter Transaction ID (TXID)" required>
        <button type="submit">I Have Paid</button>
      </form>
    </div>

    <script>
      function copyWallet(){
        navigator.clipboard.writeText(
          document.getElementById("wallet").value
        );
        alert("Wallet copied");
      }
    </script>
  </body>
  </html>
  `);
});

// Save payment
app.post("/paid", async (req, res) => {
  const { txid } = req.body;

  const { error } = await supabase
    .from("payments")
    .insert([
      {
        wallet: WALLET,
        amount: Number(AMOUNT),
        network: NETWORK,
        txid: txid,
        status: "Pending"
      }
    ]);

  if (error) {
    return res.send(
      `<h2>Database Error</h2><p>${error.message}</p>`
    );
  }

  res.send(`
    <h2>✅ Payment Submitted</h2>
    <p>Your payment is waiting for verification.</p>
    <a href="/admin?password=${ADMIN_PASSWORD}">Open Admin</a>
  `);
});

// Admin panel
app.get("/admin", async (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) {
    return res.send(`
      <h2>Admin Login</h2>
      <form method="GET" action="/admin">
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
    `);
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return res.send("Database Error: " + error.message);
  }

  const rows = payments.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.wallet}</td>
      <td>${p.amount} USDT</td>
      <td>${p.network}</td>
      <td>${p.txid || "-"}</td>
      <td>${new Date(p.created_at).toLocaleString()}</td>
      <td>${p.status}</td>
      <td>
        <a href="/approve/${p.id}?password=${ADMIN_PASSWORD}">Approve</a> |
        <a href="/reject/${p.id}?password=${ADMIN_PASSWORD}">Reject</a>
      </td>
    </tr>
  `).join("");

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Panel</title>
      <style>
        body{font-family:Arial;padding:20px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #ccc;padding:10px;text-align:center;}
        th{background:#222;color:white;}
      </style>
    </head>
    <body>
      <h2>USDT Admin Panel</h2>
      <table>
        <tr>
          <th>ID</th>
          <th>Wallet</th>
          <th>Amount</th>
          <th>Network</th>
          <th>TXID</th>
          <th>Time</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
        ${rows}
      </table>
    </body>
    </html>
  `);
});

// Approve payment
app.get("/approve/:id", async (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) {
    return res.send("Access Denied");
  }

  await supabase
    .from("payments")
    .update({ status: "Approved" })
    .eq("id", req.params.id);

  res.redirect("/admin?password=" + ADMIN_PASSWORD);
});

// Reject payment
app.get("/reject/:id", async (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) {
    return res.send("Access Denied");
  }

  await supabase
    .from("payments")
    .update({ status: "Rejected" })
    .eq("id", req.params.id);

  res.redirect("/admin?password=" + ADMIN_PASSWORD);
});

app.listen(PORT, () => {
  console.log("Server Started on port", PORT);
});
