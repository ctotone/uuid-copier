const MODULE_ID = "uuid-copier";
const MODULE_TITLE = "Evilbram UUID Copier";
const LOG_PREFIX = `[${MODULE_TITLE}]`;
const CONTEXT_MENU_CLASS = `${MODULE_ID}-copy-uuid`;

/**
 * Types de Documents pris en charge par la V1.
 * Chaque nom correspond au nom canonique d'un Document Foundry.
 */
const SUPPORTED_DOCUMENT_NAMES = Object.freeze([
  "Actor",
  "Item",
  "JournalEntry",
  "Scene",
  "RollTable",
  "Macro",
  "Playlist",
  "Cards"
]);

/**
 * Vérifie qu'une valeur contient un UUID exploitable.
 *
 * @param {unknown} value
 * @returns {value is string}
 */
function isUsableUuid(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Écrit un warning cohérent dans la console Foundry.
 *
 * @param {string} message
 * @param {unknown} [error]
 */
function warn(message, error) {
  if (error !== undefined) {
    console.warn(`${LOG_PREFIX} ${message}`, error);
  } else {
    console.warn(`${LOG_PREFIX} ${message}`);
  }
}

/**
 * Récupère les identifiants portés par l'entrée HTML ciblée.
 *
 * Foundry v14 utilise normalement data-entry-id dans ses répertoires.
 * Les autres clés servent uniquement de replis défensifs.
 *
 * @param {HTMLElement} target
 * @returns {{id: string|null, uuid: string|null}}
 */
function getTargetIdentifiers(target) {
  if (!target || typeof target.closest !== "function") {
    return {
      id: null,
      uuid: null
    };
  }

  const entry =
    target.closest("[data-entry-id]") ??
    target.closest("[data-document-id]") ??
    target.closest("[data-uuid]") ??
    target.closest("[data-id]") ??
    target;

  const dataset = entry?.dataset ?? {};

  const id =
    dataset.entryId ??
    dataset.documentId ??
    dataset.id ??
    null;

  const uuid = dataset.uuid ?? null;

  return {
    id: typeof id === "string" && id.length > 0 ? id : null,
    uuid: isUsableUuid(uuid) ? uuid : null
  };
}

/**
 * Résout l'UUID de l'entrée sur laquelle le clic droit a été effectué.
 *
 * Fonctionne avec :
 * - une collection de monde ;
 * - un compendium ouvert.
 *
 * @param {object} application
 * @param {HTMLElement} target
 * @returns {Promise<string|null>}
 */
async function resolveUuidFromContext(application, target) {
  const { id, uuid } = getTargetIdentifiers(target);

  /*
   * Certains éléments HTML peuvent déjà contenir leur UUID complet.
   */
  if (uuid) return uuid;

  if (!id) return null;

  const collection = application?.collection ?? null;

  /*
   * 1. Recherche dans les Documents déjà chargés.
   */
  const cachedDocument = collection?.get?.(id) ?? null;

  if (isUsableUuid(cachedDocument?.uuid)) {
    return cachedDocument.uuid;
  }

  /*
   * 2. Certains index de compendium peuvent déjà exposer un UUID.
   */
  const indexedEntry = collection?.index?.get?.(id) ?? null;

  if (isUsableUuid(indexedEntry?.uuid)) {
    return indexedEntry.uuid;
  }

  /*
   * 3. Charge proprement une entrée de compendium si elle n'est
   * pas encore présente dans le cache.
   */
  if (typeof collection?.getDocument === "function") {
    const loadedDocument = await collection.getDocument(id);

    if (isUsableUuid(loadedDocument?.uuid)) {
      return loadedDocument.uuid;
    }
  }

  /*
   * 4. Repli pour une collection de monde standard.
   */
  const documentName =
    application?.documentName ??
    application?.documentClass?.documentName;

  const worldCollection = documentName
    ? game.collections?.get?.(documentName)
    : null;

  const worldDocument = worldCollection?.get?.(id) ?? null;

  if (isUsableUuid(worldDocument?.uuid)) {
    return worldDocument.uuid;
  }

  return null;
}

/**
 * Copie du texte dans le presse-papier.
 *
 * Utilise d'abord l'API Clipboard moderne du navigateur.
 * Un ancien mécanisme navigateur sert uniquement de repli.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
async function writeToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      warn(
        "L'API Clipboard moderne a échoué ; tentative avec le repli navigateur.",
        error
      );
    }
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");

  textarea.style.position = "fixed";
  textarea.style.left = "-10000px";
  textarea.style.top = "-10000px";

  document.body.appendChild(textarea);

  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error(
        "document.execCommand('copy') a retourné false."
      );
    }
  } finally {
    textarea.remove();
  }
}

/**
 * Copie un UUID et affiche les retours utilisateur demandés.
 *
 * @param {string|null|undefined} uuid
 * @returns {Promise<boolean>}
 */
async function copyUuid(uuid) {
  if (!isUsableUuid(uuid)) {
    warn("Aucun UUID exploitable n'a été trouvé.");

    ui.notifications?.warn(
      "Impossible de copier l’UUID : UUID introuvable."
    );

    return false;
  }

  try {
    await writeToClipboard(uuid);

    ui.notifications?.info(`UUID copié : ${uuid}`);

    console.info(
      `${LOG_PREFIX} UUID copié : ${uuid}`
    );

    return true;
  } catch (error) {
    warn(
      `Échec de la copie de l'UUID : ${uuid}`,
      error
    );

    ui.notifications?.error(
      "Impossible de copier l’UUID. Consultez la console (F12)."
    );

    return false;
  }
}

/**
 * Gestionnaire du clic sur l'option du menu contextuel.
 *
 * @param {object} application
 * @param {HTMLElement} target
 */
async function onContextCopy(application, target) {
  try {
    const uuid = await resolveUuidFromContext(
      application,
      target
    );

    await copyUuid(uuid);
  } catch (error) {
    warn(
      "Erreur pendant la résolution de l'UUID depuis le menu contextuel.",
      error
    );

    ui.notifications?.error(
      "Impossible de récupérer l’UUID. Consultez la console (F12)."
    );
  }
}

/**
 * Ajoute l'option « Copier UUID » à un menu contextuel
 * de Document.
 *
 * @param {object} application
 * @param {Array<object>} menuItems
 */
function addContextMenuOption(application, menuItems) {
  if (!Array.isArray(menuItems)) {
    warn(
      "Le hook de menu contextuel n'a pas fourni un tableau valide."
    );

    return;
  }

  /*
   * Empêche l'apparition d'une option en double.
   */
  const alreadyAdded = menuItems.some((item) =>
    String(item?.classes ?? "")
      .split(/\s+/)
      .includes(CONTEXT_MENU_CLASS)
  );

  if (alreadyAdded) return;

  menuItems.push({
    label: "Copier UUID",
    icon: "fa-solid fa-copy",
    classes: CONTEXT_MENU_CLASS,

    /*
     * Masque l'option si l'élément ciblé ne fournit
     * aucun identifiant utilisable.
     */
    visible: (target) => {
      const { id, uuid } = getTargetIdentifiers(target);
      return Boolean(id || uuid);
    },

    onClick: (target) => {
      void onContextCopy(application, target);
    }
  });
}

/*
 * Enregistrement des hooks de menu contextuel.
 */
Hooks.once("init", () => {
  for (const documentName of SUPPORTED_DOCUMENT_NAMES) {
    Hooks.on(
      `get${documentName}ContextOptions`,
      addContextMenuOption
    );
  }

  console.info(`${LOG_PREFIX} Initialisé.`);
});

/*
 * Expose une petite API publique.
 *
 * Elle n'est pas nécessaire au fonctionnement normal du module,
 * mais elle sera utile pour les tests et pour la future V2.
 */
Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);

  if (module) {
    module.api = Object.freeze({
      copyUuid,
      resolveUuidFromContext
    });
  }

  console.info(`${LOG_PREFIX} Prêt.`);
});