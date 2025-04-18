const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const amqp = require('amqplib');

const PORT = process.env.PORT || '50051';

// MongoDB con mejor manejo de conexión
async function connectMongoDB() {
  try {
    await mongoose.connect('mongodb://mongo:27017/usuarios', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.log('🔁 Reintentando conexión a MongoDB en 5 segundos...');
    setTimeout(connectMongoDB, 5000);
  }
}

// Modelo de usuario
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
    console.error('❌ Error validando usuario:', err.message);
    callback(null, { exists: false });
  }
}

// Función para obtener todos los usuarios
async function getAllUsers(call, callback) {
  try {
    const users = await Usuario.find();
    const serialized = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email
    }));
    callback(null, { usuarios: serialized });
  } catch (err) {
    console.error('❌ Error obteniendo usuarios:', err.message);
    callback({ code: grpc.status.INTERNAL, message: 'Error obteniendo usuarios' });
  }
}

// Servidor gRPC
const server = new grpc.Server();
server.addService(userPackage.UserService.service, {
  ValidateUser: validateUser,
  GetAllUsers: getAllUsers,
  // Implementar CreateUser si el proto lo define
  CreateUser: async (call, callback) => {
    try {
      const usuario = new Usuario({ name: call.request.name, email: call.request.email });
      const saved = await usuario.save();
      console.log(`✅ Usuario creado directamente via gRPC: ${saved._id}`);
      callback(null, { message: 'Usuario creado', id: saved._id.toString() });
    } catch (err) {
      console.error('❌ Error creando usuario:', err.message);
      callback({ code: grpc.status.INTERNAL, message: 'Error creando usuario' });
    }
  }
});

// Iniciar servidor gRPC
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('❌ Error al iniciar servidor gRPC:', err);
    return;
  }
  server.start();
  console.log(`🚀 Microservicio user-service escuchando en 0.0.0.0:${PORT}`);
});

// Consumidor RabbitMQ con mejor manejo de errores
async function consumeRabbitMQ() {
  try {
    console.log('Intentando conectar a RabbitMQ...');
    const conn = await amqp.connect('amqp://rabbitmq');
    
    conn.on('error', (err) => {
      console.error('❌ Error en conexión RabbitMQ:', err.message);
      setTimeout(consumeRabbitMQ, 5000);
    });
    
    conn.on('close', () => {
      console.log('🔌 Conexión RabbitMQ cerrada. Reintentando...');
      setTimeout(consumeRabbitMQ, 5000);
    });
    
    const channel = await conn.createChannel();
    await channel.assertQueue('usuarios', { durable: true });

    console.log(`📡 Escuchando mensajes en cola 'usuarios' desde puerto ${PORT}...`);

    channel.consume('usuarios', async (msg) => {
      if (msg === null) return;
      
      try {
        const data = JSON.parse(msg.content.toString());
        console.log(`📥 Mensaje recibido en ${PORT}:`, data);

        const usuario = new Usuario({ name: data.name, email: data.email });
        const saved = await usuario.save();
        console.log(`✅ Usuario ${saved.name} guardado desde ${PORT} con ID: ${saved._id}`);
        channel.ack(msg);
      } catch (err) {
        console.error('❌ Error procesando mensaje:', err.message);
        // Rechazar mensaje solo si no se puede procesar (formato inválido)
        // Si es error de MongoDB, mantenerlo en la cola
        if (err instanceof SyntaxError) {
          channel.reject(msg, false); // No volver a encolar si es error de formato
        } else {
          channel.nack(msg, false, true); // Volver a encolar si es otro tipo de error
        }
      }
    });
  } catch (err) {
    console.error(`❌ Error conectando a RabbitMQ: ${err.message}`);
    console.log('🔁 Reintentando conexión en 5 segundos...');
    setTimeout(consumeRabbitMQ, 5000);
  }
}

// Iniciar conexiones
connectMongoDB().then(() => {
  consumeRabbitMQ();
});