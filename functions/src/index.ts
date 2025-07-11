/**
 * @fileoverview Cloud Functions para o sistema de notificações do Verbo Vivo.
 * Contém os gatilhos do Firestore para criar e enviar notificações.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

type NotificationType = "NEW_COMMENT" | "REPLY" | "POST_LIKE" | "CONGREGATION_APPROVAL";

/**
 * Função principal que cria um documento de notificação e envia um push.
 */
async function createAndSendNotification(notificationData: {
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhotoURL: string | null;
  type: NotificationType;
  entityId: string;
  entityPath: string;
}) {
  if (notificationData.recipientId === notificationData.actorId) {
    console.log("Skipping self-notification.");
    return;
  }

  // 1. Criar a notificação no Firestore
  await db.collection("notifications").add({
    ...notificationData,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 2. Buscar tokens e enviar notificação Push
  const tokensSnapshot = await db.collection("userPushTokens")
      .where("userId", "==", notificationData.recipientId).get();

  if (tokensSnapshot.empty) {
    console.log("No push tokens found for user:", notificationData.recipientId);
    return;
  }

  const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

  const messagePayload: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: "Verbo Vivo",
      body: `${notificationData.actorName} ${getNotificationMessage(notificationData.type)}`,
    },
    webpush: {
      notification: {
        icon: "https://dynamic.tiggomark.com.br/images/logo-192.png", // NOTA: Adicione uma logo em um local público
      },
      fcmOptions: {
        link: `https://[SEU_DOMINIO_DO_APP]${notificationData.entityPath}`, // NOTA: Substitua pelo seu domínio
      },
    },
  };

  const response = await messaging.sendMulticast(messagePayload);
  await cleanupInvalidTokens(response, tokens);
}

// Funções auxiliares (getNotificationMessage, cleanupInvalidTokens) como no guia anterior.
function getNotificationMessage(type: NotificationType): string {
  switch (type) {
    case "POST_LIKE": return "curtiu sua publicação.";
    case "NEW_COMMENT": return "comentou na sua publicação.";
    case "REPLY": return "respondeu ao seu comentário.";
    case "CONGREGATION_APPROVAL": return "aprovou sua entrada na congregação.";
    default: return "interagiu com você.";
  }
}

async function cleanupInvalidTokens(response: admin.messaging.BatchResponse, tokens: string[]) {
    const tokensToDelete: Promise<any>[] = [];
    response.responses.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error("Failure sending notification to", tokens[index], error);
            if (error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered") {
                const tokenRef = db.collection("userPushTokens").where("token", "==", tokens[index]);
                tokensToDelete.push(tokenRef.get().then(snap => snap.forEach(doc => doc.ref.delete())));
            }
        }
    });
    await Promise.all(tokensToDelete);
}

// --- Definição dos Gatilhos do Firestore ---

const region = "us-central1";

// Gatilho para Likes em Posts
export const onNewPostLike = functions.region(region)
    .firestore.document("congregations/{congregationId}/posts/{postId}/likes/{userId}")
    .onCreate(async (snapshot, context) => {
        const { congregationId, postId, userId: actorId } = context.params;
        const postDoc = await db.doc(`congregations/${congregationId}/posts/${postId}`).get();
        if (!postDoc.exists) return;
        const actorDoc = await db.doc(`users/${actorId}`).get();
        await createAndSendNotification({
            recipientId: postDoc.data()?.authorId,
            actorId,
            actorName: actorDoc.data()?.displayName || "Alguém",
            actorPhotoURL: actorDoc.data()?.photoURL || null,
            type: "POST_LIKE",
            entityId: postId,
            entityPath: `/community/${congregationId}`,
        });
    });

// Gatilho para Novos Comentários e Respostas
export const onNewComment = functions.region(region)
    .firestore.document("congregations/{congregationId}/posts/{postId}/comments/{commentId}")
    .onCreate(async (snapshot, context) => {
        const { congregationId, postId, commentId } = context.params;
        const commentData = snapshot.data();
        const actorId = commentData.authorId;
        const actorDoc = await db.doc(`users/${actorId}`).get();

        const baseNotification = {
            actorId,
            actorName: actorDoc.data()?.displayName || "Alguém",
            actorPhotoURL: actorDoc.data()?.photoURL || null,
            entityId: commentId,
            entityPath: `/community/${congregationId}`,
        };

        if (commentData.parentCommentId) { // É uma resposta
            const parentCommentDoc = await db.doc(`congregations/${congregationId}/posts/${postId}/comments/${commentData.parentCommentId}`).get();
            if (parentCommentDoc.exists) {
                await createAndSendNotification({
                    ...baseNotification,
                    recipientId: parentCommentDoc.data()?.authorId,
                    type: "REPLY",
                });
            }
        } else { // É um comentário no post
            const postDoc = await db.doc(`congregations/${congregationId}/posts/${postId}`).get();
            if (postDoc.exists) {
                await createAndSendNotification({
                    ...baseNotification,
                    recipientId: postDoc.data()?.authorId,
                    type: "NEW_COMMENT",
                });
            }
        }
    });

// Gatilho para Aprovação na Congregação
export const onCongregationApproval = functions.region(region)
    .firestore.document("congregations/{congregationId}/members/{userId}")
    .onUpdate(async (change, context) => {
        const { congregationId, userId: recipientId } = context.params;
        const before = change.before.data();
        const after = change.after.data();

        if (before.status === "PENDING" && after.status === "MEMBER") {
            const congregationDoc = await db.doc(`congregations/${congregationId}`).get();
            await createAndSendNotification({
                recipientId,
                actorId: congregationId,
                actorName: congregationDoc.data()?.name || "Sua Congregação",
                actorPhotoURL: null,
                type: "CONGREGATION_APPROVAL",
                entityId: congregationId,
                entityPath: `/community/${congregationId}`,
            });
        }
    });