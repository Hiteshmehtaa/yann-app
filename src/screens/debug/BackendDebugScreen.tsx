import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEBUG_INFO } from '../../utils/constants';

interface PingResult {
  url: string;
  status: 'checking' | 'success' | 'failed';
  message?: string;
  responseTime?: number;
}

export default function BackendDebugScreen() {
  const [localPing, setLocalPing] = useState<PingResult>({
    url: DEBUG_INFO.LOCAL_URL,
    status: 'checking'
  });
  const [prodPing, setProdPing] = useState<PingResult>({
    url: DEBUG_INFO.PRODUCTION_URL,
    status: 'checking'
  });
  const [refreshing, setRefreshing] = useState(false);

  const testBackend = async (url: string, setter: (result: PingResult) => void) => {
    const startTime = Date.now();
    setter({ url, status: 'checking' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${url.replace('/api', '')}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        setter({
          url,
          status: 'success',
          message: `Connected (${responseTime}ms)`,
          responseTime
        });
      } else {
        setter({
          url,
          status: 'failed',
          message: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      setter({
        url,
        status: 'failed',
        message: error.name === 'AbortError' ? 'Timeout (5s)' : error.message
      });
    }
  };

  const runTests = async () => {
    await Promise.all([
      testBackend(DEBUG_INFO.LOCAL_URL, setLocalPing),
      testBackend(DEBUG_INFO.PRODUCTION_URL, setProdPing)
    ]);
  };

  useEffect(() => {
    runTests();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await runTests();
    setRefreshing(false);
  };

  const renderPingResult = (label: string, result: PingResult) => {
    const color = 
      result.status === 'success' ? '#22c55e' :
      result.status === 'failed' ? '#ef4444' :
      '#6b7280';

    const icon = 
      result.status === 'success' ? '✅' :
      result.status === 'failed' ? '❌' :
      '⏳';

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultIcon}>{icon}</Text>
          <Text style={styles.resultLabel}>{label}</Text>
        </View>
        <Text style={styles.resultUrl}>{result.url}</Text>
        {result.message && (
          <Text style={[styles.resultMessage, { color }]}>
            {result.message}
          </Text>
        )}
        {result.status === 'checking' && (
          <ActivityIndicator size="small" color="#6b7280" style={{ marginTop: 8 }} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.title}>Backend Connectivity Debug</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Device Info</Text>
          <Text style={styles.infoText}>Type: {DEBUG_INFO.IS_DEVICE ? '📱 Physical Device' : '🖥️ Emulator/Simulator'}</Text>
          <Text style={styles.infoText}>Platform: {DEBUG_INFO.PLATFORM}</Text>
          <Text style={styles.infoText}>Localhost: {DEBUG_INFO.LOCALHOST}:3000</Text>
        </View>

        {renderPingResult('Local Backend', localPing)}
        {renderPingResult('Production Backend', prodPing)}

        <TouchableOpacity 
          style={styles.button}
          onPress={runTests}
          disabled={localPing.status === 'checking' || prodPing.status === 'checking'}
        >
          <Text style={styles.buttonText}>
            {localPing.status === 'checking' || prodPing.status === 'checking' 
              ? 'Testing...' 
              : '🔄 Test Again'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Troubleshooting Tips</Text>
          <Text style={styles.tipText}>• Both device and computer must be on same WiFi</Text>
          <Text style={styles.tipText}>• Check firewall allows port 3000</Text>
          <Text style={styles.tipText}>• Verify backend is running: npm run dev</Text>
          <Text style={styles.tipText}>• Test from browser: http://{DEBUG_INFO.LOCALHOST}:3000/health</Text>
          <Text style={styles.tipText}>• If local fails, app auto-uses production</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  resultUrl: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 6,
    lineHeight: 20,
  },
});
