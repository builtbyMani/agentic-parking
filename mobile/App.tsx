import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { useMobileNegotiation } from './src/hooks/useMobileNegotiation';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { NegotiateScreen } from './src/screens/NegotiateScreen';
import { PassScreen } from './src/screens/PassScreen';
import { LotsScreen } from './src/screens/LotsScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('home');

  const {
    events,
    isPacing,
    statusText,
    winner,
    qrToken,
    lots,
    slots,
    gateState,
    gateCountdown,
    startNegotiation,
    triggerReplay,
    clearEvents,
    actuateGate,
    toggleSlotSensor,
    confirmPayment,
  } = useMobileNegotiation(1200);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Screen Content */}
        <View style={styles.screenWrapper}>
          {currentTab === 'home' && (
            <HomeScreen
              onStartNegotiation={startNegotiation}
              onTriggerReplay={triggerReplay}
              isPacing={isPacing}
              statusText={statusText}
              onGoToBidding={() => setCurrentTab('bidding')}
              onGoToPass={() => setCurrentTab('pass')}
            />
          )}

          {currentTab === 'bidding' && (
            <NegotiateScreen
              events={events}
              isPacing={isPacing}
              statusText={statusText}
              winner={winner}
              onClear={clearEvents}
              onGoToPass={() => setCurrentTab('pass')}
            />
          )}

          {currentTab === 'pass' && (
            <PassScreen
              winner={winner}
              qrToken={qrToken}
              gateState={gateState}
              gateCountdown={gateCountdown}
              onActuateGate={actuateGate}
              onConfirmPayment={confirmPayment}
              onGoToBidding={() => setCurrentTab('bidding')}
              onGoToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'lots' && (
            <LotsScreen
              lots={lots}
              slots={slots}
              onToggleSlot={toggleSlotSensor}
              onGoToHome={() => setCurrentTab('home')}
              onGoToBidding={() => setCurrentTab('bidding')}
            />
          )}
        </View>

        {/* Floating Minimal Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          biddingCount={events.length}
          hasPass={Boolean(winner || qrToken)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenWrapper: {
    flex: 1,
  },
});
