import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672'],
        queue: 'document_upload_queue',
        queueOptions: {
          durable: false, // or true depending on your use case
        },
      },
    },
  );

  await app.listen();
  console.log('🚀 Ingestion microservice is listening on RabbitMQ...');
}

bootstrap();
