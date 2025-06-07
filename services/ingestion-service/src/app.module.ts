import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingestion } from './ingestion/entities/ingestion.entity';
import { IngestionService } from './ingestion/ingestion.service';
import { IngestionController } from './ingestion/ingestion.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IngestionModule } from './ingestion/ingestion.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgres://sukhchain:postgres@localhost:5432/ingestion',
      entities: [Ingestion],
    }),
    TypeOrmModule.forFeature([Ingestion]),
    ClientsModule.register([
      {
        name: 'USER_AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672'],
          queue: 'document_upload_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    IngestionModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class AppModule {}
