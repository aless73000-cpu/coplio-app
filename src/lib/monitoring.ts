const DSN = 'https://485d4c2b88b64f28998de65fc967e294@app.glitchtip.com/23645'

function parseDsn(dsn: string) {
  const withoutScheme = dsn.replace('https://', '')
  const [key, rest] = withoutScheme.split('@')
  const [host, projectId] = rest.split('/')
  return { key, url: `https://${host}/api/${projectId}/store/` }
}

export async function captureException(
  err: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const { key, url } = parseDsn(DSN)
    const error = err instanceof Error ? err : new Error(String(err))

    const payload: Record<string, unknown> = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'node',
      level: 'error',
      message: error.message,
      exception: {
        values: [
          {
            type: error.name,
            value: error.message,
            stacktrace: error.stack
              ? {
                  frames: error.stack
                    .split('\n')
                    .slice(1)
                    .map((line) => ({ filename: line.trim() })),
                }
              : undefined,
          },
        ],
      },
      ...(context ? { extra: context } : {}),
    }

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7,sentry_key=${key}`,
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // Ne jamais laisser le monitoring faire planter l'app
  }
}
