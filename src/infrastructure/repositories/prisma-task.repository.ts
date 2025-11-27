/**
 * Prisma Task Repository Implementation
 *
 * This file implements the ITaskRepository interface using Prisma ORM.
 * Demonstrates the Repository Pattern with:
 * - Entity-to-model mapping
 * - Database operations via Prisma
 * - Error handling and transformations
 *
 * Example CRUD repository for the assets app.
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { Task as PrismaTask } from "@/generated/prisma";
import type { TaskStatus as PrismaTaskStatus } from "@/generated/prisma/enums";

import { DI_TOKENS } from "@/di/types";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";
import type {
  ITaskRepository,
  TaskFilterOptions,
} from "@/core/repositories/task.repository.interface";

/**
 * PrismaTaskRepository
 *
 * Prisma-based implementation of ITaskRepository.
 * Handles conversion between Prisma models and domain entities.
 */
@injectable()
export class PrismaTaskRepository implements ITaskRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Find all tasks with optional filtering
   */
  async findAll(filter?: TaskFilterOptions): Promise<Task[]> {
    const where = filter?.status ? { status: filter.status } : undefined;

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return tasks.map(this.toDomain);
  }

  /**
   * Find a task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    return task ? this.toDomain(task) : null;
  }

  /**
   * Create a new task
   */
  async create(task: Task): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        createdBy: task.createdBy,
      },
    });

    return this.toDomain(created);
  }

  /**
   * Update an existing task
   */
  async update(task: Task): Promise<Task> {
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        updatedAt: task.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  /**
   * Delete a task by ID
   */
  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Count tasks by status
   */
  async countByStatus(): Promise<Record<TaskStatus, number>> {
    const counts = await this.prisma.task.groupBy({
      by: ["status"],
      _count: true,
    });

    const result: Record<TaskStatus, number> = {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
    };

    counts.forEach((count: { status: PrismaTaskStatus; _count: number }) => {
      result[count.status as TaskStatus] = count._count;
    });

    return result;
  }

  /**
   * Convert Prisma model to domain entity
   *
   * @param prismaTask - Prisma Task model
   * @returns Domain Task entity
   */
  private toDomain(prismaTask: PrismaTask): Task {
    return new Task(
      prismaTask.id,
      prismaTask.title,
      prismaTask.description,
      prismaTask.status as TaskStatus,
      prismaTask.createdBy,
      prismaTask.createdAt,
      prismaTask.updatedAt,
    );
  }
}
