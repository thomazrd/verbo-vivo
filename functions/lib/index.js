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
exports.createCongregation = exports.requestToJoinCongregation = exports.approveCongregationMemberRequest = exports.onCongregationApproval = exports.onNewPost = exports.onNewComment = exports.onNewPostLike = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors = __importStar(require("cors"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
// Configuração do CORS
const corsHandler = cors({
    origin: (origin, callback) => {
        // Permite requisições de localhost para desenvolvimento local
        if (!origin || /localhost:\d+$/.test(origin) || origin.endsWith('cloudworkstations.dev') || origin.endsWith('firebaseapp.com') || origin.endsWith('web.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
});
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
        case "NEW_POST": return "publicou na sua comunidade.";
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
// NOVO Gatilho para Novas Publicações
exports.onNewPost = functions.region(region)
    .firestore.document("congregations/{congregationId}/posts/{postId}")
    .onCreate(async (snapshot, context) => {
    const { congregationId, postId } = context.params;
    const postData = snapshot.data();
    const authorId = postData.authorId;
    // Buscar todos os membros da congregação
    const membersSnapshot = await db.collection(`congregations/${congregationId}/members`).get();
    if (membersSnapshot.empty) {
        console.log("No members found in congregation to notify:", congregationId);
        return;
    }
    const notificationPromises = [];
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
            type: "NEW_POST",
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
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b;
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        const adminUid = req.body.data.adminUid;
        const { congregationId, targetUserId } = req.body.data;
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
        const isAdmin = ((_b = (_a = congregationDoc.data()) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b[adminUid]) === true;
        if (!isAdmin) {
            res.status(403).json({ error: 'permission-denied', message: "Você não tem permissão para aprovar membros." });
            return;
        }
        const batch = db.batch();
        batch.update(memberRef, { status: "MEMBER", joinedAt: admin.firestore.FieldValue.serverTimestamp() });
        batch.update(userRef, { congregationStatus: "MEMBER" });
        batch.update(congregationRef, { memberCount: admin.firestore.FieldValue.increment(1) });
        try {
            await batch.commit();
            res.status(200).json({ data: { success: true, message: "Membro aprovado com sucesso." } });
        }
        catch (error) {
            console.error("Erro ao aprovar membro:", error);
            res.status(500).json({ error: 'internal', message: "Ocorreu um erro ao aprovar o membro." });
        }
    });
});
/**
 * Função Chamável para Solicitar Entrada na Congregação
 */
exports.requestToJoinCongregation = functions.region(region)
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b, _c, _d;
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
        if ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.congregationId) {
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
            displayName: ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.displayName) || ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.email),
            photoURL: ((_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.photoURL) || null,
            status: 'PENDING',
            requestedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batch.update(userDocRef, {
            congregationId: congregationId,
            congregationStatus: 'PENDING'
        });
        try {
            await batch.commit();
            res.status(200).json({ data: { success: true, message: "Solicitação enviada com sucesso.", congregationName: congregationDoc.data().name } });
        }
        catch (error) {
            console.error("Erro ao solicitar entrada:", error);
            res.status(500).json({ error: 'internal', message: 'Ocorreu um erro ao processar sua solicitação.' });
        }
    });
});
/**
 * Função Chamável para Criar uma Congregação
 */
exports.createCongregation = functions.region(region)
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b, _c, _d;
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
        if ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.congregationId) {
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
            displayName: ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.displayName) || ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.email),
            photoURL: ((_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.photoURL) || null,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'ADMIN',
        });
        batch.update(userDocRef, {
            congregationId: congregationRef.id,
            congregationStatus: 'ADMIN'
        });
        try {
            await batch.commit();
            res.status(200).json({ data: { success: true, message: "Congregação criada com sucesso.", congregationId: congregationRef.id } });
        }
        catch (error) {
            console.error("Erro ao criar congregação:", error);
            res.status(500).json({ error: 'internal', message: 'Ocorreu um erro ao criar a congregação.' });
        }
    });
});
//# sourceMappingURL=index.js.map