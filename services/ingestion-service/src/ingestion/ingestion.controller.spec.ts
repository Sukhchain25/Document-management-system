import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { Ingestion } from './entities/ingestion.entity';

describe('IngestionController', () => {
  let controller: IngestionController;
  let service: IngestionService;

  const mockIngestionService = {
    getIngestionByDocumentId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestionService,
          useValue: mockIngestionService,
        },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    service = module.get<IngestionService>(IngestionService);

    jest.clearAllMocks();
  });

  describe('getByDocumentId', () => {
    it('should return ingestion if found', async () => {
      const docId = 'doc123';
      const ingestionData: Ingestion = {
        id: '123',
        documentId: docId,
        userId: 'user1',
        extractedText: 'sample text',
        status: 'DONE',
        ingestedAt: new Date(),
      };

      mockIngestionService.getIngestionByDocumentId.mockResolvedValueOnce(
        ingestionData,
      );

      const result = await controller.getByDocumentId(docId);

      expect(result).toEqual(ingestionData);
      expect(service.getIngestionByDocumentId).toHaveBeenCalledWith(docId);
    });

    it('should return null if ingestion not found', async () => {
      const docId = 'nonexistent';
      mockIngestionService.getIngestionByDocumentId.mockResolvedValueOnce(null);

      const result = await controller.getByDocumentId(docId);

      expect(result).toBeNull();
      expect(service.getIngestionByDocumentId).toHaveBeenCalledWith(docId);
    });
  });
});
