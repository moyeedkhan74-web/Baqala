/**
 * Simple in-memory queue to process background notifications sequentially.
 * This prevents the Node.js process from idling and killing detached async calls.
 */

const queue = [];
let isProcessing = false;

/**
 * Push an async task into the queue.
 * @param {Function} fn - An async function that returns a promise.
 */
const queueNotification = (fn) => {
  queue.push(fn);
  console.log(`[QUEUE] Notification added. Current size: ${queue.length}`);
};

// Worker that runs every 500ms
setInterval(async () => {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const task = queue.shift();

  try {
    console.log(`[QUEUE] [PROCESS] Starting item... (Remaining: ${queue.length})`);
    await task();
    console.log(`[QUEUE] [PROCESS] Item finished.`);
  } catch (error) {
    console.error(`[QUEUE] [ERROR] Task failed:`, error.message);
  } finally {
    isProcessing = false;
    if (queue.length === 0) {
      console.log(`[QUEUE] All items processed. Drained.`);
    }
  }
}, 500);

module.exports = { queueNotification };
