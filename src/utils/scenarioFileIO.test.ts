import { describe, it, expect, vi } from 'vitest';
import {
  serializeScenario,
  deserializeScenario,
  downloadScenarioFile,
  createFileUploadHandler,
  type ScenarioData
} from './scenarioFileIO';
import type { Participant, ProjectParams, Scenario, CalculationResults } from './calculatorUtils';
import { RELEASE_VERSION } from './version';

describe('scenarioFileIO', () => {
  const mockParticipants: Participant[] = [
    {
      name: 'Test Participant',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2023-02-01')
    }
  ];

  const mockProjectParams: ProjectParams = {
    totalPurchase: 650000,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
    globalCascoPerM2: 1590
  };

  const mockScenario: Scenario = {
    constructionCostChange: 0,
    infrastructureReduction: 0,
    purchasePriceReduction: 0
  };

  const mockUnitDetails = {
    1: { casco: 178080, parachevements: 56000 }
  };

  const mockCalculations: CalculationResults = {
    totalSurface: 100,
    pricePerM2: 6500,
    sharedCosts: 10000,
    sharedPerPerson: 10000,
    participantBreakdown: [
      {
        name: 'Test Participant',
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        unitId: 1,
        surface: 100,
        interestRate: 4.5,
        durationYears: 25,
        quantity: 1,
        pricePerM2: 6500,
        purchaseShare: 650000,
        notaryFees: 81250,
        casco: 159000,
        parachevements: 50000,
        personalRenovationCost: 209000,
        constructionCost: 209000,
        constructionCostPerUnit: 209000,
        travauxCommunsPerUnit: 0,
        sharedCosts: 10000,
        totalCost: 950250,
        loanNeeded: 850250,
        financingRatio: 89.47,
        monthlyPayment: 4500,
        totalRepayment: 1350000,
        totalInterest: 499750
      }
    ],
    totals: {
      purchase: 650000,
      totalNotaryFees: 81250,
      construction: 209000,
      shared: 10000,
      totalTravauxCommuns: 0,
      travauxCommunsPerUnit: 0,
      total: 950250,
      capitalTotal: 100000,
      totalLoansNeeded: 850250,
      averageLoan: 850250,
      averageCapital: 100000
    }
  };

  describe('serializeScenario', () => {
    it('should serialize scenario data to JSON string', () => {
      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        mockScenario,
        '2023-02-01',
        mockUnitDetails,
        mockCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;
      expect(parsed.version).toBe(2);
      expect(parsed.releaseVersion).toBe(RELEASE_VERSION);
      // Dates get serialized as ISO strings, so we need to compare differently
      expect(parsed.participants[0].name).toBe(mockParticipants[0].name);
      expect(parsed.participants[0].capitalApporte).toBe(mockParticipants[0].capitalApporte);
      expect(parsed.projectParams).toEqual(mockProjectParams);
      expect(parsed.scenario).toEqual(mockScenario);
      expect(parsed.deedDate).toBe('2023-02-01');
      expect(parsed.unitDetails).toEqual(mockUnitDetails);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include calculation results', () => {
      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        mockScenario,
        '2023-02-01',
        mockUnitDetails,
        mockCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;
      expect(parsed.calculations).toBeDefined();
      expect(parsed.calculations?.totalSurface).toBe(100);
      expect(parsed.calculations?.pricePerM2).toBe(6500);
    });
  });

  describe('deserializeScenario', () => {
    it('should successfully deserialize valid scenario data', () => {
      const jsonString = serializeScenario(
        mockParticipants,
        mockProjectParams,
        mockScenario,
        '2023-02-01',
        mockUnitDetails,
        mockCalculations
      );

      const result = deserializeScenario(jsonString);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Dates get serialized as ISO strings, so compare fields individually
      expect(result.data?.participants[0].name).toBe(mockParticipants[0].name);
      expect(result.data?.participants[0].capitalApporte).toBe(mockParticipants[0].capitalApporte);
      expect(result.data?.projectParams).toEqual(mockProjectParams);
      expect(result.data?.scenario).toEqual(mockScenario);
      expect(result.data?.deedDate).toBe('2023-02-01');
    });

    it('should fail on invalid JSON', () => {
      const result = deserializeScenario('invalid json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors du chargement');
    });

    it('should fail on missing required fields', () => {
      const incomplete = JSON.stringify({
        version: 2,
        releaseVersion: RELEASE_VERSION,
        participants: mockParticipants
        // Missing projectParams and scenario
      });

      const result = deserializeScenario(incomplete);

      expect(result.success).toBe(false);
      expect(result.error).toContain('structure de données manquante');
    });

    it('should fail on incompatible version', () => {
      const data = {
        version: 2,
        releaseVersion: '0.0.0', // Incompatible version
        timestamp: new Date().toISOString(),
        participants: mockParticipants,
        projectParams: mockProjectParams,
        scenario: mockScenario,
        deedDate: '2023-02-01',
        unitDetails: mockUnitDetails
      };

      const result = deserializeScenario(JSON.stringify(data));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version incompatible');
    });
  });

  describe('downloadScenarioFile', () => {
    it('should create and download a file', () => {
      // Mock URL.createObjectURL and revokeObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      downloadScenarioFile(
        mockParticipants,
        mockProjectParams,
        mockScenario,
        '2023-02-01',
        mockUnitDetails,
        mockCalculations
      );

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(mockLink.download).toMatch(/^scenario_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/);

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('createFileUploadHandler', () => {
    it('should call onSuccess with valid file data', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const handler = createFileUploadHandler(onSuccess, onError);

      const validJson = serializeScenario(
        mockParticipants,
        mockProjectParams,
        mockScenario,
        '2023-02-01',
        mockUnitDetails,
        mockCalculations
      );

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        result: validJson
      };
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);

      const mockFile = new File([validJson], 'test.json', { type: 'application/json' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.json'
        }
      } as any;

      handler(mockEvent);

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: validJson } } as any);

      expect(onSuccess).toHaveBeenCalled();
      const successCallArg = onSuccess.mock.calls[0][0];
      // Dates are serialized as strings in JSON, so we compare fields individually
      expect(successCallArg.participants[0].name).toBe(mockParticipants[0].name);
      expect(successCallArg.participants[0].capitalApporte).toBe(mockParticipants[0].capitalApporte);
      expect(successCallArg.projectParams).toEqual(mockProjectParams);
      expect(successCallArg.scenario).toEqual(mockScenario);
      expect(successCallArg.deedDate).toBe('2023-02-01');
      expect(onError).not.toHaveBeenCalled();
      expect(mockEvent.target.value).toBe('');
    });

    it('should call onError with invalid file data', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const handler = createFileUploadHandler(onSuccess, onError);

      const invalidJson = 'invalid json';

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        result: invalidJson
      };
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);

      const mockFile = new File([invalidJson], 'test.json', { type: 'application/json' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.json'
        }
      } as any;

      handler(mockEvent);

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: invalidJson } } as any);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Erreur'));
    });

    it('should handle missing file gracefully', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const handler = createFileUploadHandler(onSuccess, onError);

      const mockEvent = {
        target: {
          files: []
        }
      } as any;

      handler(mockEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
