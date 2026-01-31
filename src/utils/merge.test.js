import { mergeIntakesByClientId } from './merge';

describe('mergeIntakesByClientId', () => {
  test('merges by clientId and prefers newer updatedAt', () => {
    const local = [
      {
        id: 'l1',
        clientId: 'c1',
        name: 'Local',
        amount: 100,
        category: 'coffee',
        timestamp: '2026-01-01T10:00:00.000Z',
        updatedAt: 200
      },
      {
        id: 'l2',
        clientId: 'c2',
        name: 'OnlyLocal',
        amount: 80,
        category: 'tea',
        timestamp: '2026-01-01T09:00:00.000Z',
        updatedAt: 150
      }
    ];
    const cloud = [
      {
        id: 'cloud-1',
        cloudId: 'cloud-1',
        clientId: 'c1',
        name: 'Cloud',
        amount: 90,
        category: 'coffee',
        timestamp: '2026-01-01T10:00:00.000Z',
        updatedAt: 100
      },
      {
        id: 'cloud-3',
        cloudId: 'cloud-3',
        clientId: 'c3',
        name: 'OnlyCloud',
        amount: 60,
        category: 'soda',
        timestamp: '2026-01-01T08:00:00.000Z',
        updatedAt: 120
      }
    ];

    const { merged, toUpsert } = mergeIntakesByClientId(local, cloud);

    const mergedIds = merged.map((item) => item.clientId);
    expect(mergedIds).toEqual(['c1', 'c2', 'c3']);

    const mergedC1 = merged.find((item) => item.clientId === 'c1');
    expect(mergedC1.name).toBe('Local');
    expect(mergedC1.updatedAt).toBe(200);

    const upsertIds = toUpsert.map((item) => item.clientId);
    expect(upsertIds).toEqual(expect.arrayContaining(['c1', 'c2']));
    expect(upsertIds).not.toContain('c3');
  });
});
