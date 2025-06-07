import { Controller, Get, Param } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestions')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get(':documentId')
  async getByDocumentId(@Param('documentId') documentId: string) {
    return this.ingestionService.getIngestionByDocumentId(documentId);
  }
}
