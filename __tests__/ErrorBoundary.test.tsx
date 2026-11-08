import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Text } from 'react-native';

const ErrorThrower = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test Error Crash');
  }
  return <Text>Safe Component</Text>;
};

describe('ErrorBoundary', () => {
  // Prevent React from logging the expected error to our test console
  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <ErrorThrower shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('Safe Component')).toBeTruthy();
  });

  it('catches the error and renders the fallback UI', async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <ErrorThrower shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong.')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('resets the error state when Try Again is pressed', async () => {
    // We can simulate a Try Again by changing the props and forcing a re-render
    // But a cleaner way is just clicking Try Again
    
    // We mock the child to initially throw, then not throw after retry
    let throwError = true;
    const DynamicThrower = () => {
      if (throwError) {
        throw new Error('Crash');
      }
      return <Text>Recovered!</Text>;
    };

    const { getByText, queryByText } = await render(
      <ErrorBoundary>
        <DynamicThrower />
      </ErrorBoundary>
    );

    // It crashed, so we see the error boundary
    expect(getByText('Something went wrong.')).toBeTruthy();

    // Fix the error state for the next render
    throwError = false;

    // Click Try Again
    await fireEvent.press(getByText('Try Again'));

    // It should have remounted and recovered
    expect(getByText('Recovered!')).toBeTruthy();
    expect(queryByText('Something went wrong.')).toBeNull();
  });
});
