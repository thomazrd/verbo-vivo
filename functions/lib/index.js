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
exports.onCongregationApproval = exports.onNewComment = exports.onNewPostLike = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
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
// Gatilho para Aprovação na Congregação
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
            actorId: congregationId,
            actorName: ((_a = congregationDoc.data()) === null || _a === void 0 ? void 0 : _a.name) || "Sua Congregação",
            actorPhotoURL: null,
            type: "CONGREGATION_APPROVAL",
            entityId: congregationId,
            entityPath: `/community/${congregationId}`,
        });
    }
});
//# sourceMappingURL=index.js.map