import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { User } from "../common/schemas/user.schema";
import { Message } from "../common/schemas/message.schema";
import { Conversation } from "../common/schemas/conversation.schema";

/**
 * UNIT TESTS: ChatService
 * Ensures complex conversational data operations are correct.
 */
describe("ChatService", () => {
  let service: ChatService;
  let userModel: any;
  let messageModel: any;
  let conversationModel: any;

  // Mock document structure
  class MockDoc {
    constructor(public data: any) {}
    save = jest
      .fn()
      .mockResolvedValue({ ...this.data, _id: new Types.ObjectId() });
  }

  const mockModel = {
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(User.name), useValue: mockModel },
        { provide: getModelToken(Message.name), useValue: mockModel },
        { provide: getModelToken(Conversation.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    userModel = module.get(getModelToken(User.name));
    messageModel = module.get(getModelToken(Message.name));
    conversationModel = module.get(getModelToken(Conversation.name));
  });

  describe("setUserOnline", () => {
    it("should call findByIdAndUpdate with correct parameters", async () => {
      const userId = new Types.ObjectId().toHexString();
      await service.setUserOnline(userId, true);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ isOnline: true }),
        { new: true },
      );
    });
  });

  describe("getMessages", () => {
    it("should build a correct cursor-based query", async () => {
      const convId = new Types.ObjectId().toHexString();
      const beforeId = new Types.ObjectId().toHexString();

      mockModel.exec.mockResolvedValueOnce([]);

      await service.getMessages(convId, 20, beforeId);

      expect(messageModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: new Types.ObjectId(convId),
          _id: { $lt: new Types.ObjectId(beforeId) },
        }),
      );
      expect(messageModel.limit).toHaveBeenCalledWith(20);
    });
  });
});
