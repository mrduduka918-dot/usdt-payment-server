const express = require("express");
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

const WALLET = "TJe8Dyt3kNNTsaz1N9DTMULWobhQZVnV1j";
const AMOUNT = "100";
const NETWORK = "TRC20";
const ADMIN_PASSWORD = "123456";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/", async (req, res) => {
  const qr = await QRCode.toDataURL(WALLET);

  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>USDT Payment</title>
<style>
body{font-family:Arial;text-align:center;margin-top:30px;}
button{padding:10px 18px;margin:5px;background:green;color:#fff;border:none;border-radius:5px;}
img{width:220px;}
input{width:320px;padding:8px;text-align:center;}
</style>
</head>
<body>

<h2>USDT Payment</h2>
<h3>${AMOUNT} USDT</h3>
<p>Network : ${NETWORK}</p>

<img src="${qr}"><br><br>

<input id="wallet" value="${WALLET}" readonly><br><br>

<button onclick="copyWallet()">Copy Address</button>
<button onclick="location='/paid'">I Have Paid</button>

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

app.get("/paid", async (req, res) => {

  await supabase.from("payments").insert([
    {
      wallet: WALLET,
      amount: AMOUNT,
      network: NETWORK,
      status: "Pending"
    }
  ]);

  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Payment Submitted</title>
<style>
body{font-family:Arial;text-align:center;margin-top:80px;}
.box{display:inline-block;padding:25px;border:1px solid #ccc;border-radius:10px;}
button{padding:10px 20px;background:green;color:#fff;border:none;border-radius:5px;}
</style>
</head>
<body>

<div class="box">
<h2>✅ Payment Submitted</h2>
<p>Your payment is waiting for verification.</p>

<button onclick="location='/admin'">
Open Admin
</button>

</div>

</body>
</html>
`);
});

app.get("/admin", async (req, res) => {

if(req.query.password!==ADMIN_PASSWORD){

return res.send(`
<h2>Admin Login</h2>

<form>

<input
type="password"
name="password"
placeholder="Password">

<button>
Login
</button>

</form>

<script>
document.querySelector("form").method="GET";
document.querySelector("form").action="/admin";
</script>
`);
}

const { data } = await supabase
.from("payments")
.select("*")
.order("id",{ascending:true});

let rows="";

data.forEach((p)=>{

rows+=`
<tr>
<td>${p.id}</td>
<td>${p.wallet}</td>
<td>${p.amount} USDT</td>
<td>${p.network}</td>
<td>${new Date(p.time).toLocaleString()}</td>
<td>${p.status}</td>

<td>

<button onclick="location='/approve/${p.id}?password=${ADMIN_PASSWORD}'">
Approve
</button>

<button onclick="location='/reject/${p.id}?password=${ADMIN_PASSWORD}'">
Reject
</button>

</td>
</tr>
`;

});

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Admin</title>

<style>
body{font-family:Arial;padding:20px;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:10px;text-align:center;}
th{background:#222;color:#fff;}
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

app.get("/approve/:id", async (req,res)=>{

if(req.query.password!==ADMIN_PASSWORD){
return res.send("Access Denied");
}

await supabase
.from("payments")
.update({status:"Approved"})
.eq("id",req.params.id);

res.redirect("/admin?password="+ADMIN_PASSWORD);

});

app.get("/reject/:id", async (req,res)=>{

if(req.query.password!==ADMIN_PASSWORD){
return res.send("Access Denied");
}

await supabase
.from("payments")
.update({status:"Rejected"})
.eq("id",req.params.id);

res.redirect("/admin?password="+ADMIN_PASSWORD);

});

app.listen(PORT,()=>{
console.log("Server Started");
});
