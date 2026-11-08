// Secure In-Memory Session Storage for Registration
// This prevents exposing passwords and OTPs in the navigation URL parameters.
// Data is stored purely in memory and is wiped when the app closes or when manually cleared.

interface RegistrationSessionData {
  email?: string;
  name?: string;
  password?: string;
  phone?: string;
  expectedOtp?: string;
}

let sessionData: RegistrationSessionData | null = null;

export const RegistrationSession = {
  set: (data: RegistrationSessionData) => {
    sessionData = { ...data };
  },
  get: (): RegistrationSessionData | null => {
    return sessionData;
  },
  clear: () => {
    sessionData = null;
  }
};
