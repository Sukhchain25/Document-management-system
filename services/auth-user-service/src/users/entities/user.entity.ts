import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RefreshToken } from '../../auth/entities/referesh-token.entity';
import { DocumentEntity } from '../../document/entities/document.entity';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone?: string;

  @ApiProperty({ enum: ['admin', 'editor', 'viewer'], default: 'viewer' })
  @Column({ default: 'viewer' })
  role: 'admin' | 'editor' | 'viewer';

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => DocumentEntity, (document) => document.user)
  documents: DocumentEntity[];
}
