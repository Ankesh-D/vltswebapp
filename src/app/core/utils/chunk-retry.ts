
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .* failed|ChunkLoadError|error loading dynamically imported module/i;

type ChunkStatus = 'pending' | 'loaded' | 'failed';

interface ChunkRecord {
  status: ChunkStatus;
  attempts: number;
}

const chunkRecords = new Map<string, ChunkRecord>();

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryChunkImport<T>(
  importer: () => Promise<T>,
  chunkName = 'unknown'
): Promise<T> {
  let record = chunkRecords.get(chunkName);

  if (!record) {
    record = { status: 'pending', attempts: 0 };
    chunkRecords.set(chunkName, record);
  } else {
    record.status = 'pending';
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    record.attempts = attempt;

    try {
      const result = await importer();

      record.status = 'loaded';

      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);

      if (!CHUNK_ERROR_RE.test(message)) {
        record.status = 'failed';
        throw error;
      }

      if (attempt === MAX_RETRIES) {
        record.status = 'failed';
        throw error;
      }

      await wait(RETRY_DELAY_MS);
    }
  }

  record.status = 'failed';

  throw new Error(`Unable to load chunk: ${chunkName}`);
}
