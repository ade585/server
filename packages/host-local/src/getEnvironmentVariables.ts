/* eslint-disable prettier/prettier */
import * as dotenv from 'dotenv';
import { type EnvironmentVariables } from './EnvironmentVariables.js';

export function getEnvironmentVariables(): EnvironmentVariables {
    if (process.env.NODE_ENV !== 'production') dotenv.config({ path: 'integration.env' });

    if (!process.env.STRIPE_PUBLISHABLE_KEY) throw new Error(`Missing environment variable with key 'STRIPE_PUBLISHABLE_KEY'`);
    if (!process.env.STRIPE_SECRET_KEY) throw new Error(`Missing environment variable with key 'STRIPE_SECRET_KEY'`);
    if (!process.env.EMAIL_ADDRESS) throw new Error(`Missing environment variable with key 'EMAIL_ADDRESS'`);
    if (!process.env.EMAIL_PASSWORD) throw new Error(`Missing environment variable with key 'EMAIL_PASSWORD'`);
    if (!process.env.TWILIO_ACCOUNT_SID) throw new Error(`Missing environment variable with key 'TWILIO_ACCOUNT_SID'`);
    if (!process.env.TWILIO_AUTH_TOKEN) throw new Error(`Missing environment variable with key 'TWILIO_AUTH_TOKEN'`);
    if (!process.env.TWILIO_PHONE_NUMBER) throw new Error(`Missing environment variable with key 'TWILIO_PHONE_NUMBER'`);
    if (!process.env.GOOGLE_IOS_CLIENT_ID) throw new Error(`Missing environment variable with key 'GOOGLE_IOS_CLIENT_ID'`);
    if (!process.env.IOS_BUNDLE_IDENTIFIER) throw new Error(`Missing environment variable with key 'IOS_BUNDLE_IDENTIFIER'`);

    return {
        database: {
            host: process.env.DATABASE_HOST ?? 'localhost',
            name: process.env.DATABASE_NAME ?? 'PeopleEatDB',
            password: process.env.DATABASE_PASSWORD ?? 'password',
            port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
            user: process.env.DATABASE_USER ?? 'people-eat-server',
        },
        email: {
            emailAddress: process.env.EMAIL_ADDRESS,
            password: process.env.EMAIL_PASSWORD,
        },
        identityProvider: {
            googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
            iosBundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER,
        },
        latestIosVersion: '',
        payment: {
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            stripeSecretKey: process.env.STRIPE_SECRET_KEY,
        },
        sms: {
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
            twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
        },
    };
}
