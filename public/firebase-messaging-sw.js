// Importa os scripts do Firebase necessários para o service worker.
// É importante usar a versão compat para ter acesso à API legada `firebase.initializeApp`.
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Configuração do Firebase, copiada do seu arquivo de inicialização.
const firebaseConfig = {
  apiKey: "AIzaSyCKKrLFYMQ0zy-L1YmUjXMNaLEBhS4Oxjk",
  authDomain: "inovai-pr4x6.firebaseapp.com",
  projectId: "inovai-pr4x6",
  storageBucket: "inovai-pr4x6.appspot.com",
  messagingSenderId: "710862373885",
  appId: "1:710862373885:web:2022633c5ea373588acf94",
  measurementId: "G-DEH2PMHWYD"
};

// Inicializa o Firebase no escopo do service worker.
firebase.initializeApp(firebaseConfig);

// Obtém uma instância do Firebase Messaging para que ele possa lidar com mensagens em segundo plano.
const messaging = firebase.messaging();

// Opcional: Adiciona um manipulador de mensagens em segundo plano.
// Este código é executado quando o aplicativo está em segundo plano ou fechado.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Personalize a notificação aqui.
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/logo-192.png", // Um ícone padrão
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
