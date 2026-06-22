import { AppDataSource } from '../data-source';
import { User } from './User';
import { Project } from './Project';
import { Task } from './Task';

export const userRepo = AppDataSource.getRepository(User);
export const projectRepo = AppDataSource.getRepository(Project);
export const taskRepo = AppDataSource.getRepository(Task);
