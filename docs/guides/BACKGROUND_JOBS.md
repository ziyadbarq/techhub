# Background Jobs Guide

Complete guide to using the BullMQ-based background job processing system in the Barq assets app.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Creating Jobs](#creating-jobs)
- [Job Handlers](#job-handlers)
- [Scheduling Jobs](#scheduling-jobs)
- [Monitoring](#monitoring)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The background job system provides robust, scalable job processing using:

- **BullMQ**: Production-ready queue system built on Redis
- **Redis**: Fast in-memory data store for job queues
- **Clean Architecture**: Jobs integrated with DI and use cases
- **Type Safety**: Full TypeScript support with job data types

### Features

- ✅ Priority queuing
- ✅ Automatic retries with exponential backoff
- ✅ Scheduled/delayed jobs
- ✅ Cron-based recurring jobs
- ✅ Progress tracking
- ✅ Job monitoring dashboard
- ✅ Graceful shutdown
- ✅ Full DI integration

## Quick Start

### 1. Start Redis

```bash
# Start Redis via Docker
npm run redis:start

# Check Redis is running
npm run redis:logs
```

### 2. Start the Worker

In development:

```bash
npm run worker:dev
```

The worker will:

- Initialize the DI container
- Start processing jobs from all queues
- Log job execution in real-time

### 3. Queue a Job

```typescript
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import { QUEUE_NAMES, TASK_JOBS } from "@/core/domain/jobs/job-names";

// Get job queue service
const container = getContainer();
const jobQueue = container.get<IJobQueueService>(DI_TOKENS.IJobQueueService);

// Add a job
const jobId = await jobQueue.addJob(
  QUEUE_NAMES.TASKS,
  TASK_JOBS.TASK_COMPLETED_NOTIFICATION,
  {
    taskId: "task-123",
    taskTitle: "My Task",
    completedAt: new Date(),
    userId: "user-456",
  },
  {
    priority: 8,
    attempts: 3,
  },
);

console.log(`Job queued: ${jobId}`);
```

### 4. Monitor Jobs

Visit http://localhost:3000/api/admin/queues (development only) to see:

- Queue statistics
- Active/waiting/completed/failed job counts
- Real-time updates every 5 seconds

## Architecture

### Layers

```
┌─────────────────────────────────────────────┐
│  Use Cases (Business Logic)                │
│  - CompleteTaskUseCase                      │
│  - ScheduleTaskReminderUseCase              │
└─────────────────┬───────────────────────────┘
                  │ uses
                  ▼
┌─────────────────────────────────────────────┐
│  IJobQueueService (Core Interface)          │
│  - addJob(), scheduleJob()                  │
│  - getJobStatus(), getQueueMetrics()        │
└─────────────────┬───────────────────────────┘
                  │ implements
                  ▼
┌─────────────────────────────────────────────┐
│  BullMQService (Infrastructure)             │
│  - Queue management                         │
│  - Redis connection                         │
└─────────────────┬───────────────────────────┘
                  │ stores in
                  ▼
┌─────────────────────────────────────────────┐
│  Redis (Job Storage)                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Worker Process (Separate Node.js)         │
│  - BaseWorker instances                     │
│  - Job handlers                             │
│  - DI container                             │
└─────────────────────────────────────────────┘
```

### File Structure

```
src/
├── core/
│   ├── domain/jobs/
│   │   ├── job-names.ts           # Job and queue name constants
│   │   └── job-data.types.ts      # Job data interfaces
│   ├── services/
│   │   └── job-queue.service.interface.ts  # Queue service interface
│   └── use-cases/task/
│       └── schedule-task-reminder.use-case.ts
├── infrastructure/services/queue/
│   ├── bullmq.service.ts          # BullMQ implementation
│   ├── base-worker.ts             # Worker base class
│   ├── types.ts                   # Worker types
│   ├── worker.ts                  # Worker entry point
│   ├── scheduled-jobs.ts          # Cron job setup
│   └── handlers/
│       ├── task-completed-notification.handler.ts
│       ├── cleanup-old-tasks.handler.ts
│       └── send-task-reminder.handler.ts
├── di/modules/
│   └── queue.module.ts            # DI bindings
└── app/api/admin/queues/
    ├── route.ts                   # Admin UI
    └── stats/route.ts             # Queue statistics API
```

## Creating Jobs

### 1. Define Job Name

Add to `src/core/domain/jobs/job-names.ts`:

```typescript
export const TASK_JOBS = {
  // ... existing jobs
  MY_NEW_JOB: "my-new-job",
} as const;
```

### 2. Define Job Data Type

Add to `src/core/domain/jobs/job-data.types.ts`:

```typescript
export interface MyNewJobData extends BaseJobData {
  userId: string;
  customField: string;
  metadata?: Record<string, unknown>;
}
```

### 3. Create Job Handler

Create `src/infrastructure/services/queue/handlers/my-new-job.handler.ts`:

```typescript
import type { Job } from "bullmq";
import type { MyNewJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IMyService } from "@/core/services/my-service.interface";

export async function handleMyNewJob(job: Job<MyNewJobData>): Promise<void> {
  const { userId, customField } = job.data;

  console.log(`[MyNewJob] Processing for user: ${userId}`);

  // Update progress
  await job.updateProgress(20);

  // Get dependencies from DI container
  const container = getContainer();
  const myService = container.get<IMyService>(DI_TOKENS.IMyService);

  // Do work
  await myService.doSomething(customField);
  await job.updateProgress(80);

  // More work...
  await job.updateProgress(100);

  console.log(`[MyNewJob] Completed for user: ${userId}`);
}
```

### 4. Register Handler in Worker

Update `src/infrastructure/services/queue/worker.ts`:

```typescript
import { handleMyNewJob } from "./handlers/my-new-job.handler";

function createTaskWorker(): BaseWorker {
  const worker = new BaseWorker({
    queueName: QUEUE_NAMES.TASKS,
    concurrency: 5,
  });

  // Register handlers
  worker.registerHandler(TASK_JOBS.MY_NEW_JOB, handleMyNewJob);
  // ... other handlers

  return worker;
}
```

### 5. Queue the Job

From a use case or controller:

```typescript
import type { MyNewJobData } from "@/core/domain/jobs/job-data.types";

const jobData: MyNewJobData = {
  userId: "user-123",
  customField: "value",
  entityId: "entity-456",
  createdAt: Date.now(),
};

const jobId = await this.jobQueueService.addJob(
  QUEUE_NAMES.TASKS,
  TASK_JOBS.MY_NEW_JOB,
  jobData,
  {
    priority: 5,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
);
```

## Job Handlers

### Handler Best Practices

1. **Idempotency**: Handlers should be safe to retry

   ```typescript
   // Bad: Creates duplicate records
   await db.insert({ id: uuid() });

   // Good: Uses deterministic ID
   const id = `task-${job.data.taskId}-notification`;
   await db.upsert({ id, ...data });
   ```

2. **Error Handling**: Let errors throw to trigger retries

   ```typescript
   export async function handleJob(job: Job<Data>): Promise<void> {
     // Don't catch errors - let BullMQ handle retries
     await riskyOperation();

     // Only catch if you can recover
     try {
       await optionalOperation();
     } catch (error) {
       console.warn("Optional operation failed, continuing...", error);
     }
   }
   ```

3. **Progress Updates**: Report progress for long-running jobs

   ```typescript
   await job.updateProgress(0);
   await step1();
   await job.updateProgress(33);
   await step2();
   await job.updateProgress(66);
   await step3();
   await job.updateProgress(100);
   ```

4. **DI Access**: Get dependencies from container

   ```typescript
   const container = getContainer();
   const repo = container.get<IRepository>(DI_TOKENS.IRepository);
   ```

5. **Logging**: Use descriptive logs
   ```typescript
   console.log(`[HandlerName] Processing entity: ${id}`);
   console.error(`[HandlerName] Failed:`, error);
   ```

### Handler Return Values

Handlers can optionally return data:

```typescript
export async function handleDataExport(
  job: Job<ExportData>,
): Promise<{ exportUrl: string; fileSize: number }> {
  const result = await exportService.export(job.data);

  return {
    exportUrl: result.url,
    fileSize: result.size,
  };
}

// Access return value later
const job = await queue.getJob(jobId);
console.log(job.returnvalue); // { exportUrl: "...", fileSize: 1024 }
```

## Scheduling Jobs

### Delayed Jobs

Execute a job after a delay:

```typescript
await jobQueue.addJob(
  QUEUE_NAMES.TASKS,
  TASK_JOBS.TASK_REMINDER,
  reminderData,
  {
    delay: 24 * 60 * 60 * 1000, // 24 hours in ms
  },
);
```

### Recurring Jobs (Cron)

Set up in `src/infrastructure/services/queue/scheduled-jobs.ts`:

```typescript
export async function setupScheduledJobs(
  jobQueueService: IJobQueueService,
): Promise<void> {
  // Daily cleanup at 2 AM UTC
  await jobQueueService.scheduleJob(
    QUEUE_NAMES.TASKS,
    TASK_JOBS.CLEANUP_OLD_TASKS,
    { olderThanDays: 30 },
    {
      pattern: "0 2 * * *",
      tz: "UTC",
    },
  );

  // Every 15 minutes
  await jobQueueService.scheduleJob(
    QUEUE_NAMES.MAINTENANCE,
    MAINTENANCE_JOBS.HEALTH_CHECK,
    { checks: ["database", "redis"] },
    {
      pattern: "*/15 * * * *",
    },
  );
}
```

### Cron Pattern Examples

```
# Every minute
* * * * *

# Every 5 minutes
*/5 * * * *

# Every hour at minute 0
0 * * * *

# Every day at midnight
0 0 * * *

# Every day at 2:30 AM
30 2 * * *

# Every Monday at 9 AM
0 9 * * 1

# First day of every month
0 0 1 * *

# Weekdays at 8 AM
0 8 * * 1-5
```

## Monitoring

### Admin Dashboard

Access at http://localhost:3000/api/admin/queues (dev only)

Shows:

- Queue names
- Job counts (waiting, active, completed, failed)
- Real-time updates

### Programmatic Monitoring

```typescript
// Get queue metrics
const metrics = await jobQueue.getQueueMetrics(QUEUE_NAMES.TASKS);
console.log(`Waiting: ${metrics.waiting}`);
console.log(`Active: ${metrics.active}`);
console.log(`Failed: ${metrics.failed}`);

// Get specific job status
const status = await jobQueue.getJobStatus(QUEUE_NAMES.TASKS, jobId);
if (status) {
  console.log(`Progress: ${status.progress}%`);
  console.log(`Attempts: ${status.attemptsMade}`);
  if (status.failedReason) {
    console.error(`Failed: ${status.failedReason}`);
  }
}
```

### Queue Control

```typescript
// Pause queue (stop processing new jobs)
await jobQueue.pauseQueue(QUEUE_NAMES.TASKS);

// Resume queue
await jobQueue.resumeQueue(QUEUE_NAMES.TASKS);

// Remove a job
await jobQueue.removeJob(QUEUE_NAMES.TASKS, jobId);
```

## Testing

### Unit Tests with Mock Queue

```typescript
import { createMockJobQueue } from "tests/helpers/queue.helper";

describe("MyUseCase", () => {
  let mockQueue: ReturnType<typeof createMockJobQueue>;

  beforeEach(() => {
    mockQueue = createMockJobQueue();
    // Bind to DI container
  });

  it("should queue job", async () => {
    await useCase.execute();

    const jobs = mockQueue.getJobsByName("my-job");
    expect(jobs).toHaveLength(1);
    expect(jobs[0].data).toMatchObject({
      userId: "user-123",
    });
  });
});
```

### Integration Tests

For testing actual job processing, use a test Redis instance:

```typescript
import { BullMQService } from "@/infrastructure/services/queue/bullmq.service";

describe("Job Processing (Integration)", () => {
  let jobQueue: BullMQService;
  let worker: BaseWorker;

  beforeAll(async () => {
    // Use test Redis URL
    process.env.REDIS_URL = "redis://localhost:6380";

    jobQueue = new BullMQService();
    worker = new BaseWorker({ queueName: "test-queue" });
    worker.registerHandler("test-job", handleTestJob);
    await worker.start();
  });

  afterAll(async () => {
    await worker.stop();
    await jobQueue.close();
  });

  it("should process job", async () => {
    const jobId = await jobQueue.addJob("test-queue", "test-job", {
      value: "test",
    });

    // Wait for job to complete
    await waitForJobCompletion(jobQueue, "test-queue", jobId);

    const status = await jobQueue.getJobStatus("test-queue", jobId);
    expect(status?.progress).toBe(100);
  });
});
```

## Production Deployment

### Environment Variables

Required in `.env`:

```env
REDIS_URL="redis://your-redis-host:6379"
NODE_ENV="production"
DATABASE_URL="postgresql://..."
```

### Integrated Deployment (Recommended)

The `start-server.js` script handles both server and worker in a single process:

```bash
# Full deployment pipeline: build → migrate → seed (if empty) → clear cache → start server + worker
npm run start:deploy

# With options
npm run start -- --deploy --force-build   # Force rebuild even if .next exists
npm run start -- --deploy --skip-seed     # Skip seeding
npm run start -- --skip-worker            # Don't start the background worker
```

The deployment script:
1. **Builds** the application (skips if `.next` exists, use `--force-build` to rebuild)
2. **Generates** Prisma client (`npm run db:generate`)
3. **Applies migrations** (`prisma migrate deploy`)
4. **Smart seeds** the database (only if `Role` table is empty)
5. **Clears** Redis cache
6. **Starts** both Next.js server and background worker with graceful shutdown

### Standalone Worker Deployment

For scaling, you can run workers separately from the server.

#### Option 1: PM2

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start npm --name "worker" -- run worker:start

# Monitor
pm2 logs worker
pm2 monit

# Restart
pm2 restart worker

# Stop
pm2 stop worker
```

#### Option 2: Docker

```dockerfile
# Dockerfile.worker
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/infrastructure/services/queue/worker.js"]
```

```yaml
# docker-compose.yml (add to existing)
services:
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
```

#### Option 3: Systemd (Linux)

```ini
# /etc/systemd/system/barq-worker.service
[Unit]
Description=Barq Background Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/barq
ExecStart=/usr/bin/node dist/infrastructure/services/queue/worker.js
Restart=always
Environment="NODE_ENV=production"
Environment="REDIS_URL=redis://localhost:6379"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable barq-worker
sudo systemctl start barq-worker
sudo systemctl status barq-worker
```

### Redis Configuration

#### Redis Cloud (Recommended for Production)

Use a managed Redis service:

- **Upstash**: Serverless Redis with free tier
- **Redis Cloud**: Official managed Redis
- **AWS ElastiCache**: For AWS deployments
- **Google Memorystore**: For GCP deployments

Update `REDIS_URL`:

```env
REDIS_URL="rediss://username:password@your-redis.upstash.io:6379"
```

#### Self-Hosted Redis

For production, configure:

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
```

### Monitoring in Production

1. **Queue Metrics**: Export to monitoring system

   ```typescript
   // Send metrics to Prometheus, Datadog, etc.
   setInterval(async () => {
     const metrics = await jobQueue.getQueueMetrics(QUEUE_NAMES.TASKS);
     monitoring.gauge("queue.waiting", metrics.waiting);
     monitoring.gauge("queue.active", metrics.active);
     monitoring.gauge("queue.failed", metrics.failed);
   }, 60000);
   ```

2. **Worker Health Checks**: Endpoint for load balancer

   ```typescript
   // src/app/api/health/worker/route.ts
   export async function GET() {
     const isHealthy = await checkWorkerHealth();
     return Response.json(
       { status: isHealthy ? "ok" : "unhealthy" },
       { status: isHealthy ? 200 : 503 },
     );
   }
   ```

3. **Alerts**: Set up alerts for:
   - High number of failed jobs
   - Jobs stuck in waiting state
   - Worker process crashes
   - Redis connection errors

### Scaling

#### Horizontal Scaling (Multiple Workers)

BullMQ supports multiple worker processes:

```bash
# Start multiple worker instances
pm2 start npm --name "worker-1" -- run worker:start
pm2 start npm --name "worker-2" -- run worker:start
pm2 start npm --name "worker-3" -- run worker:start

# Or use PM2 cluster mode
pm2 start npm --name "workers" -i 3 -- run worker:start
```

Workers automatically coordinate via Redis:

- Jobs are distributed across workers
- No duplicate processing
- Automatic failover if a worker crashes

#### Vertical Scaling (Concurrency)

Adjust concurrency per queue:

```typescript
const taskWorker = new BaseWorker({
  queueName: QUEUE_NAMES.TASKS,
  concurrency: 20, // Process up to 20 jobs concurrently
});
```

Guidelines:

- **CPU-bound jobs**: concurrency = CPU cores
- **I/O-bound jobs**: concurrency = 10-20 per worker
- **Email/notifications**: concurrency = 50-100 per worker

## Troubleshooting

### Common Issues

#### 1. Worker Not Processing Jobs

**Symptoms**: Jobs stuck in "waiting" state

**Solutions**:

```bash
# Check worker is running
pm2 status worker

# Check worker logs
pm2 logs worker

# Restart worker
pm2 restart worker

# Check Redis connection
redis-cli ping
```

#### 2. Redis Connection Errors

**Error**: `ECONNREFUSED` or `Redis connection error`

**Solutions**:

- Verify Redis is running: `docker ps | grep redis`
- Check `REDIS_URL` environment variable
- Test connection: `redis-cli -u $REDIS_URL ping`
- Check firewall rules

#### 3. Jobs Failing Repeatedly

**Symptoms**: Jobs moving to "failed" state after max attempts

**Debug**:

```typescript
const job = await jobQueue.getJobStatus(QUEUE_NAMES.TASKS, jobId);
console.log("Failed reason:", job?.failedReason);
console.log("Stack trace:", job?.stacktrace);
```

**Solutions**:

- Fix handler implementation
- Check dependencies are available
- Increase retry attempts
- Add better error handling

#### 4. Memory Leaks

**Symptoms**: Worker memory usage growing over time

**Solutions**:

- Close database connections in handlers
- Avoid storing large objects in job data
- Use streaming for large files
- Restart workers periodically: `pm2 restart worker --cron "0 3 * * *"`

#### 5. Slow Job Processing

**Symptoms**: Jobs taking longer than expected

**Debug**:

```typescript
// Add timing logs
const start = Date.now();
await expensiveOperation();
console.log(`Operation took ${Date.now() - start}ms`);
```

**Solutions**:

- Increase worker concurrency
- Add more worker instances
- Optimize handler code
- Use job priorities
- Consider moving heavy work to separate queue

### Debugging Tips

1. **Enable Detailed Logging**:

   ```typescript
   // In worker.ts
   worker.on("completed", (job) => {
     console.log(
       `[Worker] Job ${job.id} completed in ${job.finishedOn! - job.processedOn!}ms`,
     );
   });

   worker.on("failed", (job, error) => {
     console.error(`[Worker] Job ${job?.id} failed:`, {
       name: job?.name,
       data: job?.data,
       error: error.message,
       stack: error.stack,
     });
   });
   ```

2. **Inspect Job Data**:

   ```bash
   # Connect to Redis
   redis-cli

   # List queues
   KEYS bull:*

   # Get job data
   HGETALL bull:tasks:123
   ```

3. **Check Job Counts**:

   ```typescript
   const counts = await queue.getJobCounts();
   console.log(counts);
   // {
   //   waiting: 10,
   //   active: 2,
   //   completed: 100,
   //   failed: 5,
   //   delayed: 3
   // }
   ```

4. **Manual Job Retry**:

   ```typescript
   // Get failed job
   const job = await queue.getJob(jobId);

   // Retry manually
   if (job) {
     await job.retry();
   }
   ```

### Performance Tuning

1. **Job Options**:

   ```typescript
   {
     // Remove completed jobs to save memory
     removeOnComplete: {
       count: 100,  // Keep last 100
       age: 3600    // Remove after 1 hour
     },

     // Keep failed jobs for debugging
     removeOnFail: {
       count: 1000  // Keep last 1000
     },

     // Faster retries
     backoff: {
       type: "exponential",
       delay: 500
     }
   }
   ```

2. **Redis Optimization**:

   ```conf
   # Faster persistence
   save ""
   appendonly yes
   appendfsync everysec

   # More memory for jobs
   maxmemory 4gb
   maxmemory-policy allkeys-lru
   ```

3. **Connection Pooling**:
   ```typescript
   const connection = new Redis(redisUrl, {
     maxRetriesPerRequest: 3,
     enableReadyCheck: false,
     enableOfflineQueue: false,
   });
   ```

## Best Practices

1. **Job Idempotency**: Make handlers safe to retry
2. **Small Job Data**: Keep job payloads under 10KB
3. **Job Priorities**: Use 1-10, where 10 is highest
4. **Error Handling**: Let errors throw to trigger retries
5. **Monitoring**: Track queue metrics and failed jobs
6. **Graceful Shutdown**: Always close queues and workers properly
7. **Testing**: Test job handlers with mock queue service
8. **Logging**: Log job start, progress, and completion
9. **Timeouts**: Set reasonable job timeouts
10. **Dead Letter Queue**: Monitor and handle failed jobs

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Cron Pattern Reference](https://crontab.guru/)
- [Job Queue Service Interface](/src/core/services/job-queue.service.interface.ts)
- [Worker Implementation](/src/infrastructure/services/queue/worker.ts)
- [Example Handlers](/src/infrastructure/services/queue/handlers/)

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review worker logs: `npm run worker:dev` or `pm2 logs worker`
3. Check Redis health: `npm run redis:logs`
4. Inspect queue dashboard: http://localhost:3000/api/admin/queues
