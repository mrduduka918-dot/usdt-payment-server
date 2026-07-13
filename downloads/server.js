const express = require("express");
const QRCode = require("qrcode");

const app = express();

const PORT = 3000;

const WALLET = "TJe8Dyt3kNNTsaz1N9DTMULWobhQZVnV1j";
const AMOUNT = 10;
const NETWORK = "TRC20";
const ADMIN_PASSWORD = "123456";

let payments = [];

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
margin-top:30px;
}

button{
padding:10px 18px;
margin:5px;
background:green;
color:white;
border:none;
border-radius:5px;
}

img{
width:220px;
}

input{
width:320px;
padding:8px;
text-align:center;
}
</style>

</head>

<body>

<h2>USDT Payment</h2>

<h3>${AMOUNT} USDT</h3>

<p>Network : ${NETWORK}</p>

<img src="${qr}">

<br><br>

<input id="wallet" value="${WALLET}" readonly>

<br><br>

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
app.get("/paid",(req,res)=>{

payments.push({
id:Date.now(),
wallet:WALLET,
amount:AMOUNT,
network:NETWORK,
status:"Pending",
time:new Date().toLocaleString()
});

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Payment Submitted</title>
<style>
body{
font-family:Arial;
text-align:center;
margin-top:80px;
}
.box{
display:inline-block;
padding:25px;
border:1px solid #ccc;
border-radius:10px;
}
button{
padding:10px 20px;
background:green;
color:#fff;
border:none;
border-radius:5px;
}
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

app.get("/admin",(req,res)=>{

if(req.query.password!==ADMIN_PASSWORD){

return res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Admin Login</title>
<style>
body{
font-family:Arial;
text-align:center;
margin-top:100px;
}
input{
padding:10px;
width:250px;
}
button{
padding:10px 20px;
margin-top:10px;
}
</style>
</head>

<body>

<h2>Admin Login</h2>

<form action="/admin" method="GET">

<input
type="password"
name="password"
placeholder="Password"
required>

<br><br>

<button type="submit">
Login
</button>

</form>

</body>
</html>
`);
}

let rows=payments.map((p,i)=>`
<tr>
<td>${i+1}</td>
<td>${p.wallet}</td>
<td>${p.amount} USDT</td>
<td>${p.network}</td>
<td>${p.time}</td>
<td>${p.status}</td>
<td>
<button onclick="location='/approve/${i}?password=${ADMIN_PASSWORD}'">
Approve
</button>

<button onclick="location='/reject/${i}?password=${ADMIN_PASSWORD}'">
Reject
</button>
</td>
</tr>
`).join("");

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Admin Panel</title>

<style>
body{
font-family:Arial;
padding:20px;
}

table{
width:100%;
border-collapse:collapse;
}

th,td{
border:1px solid #ccc;
padding:10px;
text-align:center;
}

th{
background:#222;
color:white;
}
</style>

<body>

<h2>USDT Admin Panel</h2>

<table>

<tr>
<th>No</th>
<th>Wallet</th>
<th>Amount</th>
<th>Network</th>
<th>Time</th>
<th>Status</th>
<th>Action</th>
</tr>

${rows}

</table>
`);
});
app.get("/approve/:id", (req, res) => {

    if (req.query.password !== ADMIN_PASSWORD) {
        return res.send("Access Denied");
    }

    const id = parseInt(req.params.id);

    if (payments[id]) {
        payments[id].status = "Approved";
    }

    res.redirect("/admin?password=" + ADMIN_PASSWORD);

});

app.get("/reject/:id", (req, res) => {

    if (req.query.password !== ADMIN_PASSWORD) {
        return res.send("Access Denied");
    }

    const id = parseInt(req.params.id);

    if (payments[id]) {
        payments[id].status = "Rejected";
    }

    res.redirect("/admin?password=" + ADMIN_PASSWORD);

});

app.listen(PORT, () => {
    console.log("==================================");
    console.log("USDT Payment Server Started");
    console.log("Home  : http://localhost:3000/");
    console.log("Admin : http://localhost:3000/admin");
    console.log("Password :", ADMIN_PASSWORD);
    console.log("==================================");
});

