import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionService } from './ingestion.service';
import { Ingestion } from './entities/ingestion.entity';
import { IngestionListener } from './event-listeners/ingestion.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Ingestion])],
  providers: [IngestionService],
  controllers: [IngestionListener],
})
export class IngestionModule {}
