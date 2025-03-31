const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
app.use(express.json());

// Load protos
const userProtoDef = protoLoader.loadSync('../protos/user.proto');
const userPackage = grpc.loadPackageDefinition(userProtoDef).user;

const productProtoDef = protoLoader.loadSync('../protos/product.proto');
const productPackage = grpc.loadPackageDefinition(productProtoDef).product;

const orderProtoDef = protoLoader.loadSync('../protos/order.proto');
const orderPackage = grpc.loadPackageDefinition(orderProtoDef).order;

// Create gRPC clients
const userClient = new userPackage.UserService('localhost:50051', grpc.credentials.createInsecure());
const productClient = new productPackage.ProductService('localhost:50052', grpc.credentials.createInsecure());
const orderClient = new orderPackage.OrderService('localhost:50053', grpc.credentials.createInsecure());

// Routes
app.post('/usuario', (req, res) => {
  const { name, email } = req.body;
  userClient.CreateUser({ name, email }, (err, response) => {
    if (err) return res.status(500).json({ error: 'Error creando usuario' });
    res.json(response);
  });
});

app.post('/producto', (req, res) => {
  const { name, price } = req.body;
  productClient.AddProduct({ name, price }, (err, response) => {
    if (err) return res.status(500).json({ error: 'Error creando producto' });
    res.json(response);
  });
});

app.post('/orden', (req, res) => {
  const { userId, productId, quantity } = req.body;
  orderClient.CreateOrder({ userId, productId, quantity }, (err, response) => {
    if (err) return res.status(500).json({ error: 'Error creando orden' });
    res.json(response);
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 API Gateway corriendo en http://localhost:${PORT}`);
});
