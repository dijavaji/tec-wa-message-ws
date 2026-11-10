export const MESSAGE_CATEGORIES = Object.freeze({
	TEXT: 'text',
	IMAGE: 'image',
	VIDEO: 'video',
	AUDIO: 'audio',
	DOCUMENT: 'document',
	STICKER: 'sticker',
	LOCATION: 'location',
	CONTACT: 'contact',
	REACTION: 'reaction',
	POLL: 'poll',
	INTERACTIVE: 'interactive',
	PRODUCT: 'product',
	ORDER: 'order',
	PROTOCOL: 'protocol',
	UNKNOWN: 'unknown'
})

export const MESSAGE_TYPE_MAP = Object.freeze({
	conversation: MESSAGE_CATEGORIES.TEXT,
	extendedTextMessage: MESSAGE_CATEGORIES.TEXT,

	imageMessage: MESSAGE_CATEGORIES.IMAGE,

	videoMessage: MESSAGE_CATEGORIES.VIDEO,

	audioMessage: MESSAGE_CATEGORIES.AUDIO,

	documentMessage: MESSAGE_CATEGORIES.DOCUMENT,

	stickerMessage: MESSAGE_CATEGORIES.STICKER,

	locationMessage: MESSAGE_CATEGORIES.LOCATION,
	liveLocationMessage: MESSAGE_CATEGORIES.LOCATION,

	contactMessage: MESSAGE_CATEGORIES.CONTACT,
	contactsArrayMessage: MESSAGE_CATEGORIES.CONTACT,

	reactionMessage: MESSAGE_CATEGORIES.REACTION,

	pollCreationMessage: MESSAGE_CATEGORIES.POLL,
	pollCreationMessageV2: MESSAGE_CATEGORIES.POLL,
	pollCreationMessageV3: MESSAGE_CATEGORIES.POLL,
	pollUpdateMessage: MESSAGE_CATEGORIES.POLL,

	buttonsResponseMessage: MESSAGE_CATEGORIES.INTERACTIVE,
	listResponseMessage: MESSAGE_CATEGORIES.INTERACTIVE,
	templateButtonReplyMessage: MESSAGE_CATEGORIES.INTERACTIVE,
	interactiveResponseMessage: MESSAGE_CATEGORIES.INTERACTIVE,

	productMessage: MESSAGE_CATEGORIES.PRODUCT,
	orderMessage: MESSAGE_CATEGORIES.ORDER,

	protocolMessage: MESSAGE_CATEGORIES.PROTOCOL
})
