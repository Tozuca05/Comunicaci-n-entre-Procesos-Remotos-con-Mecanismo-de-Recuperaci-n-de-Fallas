# Comunicación entre Procesos Remotos con Mecanismo de Recuperación de Fallas

## 1. Descripción de la Actividad

Este proyecto tiene como objetivo diseñar e implementar una aplicación distribuida basada en microservicios, que integre:

- Un cliente que se comunica vía REST con un API Gateway.
- Microservicios que se comunican entre sí utilizando gRPC.
- Un mecanismo de recuperación ante fallos mediante un Middleware Orientado a Mensajes (MOM).

### 1.1. Aspectos Cumplidos de la Actividad Propuesta

- ✅ **Diseño e implementación de un API Gateway**: Se desarrolló un API Gateway que gestiona centralizadamente las peticiones del cliente y las distribuye a los microservicios correspondientes.
- ✅ **Comunicación REST entre cliente y API Gateway**: El cliente interactúa con el sistema a través de peticiones REST al API Gateway.
- ✅ **Comunicación gRPC entre microservicios**: Los microservicios se comunican entre sí utilizando gRPC, lo que permite una comunicación eficiente y estructurada.
- ✅ **Implementación de un MOM para gestión de fallos**: Se incorporó un Middleware Orientado a Mensajes que permite almacenar y reenviar mensajes en caso de que un microservicio no esté disponible temporalmente.
- ✅ **Persistencia de datos en base de datos**: Cada uno de los microservicios implementa correctamente una base de datos para la persistencia de la información.

### 1.2. Aspectos No Cumplidos de la Actividad Propuesta

- ❌ No aplica, se alcanzaron todos los aspectos requeridos por la actividad propuesta.
---

## 2. Diseño de Alto Nivel y Arquitectura

La arquitectura del sistema se basa en un enfoque de microservicios, con los siguientes componentes principales:

- **Cliente REST**: Interfaz de usuario que realiza peticiones al sistema.
- **API Gateway**: Punto central de acceso que enruta las peticiones del cliente a los microservicios correspondientes.
- **Microservicios**: Servicios independientes que manejan diferentes funcionalidades del sistema y se comunican entre sí mediante gRPC.
- **Middleware Orientado a Mensajes (MOM)**: Sistema de mensajería que garantiza la entrega de mensajes incluso en caso de fallos de los microservicios.

### Mejores Prácticas Aplicadas

- ✔️ **Separación de responsabilidades**
- ✔️ **Comunicación eficiente**
- ✔️ **Resiliencia con mensajes asincrónicos**
- ✔️ **Escalabilidad con microservicios independientes**

---

## 3. Ambiente de Desarrollo y Técnico

### Lenguaje de Programación y Herramientas

- **Lenguaje**: JavaScript (Node.js)
- **Frameworks y Librerías**:
  - Express.js
  - gRPC
  - Docker
- **Versiones**:
  - Node.js: `v14.17.0`
  - Docker: `20.10.7`

### Compilación y Ejecución

1. Clona el repositorio:

    ```bash
    git clone https://github.com/Tozuca05/Comunicaci-n-entre-Procesos-Remotos-con-Mecanismo-de-Recuperaci-n-de-Fallas.git
    cd Comunicaci-n-entre-Procesos-Remotos-con-Mecanismo-de-Recuperaci-n-de-Fallas
    ```

2. Construye y levanta los contenedores:

    ```bash
    docker-compose up --build
    ```

### Detalles del Desarrollo

- El API Gateway maneja rutas REST que redirige a servicios por gRPC.
- Cada microservicio expone funciones gRPC específicas.
- El MOM almacena temporalmente las solicitudes si un servicio falla.

### Configuración de Parámetros del Proyecto

- **Puertos**:
  - API Gateway: `3000`
  - Servicio A: `50051`
  - Servicio B: `50052`
  - Servicio C: `50053`
- **Variables de entorno** (en `.env`):
  - `SERVICE_A_HOST`
  - `SERVICE_B_HOST`
  - `SERVICE_C_HOST`

### Estructura de Directorios

```bash
.
├── api-gateway/
│   ├── index.js
│   └── ...
├── user-service-A/
│   ├── server.js
│   └── ...
├── user-service-B/
│   ├── server.js
│   └── ...
├── user-service-C/
│   ├── iserver.js
│   └── ...
├── docker-compose.yml
└── README.md
```

## 4. Ambiente de Ejecución (Producción)

### Lenguaje de Programación y Herramientas

- **Lenguaje**: JavaScript (Node.js)
- **Frameworks**: Express.js, gRPC
- **Versiones**:
  - Node.js: `v14.17.0`

### Configuración de Parámetros

- **Puertos**:
  - API Gateway: `3000`
  - Servicios gRPC: `50051`, `50052`, `50053`
- **Variables de entorno**:
  - `SERVICE_A_HOST`, `SERVICE_B_HOST`, `SERVICE_C_HOST`

### Lanzamiento del Servidor

```bash
docker-compose up --build
```

### Guía de Usuario

*Accede al servicio A:

```bash
curl http://localhost:3000/api/serviceA
```

*Simula una falla:
```bash
docker stop user-service-B
curl http://localhost:3000/api/serviceB
```

El mensaje será almacenado por el MOM y reenviado cuando el servicio esté disponible nuevamente.

## 5. Referencias Bibliográficas / Fuentes

* [Documentación oficial de gRPC](https://grpc.io/docs/)

* [Express.js](https://expressjs.com/)

* [Docker Docs](https://docs.docker.com/)

* [Node.js](https://nodejs.org/)

* [Microservices Patterns by Chris Richardson](https://microservices.io/)

* Ayudas Auxiliares: **ChatGpt** y **Clause.ai**

