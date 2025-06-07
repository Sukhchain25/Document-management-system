// ingestion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ingestions')
export class Ingestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  extractedText: string;

  @Column({ nullable: true })
  summary?: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'DONE' | 'FAILED';

  @CreateDateColumn()
  ingestedAt: Date;
}
