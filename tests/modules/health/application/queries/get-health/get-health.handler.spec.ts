import { GetHealthHandler } from '../../../../../../src/modules/health/application/queries/get-health/get-health.handler.js';

describe('GetHealthHandler', () => {
  it('reports that the process is alive', async () => {
    const handler = new GetHealthHandler();

    await expect(handler.execute()).resolves.toEqual({ status: 'ok' });
  });
});
