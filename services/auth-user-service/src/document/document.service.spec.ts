import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './document.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from './entities/document.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import { of } from 'rxjs';

jest.spyOn(path, 'resolve').mockImplementation((...args) => args.join('/'));

function createMockDocument(
  overrides?: Partial<DocumentEntity>,
): DocumentEntity {
  return {
    id: 'doc1',
    fileUrl: '/tmp/file.pdf',
    status: 'uploaded',
    userId: 'user1',
    user: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepository: jest.Mocked<Repository<DocumentEntity>>;
  let client: { emit: jest.Mock };

  beforeEach(async () => {
    // Initialize mocked dependencies
    documentRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    client = {
      emit: jest.fn().mockReturnValue(of(true)),
    };

    // Setup Testing Module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: documentRepository,
        },
        { provide: 'RABBITMQ_SERVICE', useValue: client },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should create, save, and emit "document_uploaded" event', async () => {
      // Arrange
      const userId = 'user1';
      const fileUrl = '/tmp/file.pdf';
      const savedDoc = createMockDocument({ id: 'doc1', fileUrl, userId });

      documentRepository.create.mockReturnValue(savedDoc);
      documentRepository.save.mockResolvedValue(savedDoc);
      (path.resolve as jest.Mock).mockReturnValue('/abs/tmp/file.pdf');

      // Act
      const result = await service.uploadDocument(userId, fileUrl);

      // Assert
      expect(documentRepository.create).toHaveBeenCalledWith({
        fileUrl,
        status: 'uploaded',
        userId,
      });
      expect(documentRepository.save).toHaveBeenCalledWith(savedDoc);
      expect(client.emit).toHaveBeenCalledWith('document_uploaded', {
        documentId: savedDoc.id,
        userId,
        fileUrl: '/abs/tmp/file.pdf', // Resolved path
      });
      expect(result).toEqual(savedDoc);
    });

    it('should throw if document save fails', async () => {
      // Arrange
      const minimalDoc = createMockDocument(); // All fields defaulted
      documentRepository.create.mockReturnValue(minimalDoc);
      documentRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.uploadDocument('user1', '/tmp/file.pdf'),
      ).rejects.toThrow('DB error');
    });
  });
});
