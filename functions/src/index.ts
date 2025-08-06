
/**
 * @fileoverview Cloud Functions para o sistema de notificações do Verbo Vivo.
 * Contém os gatilhos do Firestore para criar e enviar notificações.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Configuração do CORS
const corsHandler = cors({
    origin: (origin, callback) => {
        // Permite requisições de localhost para desenvolvimento local
        if (!origin || /localhost:\d+$/.test(origin) || origin.endsWith('cloudworkstations.dev') || origin.endsWith('firebaseapp.com') || origin.endsWith('web.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
});


type NotificationType = "NEW_POST" | "NEW_COMMENT" | "REPLY" | "POST_LIKE" | "CONGREGATION_APPROVAL";

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
    case "NEW_POST": return "publicou na sua comunidade.";
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

// NOVO Gatilho para Novas Publicações
export const onNewPost = functions.region(region)
    .firestore.document("congregations/{congregationId}/posts/{postId}")
    .onCreate(async (snapshot, context) => {
        const {congregationId, postId} = context.params;
        const postData = snapshot.data();
        const authorId = postData.authorId;
        
        // Buscar todos os membros da congregação
        const membersSnapshot = await db.collection(`congregations/${congregationId}/members`).get();
        if (membersSnapshot.empty) {
            console.log("No members found in congregation to notify:", congregationId);
            return;
        }

        const notificationPromises: Promise<any>[] = [];

        membersSnapshot.forEach((memberDoc) => {
            const memberId = memberDoc.id;
            
            // Não notificar o autor da publicação
            if (memberId === authorId) {
                return;
            }

            const notificationData = {
                recipientId: memberId,
                actorId: authorId,
                actorName: postData.authorName || "Alguém",
                actorPhotoURL: postData.authorPhotoURL || null,
                type: "NEW_POST" as NotificationType,
                entityId: postId,
                entityPath: `/community/${congregationId}`,
            };

            // Adiciona a promessa de notificação à lista
            notificationPromises.push(createAndSendNotification(notificationData));
        });

        // Aguarda todas as notificações serem criadas e enviadas
        await Promise.all(notificationPromises);
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
    .https.onRequest((req, res) => {
        corsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const adminUid = req.body.data.adminUid;
            const {congregationId, targetUserId} = req.body.data;
            
            if (!adminUid) {
                res.status(401).json({ error: 'unauthenticated', message: "Você deve estar logado para realizar esta ação." });
                return;
            }
            if (!congregationId || !targetUserId) {
                res.status(400).json({ error: 'invalid-argument', message: " congregationId e targetUserId são obrigatórios." });
                return;
            }

            const congregationRef = db.doc(`congregations/${congregationId}`);
            const memberRef = db.doc(`congregations/${congregationId}/members/${targetUserId}`);
            const userRef = db.doc(`users/${targetUserId}`);
            
            const congregationDoc = await congregationRef.get();
            if (!congregationDoc.exists) {
                 res.status(404).json({ error: 'not-found', message: "Congregação não encontrada." });
                return;
            }

            // Verificar se o chamador é um admin da congregação
            const isAdmin = congregationDoc.data()?.admins?.[adminUid] === true;
            if (!isAdmin) {
                res.status(403).json({ error: 'permission-denied', message: "Você não tem permissão para aprovar membros." });
                return;
            }
            
            const batch = db.batch();
            batch.update(memberRef, {status: "MEMBER", joinedAt: admin.firestore.FieldValue.serverTimestamp()});
            batch.update(userRef, {congregationStatus: "MEMBER"});
            batch.update(congregationRef, {memberCount: admin.firestore.FieldValue.increment(1)});

            try {
                await batch.commit();
                res.status(200).json({ data: { success: true, message: "Membro aprovado com sucesso." }});
            } catch (error) {
                console.error("Erro ao aprovar membro:", error);
                res.status(500).json({ error: 'internal', message: "Ocorreu um erro ao aprovar o membro." });
            }
        });
    });

/**
 * Função Chamável para Solicitar Entrada na Congregação
 */
