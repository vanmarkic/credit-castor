import { useState } from 'react';

interface ParticipantMigrationDialogProps {
  participantCount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ParticipantMigrationDialog({
  participantCount,
  onConfirm,
  onCancel,
}: ParticipantMigrationDialogProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#1976d2' }}>
          🔄 Mise à jour de l'architecture
        </h2>

        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          Une nouvelle version de l'application utilise une architecture améliorée
          pour les participants.
        </p>

        <div
          style={{
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1976d2' }}>
            Avantages :
          </p>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>Mises à jour en temps réel par participant</li>
            <li>Détection de conflits plus précise</li>
            <li>Meilleure performance</li>
          </ul>
        </div>

        <p style={{ fontSize: '14px', color: '#666' }}>
          Cette opération va migrer <strong>{participantCount} participant(s)</strong>{' '}
          vers la nouvelle structure. Vos données seront préservées.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            ❌ Erreur : {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isMigrating}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: isMigrating ? 'not-allowed' : 'pointer',
              opacity: isMigrating ? 0.5 : 1,
            }}
          >
            Plus tard
          </button>
          <button
            onClick={handleConfirm}
            disabled={isMigrating}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: isMigrating ? 'not-allowed' : 'pointer',
              opacity: isMigrating ? 0.5 : 1,
            }}
          >
            {isMigrating ? 'Migration en cours...' : 'Migrer maintenant'}
          </button>
        </div>
      </div>
    </div>
  );
}
