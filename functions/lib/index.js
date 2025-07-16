"use strict";
/**
 * @fileoverview Cloud Functions para o sistema de notificações do Verbo Vivo.
 * Contém os gatilhos do Firestore para criar e enviar notificações.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCongregation = exports.requestToJoinCongregation = exports.approveCongregationMemberRequest = exports.onCongregationApproval = exports.onNewComment = exports.onNewPostLike = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
/**
 * Função principal que cria um documento de notificação e envia um push.
 */
async function createAndSendNotification(notificationData) {
    if (notificationData.recipientId === notificationData.actorId) {
        console.log("Skipping self-notification.");
        return;
    }
    // 1. Criar a notificação no Firestore
    await db.collection("notifications").add(Object.assign(Object.assign({}, notificationData), { isRead: false, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    // 2. Buscar tokens e enviar notificação Push
    const tokensSnapshot = await db.collection("userPushTokens")
        .where("userId", "==", notificationData.recipientId).get();
    if (tokensSnapshot.empty) {
        console.log("No push tokens found for user:", notificationData.recipientId);
        return;
    }
    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
    const messagePayload = {
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
function getNotificationMessage(type) {
    switch (type) {
        case "POST_LIKE": return "curtiu sua publicação.";
        case "NEW_COMMENT": return "comentou na sua publicação.";
        case "REPLY": return "respondeu ao seu comentário.";
        case "CONGREGATION_APPROVAL": return "aprovou sua entrada na congregação.";
        default: return "interagiu com você.";
    }
}
async function cleanupInvalidTokens(response, tokens) {
    const tokensToDelete = [];
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
exports.onNewPostLike = functions.region(region)
    .firestore.document("congregations/{congregationId}/posts/{postId}/likes/{userId}")
    .onCreate(async (snapshot, context) => {
    var _a, _b, _c;
    const { congregationId, postId, userId: actorId } = context.params;
    const postDoc = await db.doc(`congregations/${congregationId}/posts/${postId}`).get();
    if (!postDoc.exists)
        return;
    const actorDoc = await db.doc(`users/${actorId}`).get();
    await createAndSendNotification({
        recipientId: (_a = postDoc.data()) === null || _a === void 0 ? void 0 : _a.authorId,
        actorId,
        actorName: ((_b = actorDoc.data()) === null || _b === void 0 ? void 0 : _b.displayName) || "Alguém",
        actorPhotoURL: ((_c = actorDoc.data()) === null || _c === void 0 ? void 0 : _c.photoURL) || null,
        type: "POST_LIKE",
        entityId: postId,
        entityPath: `/community/${congregationId}`,
    });
});
// Gatilho para Novos Comentários e Respostas
exports.onNewComment = functions.region(region)
    .firestore.document("congregations/{congregationId}/posts/{postId}/comments/{commentId}")
    .onCreate(async (snapshot, context) => {
    var _a, _b, _c, _d;
    const { congregationId, postId, commentId } = context.params;
    const commentData = snapshot.data();
    const actorId = commentData.authorId;
    const actorDoc = await db.doc(`users/${actorId}`).get();
    const baseNotification = {
        actorId,
        actorName: ((_a = actorDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || "Alguém",
        actorPhotoURL: ((_b = actorDoc.data()) === null || _b === void 0 ? void 0 : _b.photoURL) || null,
        entityId: commentId,
        entityPath: `/community/${congregationId}`,
    };
    if (commentData.parentCommentId) { // É uma resposta
        const parentCommentDoc = await db.doc(`congregations/${congregationId}/posts/${postId}/comments/${commentData.parentCommentId}`).get();
        if (parentCommentDoc.exists) {
            await createAndSendNotification(Object.assign(Object.assign({}, baseNotification), { recipientId: (_c = parentCommentDoc.data()) === null || _c === void 0 ? void 0 : _c.authorId, type: "REPLY" }));
        }
    }
    else { // É um comentário no post
        const postDoc = await db.doc(`congregations/${congregationId}/posts/${postId}`).get();
        if (postDoc.exists) {
            await createAndSendNotification(Object.assign(Object.assign({}, baseNotification), { recipientId: (_d = postDoc.data()) === null || _d === void 0 ? void 0 : _d.authorId, type: "NEW_COMMENT" }));
        }
    }
});
// Gatilho para Aprovação na Congregação (agora acionado pela Cloud Function)
// A função onUpdate não é mais necessária para aprovação, mas pode ser útil para outras transições de status.
exports.onCongregationApproval = functions.region(region)
    .firestore.document("congregations/{congregationId}/members/{userId}")
    .onUpdate(async (change, context) => {
    var _a;
    const { congregationId, userId: recipientId } = context.params;
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === "PENDING" && after.status === "MEMBER") {
        const congregationDoc = await db.doc(`congregations/${congregationId}`).get();
        await createAndSendNotification({
            recipientId,
            actorId: congregationId, // Pode ser o ID do admin que aprovou, se passado para a função.
            actorName: ((_a = congregationDoc.data()) === null || _a === void 0 ? void 0 : _a.name) || "Sua Congregação",
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
exports.approveCongregationMemberRequest = functions.region(region)
    .https.onCall(async (data, context) => {
    var _a, _b, _c;
    const adminUid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { congregationId, targetUserId } = data;
    if (!adminUid) {
        throw new functions.https.HttpsError("unauthenticated", "Você deve estar logado para realizar esta ação.");
    }
    if (!congregationId || !targetUserId) {
        throw new functions.https.HttpsError("invalid-argument", " congregationId e targetUserId são obrigatórios.");
    }
    const congregationRef = db.doc(`congregations/${congregationId}`);
    const memberRef = db.doc(`congregations/${congregationId}/members/${targetUserId}`);
    const userRef = db.doc(`users/${targetUserId}`);
    const congregationDoc = await congregationRef.get();
    if (!congregationDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Congregação não encontrada.");
    }
    // Verificar se o chamador é um admin da congregação
    const isAdmin = ((_c = (_b = congregationDoc.data()) === null || _b === void 0 ? void 0 : _b.admins) === null || _c === void 0 ? void 0 : _c[adminUid]) === true;
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para aprovar membros.");
    }
    const batch = db.batch();
    batch.update(memberRef, { status: "MEMBER", joinedAt: admin.firestore.FieldValue.serverTimestamp() });
    batch.update(userRef, { congregationStatus: "MEMBER" });
    batch.update(congregationRef, { memberCount: admin.firestore.FieldValue.increment(1) });
    try {
        await batch.commit();
        return { success: true, message: "Membro aprovado com sucesso." };
    }
    catch (error) {
        console.error("Erro ao aprovar membro:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro ao aprovar o membro.");
    }
});
/**
 * Função Chamável para Solicitar Entrada na Congregação
 */
exports.requestToJoinCongregation = functions.region(region)
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { inviteCode } = data;
    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado.");
    }
    if (!inviteCode) {
        throw new functions.https.HttpsError("invalid-argument", "Código de convite é obrigatório.");
    }
    const userDocRef = db.doc(`users/${uid}`);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Usuário não encontrado.");
    }
    if ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.congregationId) {
        throw new functions.https.HttpsError("failed-precondition", "Você já faz parte ou solicitou entrada em uma congregação.");
    }
    const congregationsRef = db.collection("congregations");
    const q = congregationsRef.where("inviteCode", "==", inviteCode.toUpperCase());
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "Código de convite inválido.");
    }
    const congregationDoc = querySnapshot.docs[0];
    const congregationId = congregationDoc.id;
    const memberRef = db.doc(`congregations/${congregationId}/members/${uid}`);
    const batch = db.batch();
    batch.set(memberRef, {
        displayName: ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.displayName) || ((_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.email),
        photoURL: ((_e = userDoc.data()) === null || _e === void 0 ? void 0 : _e.photoURL) || null,
        status: 'PENDING',
        requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    batch.update(userDocRef, {
        congregationId: congregationId,
        congregationStatus: 'PENDING'
    });
    try {
        await batch.commit();
        return { success: true, message: "Solicitação enviada com sucesso.", congregationName: congregationDoc.data().name };
    }
    catch (error) {
        console.error("Erro ao solicitar entrada:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro ao processar sua solicitação.");
    }
});
/**
 * Função Chamável para Criar uma Congregação
 */
exports.createCongregation = functions.region(region)
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { name, city, pastorName } = data;
    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado.");
    }
    if (!name || !city || !pastorName) {
        throw new functions.https.HttpsError("invalid-argument", "Todos os campos são obrigatórios.");
    }
    const userDocRef = db.doc(`users/${uid}`);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Usuário não encontrado.");
    }
    if ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.congregationId) {
        throw new functions.https.HttpsError("failed-precondition", "Você já está em uma congregação.");
    }
    const congregationRef = db.collection("congregations").doc();
    const memberRef = db.doc(`congregations/${congregationRef.id}/members/${uid}`);
    const batch = db.batch();
    batch.set(congregationRef, {
        name,
        city,
        pastorName,
        admins: { [uid]: true },
        memberCount: 1,
        inviteCode: generateInviteCode(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
    });
    batch.set(memberRef, {
        displayName: ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.displayName) || ((_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.email),
        photoURL: ((_e = userDoc.data()) === null || _e === void 0 ? void 0 : _e.photoURL) || null,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'ADMIN',
    });
    batch.update(userDocRef, {
        congregationId: congregationRef.id,
        congregationStatus: 'ADMIN'
    });
    try {
        await batch.commit();
        return { success: true, message: "Congregação criada com sucesso.", congregationId: congregationRef.id };
    }
    catch (error) {
        console.error("Erro ao criar congregação:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro ao criar a congregação.");
    }
});
//# sourceMappingURL=index.js.map