import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { User } from "../common/schemas/user.schema";
import { of, throwError } from "rxjs";
import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * UNIT TESTS: AuthService
 * Focuses on testing OTP delivery, verification logic, and user provisioning.
 */
describe("AuthService", () => {
  let service: AuthService;
  let httpService: HttpService;
  let userModel: any;

  // Mock dependencies
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "MSG91_AUTH_KEY") return "test_key";
      if (key === "MSG91_OTP_TEMPLATE_ID") return "test_template";
      return null;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => "test_token"),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    new: jest.fn(),
    save: jest.fn(),
  };

  // Setup mock class for Mongoose model
  function MockUser(dto: any) {
    this.data = dto;
    this.save = jest.fn().mockResolvedValue({ ...dto, _id: "mock_id" });
    this._id = "mock_id";
    this.phoneNumber = dto.phoneNumber;
    this.name = dto.name;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getModelToken(User.name), useValue: MockUser },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get<HttpService>(HttpService);
    userModel = module.get(getModelToken(User.name));

    // Static methods hack for Mongoose mock
    userModel.findOne = jest.fn();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendOtp", () => {
    it("should successfully request OTP from MSG91", async () => {
      const mockResponse = { data: { type: "success", message: "OTP sent" } };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.sendOtp("919876543210");
      expect(result.type).toBe("success");
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining("/otp"),
        expect.objectContaining({
          params: expect.objectContaining({ mobile: "919876543210" }),
        }),
      );
    });

    it("should throw HttpException if MSG91 returns an error", async () => {
      const mockErrorResponse = {
        data: { type: "error", message: "Invalid number" },
      };
      mockHttpService.get.mockReturnValue(of(mockErrorResponse));

      await expect(service.sendOtp("invalid")).rejects.toThrow(HttpException);
    });
  });

  describe("verifyOtp", () => {
    it("should return token and user if OTP verification succeeds", async () => {
      const mockSuccess = { data: { type: "success" } };
      mockHttpService.get.mockReturnValue(of(mockSuccess));
      userModel.findOne.mockResolvedValue({
        _id: "existing_id",
        phoneNumber: "919876543210",
        name: "Existing User",
        save: jest.fn().mockResolvedValue(true),
      });

      const result = await service.verifyOtp("919876543210", "1234");
      expect(result).toHaveProperty("access_token");
      expect(result.user.phoneNumber).toBe("919876543210");
    });

    it("should throw unauthorized error if OTP is incorrect", async () => {
      const mockFail = { data: { type: "error", message: "OTP not matched" } };
      mockHttpService.get.mockReturnValue(of(mockFail));

      await expect(service.verifyOtp("919876543210", "wrong")).rejects.toThrow(
        HttpException,
      );
    });
  });
});