export const requestToJoinCongregation = functions.region(region)
    .https.onRequest((req, res) => {
        corsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const uid = req.body.data.uid;
            const { inviteCode } = req.body.data;

            if (!uid) {
                res.status(401).json({ error: 'unauthenticated', message: 'Você precisa estar logado.' });
                return;
            }
            if (!inviteCode) {
                res.status(400).json({ error: 'invalid-argument', message: 'Código de convite é obrigatório.' });
                return;
            }

            const userDocRef = db.doc(`users/${uid}`);
            const userDoc = await userDocRef.get();
            if (!userDoc.exists) {
                res.status(404).json({ error: 'not-found', message: 'Usuário não encontrado.' });
                return;
            }
            if (userDoc.data()?.congregationId) {
                res.status(412).json({ error: 'failed-precondition', message: 'Você já faz parte ou solicitou entrada em uma congregação.' });
                return;
            }

            const congregationsRef = db.collection("congregations");
            const q = congregationsRef.where("inviteCode", "==", inviteCode.toUpperCase());
            const querySnapshot = await q.get();

            if (querySnapshot.empty) {
                res.status(404).json({ error: 'not-found', message: 'Código de convite inválido.' });
                return;
            }

            const congregationDoc = querySnapshot.docs[0];
            const congregationId = congregationDoc.id;
            const memberRef = db.doc(`congregations/${congregationId}/members/${uid}`);
            
            const batch = db.batch();
            batch.set(memberRef, {
                displayName: userDoc.data()?.displayName || userDoc.data()?.email,
                photoURL: userDoc.data()?.photoURL || null,
                status: 'PENDING',
                requestedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            batch.update(userDocRef, {
                congregationId: congregationId,
                congregationStatus: 'PENDING'
            });

            try {
                await batch.commit();
                res.status(200).json({ data: { success: true, message: "Solicitação enviada com sucesso.", congregationName: congregationDoc.data().name }});
            } catch (error) {
                console.error("Erro ao solicitar entrada:", error);
                res.status(500).json({ error: 'internal', message: 'Ocorreu um erro ao processar sua solicitação.' });
            }
        });
    });

/**
 * Função Chamável para Criar uma Congregação
 */
export const createCongregation = functions.region(region)
    .https.onRequest((req, res) => {
        corsHandler(req, res, async () => {
             if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const uid = req.body.data.uid;
            const { name, city, pastorName, isPublic, baseVerse } = req.body.data;
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();


            if (!uid) {
                res.status(401).json({ error: 'unauthenticated', message: 'Você precisa estar logado.' });
                return;
            }
            if (!name || !city || !pastorName) {
                res.status(400).json({ error: 'invalid-argument', message: 'Todos os campos são obrigatórios.' });
                return;
            }

            const userDocRef = db.doc(`users/${uid}`);
            const userDoc = await userDocRef.get();
            if (!userDoc.exists) {
                res.status(404).json({ error: 'not-found', message: 'Usuário não encontrado.' });
                return;
            }
            if (userDoc.data()?.congregationId) {
                res.status(412).json({ error: 'failed-precondition', message: 'Você já está em uma congregação.' });
                return;
            }

            const congregationRef = db.collection("congregations").doc();
            const memberRef = db.doc(`congregations/${congregationRef.id}/members/${uid}`);
            
            const batch = db.batch();
            
            batch.set(congregationRef, {
                name,
                city,
                pastorName,
                isPublic: isPublic || false,
                baseVerse: baseVerse || null,
                admins: { [uid]: true },
                memberCount: 1,
                inviteCode: inviteCode,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: uid,
            });
            
            batch.set(memberRef, {
                displayName: userDoc.data()?.displayName || userDoc.data()?.email,
                photoURL: userDoc.data()?.photoURL || null,
                joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'ADMIN',
            });

            batch.update(userDocRef, {
                congregationId: congregationRef.id,
                congregationStatus: 'ADMIN'
            });
            
            try {
                await batch.commit();
                res.status(200).json({ data: { success: true, message: "Congregação criada com sucesso.", congregationId: congregationRef.id }});
            } catch (error) {
                console.error("Erro ao criar congregação:", error);
                res.status(500).json({ error: 'internal', message: 'Ocorreu um erro ao criar a congregação.' });
            }
        });
    });
