# Document Management System

A scalable, microservices-based Document Management System built with [NestJS](https://nestjs.com/), TypeScript, TypeORM, RabbitMQ, Jest and PDF parsing.

---

## Project Structure

```
services/
  auth-user-service/      # Handles authentication, user management, document upload
  ingestion-service/      # Handles document ingestion and PDF text extraction
```

Each service is a standalone NestJS application with its own dependencies, configuration, and tests.

---

## Features

- **User Authentication & Management** (auth-user-service)
- **Document Upload** (auth-user-service)
- **PDF Parsing & Ingestion** (ingestion-service)
- **Microservice Communication** via RabbitMQ
- **REST APIs** with Swagger documentation
- **Unit & Integration Tests** with Jest
- **Docker-ready** for easy deployment

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [RabbitMQ](https://www.rabbitmq.com/) running locally or in the cloud
- [PostgreSQL](https://www.postgresql.org/) or another supported database

---

### Setup

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Document-management-system
```

#### 2. Install dependencies for each service

```bash
cd services/auth-user-service
npm install

cd ../ingestion-service
npm install
```

#### 3. Configure Environment Variables

Copy `.env.example` to `.env` in each service and update values as needed (DB, RabbitMQ, JWT, etc.).

---

### Running the Services

#### Start RabbitMQ (if not already running)

```bash
docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 rabbitmq:3
```

#### Start Auth/User Service

```bash
cd services/auth-user-service
npm run start:dev
```

#### Start Ingestion Service

```bash
cd services/ingestion-service
npm run start:dev
```

---

### API Documentation

Access the exposed Swagger docs: [http://localhost:3000/api](http://localhost:3000/api)

---

### Running Tests

Each service has its own tests:

```bash
# From each service directory
npm run test
npm run test:cov
```

---

### Deployment

See [NestJS deployment docs](https://docs.nestjs.com/deployment) for production best practices.

You can also deploy to AWS using [NestJS Mau](https://mau.nestjs.com):

```bash
npm install -g @nestjs/mau
mau deploy
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [TypeORM Documentation](https://typeorm.io/)
- [Jest Documentation](https://jestjs.io/)

---

## License

[MIT](LICENSE)
