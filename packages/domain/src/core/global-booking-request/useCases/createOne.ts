import { globalBookingRequestCustomerConfirmation } from '@people-eat/server-adapter-email-template';
import moment from 'moment';
import { Authorization } from '../../..';
import { type DBAllergy, type DBCategory, type DBKitchen, type DBUser } from '../../../data-source';
import { createNanoId } from '../../../utils/createNanoId';
import { type Runtime } from '../../Runtime';
import { type NanoId } from '../../shared';
import { type CreateOneGlobalBookingRequestRequest } from '../CreateOneGlobalBookingRequestRequest';

export interface CreateOneGlobalBookingRequestInput {
    runtime: Runtime;
    context: Authorization.Context;
    request: CreateOneGlobalBookingRequestRequest & { userId: NanoId };
}

// eslint-disable-next-line max-statements
export async function createOne({ runtime, context, request }: CreateOneGlobalBookingRequestInput): Promise<boolean> {
    const { dataSourceAdapter, emailAdapter, webAppUrl, logger } = runtime;
    const {
        adultParticipants,
        children,
        priceClassType,
        dateTime,
        duration,
        occasion,
        message,
        kitchenId,
        allergyIds,
        categoryIds,
        location,
        userId,
        phoneNumber,
    } = request;

    await Authorization.canMutateUserData({ context, dataSourceAdapter, logger, userId });

    const globalBookingRequestId: NanoId = createNanoId();

    const success: boolean = await dataSourceAdapter.globalBookingRequestRepository.insertOne({
        globalBookingRequestId,
        userId,
        adultParticipants,
        children,
        priceClassType,
        dateTime,
        duration,
        occasion: occasion.trim(),
        message: message.trim(),
        kitchenId,
        latitude: location.latitude,
        longitude: location.longitude,
        locationText: location.text ?? '',
        expiresAt: moment().add(14, 'days').toDate(),
        createdAt: new Date(),
    });

    if (!success) return false;

    const user: DBUser | undefined = await dataSourceAdapter.userRepository.findOne({ userId });

    if (!user) return false;

    let kitchen: DBKitchen | undefined;

    if (kitchenId) kitchen = await dataSourceAdapter.kitchenRepository.findOne({ kitchenId });

    const allergies: DBAllergy[] = [];

    if (allergyIds) {
        for (const allergyId of allergyIds) {
            const allergy: DBAllergy | undefined = await dataSourceAdapter.allergyRepository.findOne({ allergyId });
            if (allergy) allergies.push(allergy);
        }
    }

    const allergyTitles: string[] = allergies.map(({ title }: DBAllergy) => title);

    const categories: DBCategory[] = [];

    if (categoryIds) {
        for (const categoryId of categoryIds) {
            const category: DBCategory | undefined = await dataSourceAdapter.categoryRepository.findOne({ categoryId });
            if (category) categories.push(category);
        }
    }

    const categoryTitles: string[] = categories.map(({ title }: DBCategory) => title);

    const formattedDateTime: string = moment(dateTime).format('MMMM Do YYYY, h:mm a');
    const emailSuccess: boolean = await emailAdapter.sendToMany(
        'Global Booking Request',
        runtime.notificationEmailAddresses,
        `from ${user.firstName} ${user.lastName}`,
        `A new Booking Request was received from <b>${user.firstName} ${
            user.lastName
        }</b><br/><br/><b>When:</b> ${formattedDateTime}<br/><b>Where:</b> ${
            location.text
        }<br/><b>Occasion:</b> ${occasion}<br/><br/><b>Adults:</b> ${adultParticipants}<br/><b>Children:</b> ${children}<br/><br/><b>Budget:</b> ${priceClassType}<br/><br/><b>Message:</b><br/>${message}<br/><br/><br/><b>Contact:</b><br/>Email Address: ${
            user.emailAddress
        }<br/>Phone Number: ${phoneNumber}<br/><br/>Kitchen: ${kitchen?.title ?? 'any'}<br/><br/>Allergies: ${allergyTitles.join(
            ', ',
        )}<br/><br/>Categories: ${categoryTitles.join(', ')}`,
    );

    if (!emailSuccess) logger.info('sending email failed');

    if (user.emailAddress) {
        const customerEmailSuccess: boolean = await emailAdapter.sendToOne(
            'PeopleEat',
            user.emailAddress,
            'Bestätigung Deiner Buchungsanfrage',
            globalBookingRequestCustomerConfirmation({
                webAppUrl,
                customer: { firstName: user.firstName, profilePictureUrl: user.profilePictureUrl },
                globalBookingRequest: {
                    globalBookingRequestId,
                    occasion,
                    adults: adultParticipants,
                    children,
                    location: location.text,
                    date: dateTime.toDateString(),
                    time: moment(dateTime).format('LT'),
                    priceClassType,
                },
                chatMessage: message.trim(),
                categories: categoryTitles,
                allergies: allergyTitles,
                kitchen: kitchen?.title,
            }),
        );

        if (!customerEmailSuccess) logger.info('sending email failed');
    }

    return true;
}
