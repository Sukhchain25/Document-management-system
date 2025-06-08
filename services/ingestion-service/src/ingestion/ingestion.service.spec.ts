import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ingestion } from '../ingestion/entities/ingestion.entity';
import { logger } from '../shared/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

jest.mock('fs');
const realPath = jest.requireActual('path');
jest
  .spyOn(realPath, 'resolve')
  .mockImplementation((...args) => '/abs/path/file.pdf');
jest.mock('pdf-parse');
jest.mock('../shared/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockIngestionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
};

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: getRepositoryToken(Ingestion),
          useValue: mockIngestionRepository,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    jest.clearAllMocks();
  });

  describe('saveIngestionResult', () => {
    it('should create and save ingestion entity', async () => {
      const data = {
        documentId: 'doc1',
        userId: 'user1',
        extractedText: 'text',
        status: 'DONE' as 'DONE',
      };
      const created = { ...data, id: 1 };
      mockIngestionRepository.create.mockReturnValue(created);
      mockIngestionRepository.save.mockResolvedValue(created);

      const result = await service.saveIngestionResult(data);
      expect(mockIngestionRepository.create).toHaveBeenCalledWith(data);
      expect(mockIngestionRepository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });
  });

  describe('getIngestionByDocumentId', () => {
    it('should return ingestion entity if found', async () => {
      const ingestion = { documentId: 'doc1' };
      mockIngestionRepository.findOneBy.mockResolvedValue(ingestion);
      const result = await service.getIngestionByDocumentId('doc1');
      expect(mockIngestionRepository.findOneBy).toHaveBeenCalledWith({
        documentId: 'doc1',
      });
      expect(result).toBe(ingestion);
    });

    it('should return null if not found', async () => {
      mockIngestionRepository.findOneBy.mockResolvedValue(null);
      const result = await service.getIngestionByDocumentId('doc2');
      expect(result).toBeNull();
    });
  });

  describe('handleDocumentUploaded', () => {
    const payload = {
      documentId: 'doc1',
      userId: 'user1',
      fileUrl: '/some/path/file.pdf',
    };

    it('should process PDF, save ingestion, and log info', async () => {
      const absolutePath = '/abs/path/file.pdf';
      (path.resolve as jest.Mock).mockReturnValue(absolutePath);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('pdf'));
      (pdfParse as jest.Mock).mockResolvedValue({ text: 'Extracted text' });

      const saved = {
        id: 1,
        ...payload,
        extractedText: 'Extracted text',
        status: 'DONE',
      };
      mockIngestionRepository.create.mockReturnValue(saved);
      mockIngestionRepository.save.mockResolvedValue(saved);

      const result = await service.handleDocumentUploaded(payload);

      expect(path.resolve).toHaveBeenCalledWith(payload.fileUrl);
      expect(fs.readFileSync).toHaveBeenCalledWith(absolutePath);
      expect(pdfParse).toHaveBeenCalled();
      expect(mockIngestionRepository.create).toHaveBeenCalledWith({
        documentId: payload.documentId,
        userId: payload.userId,
        extractedText: 'Extracted text',
        status: 'DONE',
      });
      expect(logger.info).toHaveBeenCalledWith(
        `Handling document uploaded for documentId: ${payload.documentId}, userId: ${payload.userId}`,
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Ingestion saved for documentId: ${payload.documentId}`,
      );
      expect(result).toBe(saved);
    });

    it('should handle missing text in pdfData', async () => {
      (path.resolve as jest.Mock).mockReturnValue('/abs/path/file.pdf');
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('pdf'));
      (pdfParse as jest.Mock).mockResolvedValue({});

      const saved = { id: 2, ...payload, extractedText: '', status: 'DONE' };
      mockIngestionRepository.create.mockReturnValue(saved);
      mockIngestionRepository.save.mockResolvedValue(saved);

      const result = await service.handleDocumentUploaded(payload);

      expect(mockIngestionRepository.create).toHaveBeenCalledWith({
        documentId: payload.documentId,
        userId: payload.userId,
        extractedText: '',
        status: 'DONE',
      });
      expect(result).toBe(saved);
    });

    it('should save status FAILED and log error on exception', async () => {
      (path.resolve as jest.Mock).mockReturnValue('/abs/path/file.pdf');
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('FS error');
      });

      const failed = { id: 3, ...payload, extractedText: '', status: 'FAILED' };
      mockIngestionRepository.create.mockReturnValue(failed);
      mockIngestionRepository.save.mockResolvedValue(failed);

      await expect(service.handleDocumentUploaded(payload)).rejects.toThrow(
        'FS error',
      );
      expect(mockIngestionRepository.create).toHaveBeenCalledWith({
        documentId: payload.documentId,
        userId: payload.userId,
        extractedText: '',
        status: 'FAILED',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to ingest document: FS error',
      );
    });
  });
});
