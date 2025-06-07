import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IngestionService } from '../ingestion.service';
import { logger } from '../../shared/logger';

@Controller()
export class IngestionListener {
  constructor(private readonly ingestionService: IngestionService) {}

  @MessagePattern('document_uploaded')
  async onDocumentUploaded(@Payload() payload: any) {
    logger.info(
      `Received document_uploaded event with payload: ${JSON.stringify(payload)}`,
    );
    return this.ingestionService.handleDocumentUploaded(payload);
  }
}
