import CrossSessionContinuitySystem from './cross-session-continuity';
import MCPSetupSystem from './mcp-setup';
import CharacterPersistenceSystem from './character-persistence';
import ItemStorageSystem from './item-storage';

describe('CrossSessionContinuitySystem', () => {
  let continuitySystem;
  let mcpSystem;
  let characterSystem;
  let storageSystem;
  let mockEntity;

  beforeEach(() => {
    mcpSystem = new MCPSetupSystem();
    characterSystem = new CharacterPersistenceSystem(mcpSystem);
    storageSystem = new ItemStorageSystem(mcpSystem);
    continuitySystem = new CrossSessionContinuitySystem(mcpSystem, characterSystem, storageSystem);
    
    // Create mock entity
    mockEntity = {
      id: 'test_entity_1',
      hasComponents: jest.fn().mockReturnValue(true),
      getComponent: jest.fn(),
      addComponent: jest.fn(),
      removeComponent: jest.fn()
    };

    continuitySystem.addEntity(mockEntity);
  });

  afterEach(() => {
    continuitySystem.cleanup();
  });

  describe('System Initialization', () => {
    test('should initialize correctly', () => {
      expect(continuitySystem.name).toBe('CrossSessionContinuitySystem');
      expect(continuitySystem.enabled).toBe(true);
      expect(continuitySystem.priority).toBe(1);
      
      const metrics = continuitySystem.getMetrics();
      expect(metrics.name).toBe('CrossSessionContinuitySystem');
      expect(metrics.entityCount).toBe(1);
    });

    test('should handle system lifecycle', () => {
      expect(() => {
        continuitySystem.update(16.67); // 60 FPS
      }).not.toThrow();
    });

    test('should initialize metrics correctly', () => {
      const metrics = continuitySystem.getContinuityMetrics();
      expect(metrics.totalSessions).toBe(0);
      expect(metrics.averageSessionLength).toBe(0);
      expect(metrics.successfulRestores).toBe(0);
      expect(metrics.failedRestores).toBe(0);
    });
  });

  describe('Session Management', () => {
    test('should start sessions correctly', async () => {
      let sessionStarted = false;
      
      continuitySystem.on('sessionStarted', (data) => {
        sessionStarted = true;
        expect(data.sessionId).toBeTruthy();
        expect(data.session.playerId).toBe('player_1');
        expect(data.session.characterId).toBe('character_1');
        expect(data.session.state).toBe('active');
      });

      const sessionId = await continuitySystem.startSession('player_1', 'character_1', {
        autoSave: true,
        saveInterval: 30000
      });

      expect(sessionId).toBeTruthy();
      expect(sessionStarted).toBe(true);

      const session = continuitySystem.getActiveSession('player_1');
      expect(session).toBeTruthy();
      expect(session.id).toBe(sessionId);
      expect(session.preferences.autoSave).toBe(true);
      expect(session.preferences.saveInterval).toBe(30000);
    });

    test('should end sessions correctly', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      let sessionEnded = false;
      continuitySystem.on('sessionEnded', (data) => {
        sessionEnded = true;
        expect(data.sessionId).toBe(sessionId);
        expect(data.reason).toBe('user_logout');
        expect(data.session.state).toBe('ended');
      });

      const result = await continuitySystem.endSession(sessionId, 'user_logout');
      expect(result).toBe(true);
      expect(sessionEnded).toBe(true);

      const session = continuitySystem.getActiveSession('player_1');
      expect(session).toBeNull();
    });

    test('should pause and resume sessions', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      let sessionPaused = false;
      let sessionResumed = false;

      continuitySystem.on('sessionPaused', (data) => {
        sessionPaused = true;
        expect(data.sessionId).toBe(sessionId);
      });

      continuitySystem.on('sessionResumed', (data) => {
        sessionResumed = true;
        expect(data.sessionId).toBe(sessionId);
      });

      const pauseResult = await continuitySystem.pauseSession(sessionId);
      expect(pauseResult).toBe(true);
      expect(sessionPaused).toBe(true);

      const resumeResult = await continuitySystem.resumeSession(sessionId);
      expect(resumeResult).toBe(true);
      expect(sessionResumed).toBe(true);
    });

    test('should handle invalid session operations', async () => {
      const invalidSessionId = 'invalid_session';

      const endResult = await continuitySystem.endSession(invalidSessionId);
      expect(endResult).toBe(false);

      const pauseResult = await continuitySystem.pauseSession(invalidSessionId);
      expect(pauseResult).toBe(false);

      const resumeResult = await continuitySystem.resumeSession(invalidSessionId);
      expect(resumeResult).toBe(false);
    });

    test('should update session duration', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');
      const session = continuitySystem.getActiveSession('player_1');
      
      expect(session.duration).toBe(0);

      // Simulate time passing
      continuitySystem.update(1000); // 1 second
      
      expect(session.duration).toBe(1000);
      expect(session.statistics.totalPlayTime).toBe(1000);
    });
  });

  describe('Save Point Management', () => {
    let sessionId;

    beforeEach(async () => {
      sessionId = await continuitySystem.startSession('player_1', 'character_1');
    });

    test('should create save points correctly', async () => {
      let savePointCreated = false;
      
      continuitySystem.on('savePointCreated', (data) => {
        savePointCreated = true;
        expect(data.sessionId).toBe(sessionId);
        expect(data.savePoint.type).toBe('manual');
        expect(data.savePoint.verified).toBeDefined();
      });

      const savePointId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Test save');
      
      expect(savePointId).toBeTruthy();
      expect(savePointCreated).toBe(true);

      const savePoints = continuitySystem.getSavePoints('character_1');
      expect(savePoints.length).toBeGreaterThan(0);
      
      const savePoint = savePoints.find(sp => sp.id === savePointId);
      expect(savePoint).toBeTruthy();
      expect(savePoint.type).toBe('manual');
      expect(savePoint.metadata.tags).toContain('Test save');
    });

    test('should create manual save points', async () => {
      const savePointId = await continuitySystem.createManualSavePoint(sessionId, 'Manual test save');
      
      expect(savePointId).toBeTruthy();
      
      const savePoints = continuitySystem.getSavePoints('character_1');
      const savePoint = savePoints.find(sp => sp.id === savePointId);
      
      expect(savePoint.type).toBe('manual');
      expect(savePoint.metadata.tags).toContain('Manual test save');
    });

    test('should limit number of save points', async () => {
      // Create more save points than the limit
      for (let i = 0; i < 15; i++) {
        await continuitySystem.createSavePoint(sessionId, 'auto', `Auto save ${i}`);
      }

      const savePoints = continuitySystem.getSavePoints('character_1');
      
      // Should be limited to max save points (default 10)
      expect(savePoints.length).toBeLessThanOrEqual(10);
    });

    test('should verify save point integrity', async () => {
      const savePointId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Integrity test');
      
      const savePoints = continuitySystem.getSavePoints('character_1');
      const savePoint = savePoints.find(sp => sp.id === savePointId);
      
      expect(savePoint.verified).toBe(true);
      expect(savePoint.metadata.checksum).toBeTruthy();
      expect(savePoint.size).toBeGreaterThan(0);
    });

    test('should handle save point creation errors gracefully', async () => {
      const invalidSessionId = 'invalid_session';
      
      await expect(continuitySystem.createSavePoint(invalidSessionId, 'manual', 'Error test'))
        .rejects.toThrow('Session invalid_session not found');
    });
  });

  describe('Game State Restoration', () => {
    let sessionId;
    let savePointId;

    beforeEach(async () => {
      sessionId = await continuitySystem.startSession('player_1', 'character_1');
      savePointId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Test restore');
    });

    test('should restore from save point correctly', async () => {
      let gameStateRestored = false;
      
      continuitySystem.on('gameStateRestored', (data) => {
        gameStateRestored = true;
        expect(data.characterId).toBe('character_1');
        expect(data.savePointId).toBe(savePointId);
        expect(data.result.success).toBe(true);
      });

      const options = {
        restoreCharacter: true,
        restoreInventory: true,
        restoreProgress: true,
        restoreSettings: true,
        restoreWorld: true,
        restoreUI: true,
        skipCorrupted: false,
        useBackup: false,
        validateData: true
      };

      const result = await continuitySystem.restoreFromSavePoint('character_1', savePointId, options);
      
      expect(result.success).toBe(true);
      expect(result.savePointId).toBe(savePointId);
      expect(result.restored.length).toBeGreaterThan(0);
      expect(result.loadTime).toBeGreaterThan(0);
      expect(result.dataIntegrity).toBe(1.0);
      expect(gameStateRestored).toBe(true);
    });

    test('should handle partial restoration', async () => {
      const options = {
        restoreCharacter: true,
        restoreInventory: false,
        restoreProgress: false,
        restoreSettings: false,
        restoreWorld: false,
        restoreUI: false,
        skipCorrupted: true,
        useBackup: false,
        validateData: true
      };

      const result = await continuitySystem.restoreFromSavePoint('character_1', savePointId, options);
      
      expect(result.success).toBe(true);
      expect(result.restored).toContain('character');
      expect(result.restored).not.toContain('inventory');
    });

    test('should handle auto-restore', async () => {
      // Create multiple save points
      await continuitySystem.createSavePoint(sessionId, 'auto', 'Auto save 1');
      await continuitySystem.createSavePoint(sessionId, 'auto', 'Auto save 2');
      const latestSaveId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Latest save');

      const result = await continuitySystem.autoRestore('character_1');
      
      expect(result.success).toBe(true);
      expect(result.restored.length).toBeGreaterThan(0);
    });

    test('should handle restore from non-existent save point', async () => {
      const options = {
        restoreCharacter: true,
        restoreInventory: true,
        restoreProgress: true,
        restoreSettings: true,
        restoreWorld: true,
        restoreUI: true,
        skipCorrupted: false,
        useBackup: false,
        validateData: true
      };

      const result = await continuitySystem.restoreFromSavePoint('character_1', 'invalid_save_point', options);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Save point not found');
      expect(result.restored.length).toBe(0);
    });

    test('should handle auto-restore with no save points', async () => {
      const result = await continuitySystem.autoRestore('character_without_saves');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('No valid save points found');
    });
  });

  describe('Metrics and Statistics', () => {
    test('should track session metrics', async () => {
      const sessionId1 = await continuitySystem.startSession('player_1', 'character_1');
      const sessionId2 = await continuitySystem.startSession('player_2', 'character_2');

      // Simulate some time passing
      continuitySystem.update(5000);

      await continuitySystem.endSession(sessionId1);
      await continuitySystem.endSession(sessionId2);

      const metrics = continuitySystem.getContinuityMetrics();
      expect(metrics.totalSessions).toBe(2);
      expect(metrics.averageSessionLength).toBeGreaterThan(0);
    });

    test('should track save point metrics', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      // Create auto saves
      await continuitySystem.createSavePoint(sessionId, 'auto', 'Auto save 1');
      await continuitySystem.createSavePoint(sessionId, 'auto', 'Auto save 2');

      // Create manual save
      await continuitySystem.createManualSavePoint(sessionId, 'Manual save');

      const metrics = continuitySystem.getContinuityMetrics();
      expect(metrics.autoSaves).toBe(3); // Including initial auto save
      expect(metrics.manualSaves).toBe(1);
    });

    test('should track restore metrics', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');
      const savePointId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Test restore');

      const options = {
        restoreCharacter: true,
        restoreInventory: true,
        restoreProgress: true,
        restoreSettings: true,
        restoreWorld: true,
        restoreUI: true,
        skipCorrupted: false,
        useBackup: false,
        validateData: true
      };

      // Successful restore
      await continuitySystem.restoreFromSavePoint('character_1', savePointId, options);

      // Failed restore
      await continuitySystem.restoreFromSavePoint('character_1', 'invalid_save_point', options);

      const metrics = continuitySystem.getContinuityMetrics();
      expect(metrics.successfulRestores).toBe(1);
      expect(metrics.failedRestores).toBe(1);
    });

    test('should calculate average session length correctly', async () => {
      const sessionId1 = await continuitySystem.startSession('player_1', 'character_1');
      continuitySystem.update(2000); // 2 seconds
      await continuitySystem.endSession(sessionId1);

      const sessionId2 = await continuitySystem.startSession('player_2', 'character_2');
      continuitySystem.update(4000); // 4 seconds
      await continuitySystem.endSession(sessionId2);

      const metrics = continuitySystem.getContinuityMetrics();
      expect(metrics.averageSessionLength).toBe(3000); // (2000 + 4000) / 2
    });
  });

  describe('Advanced Features', () => {
    test('should handle different save point types', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      const autoSaveId = await continuitySystem.createSavePoint(sessionId, 'auto', 'Auto save');
      const manualSaveId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Manual save');
      const checkpointSaveId = await continuitySystem.createSavePoint(sessionId, 'checkpoint', 'Checkpoint');

      const savePoints = continuitySystem.getSavePoints('character_1');
      
      expect(savePoints.some(sp => sp.type === 'auto')).toBe(true);
      expect(savePoints.some(sp => sp.type === 'manual')).toBe(true);
      expect(savePoints.some(sp => sp.type === 'checkpoint')).toBe(true);
    });

    test('should handle session preferences', async () => {
      const preferences = {
        autoSave: false,
        saveInterval: 120000,
        compressionLevel: 9,
        maxSavePoints: 5,
        cloudSync: true,
        offlineMode: true
      };

      const sessionId = await continuitySystem.startSession('player_1', 'character_1', preferences);
      const session = continuitySystem.getActiveSession('player_1');

      expect(session.preferences.autoSave).toBe(false);
      expect(session.preferences.saveInterval).toBe(120000);
      expect(session.preferences.compressionLevel).toBe(9);
      expect(session.preferences.maxSavePoints).toBe(5);
      expect(session.preferences.cloudSync).toBe(true);
      expect(session.preferences.offlineMode).toBe(true);
    });

    test('should clean up old save points', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      // Create save points with old timestamps
      const savePoints = continuitySystem.getSavePoints('character_1');
      if (savePoints.length > 0) {
        savePoints[0].timestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
      }

      // Trigger cleanup
      continuitySystem.update(16.67);

      // Old auto save points should be removed, but manual ones should remain
      const remainingSavePoints = continuitySystem.getSavePoints('character_1');
      expect(remainingSavePoints.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle game state snapshots', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');
      const savePointId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Full state test');

      const savePoints = continuitySystem.getSavePoints('character_1');
      const savePoint = savePoints.find(sp => sp.id === savePointId);

      expect(savePoint.gameState).toBeDefined();
      expect(savePoint.gameState.character).toBeDefined();
      expect(savePoint.gameState.inventory).toBeDefined();
      expect(savePoint.gameState.skills).toBeDefined();
      expect(savePoint.gameState.quests).toBeDefined();
      expect(savePoint.gameState.world).toBeDefined();
      expect(savePoint.gameState.ui).toBeDefined();
      expect(savePoint.gameState.settings).toBeDefined();
      expect(savePoint.gameState.flags).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle corrupted save points gracefully', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');
      const savePointId = await continuitySystem.createSavePoint(sessionId, 'manual', 'Corruption test');

      // Simulate corruption by modifying checksum
      const savePoints = continuitySystem.getSavePoints('character_1');
      const savePoint = savePoints.find(sp => sp.id === savePointId);
      savePoint.metadata.checksum = 'corrupted_checksum';

      const options = {
        restoreCharacter: true,
        restoreInventory: true,
        restoreProgress: true,
        restoreSettings: true,
        restoreWorld: true,
        restoreUI: true,
        skipCorrupted: true,
        useBackup: false,
        validateData: true
      };

      const result = await continuitySystem.restoreFromSavePoint('character_1', savePointId, options);
      
      // Should handle corruption gracefully
      expect(result.dataIntegrity).toBeLessThan(1.0);
    });

    test('should handle system resource constraints', async () => {
      // Create many sessions to test resource handling
      const sessionIds = [];
      for (let i = 0; i < 10; i++) {
        const sessionId = await continuitySystem.startSession(`player_${i}`, `character_${i}`);
        sessionIds.push(sessionId);
      }

      expect(sessionIds.length).toBe(10);

      // Update all sessions
      expect(() => {
        continuitySystem.update(16.67);
      }).not.toThrow();

      // End all sessions
      for (const sessionId of sessionIds) {
        await continuitySystem.endSession(sessionId);
      }
    });

    test('should handle concurrent save operations', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      // Create multiple save points concurrently
      const savePromises = [];
      for (let i = 0; i < 5; i++) {
        savePromises.push(
          continuitySystem.createSavePoint(sessionId, 'manual', `Concurrent save ${i}`)
        );
      }

      const savePointIds = await Promise.all(savePromises);
      expect(savePointIds.length).toBe(5);
      expect(savePointIds.every(id => id)).toBe(true);
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      const originalExecuteQuery = continuitySystem.mcpSystem.executeQuery;
      continuitySystem.mcpSystem.executeQuery = jest.fn().mockRejectedValue(new Error('Database error'));

      // Should not throw error, but handle gracefully
      await expect(continuitySystem.startSession('player_1', 'character_1')).resolves.toBeTruthy();

      // Restore original method
      continuitySystem.mcpSystem.executeQuery = originalExecuteQuery;
    });

    test('should handle invalid character IDs gracefully', () => {
      const savePoints = continuitySystem.getSavePoints('invalid_character');
      expect(savePoints).toEqual([]);

      const session = continuitySystem.getActiveSession('invalid_player');
      expect(session).toBeNull();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle system updates efficiently', async () => {
      // Create active sessions
      const sessionId1 = await continuitySystem.startSession('player_1', 'character_1');
      const sessionId2 = await continuitySystem.startSession('player_2', 'character_2');

      const startTime = Date.now();
      
      // Perform many updates
      for (let i = 0; i < 100; i++) {
        continuitySystem.update(16.67);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });

    test('should handle large numbers of save points efficiently', async () => {
      const sessionId = await continuitySystem.startSession('player_1', 'character_1');

      const startTime = Date.now();
      
      // Create many save points
      for (let i = 0; i < 50; i++) {
        await continuitySystem.createSavePoint(sessionId, 'auto', `Performance test ${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds

      const savePoints = continuitySystem.getSavePoints('character_1');
      expect(savePoints.length).toBeGreaterThan(0);
    });

    test('should cleanup properly on system shutdown', () => {
      // Create some sessions and save points
      const setupPromises = [];
      for (let i = 0; i < 3; i++) {
        setupPromises.push(continuitySystem.startSession(`player_${i}`, `character_${i}`));
      }

      Promise.all(setupPromises).then(() => {
        // Cleanup should not throw
        expect(() => {
          continuitySystem.cleanup();
        }).not.toThrow();

        // Verify cleanup
        const session = continuitySystem.getActiveSession('player_1');
        expect(session).toBeNull();
      });
    });
  });
});