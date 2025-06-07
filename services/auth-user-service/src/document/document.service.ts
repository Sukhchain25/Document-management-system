// src/documents/documents.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { DocumentEntity } from './entities//document.entity';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  async uploadDocument(
    userId: string,
    fileUrl: string,
  ): Promise<DocumentEntity> {
    const document = this.documentRepository.create({
      fileUrl,
      status: 'uploaded',
      userId,
    });
    const savedDoc = await this.documentRepository.save(document);
    const absolutePath = path.resolve(fileUrl);
    await firstValueFrom(
      this.client.emit('document_uploaded', {
        documentId: savedDoc.id,
        userId,
        fileUrl: absolutePath,
      }),
    );

    return savedDoc;
  }
}
