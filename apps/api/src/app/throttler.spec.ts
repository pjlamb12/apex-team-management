import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard, seconds, ThrottlerException } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Controller, Get, ExecutionContext } from '@nestjs/common';
import { describe, it, expect, beforeEach } from 'vitest';

@Controller('test-throttle')
class TestThrottleController {
  @Get()
  getTest(): { ok: boolean } {
    return { ok: true };
  }
}

describe('Throttler Configuration', () => {
  let moduleRef: TestingModule;
  let guard: ThrottlerGuard;

  const createMockContext = (ip = '127.0.0.1'): ExecutionContext => {
    const headers: Record<string, string> = {};
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: {},
          method: 'GET',
          url: '/test-throttle',
        }),
        getResponse: () => ({
          header: (name: string, value: string) => {
            headers[name] = value;
          },
        }),
      }),
      getHandler: () => TestThrottleController.prototype.getTest,
      getClass: () => TestThrottleController,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: seconds(60),
            limit: 2,
          },
        ]),
      ],
      controllers: [TestThrottleController],
      providers: [
        ThrottlerGuard,
        {
          provide: APP_GUARD,
          useExisting: ThrottlerGuard,
        },
      ],
    }).compile();

    guard = moduleRef.get<ThrottlerGuard>(ThrottlerGuard);
    await guard.onModuleInit();
  });

  it('should compile the throttler module and provide ThrottlerGuard', () => {
    expect(moduleRef).toBeDefined();
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(ThrottlerGuard);
  });

  it('should allow requests within limit and reject requests exceeding limit', async () => {
    const ctx = createMockContext('192.168.1.100');

    // First request should pass
    const req1 = await guard.canActivate(ctx);
    expect(req1).toBe(true);

    // Second request should pass (limit is 2)
    const req2 = await guard.canActivate(ctx);
    expect(req2).toBe(true);

    // Third request should throw ThrottlerException
    await expect(guard.canActivate(ctx)).rejects.toThrow(ThrottlerException);
  });
});
