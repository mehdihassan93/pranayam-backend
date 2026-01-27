import { MongoClient, ObjectId } from "mongodb";

async function seed() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("pranayam");
    const users = db.collection("users");

    // Clear existing
    await users.deleteMany({});

    const profiles = [
      {
        _id: new ObjectId(),
        phoneNumber: "+911234567890",
        name: "Me (Test User)",
        interests: ["Tech", "Coffee", "Architecture"],
        gender: "MALE",
        dob: new Date("1995-10-25"),
        age: 30,
        location: { type: "Point", coordinates: [76.2673, 9.9312] }, // Kochi
        preferences: {
          distance: 50,
          ageRange: { min: 18, max: 40 },
          gender: ["FEMALE"],
        },
        photos: ["https://api.dicebear.com/7.x/avataaars/svg?seed=Me"],
        isOnline: true,
      },
      {
        _id: new ObjectId(),
        phoneNumber: "+919876543210",
        name: "Aparna",
        interests: ["Yoga", "Art", "Coffee"],
        gender: "FEMALE",
        dob: new Date("1997-05-15"),
        age: 28,
        location: { type: "Point", coordinates: [76.2999, 9.9816] }, // Kochi East
        preferences: {
          distance: 20,
          ageRange: { min: 20, max: 35 },
          gender: ["MALE"],
        },
        photos: ["https://api.dicebear.com/7.x/avataaars/svg?seed=Aparna"],
        isOnline: true,
      },
      {
        _id: new ObjectId(),
        phoneNumber: "+919998887776",
        name: "Anjali",
        interests: ["Music", "Coffee", "Tech"],
        gender: "FEMALE",
        dob: new Date("1996-08-20"),
        age: 29,
        location: { type: "Point", coordinates: [76.3575, 10.0159] }, // Aluva/Kochi
        preferences: {
          distance: 30,
          ageRange: { min: 22, max: 33 },
          gender: ["MALE"],
        },
        photos: ["https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"],
        isOnline: false,
      },
    ];

    await users.insertMany(profiles);
    console.log(
      "✅ Seeded 3 test profiles (Me, Aparna, Anjali) in Kochi area.",
    );
    console.log(
      "👉 Use +911234567890 to login and see the discovery algorithm in action!",
    );
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
