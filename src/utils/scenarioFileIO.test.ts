import { describe, it, expect, vi } from 'vitest';
import {
  serializeScenario,
  deserializeScenario,
  downloadScenarioFile,
  createFileUploadHandler,
  type ScenarioData
} from './scenarioFileIO';
import type { Participant, ProjectParams, CalculationResults, PortageFormulaParams } from './calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA } from './calculatorUtils';
import type { TimelineSnapshot } from './timelineCalculations';
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

  const mockUnitDetails = {
    1: { casco: 178080, parachevements: 56000 }
  };

  const mockPortageFormula: PortageFormulaParams = DEFAULT_PORTAGE_FORMULA;

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
        droitEnregistrements: 81250,
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
      totalDroitEnregistrements: 81250,
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
        '2023-02-01',
        mockPortageFormula,
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
      expect(parsed.deedDate).toBe('2023-02-01');
      expect(parsed.unitDetails).toEqual(mockUnitDetails);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include calculation results', () => {
      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
        mockUnitDetails,
        mockCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;
      expect(parsed.calculations).toBeDefined();
      expect(parsed.calculations?.totalSurface).toBe(100);
      expect(parsed.calculations?.pricePerM2).toBe(6500);
    });

    it('should include portageFormula in serialized data', () => {
      const customPortageFormula = {
        indexationRate: 3.5,
        carryingCostRecovery: 75,
        averageInterestRate: 5.0,
        coproReservesShare: 25
      };

      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        customPortageFormula,
        mockUnitDetails,
        mockCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;
      expect(parsed.portageFormula).toBeDefined();
      expect(parsed.portageFormula.indexationRate).toBe(3.5);
      expect(parsed.portageFormula.carryingCostRecovery).toBe(75);
      expect(parsed.portageFormula.averageInterestRate).toBe(5.0);
      expect(parsed.portageFormula.coproReservesShare).toBe(25);
    });

    it('should restore portageFormula on deserialization', () => {
      const customPortageFormula = {
        indexationRate: 2.5,
        carryingCostRecovery: 80,
        averageInterestRate: 4.8,
        coproReservesShare: 35
      };

      // Serialize with custom formula
      const jsonString = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        customPortageFormula,
        mockUnitDetails,
        mockCalculations
      );

      // Deserialize
      const result = deserializeScenario(jsonString);

      expect(result.success).toBe(true);
      expect(result.data?.portageFormula).toBeDefined();
      expect(result.data?.portageFormula.indexationRate).toBe(2.5);
      expect(result.data?.portageFormula.carryingCostRecovery).toBe(80);
      expect(result.data?.portageFormula.averageInterestRate).toBe(4.8);
      expect(result.data?.portageFormula.coproReservesShare).toBe(35);
    });

    it('should use default portageFormula for old files without it', () => {
      // Simulate old file format without portageFormula
      const oldFileData = {
        version: 2,
        releaseVersion: RELEASE_VERSION,
        timestamp: new Date().toISOString(),
        participants: mockParticipants,
        projectParams: mockProjectParams,
        deedDate: '2023-02-01',
        unitDetails: mockUnitDetails
        // portageFormula intentionally missing
      };

      const jsonString = JSON.stringify(oldFileData);
      const result = deserializeScenario(jsonString);

      expect(result.success).toBe(true);
      expect(result.data?.portageFormula).toBeDefined();
      expect(result.data?.portageFormula.indexationRate).toBe(DEFAULT_PORTAGE_FORMULA.indexationRate);
      expect(result.data?.portageFormula.carryingCostRecovery).toBe(DEFAULT_PORTAGE_FORMULA.carryingCostRecovery);
    });
  });

  describe('deserializeScenario', () => {
    it('should successfully deserialize valid scenario data', () => {
      const jsonString = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
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
        // Missing projectParams
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
        '2023-02-01',
        mockPortageFormula,
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
        '2023-02-01',
        mockPortageFormula,
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

  describe('timeline snapshots support', () => {
    it('should serialize and include timeline snapshots', () => {
      const mockSnapshots = new Map<string, TimelineSnapshot[]>();
      mockSnapshots.set('Test Participant', [
        {
          date: new Date('2023-02-01'),
          participantName: 'Test Participant',
          participantIndex: 0,
          totalCost: 350000,
          loanNeeded: 250000,
          monthlyPayment: 1500,
          isT0: true,
          colorZone: 0,
          showFinancingDetails: true
        },
        {
          date: new Date('2024-06-01'),
          participantName: 'Test Participant',
          participantIndex: 0,
          totalCost: 380000,
          loanNeeded: 280000,
          monthlyPayment: 1650,
          isT0: false,
          colorZone: 1,
          showFinancingDetails: true,
          transaction: {
            type: 'copro_sale',
            seller: 'Copropriété',
            buyer: 'Test Participant',
            delta: {
              totalCost: 30000,
              loanNeeded: 30000,
              reason: 'Purchase additional lot'
            }
          }
        }
      ]);

      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
        mockUnitDetails,
        mockCalculations,
        mockSnapshots
      );

      const parsed = JSON.parse(result) as ScenarioData;

      expect(parsed.timelineSnapshots).toBeDefined();
      expect(parsed.timelineSnapshots?.['Test Participant']).toBeDefined();
      expect(parsed.timelineSnapshots?.['Test Participant'].length).toBe(2);

      // Verify first snapshot
      const snapshot1 = parsed.timelineSnapshots?.['Test Participant'][0];
      expect(snapshot1?.participantName).toBe('Test Participant');
      expect(snapshot1?.totalCost).toBe(350000);
      expect(snapshot1?.loanNeeded).toBe(250000);
      expect(snapshot1?.isT0).toBe(true);
      expect(snapshot1?.transaction).toBeUndefined();

      // Verify second snapshot with transaction
      const snapshot2 = parsed.timelineSnapshots?.['Test Participant'][1];
      expect(snapshot2?.participantName).toBe('Test Participant');
      expect(snapshot2?.totalCost).toBe(380000);
      expect(snapshot2?.isT0).toBe(false);
      expect(snapshot2?.transaction).toBeDefined();
      expect(snapshot2?.transaction?.type).toBe('copro_sale');
      expect(snapshot2?.transaction?.delta.totalCost).toBe(30000);
    });

    it('should not include timelineSnapshots when not provided', () => {
      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
        mockUnitDetails,
        mockCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;

      expect(parsed.timelineSnapshots).toBeUndefined();
    });

    it('should handle multiple participants with timeline snapshots', () => {
      const multiParticipants: Participant[] = [
        ...mockParticipants,
        {
          name: 'Test Participant 2',
          capitalApporte: 150000,
          notaryFeesRate: 12.5,
          unitId: 2,
          surface: 120,
          interestRate: 4.0,
          durationYears: 20,
          quantity: 1,
          parachevementsPerM2: 600,
          isFounder: true,
          entryDate: new Date('2023-02-01')
        }
      ];

      const mockSnapshots = new Map<string, TimelineSnapshot[]>();
      mockSnapshots.set('Test Participant', [
        {
          date: new Date('2023-02-01'),
          participantName: 'Test Participant',
          participantIndex: 0,
          totalCost: 350000,
          loanNeeded: 250000,
          monthlyPayment: 1500,
          isT0: true,
          colorZone: 0,
          showFinancingDetails: true
        }
      ]);
      mockSnapshots.set('Test Participant 2', [
        {
          date: new Date('2023-02-01'),
          participantName: 'Test Participant 2',
          participantIndex: 1,
          totalCost: 400000,
          loanNeeded: 250000,
          monthlyPayment: 1600,
          isT0: true,
          colorZone: 0,
          showFinancingDetails: true
        }
      ]);

      const multiCalculations = { ...mockCalculations };
      const result = serializeScenario(
        multiParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
        mockUnitDetails,
        multiCalculations,
        mockSnapshots
      );

      const parsed = JSON.parse(result) as ScenarioData;

      expect(parsed.timelineSnapshots?.['Test Participant']).toBeDefined();
      expect(parsed.timelineSnapshots?.['Test Participant 2']).toBeDefined();
      expect(parsed.timelineSnapshots?.['Test Participant'].length).toBe(1);
      expect(parsed.timelineSnapshots?.['Test Participant 2'].length).toBe(1);
    });
  });

  describe('two-loan financing support', () => {
    it('should include two-loan breakdown fields in calculations', () => {
      const twoLoanCalculations: CalculationResults = {
        ...mockCalculations,
        participantBreakdown: [
          {
            ...mockCalculations.participantBreakdown[0],
            loan1Amount: 500000,
            loan1MonthlyPayment: 2800,
            loan1Interest: 120000,
            loan2Amount: 350250,
            loan2DurationYears: 23,
            loan2MonthlyPayment: 1700,
            loan2Interest: 119750
          }
        ]
      };

      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
        mockUnitDetails,
        twoLoanCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;

      const breakdown = parsed.calculations?.participantBreakdown[0];

      expect(breakdown).toHaveProperty('loan1Amount');
      expect(breakdown).toHaveProperty('loan1MonthlyPayment');
      expect(breakdown).toHaveProperty('loan1Interest');
      expect(breakdown).toHaveProperty('loan2Amount');
      expect(breakdown).toHaveProperty('loan2DurationYears');
      expect(breakdown).toHaveProperty('loan2MonthlyPayment');
      expect(breakdown).toHaveProperty('loan2Interest');

      expect(breakdown?.loan1Amount).toBe(500000);
      expect(breakdown?.loan1MonthlyPayment).toBe(2800);
      expect(breakdown?.loan1Interest).toBe(120000);
      expect(breakdown?.loan2Amount).toBe(350250);
      expect(breakdown?.loan2DurationYears).toBe(23);
      expect(breakdown?.loan2MonthlyPayment).toBe(1700);
      expect(breakdown?.loan2Interest).toBe(119750);
    });

    it('should handle participants without two-loan financing', () => {
      const result = serializeScenario(
        mockParticipants,
        mockProjectParams,
        '2023-02-01',
        mockPortageFormula,
        mockUnitDetails,
        mockCalculations
      );

      const parsed = JSON.parse(result) as ScenarioData;

      const breakdown = parsed.calculations?.participantBreakdown[0];

      // These fields should be undefined when not using two loans
      expect(breakdown?.loan1Amount).toBeUndefined();
      expect(breakdown?.loan1MonthlyPayment).toBeUndefined();
      expect(breakdown?.loan1Interest).toBeUndefined();
      expect(breakdown?.loan2Amount).toBeUndefined();
      expect(breakdown?.loan2DurationYears).toBeUndefined();
      expect(breakdown?.loan2MonthlyPayment).toBeUndefined();
      expect(breakdown?.loan2Interest).toBeUndefined();
    });
  });
});
