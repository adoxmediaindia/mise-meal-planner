import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  View,
  StyleSheet,
  Platform,
} from 'react-native';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: object;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  header,
  footer,
  style,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <View style={[styles.container, style]}>
          {header ? <View style={styles.header}>{header}</View> : null}
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  footer: {
    paddingTop: 12,
  },
});
