import { cookBookingRequestCustomerConfirmation, globalBookingRequestCookConfirmation } from '@people-eat/server-adapter-email-template';
import moment from 'moment';
import { Authorization, type DataSource, type Email, type Logger } from '../../..';
import { type DBGlobalBookingRequest, type DBUser } from '../../../data-source';
import { createNanoId } from '../../../utils/createNanoId';
import { type NanoId } from '../../shared';

export interface CreateOneBookingRequestInput {
    dataSourceAdapter: DataSource.Adapter;
    emailAdapter: Email.Adapter;
    webAppUrl: string;
    logger: Logger.Adapter;
    context: Authorization.Context;
    request: { cookId: NanoId; globalBookingRequestId: NanoId };
}

// eslint-disable-next-line max-statements
export async function createOneByGlobalBookingRequestId({
    dataSourceAdapter,
    emailAdapter,
    webAppUrl,
    logger,
    context,
    request,
}: CreateOneBookingRequestInput): Promise<boolean> {
    const { cookId, globalBookingRequestId } = request;

    await Authorization.canMutateUserData({ context, dataSourceAdapter, logger, userId: cookId });

    const globalBookingRequest: DBGlobalBookingRequest | undefined = await dataSourceAdapter.globalBookingRequestRepository.findOne({
        globalBookingRequestId,
    });

    if (!globalBookingRequest) return false;

    const user: DBUser | undefined = await dataSourceAdapter.userRepository.findOne({ userId: globalBookingRequest.userId });

    if (!user) return false;

    const cookUser: DBUser | undefined = await dataSourceAdapter.userRepository.findOne({ userId: cookId });

    if (!cookUser) return false;

    const {
        userId,
        adultParticipants,
        children,
        amount,
        currencyCode,
        dateTime,
        duration,
        occasion,
        message,
        kitchenId,
        latitude,
        longitude,
        // expiresAt,
        // createdAt,
    } = globalBookingRequest;

    const bookingRequestId: NanoId = createNanoId();

    const success: boolean = await dataSourceAdapter.bookingRequestRepository.insertOne({
        bookingRequestId,
        cookId,
        userId,
        cookAccepted: true,
        userAccepted: true,
        latitude,
        longitude,
        dateTime,
        preparationTime: 120,
        duration,
        adultParticipants,
        children,
        amount,
        currencyCode,
        fee: 18,
        occasion,
        kitchenId,
        globalBookingRequestId,
        createdAt: new Date(),
        paymentData: {
            provider: 'STRIPE',
            setupIntentId: '',
            clientSecret: '',
        },
    });

    if (!success) return false;

    const messageSuccess: boolean = await dataSourceAdapter.chatMessageRepository.insertOne({
        chatMessageId: createNanoId(),
        bookingRequestId,
        message,
        generated: false,
        createdBy: userId,
        createdAt: new Date(),
    });

    if (!messageSuccess) logger.info('persisting message for booking request failed');

    if (user.emailAddress) {
        const customerEmailSuccess: boolean = await emailAdapter.sendToOne(
            'PeopleEat',
            user.emailAddress,
            `${cookUser.firstName} hat Deine Anfrage akzeptiert`,
            cookBookingRequestCustomerConfirmation({
                webAppUrl,
                customer: {
                    firstName: user.firstName,
                },
                cook: {
                    firstName: cookUser.firstName,
                    profilePictureUrl: cookUser.profilePictureUrl ?? '',
                },
                bookingRequest: {
                    occasion,
                    children,
                    adults: adultParticipants,
                    location: 'Mannheim',
                    date: dateTime.toDateString(),
                    time: moment(dateTime).format('LT'),
                    price: {
                        perPerson: amount / (children + adultParticipants),
                        total: amount,
                        currency: currencyCode,
                    },
                },
                chatMessage: message.trim(),
            }),
        );

        if (!customerEmailSuccess) logger.info('sending email failed');
    }

    if (cookUser.emailAddress) {
        const customerEmailSuccess: boolean = await emailAdapter.sendToOne(
            user.firstName,
            cookUser.emailAddress,
            'Du hast eine Buchungsanfrage akzeptiert',
            globalBookingRequestCookConfirmation({
                webAppUrl,
                customer: {
                    firstName: user.firstName,
                },
                globalBookingRequest: {
                    occasion,
                    adults: adultParticipants,
                    children,
                    location: '',
                    date: dateTime.toDateString(),
                    time: moment(dateTime).format('LT'),
                    price: {
                        perPerson: amount / (children + adultParticipants),
                        total: amount,
                        currency: currencyCode,
                    },
                },
                chatMessage: message,
            }),
        );

        if (!customerEmailSuccess) logger.info('sending email failed');
    }

    return true;
}
