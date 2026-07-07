import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from './EmptyState';
import { Button } from './ui/Button';

interface MissingDataFallbackProps {
  onGoBack: () => void;
  message?: string;
}

export const MissingDataFallback: React.FC<MissingDataFallbackProps> = ({
  onGoBack,
  message = "We couldn't load this screen because some required information is missing.",
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState title="Something's missing" subtitle={message}>
        <Button title="Go Back" onPress={onGoBack} />
      </EmptyState>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
