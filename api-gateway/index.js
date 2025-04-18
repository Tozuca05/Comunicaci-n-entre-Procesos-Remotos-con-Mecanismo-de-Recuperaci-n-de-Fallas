const express = require('express');
const amqp = require('amqplib');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
app.use(express.static('public'));

const app = express();
app.use(express.json());

// RabbitMQ
let channel;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    channel = await connection.createChannel();
    await channel.assertQueue('usuarios');
    console.log('📡 Conectado a RabbitMQ y cola `usuarios`');
  } catch (err) {
    console.error('❌ Error conectando a RabbitMQ:', err.message);
    console.log('🔁 Reintentando conexión a RabbitMQ en 5 segundos...');
    setTimeout(connectRabbitMQ, 5000);
  }
}

connectRabbitMQ();

// Cargar el .proto y definir clientes gRPC
const packageDef = protoLoader.loadSync('./protos/user.proto');
const grpcObject = grpc.loadPackageDefinition(packageDef);
const userPackage = grpcObject.user;

const userClients = [
  new userPackage.UserService('localhost:50051', grpc.credentials.createInsecure()),
  new userPackage.UserService('localhost:50052', grpc.credentials.createInsecure()),
  new userPackage.UserService('localhost:50053', grpc.credentials.createInsecure())
];

// Función reutilizable de failover gRPC
function withFailover(methodName, payload, callback, index = 0) {
  if (index >= userClients.length) {
    return callback(new Error('Todos los servicios fallaron'));
  }

  userClients[index][methodName](payload, (err, res) => {
    if (err) {
      console.warn(`❌ Servidor en puerto ${50051 + index} falló. Probando siguiente...`);
      withFailover(methodName, payload, callback, index + 1);
    } else {
      callback(null, res);
    }
  });
}

// 📨 Crear usuario → RabbitMQ
app.post('/usuario', async (req, res) => {
  const message = JSON.stringify(req.body);
  try {
    await channel.sendToQueue('usuarios', Buffer.from(message));
    console.log('📤 Mensaje encolado:', req.body);
    res.json({ message: 'Usuario encolado para creación' });
  } catch (err) {
    console.error('❌ Error encolando mensaje:', err.message);
    res.status(500).json({ error: 'Error encolando el mensaje' });
  }
});

app.get('/usuarios', (req, res) => {
  withFailover('GetAllUsers', {}, (err, response) => {
    if (err) return res.status(500).json({ error: 'Error obteniendo usuarios' });
    res.json(response.usuarios);
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 API Gateway escuchando en http://localhost:${PORT}`);
});
