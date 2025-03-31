const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/usuarios', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ Error en MongoDB:'));
db.once('open', () => {
  console.log('✅ Conectado a MongoDB en user-service');
});

// Esquema del usuario
const Usuario = mongoose.model('Usuario', {
  name: String,
  email: String,
});

// Cargar archivo .proto
const packageDef = protoLoader.loadSync('../protos/user.proto');
const grpcObject = grpc.loadPackageDefinition(packageDef);
const userPackage = grpcObject.user;

// Función para crear usuario
async function createUser(call, callback) {
  const { name, email } = call.request;

  try {
    const usuario = new Usuario({ name, email });
    const savedUser = await usuario.save();

    console.log(`✅ Usuario guardado: ${savedUser._id}`);
    callback(null, { message: `Usuario ${savedUser.name} guardado`, id: savedUser._id.toString() });
  } catch (error) {
    console.error('❌ Error guardando usuario:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: 'Error al guardar usuario en la base de datos',
    });
  }
}


// Validación básica del usuario
async function validateUser(call, callback) {
  const { userId } = call.request;

  try {
    const usuario = await Usuario.findById(userId);
    const exists = !!usuario;
    console.log(`🔍 Validando usuario ${userId}: ${exists}`);
    callback(null, { exists });
  } catch (error) {
    console.error('❌ Error validando usuario:', error);
    callback(null, { exists: false });
  }
}


// Crear servidor gRPC
const server = new grpc.Server();
server.addService(userPackage.UserService.service, {
  CreateUser: createUser,
  ValidateUser: validateUser,
});

// Iniciar servidor
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('🚀 Microservicio de usuarios corriendo en puerto 50051');
});
