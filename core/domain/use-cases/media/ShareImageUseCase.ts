import { IMessageRepository } from '../../repositories/IMessageRepository';
import { CreateMessageDTO, Message, MessageType } from '../../entities/Message';

export interface ImageCompressionService {
  compressImage(uri: string, quality?: number): Promise<string>;
}

export class ShareImageUseCase {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly imageCompressionService: ImageCompressionService
  ) {}

  async execute(
    chatId: string,
    senderId: string,
    imageUri: string,
    caption?: string
  ): Promise<Message> {
    // Validation
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    if (!senderId) {
      throw new Error('Sender ID is required');
    }

    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    // Compress image
    const compressedImageUri = await this.imageCompressionService.compressImage(
      imageUri,
      0.7 // 70% quality
    );

    const dto: CreateMessageDTO = {
      chatId,
      senderId,
      text: caption || '',
      type: MessageType.IMAGE,
      imageUrl: compressedImageUri,
    };

    return this.messageRepository.sendMessage(dto);
  }
}
