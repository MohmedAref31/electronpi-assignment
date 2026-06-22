import { userRepo, projectRepo, taskRepo } from '../entities';
import { UserRole, ProjectStatus, TaskStatus, TaskPriority } from '../entities/enums';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';
import type { User } from '../entities/User';

interface UserSeed {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface ProjectSeed {
  title: string;
  description: string;
  status: ProjectStatus;
  ownerEmail: string;
  tasks: TaskSeed[];
}

interface TaskSeed {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays: number | null;
}

const USERS: UserSeed[] = [
  { name: 'member1', email: 'member1@example.com', password: 'Password123', role: UserRole.MEMBER },
  { name: 'member2', email: 'member2@example.com', password: 'Password123', role: UserRole.MEMBER },
  { name: 'member3', email: 'member3@example.com', password: 'Password123', role: UserRole.MEMBER },
];

const PROJECTS: ProjectSeed[] = [
  {
    title: 'Website Redesign',
    description: 'Redesign the company marketing website with a modern look and feel.',
    status: ProjectStatus.ACTIVE,
    ownerEmail: 'member1@example.com',
    tasks: [
      {
        title: 'Audit current site',
        description: 'Review existing pages, assets, and analytics.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueInDays: -7,
      },
      {
        title: 'Create wireframes',
        description: 'Low-fidelity wireframes for all key pages.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueInDays: 3,
      },
      {
        title: 'Design mockups',
        description: 'High-fidelity Figma mockups for desktop and mobile.',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueInDays: 10,
      },
    ],
  },
  {
    title: 'Mobile App MVP',
    description: 'Build the minimum viable product for the iOS and Android mobile app.',
    status: ProjectStatus.ACTIVE,
    ownerEmail: 'member2@example.com',
    tasks: [
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for build, test, and deploy.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueInDays: 5,
      },
      {
        title: 'Implement authentication screens',
        description: 'Login, register, and forgot password flows.',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dueInDays: 14,
      },
    ],
  },
  {
    title: 'Q4 Marketing Campaign',
    description: 'Plan and execute the Q4 holiday marketing campaign across all channels.',
    status: ProjectStatus.COMPLETED,
    ownerEmail: 'member3@example.com',
    tasks: [
      {
        title: 'Define campaign goals',
        description: 'Set KPIs and target audience segments.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueInDays: -30,
      },
      {
        title: 'Launch campaign',
        description: 'Go live with email, social, and paid ads.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueInDays: -2,
      },
    ],
  },
];

/**
 * Seeds sample users, projects, and tasks. Idempotent - skips if the first
 * sample user already exists (assumes the dataset was already loaded).
 */
export async function seedData(): Promise<void> {
  const sentinel = await userRepo.findOneBy({ email: USERS[0].email });
  if (sentinel) {
    logger.info('Data seeder: sample data already exists, skipping');
    return;
  }

  // ----- Users -----
  const userMap = new Map<string, User>();
  for (const u of USERS) {
    const hashedPassword = await hashPassword(u.password);
    const user = userRepo.create({
      name: u.name,
      email: u.email,
      password: hashedPassword,
      role: u.role,
    });
    await userRepo.save(user);
    userMap.set(u.email, user);
    logger.info('Data seeder: created user', { id: user.id, email: user.email });
  }

  // ----- Projects + Tasks -----
  for (const p of PROJECTS) {
    const owner = userMap.get(p.ownerEmail);
    if (!owner) {
      logger.warn('Data seeder: missing owner user for project, skipping', { title: p.title });
      continue;
    }

    const project = projectRepo.create({
      title: p.title,
      description: p.description,
      status: p.status,
      ownerId: owner.id,
    });
    await projectRepo.save(project);
    logger.info('Data seeder: created project', { id: project.id, title: project.title });

    for (const t of p.tasks) {
      const dueDate = t.dueInDays !== null ? new Date(Date.now() + t.dueInDays * 86_400_000) : null;

      const task = taskRepo.create({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate,
        projectId: project.id,
      });
      await taskRepo.save(task);
    }

    logger.info('Data seeder: created tasks for project', {
      projectId: project.id,
      count: p.tasks.length,
    });
  }

  logger.info('Data seeder: sample data inserted', {
    users: userMap.size,
    projects: PROJECTS.length,
    tasks: PROJECTS.reduce((sum, p) => sum + p.tasks.length, 0),
  });
}
