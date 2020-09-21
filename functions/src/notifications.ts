import { firestore, messaging } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { TempAny } from './temp-any';

export const sendGeneralNotification = functions.firestore
  .document('/notifications/{timestamp}')
  .onCreate(async (snapshot, context) => {
    const timestamp = context.params.timestamp;
    const message = snapshot.data();

    if (!message) return;

    console.log(`New message added at ${timestamp} with payload ${message}`);

    const deviceTokensPromise = firestore().collection('notificationsSubscribers').get();
    const notificationsConfigPromise = firestore().collection('config').doc('notifications').get();

    const [tokensSnapshot, notificationsConfigSnapshot] = await Promise.all([
      deviceTokensPromise,
      notificationsConfigPromise,
    ]);
    const notificationsConfig = notificationsConfigSnapshot.exists
      ? notificationsConfigSnapshot.data()
      : {};

    const tokens = tokensSnapshot.docs.map((doc) => doc.id);

    if (!tokens.length) {
      console.log('There are no notification tokens to send to.');
      return;
    }
    console.log(`There are ${tokens.length} tokens to send notifications to.`);

    const payload = {
      data: {
        ...message,
        ...{
          icon: message.icon || notificationsConfig.icon,
        },
      },
    };

    const tokensToRemove = [];
    const messagingResponse = await messaging().sendToDevice(tokens, payload);
    messagingResponse.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error(`Failure sending notification to ${tokens[index]}`, error);
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          const tokenRef = (tokensSnapshot as TempAny).ref.child(tokens[index]);
          tokensToRemove.push(tokenRef.remove());
        }
      }
    });

    return Promise.all(tokensToRemove);
  });
