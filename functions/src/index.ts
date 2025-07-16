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
                tokensToDelete.push(tokenRef.get().then((snap) => snap.forEach((doc) => doc.ref.delete())));
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
        const {congregationId, postId, userId: actorId} = context.params;
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
        const {congregationId, postId, commentId} = context.params;
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

// Gatilho para Aprovação na Congregação (agora acionado pela Cloud Function)
// A função onUpdate não é mais necessária para aprovação, mas pode ser útil para outras transições de status.
export const onCongregationApproval = functions.region(region)
    .firestore.document("congregations/{congregationId}/members/{userId}")
    .onUpdate(async (change, context) => {
        const {congregationId, userId: recipientId} = context.params;
        const before = change.before.data();
        const after = change.after.data();

        if (before.status === "PENDING" && after.status === "MEMBER") {
            const congregationDoc = await db.doc(`congregations/${congregationId}`).get();
            await createAndSendNotification({
                recipientId,
                actorId: congregationId, // Pode ser o ID do admin que aprovou, se passado para a função.
                actorName: congregationDoc.data()?.name || "Sua Congregação",
                actorPhotoURL: null,
                type: "CONGREGATION_APPROVAL",
                entityId: congregationId,
                entityPath: `/community/${congregationId}`,
            });
        }
    });

/**
 * Função Chamável para Aprovar Membros
 */
export const approveCongregationMemberRequest = functions.region(region)
    .https.onCall(async (data, context) => {
      const adminUid = context.auth?.uid;
      const {congregationId, targetUserId} = data;

      if (!adminUid) {
        throw new functions.https.HttpsError("unauthenticated", "Você deve estar logado para realizar esta ação.");
      }
      if (!congregationId || !targetUserId) {
        throw new functions.https.HttpsError("invalid-argument", " congregationId e targetUserId são obrigatórios.");
      }

      const congregationRef = db.doc(`congregations/${congregationId}`);
      const memberRef = db.doc(`congregations/${congregationId}/members/${targetUserId}`);
      const userRef = db.doc(`users/${targetUserId}`);
      const adminMemberRef = db.doc(`congregations/${congregationId}/members/${adminUid}`);

      // Verificar se o chamador é um admin da congregação
      const adminMemberSnap = await adminMemberRef.get();
      if (!adminMemberSnap.exists || adminMemberSnap.data()?.status !== "ADMIN") {
        throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para aprovar membros.");
      }

      const batch = db.batch();
      batch.update(memberRef, {status: "MEMBER", joinedAt: admin.firestore.FieldValue.serverTimestamp()});
      batch.update(userRef, {congregationStatus: "MEMBER"});
      batch.update(congregationRef, {memberCount: admin.firestore.FieldValue.increment(1)});

      try {
        await batch.commit();
        return {success: true, message: "Membro aprovado com sucesso."};
      } catch (error) {
        console.error("Erro ao aprovar membro:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro ao aprovar o membro.");
      }
    });
