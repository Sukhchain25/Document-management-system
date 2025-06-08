import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingestion } from './ingestion/entities/ingestion.entity';
import { IngestionService } from './ingestion/ingestion.service';
import { IngestionController } from './ingestion/ingestion.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IngestionModule } from './ingestion/ingestion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Ingestion],
        // optionally other TypeORM config here like synchronize, logging, etc.
      }),
    }),

    TypeOrmModule.forFeature([Ingestion]),

    ClientsModule.registerAsync([
      {
        name: 'USER_AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')].filter(
              (url): url is string => typeof url === 'string',
            ),
            queue: 'document_upload_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),

    IngestionModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class AppModule {}
