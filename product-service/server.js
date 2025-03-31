const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/productos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ Error en MongoDB (productos):'));
db.once('open', () => {
  console.log('✅ Conectado a MongoDB en product-service');
});

// Modelo de Producto
const Producto = mongoose.model('Producto', {
  name: String,
  price: Number,
});

// Cargar el .proto
const packageDef = protoLoader.loadSync('../protos/product.proto');
const grpcObject = grpc.loadPackageDefinition(packageDef);
const productPackage = grpcObject.product;

// Función para guardar productos
async function addProduct(call, callback) {
    const { name, price } = call.request;
  
    try {
      const producto = new Producto({ name, price });
      const savedProduct = await producto.save();
  
      console.log(`🛒 Producto guardado: ${savedProduct._id}`);
      callback(null, { message: `Producto ${savedProduct.name} guardado`, id: savedProduct._id.toString() });
    } catch (error) {
      console.error('❌ Error guardando producto:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Error al guardar producto en la base de datos',
      });
    }
  }
  

  async function validateProduct(call, callback) {
    const { productId } = call.request;
  
    try {
      const producto = await Producto.findById(productId);
      const exists = !!producto;
      console.log(`🔍 Validando producto ${productId}: ${exists}`);
      callback(null, { exists });
    } catch (error) {
      console.error('❌ Error validando producto:', error);
      callback(null, { exists: false });
    }
  }
  
// Crear servidor
const server = new grpc.Server();
server.addService(productPackage.ProductService.service, {
  AddProduct: addProduct,
  ValidateProduct: validateProduct,
});

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
  console.log('🚀 Microservicio de productos corriendo en puerto 50052');
});
