const express = require("express");
const app = express();

const wallet = "TJe8Dyt3kNNTsaz1N9DTMULWobhQZVnV1j";
const amount = 10;

let payments = [];

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>USDT Payment</title>
<style>
body{
    font-family:Arial;
    text-align:center;
    padding:20px;
}
img{
    width:250px;
    height:250px;
}
.address{
    word-break:break-all;
    margin:15px;
}
button{
    padding:12px 20px;
    font-size:16px;
    margin:8px;
    border:none;
    border-radius:8px;
    background:#0a8f08;
    color:white;
    cursor:pointer;
}
</style>
</head>

<body>

<h2>USDT Payment</h2>

<h3>Amount: ${amount} USDT</h3>

<p><b>Network:</b> TRC20</p>

<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${wallet}" alt="QR">

<p id="wallet" class="address">${wallet}</p>

<button onclick="copyWallet()">Copy Address</button>

<button onclick="paid()">I Have Paid</button>

<script>
function copyWallet(){
    navigator.clipboard.writeText("${wallet}");
    alert("Wallet copied");
}

function paid(){
    window.location="/paid";
}
</script>

</body>
</html>
`);
});
app.get("/paid", (req, res) => {

    let id = Date.now();

    payments.push({
        id: id,
        wallet: wallet,
        amount: amount,
        network: "TRC20",
        status: "Pending",
        time: new Date().toLocaleString()
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
    padding-top:80px;
}
.box{
    display:inline-block;
    border:1px solid #ddd;
    padding:30px;
    border-radius:10px;
}
</style>
</head>

<body>

<div class="box">
<h2>✅ Payment Submitted</h2>
<p>Your payment is waiting for verification.</p>
<p>Network: TRC20</p>
<a href="/admin">Open Admin Panel</a>
</div>

</body>
</html>
`);
});

app.get("/admin", (req,res)=>{

let rows = payments.map((p,i)=>`
<tr>
<td>${i+1}</td>
<td>${p.wallet}</td>
<td>${p.amount} USDT</td>
<td>${p.network}</td>
<td>${p.time}</td>
<td>${p.status}</td>
<td>
<button onclick="approve(${i})">Approve</button>
<button onclick="reject(${i})">Reject</button>
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

button{
padding:8px 15px;
margin:2px;
}
</style>

</head>

<body>

<h2>USDT Payment Admin</h2>

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

<script>
function approve(id){
fetch("/approve/"+id).then(()=>location.reload());
}

function reject(id){
fetch("/reject/"+id).then(()=>location.reload());
}
</script>

</body>
</html>
`);
});
app.get("/approve/:id", (req, res) => {
    let id = parseInt(req.params.id);

    if (payments[id]) {
        payments[id].status = "Approved";
    }

    res.send("OK");
});

app.get("/reject/:id", (req, res) => {
    let id = parseInt(req.params.id);

    if (payments[id]) {
        payments[id].status = "Rejected";
    }

    res.send("OK");
});

app.listen(3000, () => {
    console.log("Server Started");
});


