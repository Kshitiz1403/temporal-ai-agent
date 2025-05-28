import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import config from './config/config';

async function runWorker() {
  try {
    // Create worker
    const worker = await Worker.create({
      connection: await NativeConnection.connect({ address: config.temporal.server.address }),
      namespace: config.temporal.server.namespace,
      taskQueue: config.temporal.taskQueue,
      workflowsPath: require.resolve('./workflows'),
      activities,
      maxConcurrentActivityTaskExecutions: config.temporal.worker.maxConcurrentActivities,
      maxConcurrentWorkflowTaskExecutions: config.temporal.worker.maxConcurrentWorkflows,
    });

    console.log('🔄 Temporal Worker starting...');
    console.log(`📋 Task Queue: ${config.temporal.taskQueue}`);
    console.log(`🔗 Temporal Address: ${config.temporal.server.address}`);
    console.log(`🧠 LLM Model: ${config.llm.defaultModel}`);

    // Start worker
    await worker.run();
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runWorker().catch(console.error);
}

export { runWorker }; 