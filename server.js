require("dotenv").config();

const express = require("express");
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

const WALLET = process.env.USDT_WALLET;
const NETWORK = process.env.NETWORK || "TRC20";
const AMOUNT = process.env.AMOUNT || "10";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
margin-top:40px;
background:#f4f4f4;
}
.card{
background:white;
padding:20px;
border-radius:10px;
display:inline-block;
box-shadow:0 0 10px #ccc;
}
img{
width:220px;
}
input{
width:320px;
padding:10px;
text-align:center;
}
button{
padding:10px 20px;
margin-top:10px;
background:green;
color:white;
border:none;
border-radius:5px;
cursor:pointer;
}
</style>
</head>
<body>

<div class="card">

<h2>USDT Payment</h2>

<h3>${AMOUNT} USDT</h3>

<p>Network : ${NETWORK}</p>

<img src="${qr}">

<br><br>

<input id="wallet" value="${WALLET}" readonly>

<br><br>

<button onclick="copyWallet()">Copy Wallet</button>

</div>

<script>
function copyWallet(){
navigator.clipboard.writeText(document.getElementById("wallet").value);
alert("Wallet Copied");
}
</script>

</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log("Server Running On Port", PORT);
});
