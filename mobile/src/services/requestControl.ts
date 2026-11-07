export function withRequestTimeout<T>(
  request: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(message) as Error & { code: string };
      error.code = 'REQUEST_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([request, timeout]).finally(() => clearTimeout(timeoutId));
}

export function runSingleFlight<T>(
  flight: { current: Promise<T> | null },
  operation: () => Promise<T>
): Promise<T> {
  if (flight.current) return flight.current;

  const request = Promise.resolve().then(operation);
  flight.current = request;
  void request.then(
    () => {
      if (flight.current === request) flight.current = null;
    },
    () => {
      if (flight.current === request) flight.current = null;
    }
  );
  return request;
}
