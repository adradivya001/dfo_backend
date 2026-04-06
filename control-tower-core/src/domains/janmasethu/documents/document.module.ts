import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentService } from './document.service';
import { DocumentRepository } from './document.repository';
import { DocumentStorageService } from './document.storage';
import { DocumentGeneratorService } from './document.generator';
import { DocumentWorker } from './document.worker';
import { DocumentController } from './document.controller';
import { JanmasethuEncryptionService } from '../utils/encryption.service';
import { JanmasethuRbacService } from '../janmasethu.rbac';
import { JanmasethuAuditService } from '../janmasethu.audit.service';
import { JanmasethuRepository } from '../janmasethu.repository';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'document_generation_queue' }),
    ],
    providers: [
        DocumentService,
        DocumentRepository,
        DocumentStorageService,
        DocumentGeneratorService,
        DocumentWorker,
        JanmasethuEncryptionService,
        JanmasethuRbacService,
        JanmasethuAuditService,
        JanmasethuRepository,
    ],
    controllers: [DocumentController],
    exports: [DocumentService],
})
export class DocumentModule { }
