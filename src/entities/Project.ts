import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { ProjectStatus } from './enums';
import { User } from './User';
import { Task } from './Task';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus = ProjectStatus.ACTIVE;

  @Index()
  @Column({ type: 'int' })
  ownerId!: number;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Task, (task) => task.project, { cascade: true })
  tasks?: Task[];
}
