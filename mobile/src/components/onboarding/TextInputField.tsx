import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

interface TextInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  autoFocus?: boolean;
  style?: object;
  testID?: string;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'enter here',
  error,
  maxLength = 50,
  autoFocus = true,
  style,
  testID,
}) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
          style,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B4B4AE"
          maxLength={maxLength}
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoCorrect={false}
          testID={testID}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EAEAE6',
    paddingVertical: 18,
    paddingHorizontal: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  input: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    padding: 0,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
});
