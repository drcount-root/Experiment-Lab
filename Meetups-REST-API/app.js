const express = require("express");
const bodyParser = require("body-parser");

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const meetupsFilePath = path.join(__dirname, "meetups.json");
const usersFilePath = path.join(__dirname, "users.json");
const jwtSecret = "TheSecretKey";

class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

function readUsersFromFile() {
  try {
    const data = fs.readFileSync(usersFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writoUsersToFile(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

const app = express();
const PORT = process.env.PORT || 3000;

function readMeetupsFromFile() {
  try {
    const data = fs.readFileSync(meetupsFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeMeetupsToFile(meetups) {
  fs.writeFileSync(meetupsFilePath, JSON.stringify(meetups, null, 2));
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function authenticateJWT(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  // if (!token) {
  //   return res
  //     .status(401)
  //     .json({ message: "Access denied, no token provided" });
  // }

  if (!token) {
    next(new ErrorHandler(401, "Access denied, no token provided"));
    return;
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    // if (err) {
    //   return res.status(403).json({ message: "Invalid token" });
    // }

    if (err) {
      next(new ErrorHandler(403, "Invalid token"));
      return;
    }
    res.user = user;
    next();
  });
}

function validateMeetupData(meetup) {
  return (
    meetup.title &&
    typeof meetup.title === "string" &&
    meetup.summary &&
    typeof meetup.summary === "string" &&
    meetup.address &&
    typeof meetup.address === "string"
  );
}

// Routes

app.post("/signup", async (req, res, next) => {
  const { email, password } = req.body;
  // if (!email || !password) {
  //   res.status(400).json({ message: "Invalid email or password" });
  //   return;
  // }

  if (!email || !password) {
    next(new ErrorHandler(400, "Invalid email or password"));
    return;
  }

  const users = readUsersFromFile();
  const existingUser = users.find((user) => user.email === email);

  // if (existingUser) {
  //   res.status(409).json({ message: "Email already exists" });
  //   return;
  // }

  if (existingUser) {
    next(new ErrorHandler(409, "Email already exists"));
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashedPassword };
  users.push(newUser);
  writoUsersToFile(users);

  const token = jwt.sign({ email }, jwtSecret, { expiresIn: "1h" });
  res.status(201).json({ token, email });
});

app.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  // if (!email || !password) {
  //   res.status(400).json({ message: "Invalid email or password" });
  //   return;
  // }

  if (!email || !password) {
    next(new ErrorHandler(400, "Invalid email or password"));
    return;
  }

  const users = readUsersFromFile();
  const user = users.find((u) => u.email === email);

  // if (!user || !(await bcrypt.compare(password, user.password))) {
  //   res.status(401).json({ message: "Invalid email or password" });
  //   return;
  // }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    next(new ErrorHandler(401, "Invalid email or password"));
    return;
  }

  const token = jwt.sign({ email }, jwtSecret, { expiresIn: "1h" });
  res.status(200).json({ token, email });
});

app.post("/meetups", authenticateJWT, (req, res, next) => {
  const { title, summary, address } = req.body;

  if (!validateMeetupData({ title, summary, address })) {
    // res.status(400).json({ message: "Invalid meetup data" });
    next(new ErrorHandler(400, "Invalid meetup data"));
    return;
  } else {
    const meetups = readMeetupsFromFile();
    const id = meetups.length > 0 ? meetups[meetups.length - 1].id + 1 : 1;
    const newMeetup = { id, title, summary, address };
    meetups.push(newMeetup);
    writeMeetupsToFile(meetups);
    res.status(201).json(newMeetup);

    console.log("Requested url\n", req.url);
    console.log("Created!\n");
  }
});

app.get("/meetups", (req, res) => {
  const meetups = readMeetupsFromFile();
  res.status(200).json(meetups);
  console.log("Requested url\n", req.url);
  console.log("\nResponse\n", meetups);
});

app.patch("/meetups/:id", authenticateJWT, (req, res, next) => {
  const { id } = req.params;
  const { title, summary, address } = req.body;

  if (!validateMeetupData({ title, summary, address })) {
    // res.status(400).json({ message: "Unable to update meetup data" });
    next(new ErrorHandler(400, "Unable to update meetup data"));
    return;
  } else {
    let meetups = readMeetupsFromFile();
    const meetupIndex = meetups.findIndex(
      (meetup) => meetup.id === parseInt(id)
    );
    if (meetupIndex === -1) {
      // res.status(404).json({ message: `Meetup with id ${id} not found` });
      next(new ErrorHandler(404, `Meetup with id ${id} not found`));
      return;
    } else {
      meetups[meetupIndex] = {
        ...meetups[meetupIndex],
        title,
        summary,
        address,
      };
      writeMeetupsToFile(meetups);
      res.status(200).json(meetups[meetupIndex]);
    }

    console.log("Requested url\n", req.url);
    console.log("\nUpdated!\n");
  }
});

app.delete("/meetups/:id", authenticateJWT, (req, res, next) => {
  const { id } = req.params;
  let meetups = readMeetupsFromFile();
  const meetupIndex = meetups.findIndex((meetup) => meetup.id === parseInt(id));
  if (meetupIndex === -1) {
    // res.status(404).json({ message: `Meetup with id ${id} not found` });
    next(new ErrorHandler(404, `Meetup with id ${id} not found`));
    return;
  } else {
    meetups.splice(meetupIndex, 1);
    writeMeetupsToFile(meetups);
    res.status(200).json({ message: `Meetup ${id} deleted` });
  }

  console.log("Requested url\n", req.url);
  console.log("Deleted!\n");
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).json({ message });
});
app.use((req, res, next) => {
  res.status(404).json({ message: "Not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on post http://localhost:${PORT}`);
});
