import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './document.controller';
import { DocumentsService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

// Create a proper mock Multer file
import { Readable } from 'stream';

const createMockFile = (filename: string): Express.Multer.File => ({
  fieldname: 'file',
  originalname: filename,
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1024,
  destination: './uploads',
  filename: `${Date.now()}-${filename}`,
  path: `/uploads/${Date.now()}-${filename}`,
  buffer: Buffer.from('test'),
  stream: new Readable({
    read() {
      this.push(null);
    },
  }),
});

// Create a proper mock Request with user
const createMockRequest = (user?: { sub: string }): Request =>
  ({
    user,
    // Add minimal required properties for Request type
    get: jest.fn(),
    header: jest.fn(),
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    // Add other required properties as needed
    // ... (you can add more properties if your implementation uses them)
  }) as unknown as Request;

// Mock the DocumentsService
const mockDocumentsService = {
  uploadDocument: jest.fn().mockImplementation((userId, filePath) => ({
    id: 'generated-doc-id',
    fileUrl: filePath,
    status: 'uploaded',
    userId,
  })),
};

// Mock the JWT guard
const mockJwtGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

// Mock the FileInterceptor
jest.mock('@nestjs/platform-express', () => ({
  FileInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn(),
  })),
}));

// Mock the path module
jest.mock('path', () => ({
  extname: jest.fn().mockImplementation((filename) => {
    if (filename.endsWith('.pdf')) return '.pdf';
    return '';
  }),
}));

// Mock multer diskStorage
jest.mock('multer', () => ({
  diskStorage: jest.fn().mockImplementation(() => ({
    _handleFile: jest.fn(),
    _removeFile: jest.fn(),
  })),
}));

describe('DocumentsController', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /documents/upload', () => {
    it('should successfully upload a PDF file', async () => {
      const mockFile = createMockFile('test.pdf');
      const mockRequest = createMockRequest({ sub: 'user123' });

      const result = await controller.uploadDocument(mockFile, mockRequest);

      expect(result).toEqual({
        message: 'File uploaded successfully',
        documentId: 'generated-doc-id',
      });
      expect(mockDocumentsService.uploadDocument).toHaveBeenCalledWith(
        'user123',
        expect.stringContaining('/uploads/'),
      );
    });

    it('should throw BadRequestException if no file is provided', async () => {
      const mockRequest = createMockRequest({ sub: 'user123' });

      await expect(
        controller.uploadDocument(
          undefined as unknown as Express.Multer.File,
          mockRequest,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is not authenticated', async () => {
      const mockFile = createMockFile('test.pdf');
      const mockRequest = createMockRequest(); // No user

      await expect(
        controller.uploadDocument(mockFile, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-PDF files', async () => {
      // Override the extname mock for this test
      (extname as jest.Mock).mockReturnValueOnce('.jpg');

      const mockFile = createMockFile('test.jpg');
      const mockRequest = createMockRequest({ sub: 'user123' });

      await expect(
        controller.uploadDocument(mockFile, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FileInterceptor configuration', () => {
    it('should be configured with disk storage', () => {
      expect(FileInterceptor).toHaveBeenCalledWith('file', {
        storage: expect.any(Object),
        fileFilter: expect.any(Function),
      });
      expect(diskStorage).toHaveBeenCalled();
    });

    it('should generate unique filenames', () => {
      const storageConfig = (diskStorage as jest.Mock).mock.calls[0][0];
      const filenameFn = storageConfig.filename;
      const result = filenameFn({}, { originalname: 'test.pdf' }, jest.fn());
      expect(result).toMatch(/^\d+-[\d]+\.pdf$/);
    });

    it('should filter non-PDF files', () => {
      const interceptorConfig = (FileInterceptor as jest.Mock).mock.calls[0][1];
      const fileFilterFn = interceptorConfig.fileFilter;

      // Test PDF file
      const pdfCallback = jest.fn();
      fileFilterFn({}, { originalname: 'test.pdf' }, pdfCallback);
      expect(pdfCallback).toHaveBeenCalledWith(null, true);

      // Test non-PDF file
      const jpgCallback = jest.fn();
      fileFilterFn({}, { originalname: 'test.jpg' }, jpgCallback);
      expect(jpgCallback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false,
      );
    });
  });
});
