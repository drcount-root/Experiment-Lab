const express = require("express");
const bodyParser = require("body-parser");

const fs = require("fs");
const path = require("path");
const meetupsFilePath = path.join(__dirname, "meetups.json");

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

function validateMeetupDate(meetup) {
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
app.post("/meetups", (req, res) => {
  const { title, summary, address } = req.body;

  if (!validateMeetupDate({ title, summary, address })) {
    res.status(400).json({ message: "Invalid meetup data" });
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

app.patch("/meetups/:id", (req, res) => {
  const { id } = req.params;
  const { title, summary, address } = req.body;

  if (!validateMeetupDate({ title, summary, address })) {
    res.status(400).json({ message: "Unable to update meetup data" });
    return;
  } else {
    let meetups = readMeetupsFromFile();
    const meetupIndex = meetups.findIndex(
      (meetup) => meetup.id === parseInt(id)
    );
    if (meetupIndex === -1) {
      res.status(404).json({ message: `Meetup with id ${id} not found` });
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

app.delete("/meetups/:id", (req, res) => {
  const { id } = req.params;
  let meetups = readMeetupsFromFile();
  const meetupIndex = meetups.findIndex((meetup) => meetup.id === parseInt(id));
  if (meetupIndex === -1) {
    res.status(404).json({ message: `Meetup with id ${id} not found` });
  } else {
    meetups.splice(meetupIndex, 1);
    writeMeetupsToFile(meetups);
    res.status(200).json({ message: `Meetup ${id} deleted` });
  }

  console.log("Requested url\n", req.url);
  console.log("Deleted!\n");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on post http://localhost:${PORT}`);
});