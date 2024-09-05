/* eslint-disable prettier/prettier */
export interface EnvironmentVariables {
    database: {
        port: number;
        host: string;
        name: string;
        user: string;
        password: string;
    };
    payment: {
        stripePublishableKey: string;
        stripeSecretKey: string;
    };
    email: {
        emailAddress: string;
        password: string;
    };
    sms: {
        twilioAccountSid: string;
        twilioAuthToken: string;
        twilioPhoneNumber: string;
    };
    identityProvider: {
        googleIosClientId: string;
        iosBundleIdentifier: string;
    };
    latestIosVersion: string;
}
