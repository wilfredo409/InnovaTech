import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Lock, FileText, Mail, Trash2, HelpCircle } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export function PrivacyPolicyModal({ isOpen, onClose, lang }: PrivacyPolicyModalProps) {
  // Localized texts
  const content: Record<string, {
    title: string;
    lastUpdated: string;
    sections: { title: string; icon: any; content: string[] }[];
    footer: string;
    backBtn: string;
  }> = {
    es: {
      title: "Política de Privacidad y Cookies",
      lastUpdated: "Última actualización: Agosto 2026",
      sections: [
        {
          title: "1. Introducción y Responsable del Tratamiento",
          icon: Shield,
          content: [
            "En InnovaTech ('nosotros', 'nuestro', sitio web y aplicación), valoramos profundamente tu privacidad y la protección de tus datos personales. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información de los usuarios que acceden a nuestra plataforma.",
            "Al utilizar nuestros servicios, aceptas las prácticas descritas en este documento. Cumplimos con el Reglamento General de Protección de Datos (RGPD), la Ley de Privacidad del Consumidor de California (CCPA/CPRA) y las políticas oficiales para editores de Google AdSense y Google Play."
          ]
        },
        {
          title: "2. Información que Recopilamos",
          icon: FileText,
          content: [
            "Información de Cuenta (Google Sign-In): Al iniciar sesión opcionalmente con tu cuenta de Google, recopilamos tu nombre, dirección de correo electrónico y fotografía de perfil para gestionar tus comentarios, preferencias e historial sincronizado.",
            "Datos de Navegación y Uso: Registramos el historial de noticias consultadas, temas favoritos y duración de lectura para ofrecerte un feed personalizado y mejorar el rendimiento de la plataforma.",
            "Contenido y Comentarios: Almacenamos de forma segura los comentarios, respuestas y valoraciones que publicas de forma voluntaria en los artículos de tecnología.",
            "Datos Técnicos: Dirección IP anónima, tipo de navegador, sistema operativo y métricas estándar de rendimiento."
          ]
        },
        {
          title: "3. Uso de Cookies y Publicidad de Google AdSense",
          icon: HelpCircle,
          content: [
            "Proveedores de Terceros: Proveedores externos, incluido Google, utilizan cookies para publicar anuncios basados en las visitas anteriores de los usuarios a nuestro sitio web o a otros sitios web de Internet.",
            "Cookies Publicitarias de Google: El uso de cookies publicitarias (como la cookie de DoubleClick/DART) permite a Google y a sus socios comerciales mostrar anuncios relevantes a los usuarios en función de sus hábitos de navegación en este y otros sitios.",
            "Inhabilitación de Anuncios Personalizados: Los usuarios pueden inhabilitar la publicidad personalizada en cualquier momento visitando la Configuración de Anuncios de Google (https://adssettings.google.com) o a través del portal de la Digital Advertising Alliance (www.aboutads.info/choices).",
            "Cookies Propias y Analíticas: Utilizamos cookies técnicas estrictamente necesarias para el funcionamiento del sitio (gestión de tema claro/oscuro, idioma y sesión) y cookies analíticas para medir el tráfico agregado."
          ]
        },
        {
          title: "4. Servicios de Terceros y Transferencia de Datos",
          icon: Lock,
          content: [
            "Google AdSense / Google AdMob: Monetización y entrega de publicidad contextual y personalizada conforme a las normativas de privacidad de Google.",
            "Firebase (Google LLC): Servicios de base de datos en la nube (Firestore) y autenticación segura con cifrado en tránsito y en reposo.",
            "YouTube API Services: Reproducción de contenidos multimedia y videoanálisis integrados en los artículos bajo los Términos de Servicio de YouTube."
          ]
        },
        {
          title: "5. Derechos del Usuario y Eliminación de Datos",
          icon: Trash2,
          content: [
            "Derechos ARCO / RGPD: Tienes derecho a acceder, rectificar, limitar, solicitar la portabilidad y exigir la eliminación definitiva de tus datos personales.",
            "Eliminación Directa e Inmediata: Puedes pulsar la opción 'Eliminar Cuenta y Datos' en el menú principal para borrar de manera permanente e irreversible todo tu perfil, comentarios e historial de nuestros servidores.",
            "Solicitud Manual: También puedes escribirnos a smiwceron@gmail.com para solicitar la supresión de cualquier registro."
          ]
        },
        {
          title: "6. Protección de Menores",
          icon: Shield,
          content: [
            "InnovaTech es una plataforma dirigida al público general apasionado por la tecnología. No recopilamos conscientemente datos de menores de 13 años. Si detectamos cualquier dato de un menor, procedemos a su inmediata eliminación."
          ]
        },
        {
          title: "7. Contacto y Consultas",
          icon: Mail,
          content: [
            "Para cualquier consulta sobre nuestra Política de Privacidad, gestión de cookies o ejercicio de derechos legales, contáctanos en: smiwceron@gmail.com"
          ]
        }
      ],
      footer: "InnovaTech garantiza total transparencia, cumplimiento con las políticas de Google AdSense y protección de datos.",
      backBtn: "Entendido y Aceptar"
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: July 2026",
      sections: [
        {
          title: "1. Introduction",
          icon: Shield,
          content: [
            "At InnovaTech News ('we', 'our'), we deeply value your privacy and data security. This Privacy Policy outlines how we collect, use, store, and protect your information when you use our mobile application InnovaTech (com.mobilezonne.innovatech).",
            "Our application provides technology news, videos, and interactive podcasts. By using our App, you consent to the practices described here. We strictly comply with Google Play Developer Policies and applicable data protection regulations."
          ]
        },
        {
          title: "2. Information We Collect",
          icon: FileText,
          content: [
            "Account Information (Google Sign-In): If you choose to sign in with your Google account, we collect your name, email address, and profile picture URL. This is necessary to personalize your profile, enable community comments, and sync your data securely across devices.",
            "Usage Data and History: To deliver an enhanced reading experience, we log your read history, watched videos, and played podcasts locally (and in the cloud if authenticated).",
            "User-Generated Content: We safely store comments and replies you write on articles, linked transparently to your user profile.",
            "Device and Advertisement Data (AdMob): The App utilizes Google AdMob to display advertisements. AdMob may collect Android Advertising IDs, IP addresses, device identifiers, and network performance data to deliver ads and analytical reports in line with Google's consent guidelines."
          ]
        },
        {
          title: "3. How We Use Your Data",
          icon: Lock,
          content: [
            "To provide, maintain, and improve InnovaTech's interactive services.",
            "To safely sync your language choices, favorite topics, reading history, and comments across devices using Firebase Firestore.",
            "To manage and moderate community discussions (comments and replies).",
            "To display tailored or general advertisements via Google AdMob.",
            "To send relevant push notifications regarding replies to your comments or breaking tech news."
          ]
        },
        {
          title: "4. Third-Party Services & Data Transfer",
          icon: HelpCircle,
          content: [
            "Firebase (Google LLC): We use Firebase Authentication for secure user registration and login, and Cloud Firestore to store encrypted history, comments, and settings.",
            "Google AdMob (Google LLC): Used to monetize our app through banner advertisements complying with Google's advertising guidelines.",
            "YouTube API Services: Embedded to play technical video content directly within the articles, subject to YouTube Terms of Service."
          ]
        },
        {
          title: "5. User Rights and Data Deletion",
          icon: Trash2,
          content: [
            "Right to Delete Your Data (Account Deletion Compliance): In full compliance with Google Play User Data policies, we provide a prominent in-app option to permanently delete your account and associated records. You can execute this at any time in the app Menu by clicking 'Delete Account & Data'. Once confirmed, all your user profile data, reading history, comments, and replies will be permanently and irreversibly purged from our Firebase servers immediately.",
            "Manual Request: You can also write to us at smiwceron@gmail.com to request manual deletion of any personal data linked to your account."
          ]
        },
        {
          title: "6. Children's Privacy",
          icon: Shield,
          content: [
            "InnovaTech News is designed for a general audience interested in technology. We do not knowingly collect personal data from children under the age of 13. If we discover a child under 13 has provided personal information, we will immediately delete it from our systems."
          ]
        },
        {
          title: "7. Contact Us",
          icon: Mail,
          content: [
            "If you have any questions, concerns, or requests regarding this Privacy Policy or your data rights, please reach out to us at: smiwceron@gmail.com"
          ]
        }
      ],
      footer: "InnovaTech is committed to absolute transparency and compliance with Google Play Store guidelines.",
      backBtn: "Understood"
    },
    pt: {
      title: "Política de Privacidade",
      lastUpdated: "Última atualização: Julho de 2026",
      sections: [
        {
          title: "1. Introdução",
          icon: Shield,
          content: [
            "Na InnovaTech Notícias ('nós', 'nosso'), valorizamos profundamente sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados ao usar nosso aplicativo InnovaTech (com.mobilezonne.innovatech).",
            "Ao utilizar nosso aplicativo, você concorda com as práticas aqui descritas. Cumprimos rigorosamente as políticas de desenvolvedor do Google Play e as leis de proteção de dados."
          ]
        },
        {
          title: "2. Dados Coletados",
          icon: FileText,
          content: [
            "Informações de Conta: Ao fazer login com o Google, coletamos seu nome, e-mail e foto de perfil para fins de personalização e comunidade.",
            "Histórico de Leitura: Registramos notícias lidas e vídeos assistidos para melhorar as recomendações do feed.",
            "Conteúdo do Usuário: Comentários e respostas escritos por você nos artigos são salvos com segurança na nuvem.",
            "Anúncios (AdMob): Coletamos IDs de publicidade para veicular anúncios adequados em cooperação com o Google AdMob."
          ]
        },
        {
          title: "3. Direitos de Exclusão de Dados",
          icon: Trash2,
          content: [
            "Exclusão de Conta: Para cumprir as regras do Google Play, você pode excluir totalmente seus dados e sua conta a qualquer momento no Menu clicando em 'Eliminar Cuenta y Datos' (Excluir Conta e Dados). Isso apagará permanentemente todos os seus comentários, curtidas e histórico."
          ]
        },
        {
          title: "4. Contato",
          icon: Mail,
          content: [
            "Para dúvidas ou solicitações legais de dados, entre em contato em: smiwceron@gmail.com"
          ]
        }
      ],
      footer: "InnovaTech está comprometida com a transparência total.",
      backBtn: "Entendido"
    },
    fr: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour : Juillet 2026",
      sections: [
        {
          title: "1. Introduction",
          icon: Shield,
          content: [
            "Chez InnovaTech Actualités ('nous', 'notre'), nous accordons une importance cruciale à votre vie privée. Cette Politique explique comment nous traitons vos données personnelles dans notre application InnovaTech (com.mobilezonne.innovatech).",
            "En utilisant notre application, vous acceptez nos pratiques de traitement de données conformes aux politiques Google Play."
          ]
        },
        {
          title: "2. Données Collectées",
          icon: FileText,
          content: [
            "Données de profil Google : E-mail, nom et photo pour activer les commentaires et synchroniser votre historique.",
            "Historique : Les articles consultés et les podcasts écoutés sont enregistrés.",
            "Publicité (AdMob) : Collecte d'identifiants publicitaires mobiles pour diffuser des publicités adaptées."
          ]
        },
        {
          title: "3. Droits de Suppression de Compte",
          icon: Trash2,
          content: [
            "Suppression Totale : Conformément aux exigences réglementaires de Google Play, un bouton 'Eliminar Cuenta y Datos' dans le menu vous permet de supprimer instantanément et définitivement votre profil et l'intégralité de vos données de nos serveurs."
          ]
        },
        {
          title: "4. Contact",
          icon: Mail,
          content: [
            "Pour toute question ou exercice de vos droits, écrivez à : smiwceron@gmail.com"
          ]
        }
      ],
      footer: "InnovaTech respecte pleinement les directives du Google Play Store.",
      backBtn: "Compris"
    },
    de: {
      title: "Datenschutzerklärung",
      lastUpdated: "Letzte Aktualisierung: Juli 2026",
      sections: [
        {
          title: "1. Einführung",
          icon: Shield,
          content: [
            "Bei InnovaTech Nachrichten ('wir', 'uns') nehmen wir den Schutz Ihrer persönlichen Daten sehr ernst. Diese Erklärung beschreibt den Umgang mit Ihren Daten innerhalb der InnovaTech-App (com.mobilezonne.innovatech).",
            "Mit der Nutzung unserer App stimmen Sie den hier dargelegten Richtlinien zu, die im Einklang mit den Google Play Entwickler-Richtlinien stehen."
          ]
        },
        {
          title: "2. Erhobene Daten",
          icon: FileText,
          content: [
            "Konto-Informationen (Google Sign-In): Name, E-Mail-Adresse und Profilbild-URL für Personalisierung und Kommentare.",
            "Nutzungsdaten: Verlauf der gelesenen Nachrichten und Videos zur Optimierung des Feeds.",
            "Werbung (AdMob): Verwendung von Werbe-IDs zur Bereitstellung relevanter Anzeigen über Google AdMob."
          ]
        },
        {
          title: "3. Kontolöschung und Datenschutzrechte",
          icon: Trash2,
          content: [
            "Datenlöschung: Gemäß den Google Play-Richtlinien können Sie Ihr Profil und alle damit verbundenen Daten (Kommentare, Verlauf, Favoriten) jederzeit im Hauptmenü über die Schaltfläche 'Eliminar Cuenta y Datos' unwiderruflich von unseren Servern löschen."
          ]
        },
        {
          title: "4. Kontakt",
          icon: Mail,
          content: [
            "Bei Fragen zum Datenschutz wenden Sie sich bitte an: smiwceron@gmail.com"
          ]
        }
      ],
      footer: "InnovaTech steht für Transparenz und die Einhaltung aller Google Play Store-Richtlinien.",
      backBtn: "Verstanden"
    }
  };

  const currentContent = content[lang] || content["es"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm"
            id="privacy-backdrop"
          />

          {/* Modal Panel */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] pointer-events-auto"
              id="privacy-modal-card"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-white leading-tight">
                      {currentContent.title}
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {currentContent.lastUpdated}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Close Privacy Policy"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {currentContent.sections.map((sec, idx) => {
                  const IconComponent = sec.icon;
                  return (
                    <div key={idx} className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-blue-500" />
                        <span>{sec.title}</span>
                      </h3>
                      <div className="space-y-2.5 pl-6 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        {sec.content.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Developer / Play Store Notice block */}
                <div className="p-4 bg-blue-50/30 dark:bg-blue-950/15 border border-blue-100/30 dark:border-blue-900/20 rounded-2xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic text-center">
                    {currentContent.footer}
                  </p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/25 flex justify-end gap-3 shrink-0">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {currentContent.backBtn}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
