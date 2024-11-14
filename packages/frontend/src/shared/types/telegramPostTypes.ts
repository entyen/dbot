interface TextObjectData {
    type: string
    text: string
}

export interface TelegramPostType {
    message_id: number
    channel_id: number
    message: TextObjectData | undefined
    date: number
    view_count?: number
    image?: string
}

export interface TelegramPostsResponse {
    messages: TelegramPostType[]
    lastMessageId: number
}

export interface SelectedTelegramPostsType {
    [key: number]: boolean
}
