import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('Google Apps Script Logic Tests', () => {
  let mockProperties: Record<string, string>;
  let mockSheetRows: (string | null)[][];
  let lockAcquired: boolean;
  let lockReleased: boolean;
  let shouldFailLock: boolean;
  let gasContext: Record<string, unknown>;

  const gasCode = fs.readFileSync(
    path.resolve(__dirname, '../../google-apps-script/Code.js'),
    'utf-8'
  );

  beforeEach(() => {
    mockProperties = {
      SPREADSHEET_ID: 'mock-sheet-id-12345',
      SHARED_SECRET: 'test-shared-secret-gas',
    };
    mockSheetRows = [
      ['Timestamp', 'Participant ID', 'Choice'], // Header row
    ];
    lockAcquired = false;
    lockReleased = false;
    shouldFailLock = false;

    // Spreadsheet mock object
    const mockSheet = {
      getLastRowNum: () => mockSheetRows.length,
      insertSheet: () => mockSheet,
      getRange: (startRow: number, startCol: number, numRows: number, numCols: number) => ({
        setValues: (values: (string | null)[][]) => {
          for (let r = 0; r < values.length; r++) {
            const rowIndex = startRow - 1 + r;
            if (!mockSheetRows[rowIndex]) mockSheetRows[rowIndex] = [];
            for (let c = 0; c < values[r].length; c++) {
              mockSheetRows[rowIndex][startCol - 1 + c] = values[r][c];
            }
          }
        },
        getValues: () => {
          const result: (string | null)[][] = [];
          for (let r = 0; r < numRows; r++) {
            const row: (string | null)[] = [];
            for (let c = 0; c < numCols; c++) {
              const val = mockSheetRows[startRow - 1 + r]?.[startCol - 1 + c] ?? null;
              row.push(val);
            }
            result.push(row);
          }
          return result;
        },
        setFontWeight: vi.fn(),
        setBackground: vi.fn(),
        setFontColor: vi.fn(),
      }),
      appendRow: (row: (string | null)[]) => {
        mockSheetRows.push(row);
      },
      setFrozenRows: vi.fn(),
      autoResizeColumns: vi.fn(),
    };

    const sandbox = {
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (key: string) => mockProperties[key] || null,
        }),
      },
      LockService: {
        getScriptLock: () => ({
          tryLock: (_timeoutMs: number) => {
            if (shouldFailLock) return false;
            lockAcquired = true;
            return true;
          },
          releaseLock: () => {
            lockReleased = true;
          },
        }),
      },
      ContentService: {
        MimeType: { JSON: 'application/json' },
        createTextOutput: (content: string) => ({
          content,
          mimeType: '',
          setMimeType: function (type: string) {
            this.mimeType = type;
            return this;
          },
          getContent: function () {
            return this.content;
          },
        }),
      },
      Logger: {
        log: vi.fn(),
      },
      SpreadsheetApp: {
        openById: (_id: string) => ({
          getSheetByName: (name: string) => {
            if (name === 'Votes') return mockSheet;
            return null;
          },
          insertSheet: () => mockSheet,
        }),
      },
      console,
      Date,
      Math,
      JSON,
      RegExp,
      Error,
    };

    gasContext = vm.createContext(sandbox);
    vm.runInContext(gasCode, gasContext);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callGas = (fnName: string, ...args: unknown[]): any => {
    const fn = gasContext[fnName] as (...a: unknown[]) => unknown;
    return fn(...args);
  };

  describe('doGet', () => {
    it('rejects GET requests with 405 Method Not Allowed', () => {
      const output = callGas('doGet');
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('doPost validation & security', () => {
    it('returns 400 on empty body', () => {
      const output = callGas('doPost', {});
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('EMPTY_BODY');
    });

    it('returns 400 on invalid JSON', () => {
      const output = callGas('doPost', { postData: { contents: '{not valid json' } });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('INVALID_JSON');
    });

    it('returns 500 when Script Properties are not configured', () => {
      mockProperties = {};
      const output = callGas('doPost', {
        postData: { contents: JSON.stringify({ secret: 'any', action: 'stats' }) },
      });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('SERVER_MISCONFIGURED');
    });

    it('returns 403 on invalid shared secret', () => {
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({ secret: 'wrong-secret', action: 'stats' }),
        },
      });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 on unknown action', () => {
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'delete_all_data',
          }),
        },
      });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('INVALID_ACTION');
    });
  });

  describe('handleVote', () => {
    const validUuid = 'c9bf9e57-1685-4c89-bafb-ff5af830be8a';

    it('rejects invalid participantId', () => {
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: 'not-a-uuid',
            choice: 'stay',
          }),
        },
      });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('INVALID_PARTICIPANT_ID');
    });

    it('rejects invalid choice value', () => {
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'third-option',
          }),
        },
      });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('INVALID_CHOICE');
    });

    it('returns 503 LOCK_TIMEOUT when lock cannot be acquired', () => {
      shouldFailLock = true;
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'stay',
          }),
        },
      });
      const parsed = JSON.parse(output.getContent());
      expect(parsed.error.code).toBe('LOCK_TIMEOUT');
    });

    it('records first vote, appends row, and releases lock', () => {
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'stay',
          }),
        },
      });

      const parsed = JSON.parse(output.getContent());
      expect(parsed).toEqual({ status: 'recorded', choice: 'stay' });
      expect(lockAcquired).toBe(true);
      expect(lockReleased).toBe(true);
      expect(mockSheetRows.length).toBe(2); // Header + 1 vote
      expect(mockSheetRows[1][1]).toBe(validUuid);
      expect(mockSheetRows[1][2]).toBe('stay');
    });

    it('handles duplicate vote with same participantId: does NOT append new row', () => {
      // First vote
      callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'stay',
          }),
        },
      });
      expect(mockSheetRows.length).toBe(2);

      // Duplicate vote
      const duplicateOutput = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'stay',
          }),
        },
      });

      const parsed = JSON.parse(duplicateOutput.getContent());
      expect(parsed).toEqual({ status: 'already_voted', choice: 'stay' });
      expect(mockSheetRows.length).toBe(2); // Row count did not increase
    });

    it('prevents changing vote: returning original choice if participant sends different choice', () => {
      // First vote is 'stay'
      callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'stay',
          }),
        },
      });

      // Second attempt sends 'switch'
      const changedOutput = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'vote',
            participantId: validUuid,
            choice: 'switch',
          }),
        },
      });

      const parsed = JSON.parse(changedOutput.getContent());
      expect(parsed).toEqual({ status: 'already_voted', choice: 'stay' });
      // Sheet still contains 'stay'
      expect(mockSheetRows[1][2]).toBe('stay');
      expect(mockSheetRows.length).toBe(2);
    });
  });

  describe('handleStats', () => {
    it('returns zeros when sheet has only headers', () => {
      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'stats',
          }),
        },
      });

      const parsed = JSON.parse(output.getContent());
      expect(parsed.total).toBe(0);
      expect(parsed.stay).toBe(0);
      expect(parsed.switch).toBe(0);
      expect(parsed.stayPercent).toBe(0);
      expect(parsed.switchPercent).toBe(0);
      expect(parsed.updatedAt).toBeDefined();
    });

    it('aggregates votes accurately and never reveals participant IDs', () => {
      // Insert mock rows
      mockSheetRows.push(['2026-11-05T10:00:00Z', 'uuid-1', 'stay']);
      mockSheetRows.push(['2026-11-05T10:01:00Z', 'uuid-2', 'stay']);
      mockSheetRows.push(['2026-11-05T10:02:00Z', 'uuid-3', 'switch']);

      const output = callGas('doPost', {
        postData: {
          contents: JSON.stringify({
            secret: 'test-shared-secret-gas',
            action: 'stats',
          }),
        },
      });

      const parsed = JSON.parse(output.getContent());
      expect(parsed.total).toBe(3);
      expect(parsed.stay).toBe(2);
      expect(parsed.switch).toBe(1);
      expect(parsed.stayPercent).toBe(66.7);
      expect(parsed.switchPercent).toBe(33.3);

      // Verify no participant IDs or private rows leaked
      expect(parsed.participantId).toBeUndefined();
      expect(parsed.rows).toBeUndefined();
    });
  });

  describe('setup', () => {
    it('initializes sheet headers when empty', () => {
      mockSheetRows = [];
      callGas('setup');
      expect(mockSheetRows.length).toBe(1);
      expect(mockSheetRows[0]).toEqual(['Timestamp', 'Participant ID', 'Choice']);
    });
  });
});
