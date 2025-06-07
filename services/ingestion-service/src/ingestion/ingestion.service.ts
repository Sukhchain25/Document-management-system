import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingestion } from '../ingestion/entities/ingestion.entity';
import { logger } from '../shared/logger';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Ingestion)
    private ingestionRepository: Repository<Ingestion>,
  ) {}

  async saveIngestionResult(data: Partial<Ingestion>): Promise<Ingestion> {
    const ingestion = this.ingestionRepository.create(data);
    return this.ingestionRepository.save(ingestion);
  }

  async getIngestionByDocumentId(
    documentId: string,
  ): Promise<Ingestion | null> {
    return this.ingestionRepository.findOneBy({ documentId });
  }

  async handleDocumentUploaded(payload: {
    documentId: string;
    userId: string;
    fileUrl: string;
  }) {
    logger.info(
      `Handling document uploaded for documentId: ${payload.documentId}, userId: ${payload.userId}`,
    );

    try {
      const absolutePath = path.resolve(payload.fileUrl);
      const fileBuffer = readFileSync(absolutePath);
      const pdfData = await pdfParse(fileBuffer);

      const extractedText = pdfData.text || '';

      const saved = await this.saveIngestionResult({
        documentId: payload.documentId,
        userId: payload.userId,
        extractedText,
        status: 'DONE',
      });

      logger.info(`Ingestion saved for documentId: ${payload.documentId}`);
      return saved;
    } catch (err) {
      logger.error('Failed to ingest document: ' + err.message);
      await this.saveIngestionResult({
        documentId: payload.documentId,
        userId: payload.userId,
        extractedText: '',
        status: 'FAILED',
      });
      throw err;
    }
  }
}
