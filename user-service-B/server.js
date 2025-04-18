const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const amqp = require('amqplib');

// Cambia este número en las otras réplicas
const PORT = '50052';

// MongoDB
mongoose.connect('mongodb://mongo:27017/usuarios', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ Error en MongoDB:'));
db.once('open', () => {
  console.log('✅ Conectado a MongoDB');
});

const Usuario = mongoose.model('Usuario', { name: String, email: String });

// Cargar .proto y servicio
const packageDef = protoLoader.loadSync('./protos/user.proto');
const grpcObject = grpc.loadPackageDefinition(packageDef);
const userPackage = grpcObject.user;

// Función gRPC para validar si un usuario existe
async function validateUser(call, callback) {
  try {
    const user = await Usuario.findById(call.request.userId);
    callback(null, { exists: !!user });
  } catch (err) {
    callback(null, { exists: false });
  }
}

// Servidor gRPC
const server = new grpc.Server();
server.addService(userPackage.UserService.service, {
  ValidateUser: validateUser,
});

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`🚀 Microservicio user-service escuchando en puerto ${PORT}`);
});

// Consumidor RabbitMQ
async function consumeRabbitMQ() {
  try {
    const conn = await amqp.connect('amqp://rabbitmq');
    const channel = await conn.createChannel();
    await channel.assertQueue('usuarios');

    console.log(`📡 Escuchando mensajes en cola 'usuarios' desde puerto ${PORT}...`);

    channel.consume('usuarios', async (msg) => {
      const data = JSON.parse(msg.content.toString());
      console.log(`📥 Mensaje recibido en ${PORT}:`, data);

      try {
        const usuario = new Usuario({ name: data.name, email: data.email });
        const saved = await usuario.save();
        console.log(`✅ Usuario ${saved.name} guardado desde ${PORT} con ID: ${saved._id}`);
        channel.ack(msg);
      } catch (err) {
        console.error('❌ Error guardando usuario:', err.message);
      }
    });
  } catch (err) {
    console.error('❌ Error conectando a RabbitMQ:', err.message);
  }
}

consumeRabbitMQ();
