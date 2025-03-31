const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/ordenes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ Error en MongoDB (ordenes):'));
db.once('open', () => {
  console.log('✅ Conectado a MongoDB en order-service');
});

// Modelo de Orden
const Orden = mongoose.model('Orden', {
  userId: String,
  productId: String,
  quantity: Number,
});

// Cargar order.proto
const orderPackageDef = protoLoader.loadSync('../protos/order.proto');
const orderGrpcObject = grpc.loadPackageDefinition(orderPackageDef);
const orderPackage = orderGrpcObject.order;

// Cargar user.proto
const userPackageDef = protoLoader.loadSync('../protos/user.proto');
const userGrpcObject = grpc.loadPackageDefinition(userPackageDef);
const userClient = new userGrpcObject.user.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Cargar product.proto
const productPackageDef = protoLoader.loadSync('../protos/product.proto');
const productGrpcObject = grpc.loadPackageDefinition(productPackageDef);
const productClient = new productGrpcObject.product.ProductService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

// Función para crear una orden
function createOrder(call, callback) {
  const { userId, productId, quantity } = call.request;

  userClient.ValidateUser({ userId }, (err, userRes) => {
    if (err || !userRes.exists) {
      console.log(`❌ Usuario no válido: ${userId}`);
      return callback(null, { message: 'Usuario no válido. Orden rechazada.' });
    }

    productClient.ValidateProduct({ productId }, async (err, productRes) => {
      if (err || !productRes.exists) {
        console.log(`❌ Producto no válido: ${productId}`);
        return callback(null, { message: 'Producto no válido. Orden rechazada.' });
      }

      try {
        const orden = new Orden({ userId, productId, quantity });
        await orden.save();

        console.log(`✅ Orden guardada: Usuario ${userId} - Producto ${productId} (x${quantity})`);
        callback(null, {
          message: `Orden creada y guardada para usuario ${userId}`
        });
      } catch (error) {
        console.error('❌ Error guardando orden:', error);
        callback({
          code: grpc.status.INTERNAL,
          message: 'Error al guardar orden en la base de datos',
        });
      }
    });
  });
}

// Iniciar servidor gRPC
const server = new grpc.Server();
server.addService(orderPackage.OrderService.service, {
  CreateOrder: createOrder,
});

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), () => {
  console.log('🚀 Microservicio de órdenes corriendo en puerto 50053');
});
