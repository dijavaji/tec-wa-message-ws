import { getContentType, normalizeMessageContent } from '@whiskeysockets/baileys';

import { MESSAGE_CATEGORIES, MESSAGE_TYPE_MAP } from '../constants/MessageTypes.js'

class MessageClassifier {

	classify(message) {
		if (!message?.message) {
			return null
		}

		const content = normalizeMessageContent(message.message)

		if (!content) {
			return null
		}

		const rawType = getContentType(content)

		if (!rawType) {
			return {
				rawType: null,
				category: MESSAGE_CATEGORIES.UNKNOWN,
				content
			}
		}

		const category =
		MESSAGE_TYPE_MAP[rawType] ?? MESSAGE_CATEGORIES.UNKNOWN

		return {
			rawType,
			category,
			content
		}
	}
}

export default new MessageClassifier()
