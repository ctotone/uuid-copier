const MODULE_ID = "uuid-copier";
const MODULE_TITLE = "Evilbram UIID-Copier";
const LOG_PREFIX = `[${MODULE_TITLE}]`;
const CONTEXT_MENU_CLASS = `${MODULE_ID}-copy-uuid`;

/**
 * Types de Documents de monde pris en charge.
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
 * Documents intégrés à une scène pris en charge.
 */
const SUPPORTED_PLACEABLE_DOCUMENT_NAMES = Object.freeze([
  "Wall",
  "AmbientLight",
  "Region",
  "Token",
  "AmbientSound",
  "Tile",
  "Drawing",
  "Note"
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
 * Renvoie la première valeur dataset exploitable trouvée sur l'élément
 * ou sur l'un de ses parents.
 *
 * @param {HTMLElement} target
 * @param {string[]} keys
 * @returns {string|null}
 */
function findDatasetValue(target, keys) {
  if (!target || typeof target.closest !== "function") return null;

  let element = target;

  while (element instanceof HTMLElement) {
    for (const key of keys) {
      const value = element.dataset?.[key];

      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }

    element = element.parentElement;
  }

  return null;
}

/**
 * Récupère les identifiants portés par une entrée HTML standard.
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
    target.closest(
      "[data-sound-id], " +
      "[data-entry-id], " +
      "[data-document-id], " +
      "[data-object-id], " +
      "[data-uuid], " +
      "[data-id]"
    ) ?? target;

  const dataset = entry?.dataset ?? {};

  const id =
    dataset.soundId ??
    dataset.entryId ??
    dataset.documentId ??
    dataset.objectId ??
    dataset.id ??
    null;

  const uuid = dataset.uuid ?? null;

  return {
    id:
      typeof id === "string" && id.length > 0
        ? id
        : null,

    uuid:
      isUsableUuid(uuid)
        ? uuid
        : null
  };
}

/**
 * Récupère spécifiquement l'identifiant d'une page dans la barre
 * latérale d'un JournalEntry ouvert.
 *
 * Cette fonction reste séparée de getTargetIdentifiers afin de ne pas
 * modifier le comportement déjà validé pour les autres menus.
 *
 * @param {HTMLElement} target
 * @returns {{id: string|null, uuid: string|null}}
 */
function getJournalPageIdentifiers(target) {
  if (!target || typeof target.closest !== "function") {
    return {
      id: null,
      uuid: null
    };
  }

  const entry =
    target.closest("[data-page-id]") ??
    target.closest("[data-entry-id]") ??
    target.closest("[data-document-id]") ??
    target.closest("[data-object-id]") ??
    target.closest("[data-uuid]") ??
    target.closest("[data-id]") ??
    target;

  const dataset = entry?.dataset ?? {};

  const id =
    dataset.pageId ??
    dataset.entryId ??
    dataset.documentId ??
    dataset.objectId ??
    dataset.id ??
    null;

  const uuid = dataset.uuid ?? null;

  return {
    id:
      typeof id === "string" && id.length > 0
        ? id
        : null,

    uuid:
      isUsableUuid(uuid)
        ? uuid
        : null
  };
}

/**
 * Produit plusieurs formes possibles d'un identifiant HTML.
 *
 * @param {string|null} id
 * @param {string} [documentName]
 * @returns {string[]}
 */
function getCandidateIds(id, documentName) {
  if (typeof id !== "string" || id.length === 0) {
    return [];
  }

  const candidates = new Set([id]);

  if (
    documentName &&
    id.startsWith(`${documentName}.`)
  ) {
    candidates.add(
      id.slice(documentName.length + 1)
    );
  }

  if (id.includes(".")) {
    candidates.add(
      id.split(".").at(-1)
    );
  }

  return Array
    .from(candidates)
    .filter(Boolean);
}

/**
 * Résout l'UUID d'une entrée de Document de monde.
 *
 * @param {object} application
 * @param {HTMLElement} target
 * @returns {Promise<string|null>}
 */
async function resolveUuidFromContext(application, target) {
  const { id, uuid } = getTargetIdentifiers(target);

  if (uuid) return uuid;
  if (!id) return null;

  const collection = application?.collection ?? null;

  const cachedDocument =
    collection?.get?.(id) ??
    null;

  if (isUsableUuid(cachedDocument?.uuid)) {
    return cachedDocument.uuid;
  }

  const indexedEntry =
    collection?.index?.get?.(id) ??
    null;

  if (isUsableUuid(indexedEntry?.uuid)) {
    return indexedEntry.uuid;
  }

  if (typeof collection?.getDocument === "function") {
    const loadedDocument =
      await collection.getDocument(id);

    if (isUsableUuid(loadedDocument?.uuid)) {
      return loadedDocument.uuid;
    }
  }

  const documentName =
    application?.documentName ??
    application?.documentClass?.documentName;

  const worldCollection =
    documentName
      ? game.collections?.get?.(documentName)
      : null;

  const worldDocument =
    worldCollection?.get?.(id) ??
    null;

  if (isUsableUuid(worldDocument?.uuid)) {
    return worldDocument.uuid;
  }

  return null;
}

/**
 * Résout l'UUID d'un Document intégré à la scène active.
 *
 * Types actuellement pris en charge :
 * - mur ;
 * - lumière ;
 * - région ;
 * - token ;
 * - son ambiant ;
 * - tuile ;
 * - dessin ;
 * - note.
 *
 * @param {string} documentName
 * @param {HTMLElement} target
 * @returns {string|null}
 */
function resolvePlaceableUuid(documentName, target) {
  const { id, uuid } = getTargetIdentifiers(target);

  if (uuid) return uuid;
  if (!id) return null;

  const scene = canvas?.scene;

  if (!scene) {
    warn(
      `Aucune scène active pour résoudre un document ${documentName}.`
    );

    return null;
  }

  const candidateIds =
    getCandidateIds(id, documentName);

  for (const candidateId of candidateIds) {
    const document =
      scene.getEmbeddedDocument?.(
        documentName,
        candidateId
      );

    if (isUsableUuid(document?.uuid)) {
      return document.uuid;
    }
  }

  return null;
}

/**
 * Résout l'UUID d'une piste individuelle de Playlist.
 *
 * @param {object} application
 * @param {HTMLElement} target
 * @returns {string|null}
 */
function resolvePlaylistSoundUuid(application, target) {
  const { id, uuid } = getTargetIdentifiers(target);

  if (uuid) return uuid;
  if (!id) return null;

  const playlistId =
    findDatasetValue(
      target,
      ["playlistId"]
    );

  const playlists =
    application?.collection ??
    game.playlists;

  if (playlistId) {
    const playlist =
      playlists?.get?.(playlistId) ??
      game.playlists?.get?.(playlistId);

    const candidateIds =
      getCandidateIds(
        id,
        "PlaylistSound"
      );

    for (const candidateId of candidateIds) {
      const sound =
        playlist?.sounds?.get?.(candidateId);

      if (isUsableUuid(sound?.uuid)) {
        return sound.uuid;
      }
    }
  }

  const matches = [];

  for (const playlist of game.playlists ?? []) {
    const candidateIds =
      getCandidateIds(
        id,
        "PlaylistSound"
      );

    for (const candidateId of candidateIds) {
      const sound =
        playlist?.sounds?.get?.(candidateId);

      if (isUsableUuid(sound?.uuid)) {
        matches.push(sound);
        break;
      }
    }
  }

  if (matches.length === 1) {
    return matches[0].uuid;
  }

  if (matches.length > 1) {
    warn(
      `Plusieurs PlaylistSound correspondent à l'identifiant ${id}. ` +
      "La copie est annulée pour éviter de copier le mauvais UUID."
    );
  }

  return null;
}

/**
 * Résout l'UUID d'une page interne de JournalEntry.
 *
 * @param {object} application
 * @param {HTMLElement} target
 * @returns {string|null}
 */
function resolveJournalEntryPageUuid(application, target) {
  const { id, uuid } = getJournalPageIdentifiers(target);

  if (uuid) return uuid;
  if (!id) return null;

  const journalEntry =
    application?.entry ??
    application?.document ??
    application?.object ??
    null;

  if (!journalEntry) {
    warn(
      "Impossible de retrouver le JournalEntry parent de la page."
    );

    return null;
  }

  const candidateIds =
    getCandidateIds(
      id,
      "JournalEntryPage"
    );

  for (const candidateId of candidateIds) {
    const pageFromCollection =
      journalEntry.pages?.get?.(
        candidateId
      );

    if (isUsableUuid(pageFromCollection?.uuid)) {
      return pageFromCollection.uuid;
    }

    const embeddedPage =
      journalEntry.getEmbeddedDocument?.(
        "JournalEntryPage",
        candidateId
      );

    if (isUsableUuid(embeddedPage?.uuid)) {
      return embeddedPage.uuid;
    }
  }

  return null;
}

/**
 * Copie du texte dans le presse-papier.
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
        "L'API Clipboard moderne a échoué ; " +
        "tentative avec le repli navigateur.",
        error
      );
    }
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");

  textarea.style.position = "fixed";
  textarea.style.left = "-10000px";
  textarea.style.top = "-10000px";

  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied =
      document.execCommand("copy");

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
 * Copie un UUID et affiche les retours utilisateur.
 *
 * @param {string|null|undefined} uuid
 * @returns {Promise<boolean>}
 */
async function copyUuid(uuid) {
  if (!isUsableUuid(uuid)) {
    warn(
      "Aucun UUID exploitable n'a été trouvé."
    );

    ui.notifications?.warn(
      "Impossible de copier l’UUID : UUID introuvable."
    );

    return false;
  }

  try {
    await writeToClipboard(uuid);

    ui.notifications?.info(
      `UUID copié : ${uuid}`
    );

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
 * Gestionnaire du clic sur un Document de monde.
 *
 * @param {object} application
 * @param {HTMLElement} target
 */
async function onContextCopy(application, target) {
  try {
    const uuid =
      await resolveUuidFromContext(
        application,
        target
      );

    await copyUuid(uuid);
  } catch (error) {
    warn(
      "Erreur pendant la résolution de l'UUID " +
      "depuis le menu contextuel.",
      error
    );

    ui.notifications?.error(
      "Impossible de récupérer l’UUID. Consultez la console (F12)."
    );
  }
}

/**
 * Gestionnaire du clic sur un objet intégré à la scène.
 *
 * @param {string} documentName
 * @param {HTMLElement} target
 */
async function onPlaceableContextCopy(
  documentName,
  target
) {
  try {
    const uuid =
      resolvePlaceableUuid(
        documentName,
        target
      );

    await copyUuid(uuid);
  } catch (error) {
    warn(
      `Erreur pendant la résolution de l'UUID ` +
      `du document ${documentName}.`,
      error
    );

    ui.notifications?.error(
      "Impossible de récupérer l’UUID. Consultez la console (F12)."
    );
  }
}

/**
 * Gestionnaire du clic sur une piste de Playlist.
 *
 * @param {object} application
 * @param {HTMLElement} target
 */
async function onPlaylistSoundContextCopy(
  application,
  target
) {
  try {
    const uuid =
      resolvePlaylistSoundUuid(
        application,
        target
      );

    await copyUuid(uuid);
  } catch (error) {
    warn(
      "Erreur pendant la résolution de l'UUID " +
      "de la piste de Playlist.",
      error
    );

    ui.notifications?.error(
      "Impossible de récupérer l’UUID. Consultez la console (F12)."
    );
  }
}

/**
 * Gestionnaire du clic sur une page de journal.
 *
 * @param {object} application
 * @param {HTMLElement} target
 */
async function onJournalEntryPageContextCopy(
  application,
  target
) {
  try {
    const uuid =
      resolveJournalEntryPageUuid(
        application,
        target
      );

    await copyUuid(uuid);
  } catch (error) {
    warn(
      "Erreur pendant la résolution de l'UUID " +
      "de la page de journal.",
      error
    );

    ui.notifications?.error(
      "Impossible de récupérer l’UUID. Consultez la console (F12)."
    );
  }
}

/**
 * Vérifie qu'une option n'a pas déjà été ajoutée au menu.
 *
 * @param {Array<object>} menuItems
 * @param {string} cssClass
 * @returns {boolean}
 */
function hasContextMenuOption(
  menuItems,
  cssClass
) {
  return menuItems.some((item) =>
    String(item?.classes ?? "")
      .split(/\s+/)
      .includes(cssClass)
  );
}

/**
 * Ajoute l'option « Copier UUID » au menu d'un Document de monde.
 *
 * @param {object} application
 * @param {Array<object>} menuItems
 */
function addContextMenuOption(
  application,
  menuItems
) {
  if (!Array.isArray(menuItems)) {
    warn(
      "Le hook de menu contextuel " +
      "n'a pas fourni un tableau valide."
    );

    return;
  }

  if (
    hasContextMenuOption(
      menuItems,
      CONTEXT_MENU_CLASS
    )
  ) {
    return;
  }

  menuItems.push({
    label: "Copier UUID",
    icon: "fa-solid fa-copy",
    classes: CONTEXT_MENU_CLASS,

    visible: (target) => {
      const { id, uuid } =
        getTargetIdentifiers(target);

      return Boolean(id || uuid);
    },

    onClick: (_event, target) => {
      void onContextCopy(
        application,
        target
      );
    }
  });
}

/**
 * Ajoute l'option à un type précis d'objet de scène.
 *
 * @param {string} documentName
 * @param {object} _application
 * @param {Array<object>} menuItems
 */
function addPlaceableContextMenuOption(
  documentName,
  _application,
  menuItems
) {
  if (!Array.isArray(menuItems)) {
    warn(
      `Le hook ${documentName}Placeable ` +
      "n'a pas fourni un tableau valide."
    );

    return;
  }

  const cssClass =
    `${CONTEXT_MENU_CLASS}-` +
    documentName.toLowerCase();

  if (
    hasContextMenuOption(
      menuItems,
      cssClass
    )
  ) {
    return;
  }

  menuItems.push({
    label: "Copier UUID",
    icon: "fa-solid fa-copy",
    classes: cssClass,

    visible: (target) => {
      const { id, uuid } =
        getTargetIdentifiers(target);

      return Boolean(id || uuid);
    },

    onClick: (_event, target) => {
      void onPlaceableContextCopy(
        documentName,
        target
      );
    }
  });
}

/**
 * Ajoute l'option à une piste individuelle de Playlist.
 *
 * @param {object} application
 * @param {Array<object>} menuItems
 */
function addPlaylistSoundContextMenuOption(
  application,
  menuItems
) {
  if (!Array.isArray(menuItems)) {
    warn(
      "Le hook PlaylistSound " +
      "n'a pas fourni un tableau valide."
    );

    return;
  }

  const cssClass =
    `${CONTEXT_MENU_CLASS}-playlist-sound`;

  if (
    hasContextMenuOption(
      menuItems,
      cssClass
    )
  ) {
    return;
  }

  menuItems.push({
    label: "Copier UUID",
    icon: "fa-solid fa-copy",
    classes: cssClass,

    visible: (target) => {
      const { id, uuid } =
        getTargetIdentifiers(target);

      return Boolean(id || uuid);
    },

    onClick: (_event, target) => {
      void onPlaylistSoundContextCopy(
        application,
        target
      );
    }
  });
}

/**
 * Ajoute l'option à une page interne de JournalEntry.
 *
 * @param {object} application
 * @param {Array<object>} menuItems
 */
function addJournalEntryPageContextMenuOption(
  application,
  menuItems
) {
  if (!Array.isArray(menuItems)) {
    warn(
      "Le hook JournalEntryPage " +
      "n'a pas fourni un tableau valide."
    );

    return;
  }

  const cssClass =
    `${CONTEXT_MENU_CLASS}-journal-page`;

  if (
    hasContextMenuOption(
      menuItems,
      cssClass
    )
  ) {
    return;
  }

  menuItems.push({
    label: "Copier UUID",
    icon: "fa-solid fa-copy",
    classes: cssClass,

    visible: (target) => {
      const { id, uuid } =
        getJournalPageIdentifiers(target);

      return Boolean(id || uuid);
    },

    onClick: (_event, target) => {
      void onJournalEntryPageContextCopy(
        application,
        target
      );
    }
  });
}

/**
 * Enregistrement des hooks.
 */
Hooks.once("init", () => {
  for (
    const documentName
    of SUPPORTED_DOCUMENT_NAMES
  ) {
    Hooks.on(
      `get${documentName}ContextOptions`,
      addContextMenuOption
    );
  }

  for (
    const documentName
    of SUPPORTED_PLACEABLE_DOCUMENT_NAMES
  ) {
    Hooks.on(
      `get${documentName}PlaceableContextOptions`,
      (application, menuItems) => {
        addPlaceableContextMenuOption(
          documentName,
          application,
          menuItems
        );
      }
    );
  }

  Hooks.on(
    "getPlaylistSoundContextOptions",
    addPlaylistSoundContextMenuOption
  );

  Hooks.on(
    "getJournalEntryPageContextOptions",
    addJournalEntryPageContextMenuOption
  );

  console.info(
    `${LOG_PREFIX} Initialisé.`
  );
});

/**
 * Exposition d'une petite API publique.
 */
Hooks.once("ready", () => {
  const moduleData =
    game.modules.get(MODULE_ID);

  if (moduleData) {
    moduleData.api = Object.freeze({
      copyUuid,
      resolveUuidFromContext,
      resolvePlaceableUuid,
      resolvePlaylistSoundUuid,
      resolveJournalEntryPageUuid
    });
  }

  console.info(
    `${LOG_PREFIX} Prêt.`
  );
});
