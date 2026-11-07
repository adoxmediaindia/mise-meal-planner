import { describe, expect, it, vi } from 'vitest';
import {
  runSingleFlight,
  withRequestTimeout,
} from '../../mobile/src/services/requestControl.js';

describe('mobile retry request control', () => {
  it('shares one concurrent retry request and allows another after it settles', async () => {
    let resolveFirst!: () => void;
    const operation = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveFirst = () => resolve('complete');
      }))
      .mockResolvedValue('retried');
    const flight = { current: null as Promise<string> | null };

    const first = runSingleFlight(flight, operation);
    const duplicate = runSingleFlight(flight, operation);
    expect(duplicate).toBe(first);
    expect(operation).toHaveBeenCalledTimes(0);

    await Promise.resolve();
    expect(operation).toHaveBeenCalledTimes(1);
    resolveFirst();
    await expect(first).resolves.toBe('complete');
    await Promise.resolve();

    await expect(runSingleFlight(flight, operation)).resolves.toBe('retried');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('clears a failed retry so the user can safely try again', async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce('success');
    const flight = { current: null as Promise<string> | null };

    await expect(runSingleFlight(flight, operation)).rejects.toThrow('temporary failure');
    await Promise.resolve();
    await expect(runSingleFlight(flight, operation)).resolves.toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('times out the mobile wait without aborting backend work and permits recovery', async () => {
    let resolvePending!: () => void;
    let backendFinished = false;
    const pendingRequest = new Promise<string>((resolve) => {
      resolvePending = () => {
        backendFinished = true;
        resolve('server completed');
      };
    });

    await expect(
      withRequestTimeout(pendingRequest, 5, 'retryable timeout')
    ).rejects.toMatchObject({ message: 'retryable timeout', code: 'REQUEST_TIMEOUT' });
    expect(backendFinished).toBe(false);

    resolvePending();
    await expect(pendingRequest).resolves.toBe('server completed');
    expect(backendFinished).toBe(true);

    await expect(
      withRequestTimeout(Promise.resolve('recovered'), 100, 'timeout')
    ).resolves.toBe('recovered');
  });
});
