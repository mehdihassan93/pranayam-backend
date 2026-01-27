import { connect, connection, Model } from "mongoose";
import { User, UserSchema } from "../common/schemas/user.schema";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pranayam";

// Dummy profile data - mix of genders, ages, locations around Kerala
const dummyUsers = [
  {
    firebaseUid: "seed_user_001",
    name: "Aparna",
    phoneNumber: "+919876543001",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    bio: "Software engineer who loves to explore Kerala backwaters. Looking for someone to share adventures with.",
    gender: "FEMALE",
    location: { type: "Point", coordinates: [76.2711, 9.9312] }, // Kochi
    dob: new Date("1998-05-15"),
    age: 26,
    interests: ["Technology", "Travel", "Photography", "Coffee"],
    preferences: {
      distance: 50,
      ageRange: { min: 24, max: 32 },
      gender: ["MALE"],
    },
  },
  {
    firebaseUid: "seed_user_002",
    name: "Rahul",
    phoneNumber: "+919876543002",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    bio: "Architect with a passion for sustainable design. Weekend chef and amateur guitarist.",
    gender: "MALE",
    location: { type: "Point", coordinates: [76.9366, 8.5241] }, // Trivandrum
    dob: new Date("1995-08-22"),
    age: 29,
    interests: ["Architecture", "Music", "Cooking", "Yoga"],
    preferences: {
      distance: 75,
      ageRange: { min: 22, max: 30 },
      gender: ["FEMALE"],
    },
  },
  {
    firebaseUid: "seed_user_003",
    name: "Priya",
    phoneNumber: "+919876543003",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    bio: "Doctor by profession, artist at heart. Love watching sunsets at the beach.",
    gender: "FEMALE",
    location: { type: "Point", coordinates: [75.7804, 11.2588] }, // Kozhikode
    dob: new Date("1996-12-03"),
    age: 28,
    interests: ["Art", "Reading", "Movies", "Travel"],
    preferences: {
      distance: 100,
      ageRange: { min: 26, max: 35 },
      gender: ["MALE"],
    },
  },
  {
    firebaseUid: "seed_user_004",
    name: "Arjun",
    phoneNumber: "+919876543004",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    bio: "Startup founder building the future of fintech. Coffee addict and cricket enthusiast.",
    gender: "MALE",
    location: { type: "Point", coordinates: [76.2711, 9.9312] }, // Kochi
    dob: new Date("1993-03-18"),
    age: 31,
    interests: ["Technology", "Cricket", "Startups", "Coffee"],
    preferences: {
      distance: 50,
      ageRange: { min: 24, max: 32 },
      gender: ["FEMALE"],
    },
  },
  {
    firebaseUid: "seed_user_005",
    name: "Meera",
    phoneNumber: "+919876543005",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    bio: "Yoga instructor spreading positive vibes. Nature lover and classical dancer.",
    gender: "FEMALE",
    location: { type: "Point", coordinates: [76.6413, 10.5276] }, // Thrissur
    dob: new Date("1997-07-28"),
    age: 27,
    interests: ["Yoga", "Dance", "Nature", "Meditation"],
    preferences: {
      distance: 60,
      ageRange: { min: 25, max: 33 },
      gender: ["MALE"],
    },
  },
  {
    firebaseUid: "seed_user_006",
    name: "Varun",
    phoneNumber: "+919876543006",
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    bio: "Wildlife photographer capturing Kerala's beauty. Adventure seeker and foodie.",
    gender: "MALE",
    location: { type: "Point", coordinates: [77.0126, 10.8505] }, // Palakkad
    dob: new Date("1994-11-10"),
    age: 30,
    interests: ["Photography", "Wildlife", "Travel", "Food"],
    preferences: {
      distance: 80,
      ageRange: { min: 23, max: 30 },
      gender: ["FEMALE"],
    },
  },
  {
    firebaseUid: "seed_user_007",
    name: "Lakshmi",
    phoneNumber: "+919876543007",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    bio: "Marketing professional with a love for literature. Chai over coffee any day!",
    gender: "FEMALE",
    location: { type: "Point", coordinates: [76.2711, 9.9312] }, // Kochi
    dob: new Date("1999-02-14"),
    age: 25,
    interests: ["Reading", "Writing", "Marketing", "Theater"],
    preferences: {
      distance: 40,
      ageRange: { min: 25, max: 32 },
      gender: ["MALE"],
    },
  },
  {
    firebaseUid: "seed_user_008",
    name: "Aditya",
    phoneNumber: "+919876543008",
    photoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    bio: "Film director exploring human emotions through cinema. Deep conversations appreciated.",
    gender: "MALE",
    location: { type: "Point", coordinates: [76.9366, 8.5241] }, // Trivandrum
    dob: new Date("1992-09-05"),
    age: 32,
    interests: ["Cinema", "Art", "Philosophy", "Music"],
    preferences: {
      distance: 100,
      ageRange: { min: 24, max: 30 },
      gender: ["FEMALE"],
    },
  },
  {
    firebaseUid: "seed_user_009",
    name: "Anjali",
    phoneNumber: "+919876543009",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    bio: "Data scientist by day, salsa dancer by night. Looking for a dance partner for life!",
    gender: "FEMALE",
    location: { type: "Point", coordinates: [76.2711, 9.9312] }, // Kochi
    dob: new Date("1997-04-20"),
    age: 27,
    interests: ["Dance", "Technology", "Fitness", "Travel"],
    preferences: {
      distance: 50,
      ageRange: { min: 26, max: 34 },
      gender: ["MALE"],
    },
  },
  {
    firebaseUid: "seed_user_010",
    name: "Karthik",
    phoneNumber: "+919876543010",
    photoUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
    bio: "Chef running my own restaurant. Food is my love language. Let me cook for you!",
    gender: "MALE",
    location: { type: "Point", coordinates: [75.7804, 11.2588] }, // Kozhikode
    dob: new Date("1991-06-12"),
    age: 33,
    interests: ["Cooking", "Food", "Travel", "Business"],
    preferences: {
      distance: 75,
      ageRange: { min: 25, max: 32 },
      gender: ["FEMALE"],
    },
  },
  {
    firebaseUid: "seed_user_011",
    name: "Divya",
    phoneNumber: "+919876543011",
    photoUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400",
    bio: "Environmental activist and marine biologist. Let's save the oceans together!",
    gender: "FEMALE",
    location: { type: "Point", coordinates: [76.9366, 8.5241] }, // Trivandrum
    dob: new Date("1996-01-30"),
    age: 28,
    interests: ["Environment", "Science", "Diving", "Hiking"],
    preferences: {
      distance: 60,
      ageRange: { min: 26, max: 35 },
      gender: ["MALE"],
    },
  },
  {
    firebaseUid: "seed_user_012",
    name: "Nikhil",
    phoneNumber: "+919876543012",
    photoUrl:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400",
    bio: "Musician playing the veena since childhood. Also into rock music - contradictions are fun!",
    gender: "MALE",
    location: { type: "Point", coordinates: [76.6413, 10.5276] }, // Thrissur
    dob: new Date("1995-10-08"),
    age: 29,
    interests: ["Music", "Concerts", "Art", "Coffee"],
    preferences: {
      distance: 50,
      ageRange: { min: 23, max: 29 },
      gender: ["FEMALE"],
    },
  },
];

async function seed() {
  console.log("🌱 Starting seed process...");

  try {
    await connect(MONGO_URI);
    console.log("📦 Connected to MongoDB");

    const UserModel = connection.model("User", UserSchema);

    // Clear existing seed data
    const deleteResult = await UserModel.deleteMany({
      firebaseUid: { $regex: /^seed_user_/ },
    });
    console.log(`🧹 Cleared ${deleteResult.deletedCount} existing seed users`);

    // Insert new seed data
    for (const userData of dummyUsers) {
      const user = new UserModel({
        ...userData,
        isOnline: Math.random() > 0.5, // Randomly set online status
        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random last seen within 24h
      });
      await user.save();
      console.log(`✅ Created user: ${userData.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${dummyUsers.length} dummy users!`);
    console.log("\n📋 Test accounts created:");
    dummyUsers.forEach((u) => {
      console.log(
        `   - ${u.name} (${u.gender}, ${u.age}yo) - ${u.interests.slice(0, 2).join(", ")}`,
      );
    });
  } catch (error) {
    console.error("❌ Seed error:", error);
  } finally {
    await connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

seed();
